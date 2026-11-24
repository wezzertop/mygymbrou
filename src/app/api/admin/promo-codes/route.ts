import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { DEFAULT_PROMO_CODES } from "@/lib/referrals";

export async function GET() {
  const adminClient = createAdminSupabaseClient();
  if (!adminClient) {
    return NextResponse.json({ codes: DEFAULT_PROMO_CODES, mode: "demo" });
  }

  try {
    const { data, error } = await adminClient
      .from("promo_codes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data) {
      return NextResponse.json({ codes: DEFAULT_PROMO_CODES, mode: "fallback" });
    }

    return NextResponse.json({
      codes: data.length > 0 ? data : DEFAULT_PROMO_CODES,
      mode: "live",
    });
  } catch {
    return NextResponse.json({ codes: DEFAULT_PROMO_CODES, mode: "fallback" });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const code = String(body.code || "")
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9_-]/g, "");
    const description = String(body.description || "").trim() || null;
    const discountType =
      body.discount_type === "fixed_mxn" ? "fixed_mxn" : "percent";
    const discountValue = Number(body.discount_value || 25);
    const targetPlanTier = body.target_plan_tier || null;
    const maxUses = body.max_uses ? Number(body.max_uses) : null;
    const expiresAt = body.expires_at ? new Date(body.expires_at).toISOString() : null;

    if (!code || code.length < 3) {
      return NextResponse.json(
        { error: "Ingresa un código válido de al menos 3 caracteres." },
        { status: 400 }
      );
    }
    if (discountType === "percent" && (discountValue < 5 || discountValue > 50)) {
      return NextResponse.json(
        { error: "El porcentaje recomendado debe estar entre 5% y 50% (óptimo 25%–35%)." },
        { status: 400 }
      );
    }

    const adminClient = createAdminSupabaseClient();
    if (!adminClient) {
      return NextResponse.json({
        mode: "demo",
        code: {
          id: `promo-${Date.now()}`,
          code,
          description,
          discount_type: discountType,
          discount_value: discountValue,
          target_plan_tier: targetPlanTier,
          max_uses: maxUses,
          used_count: 0,
          expires_at: expiresAt,
          is_active: true,
          created_at: new Date().toISOString(),
        },
      });
    }

    const { data, error } = await adminClient
      .from("promo_codes")
      .insert({
        code,
        description,
        discount_type: discountType,
        discount_value: discountValue,
        target_plan_tier: targetPlanTier,
        max_uses: maxUses,
        expires_at: expiresAt,
        is_active: true,
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ code: data, created: true });
  } catch {
    return NextResponse.json(
      { error: "No se pudo crear el código promocional." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const id = String(body.id || "").trim();
    const isActive = Boolean(body.is_active);
    if (!id) {
      return NextResponse.json({ error: "Falta ID del código." }, { status: 400 });
    }

    const adminClient = createAdminSupabaseClient();
    if (!adminClient) {
      return NextResponse.json({ updated: true, mode: "demo" });
    }

    const { data, error } = await adminClient
      .from("promo_codes")
      .update({ is_active: isActive })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ code: data, updated: true });
  } catch {
    return NextResponse.json(
      { error: "No se pudo actualizar el código." },
      { status: 500 }
    );
  }
}
