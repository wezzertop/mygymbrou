import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import {
  createAdminSupabaseClient,
  createServerSupabaseClient,
} from "@/lib/supabase/server";

function sanitizeNextPath(next: string | null): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return null;
  }
  return next;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = sanitizeNextPath(searchParams.get("next"));

  const envUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    ""
  )
    .trim()
    .replace(/\/+$/, "");
  const forwardedHost = request.headers
    .get("x-forwarded-host")
    ?.split(",")[0]
    ?.trim();
  const forwardedProto =
    request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || "https";

  const isLocal = (u?: string | null) =>
    !u ||
    u.includes("localhost") ||
    u.includes("127.0.0.1") ||
    u.includes("0.0.0.0");

  const appOrigin =
    forwardedHost && !isLocal(forwardedHost)
      ? `${forwardedProto}://${forwardedHost}`
      : envUrl && !isLocal(envUrl)
      ? envUrl
      : !isLocal(origin)
      ? origin
      : origin || "https://migymbrou.com";

  const supabase = await createServerSupabaseClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(
        `${appOrigin}/auth?error=${encodeURIComponent(
          "El enlace de verificación expiró o no es válido. Intenta iniciar sesión o solicita uno nuevo."
        )}`
      );
    }
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (error) {
      return NextResponse.redirect(
        `${appOrigin}/auth?error=${encodeURIComponent(
          "No se pudo verificar el enlace de correo. Solicita un nuevo correo."
        )}`
      );
    }
  }

  // Auto-vincular invitaciones pendientes de registro (Caso A) al confirmar cuenta
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.email) {
    try {
      const adminClient = createAdminSupabaseClient();
      if (adminClient) {
        const cleanEmail = user.email.toLowerCase();
        const { data: pendingSignups } = await adminClient
          .from("coach_students")
          .select("id, coach_id, invited_name, subscription_status")
          .ilike("invited_email", cleanEmail)
          .in("invite_status", ["pending", "pending_signup"])
          .is("student_id", null);

        for (const rel of pendingSignups || []) {
          await adminClient
            .from("coach_students")
            .update({
              student_id: user.id,
              invite_status: "active",
              subscription_status:
                rel.subscription_status === "trial"
                  ? "active"
                  : rel.subscription_status,
              updated_at: new Date().toISOString(),
            })
            .eq("id", rel.id);

          const { data: rec } = await adminClient
            .from("coach_student_records")
            .update({
              student_id: user.id,
              updated_at: new Date().toISOString(),
            })
            .eq("coach_student_id", rel.id)
            .select("id")
            .maybeSingle();

          if (rec?.id) {
            await adminClient.rpc("materialize_initial_assessment", {
              target_record_id: rec.id,
              target_student_id: user.id,
            });
          }
        }
      }
    } catch {
      // No bloquear redirección si falla la auto-vinculación en callback (reintenta en AppContext)
    }
  }

  // Si hay una ruta específica (ej. /auth/reset-password o /auth/activate?token=...), redirigimos allí
  if (next) {
    return NextResponse.redirect(`${appOrigin}${next}`);
  }

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const role =
      profile?.role || (user.user_metadata?.role as string | undefined);

    if (role === "admin") {
      return NextResponse.redirect(`${appOrigin}/admin`);
    }
    if (role === "student") {
      return NextResponse.redirect(`${appOrigin}/student`);
    }
    return NextResponse.redirect(`${appOrigin}/coach`);
  }

  return NextResponse.redirect(`${appOrigin}/auth?confirmed=1`);
}
