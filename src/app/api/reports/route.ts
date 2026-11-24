import { NextResponse } from "next/server";
import {
  createAdminSupabaseClient,
  createServerSupabaseClient,
} from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      reported_user_id,
      reported_user_name,
      reported_role,
      category,
      description,
    } = body as {
      reported_user_id?: string;
      reported_user_name?: string;
      reported_role?: "coach" | "student";
      category?: string;
      description?: string;
    };

    if (!reported_user_name?.trim() || !description?.trim()) {
      return NextResponse.json(
        { error: "Indica el usuario y describe el motivo del reporte." },
        { status: 400 }
      );
    }

    const adminClient = createAdminSupabaseClient();
    if (!adminClient) {
      return NextResponse.json({ mode: "demo", created: true });
    }

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Debes iniciar sesión para enviar un reporte." },
        { status: 401 }
      );
    }

    const { data: reporterProfile } = await adminClient
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();

    const { data, error } = await adminClient
      .from("user_reports")
      .insert({
        reporter_id: user.id,
        reported_user_id: reported_user_id || null,
        reporter_name:
          reporterProfile?.full_name || user.email?.split("@")[0] || "Usuario",
        reported_user_name: reported_user_name.trim(),
        reported_role: reported_role === "student" ? "student" : "coach",
        category: category || "servicio",
        description: description.trim(),
        status: "pendiente",
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ mode: "supabase", created: true, report: data });
  } catch {
    return NextResponse.json(
      { error: "Error al registrar el reporte." },
      { status: 500 }
    );
  }
}
