import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import {
  DEFAULT_PROMO_CODES,
  generateCoachReferralCode,
  REFERRAL_RULES,
} from "@/lib/referrals";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const codeParam = searchParams.get("code")?.trim().toUpperCase();
  const emailParam = searchParams.get("email")?.trim().toLowerCase();
  const coachIdParam = searchParams.get("coachId")?.trim();

  const adminClient = createAdminSupabaseClient();

  // 1) Consulta del resumen de referidos + cola consecutiva del Coach
  if (coachIdParam) {
    if (!adminClient) {
      return NextResponse.json({
        code: generateCoachReferralCode("COACH", coachIdParam),
        maxRewardsCap: REFERRAL_RULES.defaultRewardCap,
        queue: [],
        redemptionsCount: 0,
        mode: "demo",
      });
    }

    try {
      const [codeRes, queueRes, redRes] = await Promise.all([
        adminClient
          .from("referral_codes")
          .select("*")
          .eq("coach_id", coachIdParam)
          .maybeSingle(),
        adminClient
          .from("referral_reward_queue")
          .select("*")
          .eq("sponsor_coach_id", coachIdParam)
          .order("queue_position", { ascending: true }),
        adminClient
          .from("referral_redemptions")
          .select("id")
          .eq("sponsor_coach_id", coachIdParam),
      ]);

      return NextResponse.json({
        code:
          codeRes.data?.code ||
          generateCoachReferralCode("COACH", coachIdParam),
        maxRewardsCap:
          codeRes.data?.max_rewards_cap || REFERRAL_RULES.defaultRewardCap,
        queue: queueRes.data || [],
        redemptionsCount: (redRes.data || []).length,
        mode: "live",
      });
    } catch {
      return NextResponse.json({
        code: generateCoachReferralCode("COACH", coachIdParam),
        maxRewardsCap: REFERRAL_RULES.defaultRewardCap,
        queue: [],
        redemptionsCount: 0,
        mode: "fallback",
      });
    }
  }

  // 2) Validación de código en tiempo real al registrarse por primera vez
  if (!codeParam) {
    return NextResponse.json(
      { valid: false, error: "Ingresa un código para validar." },
      { status: 400 }
    );
  }

  // Fallback contra promos default si no hay Supabase admin
  if (!adminClient) {
    const match = DEFAULT_PROMO_CODES.find(
      (p) => p.code.toUpperCase() === codeParam && p.is_active
    );
    if (match) {
      return NextResponse.json({
        valid: true,
        codeKind: "promo",
        code: match.code,
        discountType: match.discount_type,
        discountValue: match.discount_value,
        description: match.description,
      });
    }
    if (/^[A-Z]{3,8}-[A-Z0-9]{4}$/.test(codeParam)) {
      return NextResponse.json({
        valid: true,
        codeKind: "referral",
        code: codeParam,
        discountType: "percent",
        discountValue: REFERRAL_RULES.inviteeDefaultDiscountPercent,
        description: "Código de referido de Coach (25% en tu primer mes comprado)",
      });
    }
    return NextResponse.json({
      valid: false,
      error: "Código no encontrado o inactivo.",
    });
  }

  try {
    // Verificar si el correo ya redimió un código anteriormente (regla de uso único)
    if (emailParam) {
      const { data: prior } = await adminClient
        .from("referral_redemptions")
        .select("id")
        .eq("invited_coach_email", emailParam)
        .maybeSingle();
      if (prior) {
        return NextResponse.json({
          valid: false,
          error: "Esta cuenta ya utilizó un código promocional o de referido anteriormente.",
        });
      }
    }

    // Buscar primero en promo_codes (/admin)
    const { data: promo } = await adminClient
      .from("promo_codes")
      .select("*")
      .ilike("code", codeParam)
      .maybeSingle();

    if (promo) {
      if (!promo.is_active) {
        return NextResponse.json({ valid: false, error: "Este código promocional está inactivo." });
      }
      if (promo.expires_at && new Date(promo.expires_at).getTime() < Date.now()) {
        return NextResponse.json({ valid: false, error: "Este código promocional ya expiró." });
      }
      if (promo.max_uses && promo.used_count >= promo.max_uses) {
        return NextResponse.json({ valid: false, error: "Este código alcanzó su límite de usos." });
      }
      return NextResponse.json({
        valid: true,
        codeKind: "promo",
        code: promo.code,
        discountType: promo.discount_type,
        discountValue: Number(promo.discount_value),
        targetPlanTier: promo.target_plan_tier || null,
        description:
          promo.description ||
          `${promo.discount_value}${promo.discount_type === "percent" ? "%" : " MXN"} de descuento en tu primer mes`,
      });
    }

    // Buscar en referral_codes (códigos de coaches)
    const { data: refCode } = await adminClient
      .from("referral_codes")
      .select("*, profiles:coach_id(email, full_name)")
      .ilike("code", codeParam)
      .maybeSingle();

    if (refCode && refCode.is_active) {
      const sponsorEmail = (refCode.profiles as { email?: string } | null)?.email?.toLowerCase();
      if (emailParam && sponsorEmail && sponsorEmail === emailParam) {
        return NextResponse.json({
          valid: false,
          error: "No puedes usar tu propio código de referido.",
        });
      }
      return NextResponse.json({
        valid: true,
        codeKind: "referral",
        code: refCode.code,
        sponsorCoachId: refCode.coach_id,
        discountType: "percent",
        discountValue: Number(refCode.invitee_discount_percent || 25),
        description: `${refCode.invitee_discount_percent || 25}% de descuento en tu primer mes (solo primer mes comprado)`,
      });
    }

    // Fallback a DEFAULT_PROMO_CODES si la tabla aún no está sembrada
    const fallbackPromo = DEFAULT_PROMO_CODES.find(
      (p) => p.code.toUpperCase() === codeParam && p.is_active
    );
    if (fallbackPromo) {
      return NextResponse.json({
        valid: true,
        codeKind: "promo",
        code: fallbackPromo.code,
        discountType: fallbackPromo.discount_type,
        discountValue: fallbackPromo.discount_value,
        description: fallbackPromo.description,
      });
    }

    return NextResponse.json({
      valid: false,
      error: "Código no válido o inactivo.",
    });
  } catch {
    return NextResponse.json({
      valid: false,
      error: "No se pudo validar el código en este momento.",
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const code = String(body.code || "").trim().toUpperCase();
    const invitedEmail = String(body.invited_email || "").trim().toLowerCase();
    const codeKind = body.code_kind === "promo" ? "promo" : "referral";
    const discountType = body.discount_type === "fixed_mxn" ? "fixed_mxn" : "percent";
    const discountValue = Number(body.discount_value || 25);
    const sponsorCoachId = body.sponsor_coach_id || null;

    if (!code || !invitedEmail) {
      return NextResponse.json(
        { error: "Faltan código o correo para registrar redención." },
        { status: 400 }
      );
    }

    const adminClient = createAdminSupabaseClient();
    if (!adminClient) {
      return NextResponse.json({ recorded: true, mode: "demo" });
    }

    await adminClient
      .from("referral_redemptions")
      .insert({
        code,
        code_kind: codeKind,
        sponsor_coach_id: sponsorCoachId,
        invited_coach_email: invitedEmail,
        discount_type: discountType,
        discount_value: discountValue,
        first_month_applied: false,
      })
      .then(() => {});

    return NextResponse.json({ recorded: true });
  } catch {
    return NextResponse.json(
      { error: "No se pudo registrar la redención del código." },
      { status: 500 }
    );
  }
}
