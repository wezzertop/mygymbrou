import { NextResponse } from "next/server";
import {
  createAdminSupabaseClient,
  createServerSupabaseClient,
} from "@/lib/supabase/server";
import { DEFAULT_APPROVED_GYMS } from "@/lib/coach-catalogs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const includePending = searchParams.get("includePending") === "true";

  const adminClient = createAdminSupabaseClient();
  if (!adminClient) {
    return NextResponse.json({ gyms: DEFAULT_APPROVED_GYMS, mode: "fallback" });
  }

  try {
    let query = adminClient
      .from("gyms")
      .select("*")
      .order("status", { ascending: true })
      .order("name", { ascending: true });

    if (!includePending) {
      query = query.eq("status", "approved");
    }

    const { data, error } = await query;
    if (error || !data) {
      return NextResponse.json({
        gyms: DEFAULT_APPROVED_GYMS,
        mode: "fallback",
      });
    }

    return NextResponse.json({
      gyms: data.length > 0 ? data : DEFAULT_APPROVED_GYMS,
      mode: "live",
    });
  } catch {
    return NextResponse.json({ gyms: DEFAULT_APPROVED_GYMS, mode: "fallback" });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body.name || "").trim();
    const city = String(body.city || "").trim() || null;
    const submittedByEmail = String(body.submitted_by_email || "")
      .trim()
      .toLowerCase() || null;

    if (!name || name.length < 2) {
      return NextResponse.json(
        { error: "Ingresa el nombre del gimnasio o estudio." },
        { status: 400 }
      );
    }

    const adminClient = createAdminSupabaseClient();
    if (!adminClient) {
      return NextResponse.json({
        mode: "demo",
        gym: {
          id: `gym-pending-${Date.now()}`,
          name,
          city,
          status: "pending",
          submitted_by_email: submittedByEmail,
          created_at: new Date().toISOString(),
        },
      });
    }

    let coachId: string | null = null;
    try {
      const supabase = await createServerSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      coachId = user?.id || null;
    } catch {
      // public registration before email confirmation
    }

    // Evitar duplicados exactos
    const { data: existing } = await adminClient
      .from("gyms")
      .select("*")
      .ilike("name", name)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ gym: existing, existed: true });
    }

    const { data, error } = await adminClient
      .from("gyms")
      .insert({
        name,
        city,
        status: "pending",
        submitted_by_coach_id: coachId,
        submitted_by_email: submittedByEmail,
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message || "No se pudo registrar el gimnasio." },
        { status: 500 }
      );
    }

    return NextResponse.json({ gym: data, created: true });
  } catch {
    return NextResponse.json(
      { error: "Error procesando solicitud de gimnasio." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const id = String(body.id || "").trim();
    const status = body.status as "approved" | "rejected" | "pending" | undefined;
    const name = body.name ? String(body.name).trim() : undefined;
    const city = body.city !== undefined ? String(body.city).trim() || null : undefined;

    if (!id) {
      return NextResponse.json({ error: "Falta ID del gimnasio." }, { status: 400 });
    }

    const adminClient = createAdminSupabaseClient();
    if (!adminClient) {
      return NextResponse.json({ updated: true, mode: "demo" });
    }

    const patch: Record<string, unknown> = {};
    if (status) {
      patch.status = status;
      if (status === "approved") patch.approved_at = new Date().toISOString();
    }
    if (name) patch.name = name;
    if (city !== undefined) patch.city = city;

    const { data, error } = await adminClient
      .from("gyms")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ gym: data, updated: true });
  } catch {
    return NextResponse.json(
      { error: "Error actualizando gimnasio." },
      { status: 500 }
    );
  }
}
