import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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

  // Si hay una ruta específica (ej. /auth/reset-password o /auth/activate?token=...), redirigimos allí
  if (next) {
    return NextResponse.redirect(`${appOrigin}${next}`);
  }

  // Caso contrario, redirigimos según el rol real del usuario autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
