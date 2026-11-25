import { NextResponse } from "next/server";
import {
  createAdminSupabaseClient,
  createServerSupabaseClient,
} from "@/lib/supabase/server";
import {
  getServerAppUrl,
  getStripeClient,
  getStripePriceIdForTier,
} from "@/lib/stripe";
import {
  calculatePlanChangeQuote,
  getSaasPlanById,
  SaasPlanTier,
} from "@/lib/saas-plans";

const VALID_TIERS: SaasPlanTier[] = ["free", "base", "pro", "studio"];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const adminClient = createAdminSupabaseClient();

    if (adminClient && !user?.id) {
      return NextResponse.json(
        { error: "Debes iniciar sesión como Coach para cambiar tu plan." },
        { status: 401 }
      );
    }

    let profile: {
      id: string;
      email: string;
      full_name: string;
      saas_plan_tier?: SaasPlanTier | null;
      stripe_customer_id?: string | null;
      stripe_subscription_id?: string | null;
      saas_period_end?: string | null;
    } | null = null;

    if (adminClient && user?.id) {
      const { data } = await adminClient
        .from("profiles")
        .select(
          "id, email, full_name, saas_plan_tier, stripe_customer_id, stripe_subscription_id, saas_period_end"
        )
        .eq("id", user.id)
        .maybeSingle();
      profile = data;
    }

    // Acción: cancelar downgrade programado en Stripe y BD
    if (body.action === "cancel_scheduled_downgrade") {
      const stripe = getStripeClient();
      if (stripe && profile?.stripe_subscription_id) {
        const sub = await stripe.subscriptions.retrieve(
          profile.stripe_subscription_id
        );
        if (sub.status !== "canceled") {
          await stripe.subscriptions.update(sub.id, {
            cancel_at_period_end: false,
            metadata: {
              ...sub.metadata,
              scheduled_downgrade_plan: "",
            },
          });
        }
      }
      if (adminClient && user?.id) {
        await adminClient
          .from("profiles")
          .update({ scheduled_downgrade_plan_tier: null })
          .eq("id", user.id);
      }
      return NextResponse.json({ cancelled: true });
    }

    // Nunca confiar en from_plan del cliente cuando existe perfil real en BD
    const fromPlan = (profile?.saas_plan_tier ||
      body.from_plan ||
      "free") as SaasPlanTier;
    const toPlan = body.to_plan as SaasPlanTier;
    const acceptedTermsAt =
      typeof body.accepted_terms_at === "string" && body.accepted_terms_at
        ? body.accepted_terms_at
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
        { error: "Debes aceptar los términos de cambio de plan antes de continuar." },
        { status: 400 }
      );
    }

    const quote = calculatePlanChangeQuote({
      currentTier: fromPlan,
      targetTier: toPlan,
      periodEndIso: profile?.saas_period_end || body.period_end_iso || null,
    });

    // Registrar auditoría en plan_changes
    if (adminClient) {
      await adminClient
        .from("plan_changes")
        .insert({
          coach_id: user?.id || null,
          coach_email: profile?.email || user?.email || body.coach_email || null,
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
    }

    const stripe = getStripeClient();
    if (!stripe) {
      // Modo sin Stripe configurado: devolvemos quote para flujo SPEI / programado local
      if (quote.mode === "downgrade" && adminClient && user?.id) {
        await adminClient
          .from("profiles")
          .update({
            scheduled_downgrade_plan_tier: toPlan,
            saas_period_end: quote.effectiveAtIso,
          })
          .eq("id", user.id);
      }
      return NextResponse.json({
        mode: quote.mode,
        fallback: "spei",
        quote,
      });
    }

    const targetPriceId = getStripePriceIdForTier(toPlan);
    const appOrigin = getServerAppUrl(request);

    // ================= UPGRADE =================
    if (quote.mode === "upgrade") {
      if (!targetPriceId) {
        return NextResponse.json(
          { error: "Falta configurar el Price ID de Stripe para el plan destino." },
          { status: 400 }
        );
      }

      // Caso A: El coach ya tiene suscripción activa en Stripe -> aplicamos crédito equivalente y actualizamos
      if (profile?.stripe_subscription_id && profile?.stripe_customer_id) {
        const sub = await stripe.subscriptions.retrieve(
          profile.stripe_subscription_id
        );
        const itemId = sub.items.data[0]?.id;

        if (itemId && sub.status !== "canceled") {
          if (quote.creditMxn > 0) {
            await stripe.invoiceItems.create({
              customer: profile.stripe_customer_id,
              amount: -Math.round(quote.creditMxn * 100),
              currency: "mxn",
              description: `Equivalencia por ${quote.remainingDays} días restantes de ${quote.fromPlan.name}`,
            });
          }

          // Aplicamos nuestro crédito transparente de días restantes SIN doble prorrateo automático de Stripe
          const updatedSub = await stripe.subscriptions.update(sub.id, {
            items: [{ id: itemId, price: targetPriceId }],
            cancel_at_period_end: false,
            proration_behavior: "none",
            metadata: {
              coach_id: profile.id,
              target_plan: toPlan,
              change_mode: "upgrade",
            },
          });

          const targetConfig = getSaasPlanById(toPlan);
          if (adminClient) {
            await adminClient
              .from("profiles")
              .update({
                saas_plan_tier: toPlan,
                saas_student_limit: targetConfig.studentLimit,
                saas_subscription_status: "active",
                scheduled_downgrade_plan_tier: null,
              })
              .eq("id", profile.id);
          }

          return NextResponse.json({
            mode: "upgrade",
            upgradedImmediately: true,
            subscriptionId: updatedSub.id,
            quote,
          });
        }
      }

      // Caso B: El coach viene de Free o sin suscripción activa -> Stripe Checkout con cupón de crédito si aplica
      let customerId = profile?.stripe_customer_id || null;
      if (!customerId && (profile?.email || user?.email)) {
        const customer = await stripe.customers.create({
          email: profile?.email || user?.email || undefined,
          name: profile?.full_name || "Coach MiGymBrou",
          metadata: { coach_id: user?.id || "", user_id: user?.id || "" },
        });
        customerId = customer.id;
        if (adminClient && user?.id) {
          await adminClient
            .from("profiles")
            .update({ stripe_customer_id: customerId })
            .eq("id", user.id);
        }
      }

      let discounts: { coupon: string }[] | undefined;
      if (quote.creditMxn > 0) {
        const creditCoupon = await stripe.coupons.create({
          amount_off: Math.round(quote.creditMxn * 100),
          currency: "mxn",
          duration: "once",
          name: `Crédito ${quote.remainingDays}d restantes (${quote.fromPlan.name})`,
        });
        discounts = [{ coupon: creditCoupon.id }];
      }

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        ...(customerId ? { customer: customerId } : {}),
        line_items: [{ price: targetPriceId, quantity: 1 }],
        ...(discounts ? { discounts } : {}),
        success_url: `${appOrigin}/coach/plans?tab=saas&payment=success`,
        cancel_url: `${appOrigin}/coach/plans?tab=saas&payment=canceled`,
        metadata: {
          coach_id: user?.id || "",
          user_id: user?.id || "",
          target_plan: toPlan,
          change_mode: "upgrade",
        },
        subscription_data: {
          metadata: {
            coach_id: user?.id || "",
            target_plan: toPlan,
          },
        },
      });

      return NextResponse.json({
        mode: "upgrade",
        url: session.url,
        quote,
      });
    }

    // ================= DOWNGRADE (SIN DEVOLUCIÓN · AL FIN DE CORTE) =================
    if (profile?.stripe_subscription_id) {
      if (toPlan === "free") {
        // Mantiene beneficios hasta el cierre de corte y baja a Free automáticamente al vencer
        await stripe.subscriptions.update(profile.stripe_subscription_id, {
          cancel_at_period_end: true,
          metadata: {
            coach_id: profile.id,
            scheduled_downgrade_plan: "free",
          },
        });
      } else {
        // Guardamos el downgrade programado para aplicarlo sin prorrateo al cierre de corte
        await stripe.subscriptions.update(profile.stripe_subscription_id, {
          metadata: {
            coach_id: profile.id,
            scheduled_downgrade_plan: toPlan,
          },
        });
      }
    }

    if (adminClient && user?.id) {
      await adminClient
        .from("profiles")
        .update({
          scheduled_downgrade_plan_tier: toPlan,
          saas_period_end: quote.effectiveAtIso,
        })
        .eq("id", user.id);
    }

    return NextResponse.json({
      mode: "downgrade",
      scheduled: true,
      quote,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "No se pudo procesar el cambio de plan.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
