"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Dumbbell,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { createClient, getAppUrl, isSupabaseConfigured } from "@/lib/supabase/client";

function AuthLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get("role") === "student" ? "student" : "coach";
  const nextPath = searchParams.get("next");
  const callbackError = searchParams.get("error");

  const demoMode =
    !isSupabaseConfigured() || process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  const [role, setRole] = useState<"coach" | "student">(initialRole);
  const [email, setEmail] = useState(
    demoMode
      ? initialRole === "coach"
        ? "carlos@apexperformance.fit"
        : "sofia.ramirez@email.com"
      : searchParams.get("email") || ""
  );
  const [password, setPassword] = useState(demoMode ? "Demo1234!" : "");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [error, setError] = useState<string | null>(callbackError);

  const handleResendConfirmation = async () => {
    if (!email || !isSupabaseConfigured()) return;
    setResending(true);
    setResendSuccess(false);
    const supabase = createClient();
    const { error: resendErr } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${getAppUrl()}/auth/callback`,
      },
    });
    setResending(false);
    if (resendErr) {
      setError(resendErr.message);
    } else {
      setResendSuccess(true);
      setError(null);
    }
  };

  const handleRoleChange = (nextRole: "coach" | "student") => {
    setRole(nextRole);
    setError(null);
    if (demoMode) {
      setEmail(
        nextRole === "coach"
          ? "carlos@apexperformance.fit"
          : "sofia.ramirez@email.com"
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) {
          setError(signInError.message);
          setLoading(false);
          return;
        }

        if (nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")) {
          router.push(nextPath);
          return;
        }

        const user = data.user;
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .maybeSingle();
          const actualRole =
            profile?.role || (user.user_metadata?.role as string | undefined) || role;
          if (actualRole === "admin") {
            router.push("/admin");
            return;
          }
          router.push(actualRole === "student" ? "/student" : "/coach");
          return;
        }
      }
      router.push(role === "coach" ? "/coach" : "/student");
    } catch {
      setError("Ocurrió un error al iniciar sesión. Intenta nuevamente.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#060607] px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Inicio
          </Link>
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-white">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-zinc-950">
              <Dumbbell className="h-3.5 w-3.5 stroke-[2.25]" />
            </span>
            MiGym<span className="text-emerald-400">Brou</span>
          </Link>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-[#0e0f12] p-6 shadow-2xl sm:p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-semibold tracking-[-0.025em] text-white">
              Iniciar sesión
            </h1>
            <p className="mt-1.5 text-xs text-zinc-400 sm:text-sm">
              Selecciona tu perfil para ingresar a la plataforma
            </p>
          </div>

          {/* Role Selector Tabs */}
          <div className="mb-6 grid grid-cols-2 gap-1.5 rounded-full border border-white/[0.08] bg-[#060607] p-1">
            <button
              type="button"
              onClick={() => handleRoleChange("coach")}
              className={`h-9 rounded-full text-xs font-semibold transition ${
                role === "coach"
                  ? "bg-white text-zinc-950"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Coach
            </button>
            <button
              type="button"
              onClick={() => handleRoleChange("student")}
              className={`h-9 rounded-full text-xs font-semibold transition ${
                role === "student"
                  ? "bg-white text-zinc-950"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Alumno
            </button>
          </div>

          {error && (
            <div className="mb-4 space-y-2 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-300">
              <p>{error}</p>
              {error.toLowerCase().includes("confirm") && isSupabaseConfigured() && (
                <button
                  type="button"
                  onClick={handleResendConfirmation}
                  disabled={resending}
                  className="font-bold text-cyan-300 underline hover:text-cyan-200 disabled:opacity-60"
                >
                  {resending
                    ? "Reenviando correo..."
                    : "Reenviar correo de confirmación"}
                </button>
              )}
            </div>
          )}
          {resendSuccess && (
            <div className="mb-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-300">
              Te reenviamos el correo de confirmación. Revisa tu bandeja de entrada y spam.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-zinc-300">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-[#060607] py-3 pl-10 pr-4 text-sm text-white outline-none transition focus:border-emerald-500"
                  placeholder="tu@correo.com"
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-300">
                  Contraseña
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs font-medium text-cyan-400 hover:text-cyan-300"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-[#060607] py-3 pl-10 pr-11 text-sm text-white outline-none transition focus:border-emerald-500"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className="absolute right-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-white/[0.06] hover:text-white"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="h-12 w-full rounded-full bg-white text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200 disabled:opacity-60"
            >
              {loading
                ? "Ingresando..."
                : role === "coach"
                ? "Entrar al Panel del Coach"
                : "Entrar a mi App de Alumno"}
            </button>
          </form>

          {/* Contextual Info */}
          <div className="mt-6 border-t border-white/[0.08] pt-5 text-center text-xs text-zinc-400">
            {role === "coach" ? (
              <p>
                ¿Eres entrenador y aún no tienes cuenta?{" "}
                <Link
                  href="/auth/register-coach"
                  className="font-bold text-cyan-400 hover:underline"
                >
                  Registrarme como Coach
                </Link>
              </p>
            ) : (
              <div className="space-y-2">
                <p className="flex items-center justify-center gap-1.5 text-zinc-300">
                  <UserCheck className="h-4 w-4 text-emerald-400" />
                  Los alumnos acceden por invitación de su Coach.
                </p>
                {demoMode ? (
                  <p>
                    ¿Recibiste un correo de invitación?{" "}
                    <Link
                      href="/auth/activate?token=demo-token-mateo&email=mateo.herrera@email.com&name=Mateo%20Herrera"
                      className="font-bold text-emerald-400 hover:underline"
                    >
                      Probar activación aquí
                    </Link>
                  </p>
                ) : (
                  <p className="text-zinc-400">
                    Revisa el enlace de activación enviado a tu correo por tu Coach.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-zinc-500">
          <ShieldCheck className="h-3.5 w-3.5 text-cyan-500" />
          {isSupabaseConfigured()
            ? "Autenticación protegida por Supabase Auth + RLS"
            : "Modo Demo local activo — Puedes entrar directamente con las credenciales precargadas"}
        </p>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#060607] text-sm text-zinc-400">
          Cargando acceso...
        </div>
      }
    >
      <AuthLoginContent />
    </Suspense>
  );
}
