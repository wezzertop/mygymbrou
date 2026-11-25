import { NextResponse } from "next/server";
import {
  createAdminSupabaseClient,
  createServerSupabaseClient,
} from "@/lib/supabase/server";
import { getServerAppUrl, getStripeClient } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    const stripe = getStripeClient();
    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe Customer Portal no está configurado en el servidor." },
        { status: 503 }
      );
    }

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Debes iniciar sesión para administrar tu facturación." },
        { status: 401 }
      );
    }

    const adminClient = createAdminSupabaseClient();
    let customerId: string | null = null;
    if (adminClient) {
      const { data: prof } = await adminClient
        .from("profiles")
        .select("stripe_customer_id, full_name, email")
        .eq("id", user.id)
        .maybeSingle();
      customerId = prof?.stripe_customer_id || null;

      if (!customerId) {
        const customer = await stripe.customers.create({
          email: prof?.email || user.email || undefined,
          name: prof?.full_name || "Coach MiGymBrou",
          metadata: { coach_id: user.id, user_id: user.id },
        });
        customerId = customer.id;
        await adminClient
          .from("profiles")
          .update({ stripe_customer_id: customerId })
          .eq("id", user.id);
      }
    }

    if (!customerId) {
      return NextResponse.json(
        { error: "No encontramos un perfil de facturación en Stripe para esta cuenta." },
        { status: 404 }
      );
    }

    const appOrigin = getServerAppUrl(request);
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${appOrigin}/coach/plans?tab=saas`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "No se pudo abrir el portal de facturación.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
