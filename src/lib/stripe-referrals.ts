import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { getStripeClient } from "@/lib/stripe";
import { getSaasPlanById, SaasPlanTier } from "@/lib/saas-plans";
import { calculateQueuedRewardForPlan } from "@/lib/referrals";

/**
 * Servicio idempotente de Cola Mensual Consecutiva de Referidos en Stripe:
 * - Garantiza estrictamente MÁXIMO 1 descuento activo/programado por mes (nunca apila 2 en el mismo mes).
 * - Caso estándar (mismo plan) o Downgrade: crea cupón Stripe `duration: 'once'` con `percent_off`
 *   (nunca genera saldo negativo ni devolución en efectivo).
 * - Caso Upgrade (plan actual más caro que el plan donde se ganó la recompensa):
 *   crea cupón Stripe `duration: 'once'` con `amount_off` en centavos MXN equivalente al valor
 *   del plan previo (`locked_plan_price_mxn * discount_percent%`).
 */
export async function applyNextReferralRewardToStripe(
  coachId: string,
  options?: { draftInvoiceId?: string }
): Promise<{
  applied: boolean;
  reason?: string;
  couponId?: string;
  rewardId?: string;
}> {
  const stripe = getStripeClient();
  const admin = createAdminSupabaseClient();
  if (!stripe || !admin || !coachId) {
    return { applied: false, reason: "missing_clients" };
  }

  // 1. Verificar que el coach tenga suscripción activa en Stripe (plan de pago)
  const { data: coach } = await admin
    .from("profiles")
    .select(
      "id, saas_plan_tier, saas_subscription_status, stripe_customer_id, stripe_subscription_id"
    )
    .eq("id", coachId)
    .maybeSingle();

  if (
    !coach ||
    !coach.stripe_subscription_id ||
    coach.saas_plan_tier === "free" ||
    coach.saas_subscription_status === "canceled"
  ) {
    return { applied: false, reason: "no_active_paid_subscription" };
  }

  // 2. Regla estricta anti-apilamiento: si ya hay 1 recompensa `queued_in_stripe`, NO activar otra este mes
  const { data: alreadyQueued } = await admin
    .from("referral_reward_queue")
    .select("id, stripe_coupon_id")
    .eq("sponsor_coach_id", coachId)
    .eq("status", "queued_in_stripe")
    .limit(1)
    .maybeSingle();

  if (alreadyQueued) {
    return {
      applied: false,
      reason: "already_queued_for_next_cycle",
      rewardId: alreadyQueued.id,
      couponId: alreadyQueued.stripe_coupon_id || undefined,
    };
  }

  // 3. Tomar ÚNICAMENTE la siguiente recompensa pendiente en orden de cola
  const { data: nextReward } = await admin
    .from("referral_reward_queue")
    .select("*")
    .eq("sponsor_coach_id", coachId)
    .in("status", ["pending", "queued"])
    .order("queue_position", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!nextReward) {
    return { applied: false, reason: "empty_queue" };
  }

  const currentTier = (coach.saas_plan_tier || "base") as SaasPlanTier;
  const currentPlan = getSaasPlanById(currentTier);
  const lockedPrice = Number(nextReward.locked_plan_price_mxn || currentPlan.priceMxn);
  const discountPercent = Math.min(
    50,
    Math.max(5, Number(nextReward.discount_percent || 25))
  );

  const calc = calculateQueuedRewardForPlan(
    {
      discount_percent: discountPercent,
      locked_plan_price_mxn: lockedPrice,
      plan_at_grant: (nextReward.plan_at_grant || "base") as SaasPlanTier,
    },
    currentTier
  );

  // 4. Crear cupón nativo de Stripe `duration: 'once'` según regla Upgrade vs Estándar/Downgrade
  const coupon =
    calc.ruleApplied === "upgrade_locked_base"
      ? await stripe.coupons.create({
          amount_off: Math.round(calc.discountAmountMxn * 100),
          currency: "mxn",
          duration: "once",
          name: `Referido ${discountPercent}% (base plan ${nextReward.plan_at_grant})`,
          metadata: {
            reward_id: nextReward.id,
            sponsor_coach_id: coachId,
            rule: "upgrade_locked_base",
          },
        })
      : await stripe.coupons.create({
          percent_off: discountPercent,
          duration: "once",
          name: `Referido ${discountPercent}% mensual`,
          metadata: {
            reward_id: nextReward.id,
            sponsor_coach_id: coachId,
            rule: calc.ruleApplied,
          },
        });

  // 5. Inyectar cupón en factura draft (invoice.created) o directamente en la suscripción activa
  if (options?.draftInvoiceId) {
    await stripe.invoices.update(options.draftInvoiceId, {
      discounts: [{ coupon: coupon.id }],
    });
  } else {
    await stripe.subscriptions.update(coach.stripe_subscription_id, {
      discounts: [{ coupon: coupon.id }],
    });
  }

  // 6. Marcar como `queued_in_stripe` con su `stripe_coupon_id`
  await admin
    .from("referral_reward_queue")
    .update({
      status: "queued_in_stripe",
      stripe_coupon_id: coupon.id,
      stripe_invoice_id: options?.draftInvoiceId || null,
      applied_amount_mxn: calc.discountAmountMxn,
    })
    .eq("id", nextReward.id);

  return {
    applied: true,
    couponId: coupon.id,
    rewardId: nextReward.id,
  };
}

/**
 * Cuando `invoice.paid` confirma que se cobró el ciclo con descuento:
 * 1) Pasa la recompensa `queued_in_stripe` a `applied` con monto y mes exactos.
 * 2) Encola automáticamente la SIGUIENTE recompensa (solo 1) para el próximo mes.
 */
export async function finalizeAppliedRewardAndQueueNext(params: {
  coachId: string;
  invoiceId: string;
  discountAmountMxn?: number;
}): Promise<void> {
  const admin = createAdminSupabaseClient();
  if (!admin || !params.coachId) return;

  const { data: activeQueued } = await admin
    .from("referral_reward_queue")
    .select("*")
    .eq("sponsor_coach_id", params.coachId)
    .eq("status", "queued_in_stripe")
    .order("queue_position", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (activeQueued) {
    await admin
      .from("referral_reward_queue")
      .update({
        status: "applied",
        stripe_invoice_id: params.invoiceId,
        applied_month: new Date().toISOString().slice(0, 7),
        ...(params.discountAmountMxn !== undefined && params.discountAmountMxn > 0
          ? { applied_amount_mxn: params.discountAmountMxn }
          : {}),
        applied_at: new Date().toISOString(),
      })
      .eq("id", activeQueued.id);
  }

  // Preparar ÚNICAMENTE 1 recompensa más para el siguiente ciclo mensual
  await applyNextReferralRewardToStripe(params.coachId);
}
