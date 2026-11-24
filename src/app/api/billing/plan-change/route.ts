import { NextResponse } from "next/server";
import {
  createAdminSupabaseClient,
  createServerSupabaseClient,
} from "@/lib/supabase/server";
import {
  calculatePlanChangeQuote,
  SaasPlanTier,
} from "@/lib/saas-plans";

const VALID_TIERS: SaasPlanTier[] = ["free", "base", "pro", "studio"];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const fromPlan = body.from_plan as SaasPlanTier;
    const toPlan = body.to_plan as SaasPlanTier;
    const acceptedTermsAt =
      typeof body.accepted_terms_at === "string" && body.accepted_terms_at
        ? body.accepted_terms_at
        : null;
    const periodEndIso =
      typeof body.period_end_iso === "string" ? body.period_end_iso : null;
    const coachEmailInput =
      typeof body.coach_email === "string"
        ? body.coach_email.trim().toLowerCase()
        : null;

    if (!VALID_TIERS.includes(fromPlan) || !VALID_TIERS.includes(toPlan)) {
      return NextResponse.json(
        { error: "Plan de origen o destino inválido." },
        { status: 400 }
      );
    }

    if (fromPlan === toPlan) {
      return NextResponse.json(
        { error: "Ya te encuentras en ese plan." },
        { status: 400 }
      );
    }

    if (!acceptedTermsAt) {
      return NextResponse.json(
        {
          error:
            "Debes aceptar los Términos y Condiciones de cambio de plan antes de continuar.",
        },
        { status: 400 }
      );
    }

    const quote = calculatePlanChangeQuote({
      currentTier: fromPlan,
      targetTier: toPlan,
      periodEndIso,
    });

    const adminClient = createAdminSupabaseClient();
    if (!adminClient) {
      return NextResponse.json({
        mode: "demo",
        recorded: true,
        quote,
      });
    }

    let coachId: string | null = null;
    let resolvedEmail = coachEmailInput;
    try {
      const supabase = await createServerSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        coachId = user.id;
        resolvedEmail = resolvedEmail || user.email || null;
      }
    } catch {
      // fallback
    }

    await adminClient
      .from("plan_changes")
      .insert({
        coach_id: coachId,
        coach_email: resolvedEmail,
        from_plan: fromPlan,
        to_plan: toPlan,
        mode: quote.mode,
        remaining_days: quote.remainingDays,
        daily_rate_mxn: Number(quote.dailyRateCurrentMxn.toFixed(4)),
        credit_applied_mxn: quote.creditMxn,
        net_amount_mxn: quote.netPayableTodayMxn,
        effective_at: quote.effectiveAtIso,
        accepted_terms_at: acceptedTermsAt,
      })
      .then(() => {});

    // Si es downgrade, programamos el cambio al cierre de corte sin quitar beneficios actuales
    if (quote.mode === "downgrade" && coachId) {
      await adminClient
        .from("profiles")
        .update({
          scheduled_downgrade_plan_tier: toPlan,
          saas_period_end: quote.effectiveAtIso,
        })
        .eq("id", coachId)
        .then(() => {});
    }

    return NextResponse.json({
      recorded: true,
      quote,
    });
  } catch {
    return NextResponse.json(
      { error: "No se pudo registrar el cambio de plan." },
      { status: 500 }
    );
  }
}
