import { NextResponse } from "next/server";
import {
  createAdminSupabaseClient,
  createServerSupabaseClient,
} from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token")?.trim();

    if (!token) {
      return NextResponse.json(
        { error: "Token de invitación faltante." },
        { status: 400 }
      );
    }

    const adminClient = createAdminSupabaseClient();
    if (!adminClient) {
      return NextResponse.json({ mode: "demo", invite: null });
    }

    const { data: relation } = await adminClient
      .from("coach_students")
      .select(
        "id, coach_id, student_id, invited_name, invited_email, invite_status, subscription_plan_name"
      )
      .eq("invite_token", token)
      .maybeSingle();

    if (!relation) {
      return NextResponse.json(
        { error: "Invitación no encontrada o expirada." },
        { status: 404 }
      );
    }

    const [{ data: coach }, { data: existingStudent }] = await Promise.all([
      adminClient
        .from("profiles")
        .select("id, full_name, brand_name, avatar_url, specialty")
        .eq("id", relation.coach_id)
        .maybeSingle(),
      adminClient
        .from("profiles")
        .select("id, email")
        .ilike("email", relation.invited_email)
        .maybeSingle(),
    ]);

    return NextResponse.json({
      mode: "supabase",
      invite: {
        id: relation.id,
        coach_id: relation.coach_id,
        coach_name: coach?.full_name || "Tu Coach",
        coach_brand: coach?.brand_name || "MiGymBrou",
        coach_avatar: coach?.avatar_url || null,
        invited_name: relation.invited_name,
        invited_email: relation.invited_email,
        invite_status: relation.invite_status,
        plan_name: relation.subscription_plan_name,
        has_existing_account: Boolean(existingStudent),
      },
    });
  } catch {
    return NextResponse.json(
      { error: "No se pudo consultar la invitación." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, fullName } = body as {
      token?: string;
      fullName?: string;
    };

    if (!token) {
      return NextResponse.json(
        { error: "Token de invitación obligatorio." },
        { status: 400 }
      );
    }

    const adminClient = createAdminSupabaseClient();
    if (!adminClient) {
      return NextResponse.json({ mode: "demo", accepted: true });
    }

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Debes iniciar sesión para aceptar la invitación." },
        { status: 401 }
      );
    }

    const { data: relation } = await adminClient
      .from("coach_students")
      .select("*")
      .eq("invite_token", token)
      .maybeSingle();

    if (!relation) {
      return NextResponse.json(
        { error: "La invitación no existe o ya no es válida." },
        { status: 404 }
      );
    }

    // Vincular alumno con el coach y activar estado
    const { error: updateErr } = await adminClient
      .from("coach_students")
      .update({
        student_id: user.id,
        invited_name: fullName?.trim() || relation.invited_name,
        invite_status: "active",
        subscription_status:
          relation.subscription_status === "trial"
            ? "active"
            : relation.subscription_status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", relation.id);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 400 });
    }

    // Notificar al Coach en tiempo real
    await adminClient.from("notifications").insert({
      user_id: relation.coach_id,
      title: "¡Nuevo alumno vinculado!",
      message: `${fullName?.trim() || relation.invited_name} aceptó tu invitación y ya está activo en tu cartera.`,
      type: "subscription",
    });

    return NextResponse.json({
      mode: "supabase",
      accepted: true,
      coachId: relation.coach_id,
    });
  } catch {
    return NextResponse.json(
      { error: "Error al aceptar la invitación." },
      { status: 500 }
    );
  }
}
