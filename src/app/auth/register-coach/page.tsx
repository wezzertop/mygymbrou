"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Check,
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
import {
  getSaasPlanById,
  SAAS_PLANS_MXN,
  SaasPlanTier,
} from "@/lib/saas-plans";
import { GymCatalogSelector } from "@/components/GymCatalogSelector";
import { CoachSpecialtySelector } from "@/components/CoachSpecialtySelector";

function RegisterCoachContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPlanParam = (searchParams.get("plan") as SaasPlanTier) || "free";
  const [selectedPlanId, setSelectedPlanId] = useState<SaasPlanTier>(
    getSaasPlanById(initialPlanParam).id
  );
  const selectedPlan = getSaasPlanById(selectedPlanId);

  const { updateCoachProfile, isDemoMode } = useApp();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [brandName, setBrandName] = useState("");
  const [isCustomGym, setIsCustomGym] = useState(false);
  const [customGymCity, setCustomGymCity] = useState("");
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
      const isPaidPlan = selectedPlan.id !== "free";
      const checkoutPath = `/coach/billing/checkout?plan=${selectedPlan.id}&email=${encodeURIComponent(
        email.trim()
      )}&name=${encodeURIComponent(fullName.trim())}`;

      if (isSupabaseConfigured()) {
        const supabase = createClient();
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${getAppUrl()}/auth/callback?next=${encodeURIComponent(
              isPaidPlan ? checkoutPath : "/coach"
            )}`,
            data: {
              role: "coach",
              full_name: fullName,
              brand_name: brandName,
              specialty,
              // Las cuentas de pago inician en 'free' hasta aprobar el comprobante SPEI
              saas_plan_tier: "free",
              requested_plan_tier: selectedPlan.id,
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
          saas_plan_tier: "free",
          saas_student_limit: 5,
          terms_accepted_at: termsTimestamp,
        });
      }

      if (isCustomGym && brandName.trim()) {
        fetch("/api/gyms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: brandName.trim(),
            city: customGymCity.trim() || undefined,
            submitted_by_email: email.trim().toLowerCase(),
          }),
        }).catch(() => {});
      }

      if (isPaidPlan) {
        router.push(checkoutPath);
        return;
      }

      setSubmitted(true);
    } catch {
      setError("No se pudo completar el registro. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#060607] px-4 py-10">
      <div className="w-full max-w-lg space-y-6">
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
          {submitted ? (
            <div className="space-y-5 py-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h1 className="text-2xl font-extrabold text-white">
                ¡Revisa tu correo electrónico!
              </h1>
              <p className="text-sm leading-relaxed text-zinc-300">
                Enviamos un enlace de confirmación a{" "}
                <span className="font-semibold text-emerald-400">{email}</span>.
                Verifica tu cuenta mediante Supabase Email Confirmation para
                activar tu panel al 100%.
              </p>
              <div className="rounded-xl border border-white/[0.08] bg-[#060607] p-3 text-xs text-zinc-400">
                Aceptación de Términos registrada correctamente con marca de
                tiempo en la base de datos.
              </div>
              <div className="flex flex-col gap-2.5 pt-2 sm:flex-row sm:justify-center">
                {isDemoMode && (
                  <Link
                    href="/coach"
                    className="rounded-xl bg-white hover:bg-zinc-200 px-5 py-3 text-sm font-bold text-zinc-950 transition "
                  >
                    Ir al Panel Coach (Demo)
                  </Link>
                )}
                <Link
                  href="/auth"
                  className={`rounded-xl px-5 py-3 text-sm font-bold transition ${
                    isDemoMode
                      ? "border border-white/15 bg-white/[0.06] text-white hover:bg-white/[0.12]"
                      : "bg-white hover:bg-zinc-200 text-zinc-950 "
                  }`}
                >
                  Ir a Iniciar Sesión
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-bold text-emerald-400">
                  Registro Profesional
                </span>
                <h1 className="mt-3 text-2xl font-extrabold text-white">
                  Crea tu cuenta de Coach
                </h1>
                <p className="mt-1 text-sm text-zinc-400">
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
                {/* Plan Selector */}
                <div>
                  <label className="mb-2 block text-xs font-semibold text-zinc-300">
                    Elige tu plan en MXN *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {SAAS_PLANS_MXN.map((plan) => {
                      const active = selectedPlanId === plan.id;
                      return (
                        <button
                          key={plan.id}
                          type="button"
                          onClick={() => setSelectedPlanId(plan.id)}
                          className={`relative flex flex-col items-start rounded-xl border p-3 text-left transition ${
                            active
                              ? "border-emerald-500/70 bg-emerald-500/10"
                              : "border-white/10 bg-[#060607] hover:border-white/25"
                          }`}
                        >
                          <div className="flex w-full items-center justify-between gap-1">
                            <span className="text-xs font-semibold text-white">
                              {plan.name}
                            </span>
                            {active && (
                              <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                            )}
                          </div>
                          <span className="mt-1 text-sm font-bold tabular-nums text-white">
                            {plan.priceLabel}{" "}
                            <span className="text-[10px] font-normal text-zinc-400">
                              /mes
                            </span>
                          </span>
                          <span className="mt-0.5 text-[10px] text-zinc-400">
                            {plan.studentLimitLabel}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {selectedPlan.id !== "free" && (
                    <p className="mt-2 text-[11px] text-emerald-400">
                      Al crear tu cuenta te llevaremos a los datos de transferencia SPEI para subir tu comprobante y activar{" "}
                      <strong>{selectedPlan.name}</strong>.
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-zinc-300">
                    Nombre completo *
                  </label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Ej. Carlos Mendoza"
                      className="w-full rounded-xl border border-white/15 bg-[#060607] py-3 pl-10 pr-4 text-sm text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-zinc-300">
                    Correo electrónico *
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="coach@tumarca.com"
                      className="w-full rounded-xl border border-white/15 bg-[#060607] py-3 pl-10 pr-4 text-sm text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-zinc-300">
                    Contraseña (mín. 8 caracteres) *
                  </label>
                  <div className="relative">
                    <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-white/15 bg-[#060607] py-3 pl-10 pr-11 text-sm text-white outline-none focus:border-emerald-500"
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

                <GymCatalogSelector
                  value={brandName}
                  onChange={(name, meta) => {
                    setBrandName(name);
                    setIsCustomGym(Boolean(meta?.isCustom));
                    setCustomGymCity(meta?.customCity || "");
                  }}
                />

                <CoachSpecialtySelector
                  value={specialty}
                  onChange={setSpecialty}
                />

                {/* Mandatory Terms & Conditions */}
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/[0.08] bg-[#060607] p-3.5">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-zinc-600 bg-[#0e0f12] accent-emerald-500 focus:ring-emerald-500"
                  />
                  <span className="text-xs leading-relaxed text-zinc-300">
                    Acepto obligatoriamente los{" "}
                    <Link
                      href="/terminos"
                      target="_blank"
                      className="font-semibold text-emerald-400 underline hover:text-emerald-300"
                    >
                      Términos y Condiciones
                    </Link>{" "}
                    y el{" "}
                    <Link
                      href="/privacidad"
                      target="_blank"
                      className="font-semibold text-emerald-400 underline hover:text-emerald-300"
                    >
                      Aviso de Privacidad (LFPDPPP)
                    </Link>{" "}
                    de MiGymBrou. Autorizo guardar la fecha y hora de mi
                    aceptación.
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="h-12 w-full rounded-full bg-emerald-500 text-sm font-bold text-[#0a0a0a] transition hover:bg-emerald-400 disabled:opacity-60"
                >
                  {loading ? "Creando cuenta..." : "Crear Cuenta de Coach"}
                </button>
              </form>

              <p className="mt-5 text-center text-xs text-zinc-400">
                ¿Ya tienes cuenta?{" "}
                <Link
                  href="/auth"
                  className="font-bold text-emerald-400 transition hover:text-emerald-300 hover:underline"
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
        <div className="flex min-h-screen items-center justify-center bg-[#060607] text-sm text-zinc-400">
          Cargando registro...
        </div>
      }
    >
      <RegisterCoachContent />
    </Suspense>
  );
}
