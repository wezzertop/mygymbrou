import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import {
  getStripeClient,
  getStripePriceIdForTier,
  getTierFromStripePriceId,
} from "@/lib/stripe";
import { getSaasPlanById, SaasPlanTier } from "@/lib/saas-plans";
import {
  calculateQueuedRewardForPlan,
  REFERRAL_RULES,
} from "@/lib/referrals";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function unixToIso(ts?: number | null): string | null {
  if (!ts) return null;
  return new Date(ts * 1000).toISOString();
}

function extractSubPeriod(sub: Stripe.Subscription): {
  startIso: string | null;
  endIso: string | null;
} {
  const firstItem = sub.items?.data?.[0] as
    | (Stripe.SubscriptionItem & {
        current_period_start?: number;
        current_period_end?: number;
      })
    | undefined;
  const subAny = sub as Stripe.Subscription & {
    current_period_start?: number;
    current_period_end?: number;
  };
  return {
    startIso: unixToIso(
      firstItem?.current_period_start ?? subAny.current_period_start
    ),
    endIso: unixToIso(
      firstItem?.current_period_end ?? subAny.current_period_end
    ),
  };
}

export async function POST(request: Request) {
  const stripe = getStripeClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

  if (!stripe || !webhookSecret) {
    return NextResponse.json(
      { error: "Stripe webhook no configurado en el servidor." },
      { status: 503 }
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "Falta encabezado stripe-signature." },
      { status: 400 }
    );
  }

  // Lectura de rawBody intacto para verificación criptográfica con whsec_
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Firma inválida";
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${msg}` },
      { status: 400 }
    );
  }

  const admin = createAdminSupabaseClient();
  if (!admin) {
    return NextResponse.json({ received: true, mode: "no-admin-db" });
  }

  // Idempotencia estricta: verificar si stripe_event_id ya fue procesado
  const { data: existingEvent } = await admin
    .from("stripe_webhook_events")
    .select("stripe_event_id")
    .eq("stripe_event_id", event.id)
    .maybeSingle();

  if (existingEvent) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      // ============================================================
      // 1. checkout.session.completed
      // ============================================================
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const coachId = session.metadata?.coach_id || session.metadata?.user_id;
        const targetPlan = (session.metadata?.target_plan || "base") as SaasPlanTier;
        const referralCodeId = session.metadata?.referral_code_id || "";
        const customerId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id || null;
        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id || null;

        let periodStart: string | null = new Date().toISOString();
        let periodEnd: string | null = new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString();

        if (subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          const p = extractSubPeriod(sub);
          if (p.startIso) periodStart = p.startIso;
          if (p.endIso) periodEnd = p.endIso;
        }

        const planConfig = getSaasPlanById(targetPlan);
        if (coachId) {
          await admin
            .from("profiles")
            .update({
              saas_plan_tier: targetPlan,
              saas_student_limit: planConfig.studentLimit,
              saas_subscription_status: "active",
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              saas_period_start: periodStart,
              saas_period_end: periodEnd,
              scheduled_downgrade_plan_tier: null,
            })
            .eq("id", coachId);
        }

        // Si el coach invitado utilizó código de referido:
        // 1) Marca descuento de invitado como redimido (solo 1er mes)
        // 2) Agrega 1 recompensa mensual en la cola consecutiva del Coach Padrino (respetando tope 12-24)
        if (referralCodeId) {
          const { data: redemption } = await admin
            .from("referral_redemptions")
            .select("*")
            .eq("id", referralCodeId)
            .maybeSingle();

          if (redemption && !redemption.first_month_applied) {
            await admin
              .from("referral_redemptions")
              .update({ first_month_applied: true })
              .eq("id", redemption.id);

            if (redemption.code_kind === "referral" && redemption.sponsor_coach_id) {
              const [{ data: sponsor }, { data: sponsorCode }, { data: existingQueue }] =
                await Promise.all([
                  admin
                    .from("profiles")
                    .select("saas_plan_tier")
                    .eq("id", redemption.sponsor_coach_id)
                    .maybeSingle(),
                  admin
                    .from("referral_codes")
                    .select("max_rewards_cap, sponsor_discount_percent")
                    .eq("coach_id", redemption.sponsor_coach_id)
                    .maybeSingle(),
                  admin
                    .from("referral_reward_queue")
                    .select("id, queue_position")
                    .eq("sponsor_coach_id", redemption.sponsor_coach_id)
                    .in("status", ["queued", "applied"]),
                ]);

              const cap = sponsorCode?.max_rewards_cap || REFERRAL_RULES.defaultRewardCap;
              const currentCount = (existingQueue || []).length;

              if (currentCount < cap) {
                const sponsorTier = (sponsor?.saas_plan_tier || "base") as SaasPlanTier;
                const sponsorPlan = getSaasPlanById(sponsorTier);
                const lockedPrice =
                  sponsorPlan.priceMxn > 0
                    ? sponsorPlan.priceMxn
                    : getSaasPlanById("base").priceMxn;

                await admin.from("referral_reward_queue").insert({
                  sponsor_coach_id: redemption.sponsor_coach_id,
                  invited_coach_id: coachId || null,
                  invited_coach_email: redemption.invited_coach_email,
                  discount_percent: Number(
                    sponsorCode?.sponsor_discount_percent ||
                      REFERRAL_RULES.sponsorDiscountPercent
                  ),
                  plan_at_grant: sponsorTier,
                  locked_plan_price_mxn: lockedPrice,
                  queue_position: currentCount + 1,
                  status: "queued",
                });
              }
            }
          }
        }
        break;
      }

      // ============================================================
      // 2. invoice.paid
      // ============================================================
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice & {
          subscription?: string | { id: string } | null;
        };
        const customerId =
          typeof invoice.customer === "string"
            ? invoice.customer
            : invoice.customer?.id || null;
        const subscriptionId =
          typeof invoice.subscription === "string"
            ? invoice.subscription
            : invoice.subscription?.id || null;

        if (!customerId) break;

        const { data: coach } = await admin
          .from("profiles")
          .select(
            "id, saas_plan_tier, stripe_subscription_id, scheduled_downgrade_plan_tier"
          )
          .eq("stripe_customer_id", customerId)
          .maybeSingle();

        if (!coach) break;

        const line = invoice.lines?.data?.[0];
        const periodStart = unixToIso(line?.period?.start) || new Date().toISOString();
        const periodEnd =
          unixToIso(line?.period?.end) ||
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        const amountPaidMxn = Number(((invoice.amount_paid || 0) / 100).toFixed(2));

        // Registrar factura en historial interno del coach
        await admin
          .from("coach_billing_invoices")
          .upsert(
            {
              coach_id: coach.id,
              stripe_invoice_id: invoice.id,
              stripe_subscription_id: subscriptionId,
              plan_tier: coach.saas_plan_tier || "base",
              amount_paid_mxn: amountPaidMxn,
              currency: invoice.currency || "mxn",
              status: "paid",
              hosted_invoice_url: invoice.hosted_invoice_url || null,
              invoice_pdf: invoice.invoice_pdf || null,
              period_start: periodStart,
              period_end: periodEnd,
            },
            { onConflict: "stripe_invoice_id" }
          );

        // Actualizar vigencia del plan
        await admin
          .from("profiles")
          .update({
            saas_subscription_status: "active",
            saas_period_start: periodStart,
            saas_period_end: periodEnd,
          })
          .eq("id", coach.id);

        // Si tenía downgrade programado a otro plan de pago, aplicarlo sin prorrateo para el siguiente ciclo
        const scheduledTier = coach.scheduled_downgrade_plan_tier as SaasPlanTier | null;
        if (
          scheduledTier &&
          scheduledTier !== "free" &&
          subscriptionId
        ) {
          const nextPriceId = getStripePriceIdForTier(scheduledTier);
          if (nextPriceId) {
            const sub = await stripe.subscriptions.retrieve(subscriptionId);
            const itemId = sub.items.data[0]?.id;
            if (itemId) {
              await stripe.subscriptions.update(subscriptionId, {
                items: [{ id: itemId, price: nextPriceId }],
                proration_behavior: "none",
              });
              const nextConfig = getSaasPlanById(scheduledTier);
              await admin
                .from("profiles")
                .update({
                  saas_plan_tier: scheduledTier,
                  saas_student_limit: nextConfig.studentLimit,
                  scheduled_downgrade_plan_tier: null,
                })
                .eq("id", coach.id);
            }
          }
        }

        // Cola mensual consecutiva de referidos: aplicar ÚNICAMENTE 1 recompensa para el siguiente ciclo
        const activeTierForNext = (scheduledTier || coach.saas_plan_tier || "base") as SaasPlanTier;
        if (activeTierForNext !== "free") {
          const { data: nextReward } = await admin
            .from("referral_reward_queue")
            .select("*")
            .eq("sponsor_coach_id", coach.id)
            .eq("status", "queued")
            .order("queue_position", { ascending: true })
            .limit(1)
            .maybeSingle();

          if (nextReward) {
            const calc = calculateQueuedRewardForPlan(
              {
                discount_percent: Number(nextReward.discount_percent || 25),
                locked_plan_price_mxn: Number(nextReward.locked_plan_price_mxn || 449),
                plan_at_grant: nextReward.plan_at_grant as SaasPlanTier,
              },
              activeTierForNext
            );

            if (calc.discountAmountMxn > 0) {
              await stripe.invoiceItems.create({
                customer: customerId,
                amount: -Math.round(calc.discountAmountMxn * 100),
                currency: "mxn",
                description: `Recompensa mensual por referido (${nextReward.discount_percent}% sobre base $${calc.referenceBasePriceMxn} MXN)`,
              });

              await admin
                .from("referral_reward_queue")
                .update({
                  status: "applied",
                  applied_month: new Date().toISOString().slice(0, 7),
                  applied_amount_mxn: calc.discountAmountMxn,
                  applied_at: new Date().toISOString(),
                })
                .eq("id", nextReward.id);
            }
          }
        }
        break;
      }

      // ============================================================
      // 3. invoice.payment_failed
      // ============================================================
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === "string"
            ? invoice.customer
            : invoice.customer?.id || null;
        if (!customerId) break;

        const { data: coach } = await admin
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();

        if (coach) {
          await admin
            .from("profiles")
            .update({ saas_subscription_status: "past_due" })
            .eq("id", coach.id);

          await admin.from("notifications").insert({
            user_id: coach.id,
            title: "Pago de suscripción rechazado",
            message:
              "No pudimos cobrar tu renovación mensual. Actualiza tu tarjeta desde Administrar Facturación para mantener tus cupos activos.",
            type: "subscription",
            is_read: false,
          });
        }
        break;
      }

      // ============================================================
      // 4. customer.subscription.updated
      // ============================================================
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId =
          typeof sub.customer === "string" ? sub.customer : sub.customer?.id || null;
        if (!customerId) break;

        const priceId = sub.items?.data?.[0]?.price?.id;
        const detectedTier =
          getTierFromStripePriceId(priceId) ||
          (sub.metadata?.target_plan as SaasPlanTier | undefined);
        const period = extractSubPeriod(sub);

        const mappedStatus =
          sub.status === "active"
            ? "active"
            : sub.status === "past_due"
            ? "past_due"
            : sub.status === "trialing"
            ? "trialing"
            : "canceled";

        const updatePayload: Record<string, unknown> = {
          stripe_subscription_id: sub.id,
          saas_subscription_status: mappedStatus,
          ...(period.startIso ? { saas_period_start: period.startIso } : {}),
          ...(period.endIso ? { saas_period_end: period.endIso } : {}),
        };

        if (detectedTier) {
          updatePayload.saas_plan_tier = detectedTier;
          updatePayload.saas_student_limit =
            getSaasPlanById(detectedTier).studentLimit;
        }
        if (sub.cancel_at_period_end) {
          updatePayload.scheduled_downgrade_plan_tier = "free";
        }

        await admin
          .from("profiles")
          .update(updatePayload)
          .eq("stripe_customer_id", customerId);
        break;
      }

      // ============================================================
      // 5. customer.subscription.deleted
      // ============================================================
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId =
          typeof sub.customer === "string" ? sub.customer : sub.customer?.id || null;
        if (!customerId) break;

        const freePlan = getSaasPlanById("free");
        await admin
          .from("profiles")
          .update({
            saas_plan_tier: "free",
            saas_student_limit: freePlan.studentLimit,
            saas_subscription_status: "free",
            stripe_subscription_id: null,
            scheduled_downgrade_plan_tier: null,
          })
          .eq("stripe_customer_id", customerId);
        break;
      }

      default:
        break;
    }

    // Guardar stripe_event_id para garantizar idempotencia
    await admin.from("stripe_webhook_events").insert({
      stripe_event_id: event.id,
      event_type: event.type,
      payload_summary: { livemode: event.livemode, created: event.created },
    });

    return NextResponse.json({ received: true, type: event.type });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error procesando webhook de Stripe.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
