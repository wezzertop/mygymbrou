"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Dumbbell,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  User,
} from "lucide-react";
import { createClient, getAppUrl, isSupabaseConfigured } from "@/lib/supabase/client";
import { useApp } from "@/context/AppContext";
import { getSaasPlanById, SaasPlanTier } from "@/lib/saas-plans";

function RegisterCoachContent() {
  const searchParams = useSearchParams();
  const planParam = (searchParams.get("plan") as SaasPlanTier) || "free";
  const selectedPlan = getSaasPlanById(planParam);

  const { updateCoachProfile, isDemoMode } = useApp();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [brandName, setBrandName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!acceptedTerms) {
      setError("Debes aceptar los Términos y Condiciones y la Política de Privacidad.");
      return;
    }

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setLoading(true);
    const termsTimestamp = new Date().toISOString();

    try {
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${getAppUrl()}/auth/callback?next=/coach`,
            data: {
              role: "coach",
              full_name: fullName,
              brand_name: brandName,
              specialty,
              saas_plan_tier: selectedPlan.id,
              terms_accepted_at: termsTimestamp,
            },
          },
        });
        if (signUpError) {
          setError(signUpError.message);
          setLoading(false);
          return;
        }
      } else {
        updateCoachProfile({
          full_name: fullName,
          email,
          brand_name: brandName,
          specialty,
          saas_plan_tier: selectedPlan.id,
          saas_student_limit: selectedPlan.studentLimit,
          terms_accepted_at: termsTimestamp,
        });
      }

      setSubmitted(true);
    } catch {
      setError("No se pudo completar el registro. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0b1120] px-4 py-10">
      <div className="w-full max-w-lg space-y-6">
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
          {submitted ? (
            <div className="space-y-5 py-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h1 className="text-2xl font-extrabold text-white">
                ¡Revisa tu correo electrónico!
              </h1>
              <p className="text-sm leading-relaxed text-slate-300">
                Enviamos un enlace de confirmación a{" "}
                <span className="font-semibold text-cyan-400">{email}</span>.
                Verifica tu cuenta mediante Supabase Email Confirmation para
                activar tu panel al 100%.
              </p>
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-xs text-slate-400">
                Aceptación de Términos registrada correctamente con marca de
                tiempo en la base de datos.
              </div>
              <div className="flex flex-col gap-2.5 pt-2 sm:flex-row sm:justify-center">
                {isDemoMode && (
                  <Link
                    href="/coach"
                    className="rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:brightness-110"
                  >
                    Ir al Panel Coach (Demo)
                  </Link>
                )}
                <Link
                  href="/auth"
                  className={`rounded-xl px-5 py-3 text-sm font-bold transition ${
                    isDemoMode
                      ? "border border-slate-700 bg-slate-800 text-white hover:bg-slate-700"
                      : "bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 hover:brightness-110"
                  }`}
                >
                  Ir a Iniciar Sesión
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-[11px] font-bold text-cyan-300">
                  Registro Profesional
                </span>
                <h1 className="mt-3 text-2xl font-extrabold text-white">
                  Crea tu cuenta de Coach
                </h1>
                <p className="mt-1 text-sm text-slate-400">
                  Administra tus alumnos, antropometría, rutinas, dietas y
                  suscripciones desde una sola app.
                </p>
              </div>

              {error && (
                <div className="mb-4 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-300">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                    Nombre completo *
                  </label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Ej. Carlos Mendoza"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-10 pr-4 text-sm text-white outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                    Correo electrónico *
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="coach@tumarca.com"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-10 pr-4 text-sm text-white outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                    Contraseña (mín. 8 caracteres) *
                  </label>
                  <div className="relative">
                    <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-10 pr-11 text-sm text-white outline-none focus:border-cyan-500"
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

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                      Nombre de Marca o Gimnasio *
                    </label>
                    <div className="relative">
                      <Building2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        required
                        value={brandName}
                        onChange={(e) => setBrandName(e.target.value)}
                        placeholder="Ej. Apex Performance"
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-10 pr-4 text-sm text-white outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                      Especialidad
                    </label>
                    <input
                      type="text"
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      placeholder="Ej. Hipertrofia y Nutrición"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-3 text-sm text-white outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                {/* Mandatory Terms & Conditions */}
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/70 p-3.5">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-600 bg-slate-900 text-cyan-500 focus:ring-cyan-500"
                  />
                  <span className="text-xs leading-relaxed text-slate-300">
                    Acepto obligatoriamente los{" "}
                    <span className="font-semibold text-cyan-400">
                      Términos y Condiciones
                    </span>{" "}
                    y la{" "}
                    <span className="font-semibold text-cyan-400">
                      Política de Privacidad
                    </span>{" "}
                    de MiGymBrou. Autorizo guardar la fecha y hora de mi
                    aceptación.
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:brightness-110 disabled:opacity-60"
                >
                  {loading ? "Creando cuenta..." : "Crear Cuenta de Coach"}
                </button>
              </form>

              <p className="mt-5 text-center text-xs text-slate-400">
                ¿Ya tienes cuenta?{" "}
                <Link
                  href="/auth"
                  className="font-bold text-cyan-400 hover:underline"
                >
                  Iniciar sesión
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RegisterCoachPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] text-sm text-slate-400">
          Cargando registro...
        </div>
      }
    >
      <RegisterCoachContent />
    </Suspense>
  );
}
