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
import { SaasPlanTier } from "@/lib/saas-plans";

export async function POST(request: Request) {
  try {
    const stripe = getStripeClient();
    if (!stripe) {
      return NextResponse.json(
        {
          error: "Stripe no está configurado en el servidor todavía.",
          fallback: "spei",
        },
        { status: 503 }
      );
    }

    const body = await request.json();
    const targetPlan = body.target_plan as SaasPlanTier;
    const priceId = getStripePriceIdForTier(targetPlan);
    if (!priceId || !["base", "pro", "studio"].includes(targetPlan)) {
      return NextResponse.json(
        {
          error:
            "Plan o Price ID de Stripe inválido. Verifica las variables NEXT_PUBLIC_STRIPE_PRICE_*.",
        },
        { status: 400 }
      );
    }

    const adminClient = createAdminSupabaseClient();
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const coachId = user?.id || (body.coach_id as string | undefined) || "";
    const coachEmail = (
      user?.email ||
      (body.coach_email as string | undefined) ||
      ""
    )
      .trim()
      .toLowerCase();
    const coachName = (
      (body.coach_name as string | undefined) ||
      (user?.user_metadata?.full_name as string | undefined) ||
      coachEmail.split("@")[0] ||
      "Coach MiGymBrou"
    ).trim();

    if (!coachEmail) {
      return NextResponse.json(
        { error: "Inicia sesión con tu cuenta de Coach para continuar al pago." },
        { status: 401 }
      );
    }

    // 1. Obtener o crear stripe_customer_id en Supabase
    let stripeCustomerId: string | null = null;
    if (adminClient && coachId) {
      const { data: prof } = await adminClient
        .from("profiles")
        .select("stripe_customer_id")
        .eq("id", coachId)
        .maybeSingle();
      stripeCustomerId = prof?.stripe_customer_id || null;
    }

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: coachEmail,
        name: coachName,
        metadata: {
          coach_id: coachId,
          user_id: coachId,
        },
      });
      stripeCustomerId = customer.id;
      if (adminClient && coachId) {
        await adminClient
          .from("profiles")
          .update({ stripe_customer_id: stripeCustomerId })
          .eq("id", coachId);
      }
    }

    // 2. Verificar si el coach tiene un descuento pendiente de primer mes (código de referido o promo)
    let discounts: { coupon: string }[] | undefined;
    let referralCodeId = "";
    if (adminClient) {
      const { data: redemption } = await adminClient
        .from("referral_redemptions")
        .select("*")
        .eq("invited_coach_email", coachEmail)
        .eq("first_month_applied", false)
        .maybeSingle();

      if (redemption) {
        referralCodeId = redemption.id;
        const coupon = await stripe.coupons.create(
          redemption.discount_type === "fixed_mxn"
            ? {
                amount_off: Math.round(Number(redemption.discount_value) * 100),
                currency: "mxn",
                duration: "once",
                name: `Descuento 1er mes (${redemption.code})`,
              }
            : {
                percent_off: Math.min(50, Math.max(5, Number(redemption.discount_value))),
                duration: "once",
                name: `Descuento 1er mes ${redemption.discount_value}% (${redemption.code})`,
              }
        );
        discounts = [{ coupon: coupon.id }];
      }
    }

    // 3. Crear sesión de Stripe Checkout (mode: subscription)
    const appOrigin = getServerAppUrl(request);
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: stripeCustomerId,
      line_items: [{ price: priceId, quantity: 1 }],
      ...(discounts ? { discounts } : {}),
      success_url: `${appOrigin}/coach/plans?tab=saas&payment=success`,
      cancel_url: `${appOrigin}/coach/plans?tab=saas&payment=canceled`,
      metadata: {
        coach_id: coachId,
        user_id: coachId,
        target_plan: targetPlan,
        referral_code_id: referralCodeId,
        change_mode: "new",
      },
      subscription_data: {
        metadata: {
          coach_id: coachId,
          target_plan: targetPlan,
          referral_code_id: referralCodeId,
        },
      },
    });

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error creando sesión de pago Stripe.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
