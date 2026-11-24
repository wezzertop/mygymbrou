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
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

function AuthLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get("role") === "student" ? "student" : "coach";

  const demoMode =
    !isSupabaseConfigured() || process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  const [role, setRole] = useState<"coach" | "student">(initialRole);
  const [email, setEmail] = useState(
    demoMode
      ? initialRole === "coach"
        ? "carlos@apexperformance.fit"
        : "sofia.ramirez@email.com"
      : ""
  );
  const [password, setPassword] = useState(demoMode ? "Demo1234!" : "");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) {
          setError(signInError.message);
          setLoading(false);
          return;
        }
      }
      router.push(role === "coach" ? "/coach" : "/student/progress");
    } catch {
      setError("Ocurrió un error al iniciar sesión. Intenta nuevamente.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0b1120] px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Link>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-white">
            <Dumbbell className="h-4 w-4 text-cyan-400" />
            MiGym<span className="text-cyan-400">Brou</span>
          </span>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl sm:p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-extrabold text-white">
              Iniciar Sesión
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Selecciona tu perfil para ingresar a la plataforma
            </p>
          </div>

          {/* Role Selector Tabs */}
          <div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl border border-slate-800 bg-slate-950 p-1.5">
            <button
              type="button"
              onClick={() => handleRoleChange("coach")}
              className={`rounded-xl py-2.5 text-xs font-bold transition ${
                role === "coach"
                  ? "bg-cyan-500 text-slate-950 shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Acceso Coaches
            </button>
            <button
              type="button"
              onClick={() => handleRoleChange("student")}
              className={`rounded-xl py-2.5 text-xs font-bold transition ${
                role === "student"
                  ? "bg-emerald-500 text-slate-950 shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Acceso Alumnos
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-10 pr-4 text-sm text-white outline-none transition focus:border-cyan-500"
                  placeholder="tu@correo.com"
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">
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
                <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-10 pr-11 text-sm text-white outline-none transition focus:border-cyan-500"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className="absolute right-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-white"
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
              className={`w-full rounded-xl py-3.5 text-sm font-bold text-slate-950 shadow-lg transition disabled:opacity-60 ${
                role === "coach"
                  ? "bg-gradient-to-r from-cyan-500 to-cyan-400 shadow-cyan-500/20 hover:brightness-110"
                  : "bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-emerald-500/20 hover:brightness-110"
              }`}
            >
              {loading
                ? "Ingresando..."
                : role === "coach"
                ? "Entrar al Panel del Coach"
                : "Entrar a mi App de Alumno"}
            </button>
          </form>

          {/* Contextual Info */}
          <div className="mt-6 border-t border-slate-800 pt-5 text-center text-xs text-slate-400">
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
                <p className="flex items-center justify-center gap-1.5 text-slate-300">
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
                  <p className="text-slate-400">
                    Revisa el enlace de activación enviado a tu correo por tu Coach.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-slate-500">
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
        <div className="flex min-h-screen items-center justify-center bg-[#0b1120] text-sm text-slate-400">
          Cargando acceso...
        </div>
      }
    >
      <AuthLoginContent />
    </Suspense>
  );
}
