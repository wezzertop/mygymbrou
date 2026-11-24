import { NextResponse } from "next/server";
import {
  createAdminSupabaseClient,
  createServerSupabaseClient,
} from "@/lib/supabase/server";
import { getSaasPlanById } from "@/lib/saas-plans";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      coach_name,
      coach_email,
      plan_tier,
      transfer_reference,
      receipt_url,
      receipt_name,
      notes,
    } = body as {
      coach_name?: string;
      coach_email?: string;
      plan_tier?: "base" | "pro" | "studio";
      transfer_reference?: string;
      receipt_url?: string;
      receipt_name?: string;
      notes?: string;
    };

    if (!plan_tier || !["base", "pro", "studio"].includes(plan_tier)) {
      return NextResponse.json(
        { error: "Selecciona un plan de pago válido (Base, Pro o Estudio)." },
        { status: 400 }
      );
    }

    if (!receipt_url || !receipt_name) {
      return NextResponse.json(
        { error: "Sube tu comprobante de transferencia para continuar." },
        { status: 400 }
      );
    }

    const plan = getSaasPlanById(plan_tier);
    const adminClient = createAdminSupabaseClient();

    if (!adminClient) {
      return NextResponse.json({
        mode: "demo",
        created: true,
        request: {
          id: `pay-${Date.now()}`,
          coach_name: coach_name || "Coach",
          coach_email: coach_email || "",
          plan_tier,
          amount_mxn: plan.priceMxn,
          transfer_reference,
          receipt_url,
          receipt_name,
          notes,
          status: "pendiente",
          created_at: new Date().toISOString(),
        },
      });
    }

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let resolvedCoachId = user?.id || null;
    let resolvedName = coach_name?.trim() || "";
    let resolvedEmail = coach_email?.trim().toLowerCase() || user?.email || "";

    if (resolvedCoachId) {
      const { data: prof } = await adminClient
        .from("profiles")
        .select("full_name, email")
        .eq("id", resolvedCoachId)
        .maybeSingle();
      if (prof) {
        resolvedName = resolvedName || prof.full_name;
        resolvedEmail = resolvedEmail || prof.email;
      }
    } else if (resolvedEmail) {
      const { data: profByEmail } = await adminClient
        .from("profiles")
        .select("id, full_name")
        .ilike("email", resolvedEmail)
        .maybeSingle();
      if (profByEmail) {
        resolvedCoachId = profByEmail.id;
        resolvedName = resolvedName || profByEmail.full_name;
      }
    }

    if (!resolvedEmail) {
      return NextResponse.json(
        { error: "Indica el correo electrónico asociado a tu cuenta de Coach." },
        { status: 400 }
      );
    }

    const { data, error } = await adminClient
      .from("saas_payment_requests")
      .insert({
        coach_id: resolvedCoachId,
        coach_name: resolvedName || resolvedEmail.split("@")[0],
        coach_email: resolvedEmail,
        plan_tier,
        amount_mxn: plan.priceMxn,
        transfer_reference: transfer_reference?.trim() || null,
        receipt_url,
        receipt_name,
        notes: notes?.trim() || null,
        status: "pendiente",
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      mode: "supabase",
      created: true,
      request: data,
    });
  } catch {
    return NextResponse.json(
      { error: "Error al enviar el comprobante de pago." },
      { status: 500 }
    );
  }
}
