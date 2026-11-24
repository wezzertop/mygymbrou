"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Flame,
  KeyRound,
  LogIn,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { createClient, getAppUrl, isSupabaseConfigured } from "@/lib/supabase/client";
import { Gender } from "@/types/database";

interface InviteMetadata {
  id: string;
  coach_id: string;
  coach_name: string;
  coach_brand: string;
  invited_name: string;
  invited_email: string;
  invite_status: string;
  plan_name: string;
  has_existing_account: boolean;
}

function ActivateAccountContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    activateInvitedStudent,
    coachProfile,
    authUserId,
    studentProfile,
    refreshData,
    isDemoMode,
  } = useApp();

  const token = searchParams.get("token") || "demo-token-mateo";
  const paramEmail = searchParams.get("email") || "mateo.herrera@email.com";
  const paramName = searchParams.get("name") || "Mateo Herrera";

  const [inviteMeta, setInviteMeta] = useState<InviteMetadata | null>(null);
  const [loadingMeta, setLoadingMeta] = useState(true);

  const [fullName, setFullName] = useState(paramName);
  const [gender, setGender] = useState<Gender>("female");
  const [fitnessGoal, setFitnessGoal] = useState("Recomposición corporal");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activated, setActivated] = useState(false);
  const [needsEmailConfirm, setNeedsEmailConfirm] = useState(false);

  useEffect(() => {
    let active = true;
    async function fetchInvite() {
      if (!token || isDemoMode) {
        setLoadingMeta(false);
        return;
      }
      try {
        const res = await fetch(
          `/api/students/accept-invite?token=${encodeURIComponent(token)}`
        );
        if (res.ok) {
          const data = await res.json();
          if (active && data.invite) {
            setInviteMeta(data.invite);
            if (data.invite.invited_name) {
              setFullName(data.invite.invited_name);
            }
          }
        }
      } catch {
        // Fallback to URL query params
      } finally {
        if (active) setLoadingMeta(false);
      }
    }
    fetchInvite();
    return () => {
      active = false;
    };
  }, [token, isDemoMode]);

  const invitedEmail = inviteMeta?.invited_email || paramEmail;
  const coachName = inviteMeta?.coach_name || coachProfile.full_name || "Tu Coach";
  const coachBrand = inviteMeta?.coach_brand || coachProfile.brand_name || "MiGymBrou";
  const planName = inviteMeta?.plan_name || "Plan Personalizado";

  // Si ya hay una sesión iniciada con cuenta existente en modo Supabase real
  const isExistingLoggedInUser =
    !isDemoMode && Boolean(authUserId) && Boolean(inviteMeta?.has_existing_account);

  const handleOneClickAccept = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/students/accept-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          fullName: studentProfile.full_name || fullName,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo completar la vinculación.");
        setLoading(false);
        return;
      }
      activateInvitedStudent(token, studentProfile.full_name || fullName);
      await refreshData();
      setActivated(true);
    } catch {
      setError("Error de conexión al aceptar la invitación.");
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (!acceptedTerms) {
      setError("Debes aceptar los Términos y Condiciones para activar tu cuenta.");
      return;
    }

    setLoading(true);
    try {
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();

        if (currentUser) {
          // Usuario llegó desde el correo de invitación con sesión temporal activa
          const { error: updateErr } = await supabase.auth.updateUser({
            password,
            data: {
              role: "student",
              full_name: fullName,
              gender,
              fitness_goal: fitnessGoal,
              terms_accepted_at: new Date().toISOString(),
            },
          });
          if (updateErr) {
            setError(updateErr.message);
            setLoading(false);
            return;
          }

          await supabase
            .from("profiles")
            .update({
              full_name: fullName,
              gender,
              fitness_goal: fitnessGoal,
            })
            .eq("id", currentUser.id);

          await fetch("/api/students/accept-invite", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token, fullName }),
          });
          await refreshData();
        } else {
          // Registro rápido directo desde enlace compartido
          const { data: signUpData, error: signUpErr } =
            await supabase.auth.signUp({
              email: invitedEmail,
              password,
              options: {
                emailRedirectTo: `${getAppUrl()}/auth/callback?next=/student`,
                data: {
                  role: "student",
                  full_name: fullName,
                  gender,
                  fitness_goal: fitnessGoal,
                  invite_token: token,
                  terms_accepted_at: new Date().toISOString(),
                },
              },
            });

          if (signUpErr) {
            setError(signUpErr.message);
            setLoading(false);
            return;
          }

          if (signUpData.session) {
            await fetch("/api/students/accept-invite", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ token, fullName }),
            });
            await refreshData();
          } else {
            setNeedsEmailConfirm(true);
            setLoading(false);
            return;
          }
        }
      }

      activateInvitedStudent(token, fullName);
      setActivated(true);
    } catch {
      setError("No se pudo activar la cuenta. Verifica el enlace.");
    } finally {
      setLoading(false);
    }
  };

  const loginReturnUrl = `/auth?role=student&email=${encodeURIComponent(
    invitedEmail
  )}&next=${encodeURIComponent(
    `/auth/activate?token=${encodeURIComponent(token)}&email=${encodeURIComponent(
      invitedEmail
    )}&name=${encodeURIComponent(fullName)}`
  )}`;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#060607] px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 text-zinc-950 shadow-lg shadow-none">
            <Flame className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">
            Invitación de Entrenamiento
          </h1>
          <p className="mt-1 text-xs text-zinc-400">
            Invitado por{" "}
            <span className="font-semibold text-cyan-400">
              {coachName} ({coachBrand})
            </span>
          </p>
        </div>

        <div className="rounded-3xl border border-white/[0.08] bg-[#0e0f12] p-6 shadow-2xl sm:p-8">
          {loadingMeta ? (
            <div className="py-8 text-center text-sm text-zinc-400">
              Validando enlace de invitación...
            </div>
          ) : activated ? (
            <div className="space-y-4 py-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-bold text-white">
                ¡Vinculación completada!
              </h2>
              <p className="text-sm text-zinc-300">
                Ya formas parte del equipo de{" "}
                <span className="font-semibold text-white">{coachName}</span> con{" "}
                <span className="font-semibold text-emerald-400">{planName}</span>.
              </p>
              <button
                type="button"
                onClick={() => router.push("/student")}
                className="min-h-[48px] w-full rounded-xl bg-white hover:bg-zinc-200 py-3.5 text-sm font-bold text-zinc-950 transition "
              >
                Entrar a mi App de Alumno
              </button>
            </div>
          ) : needsEmailConfirm ? (
            <div className="space-y-4 py-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-400">
                <Sparkles className="h-7 w-7" />
              </div>
              <h2 className="text-xl font-bold text-white">
                Confirma tu correo para entrar
              </h2>
              <p className="text-sm text-zinc-300">
                Enviamos un enlace de confirmación a{" "}
                <span className="font-semibold text-cyan-400">{invitedEmail}</span>.
                Al confirmarlo quedarás vinculado automáticamente con{" "}
                <span className="font-semibold text-white">{coachName}</span>.
              </p>
              <Link
                href="/auth?role=student"
                className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-white hover:bg-zinc-200 py-3 text-sm font-bold text-zinc-950"
              >
                Ir a Iniciar Sesión
              </Link>
            </div>
          ) : isExistingLoggedInUser ? (
            <div className="space-y-5">
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-200">
                <p className="flex items-center gap-1.5 font-bold text-emerald-300">
                  <UserCheck className="h-4 w-4" />
                  Cuenta existente detectada
                </p>
                <p className="mt-1.5 text-zinc-300">
                  Ya iniciaste sesión como{" "}
                  <span className="font-bold text-white">
                    {studentProfile.full_name || invitedEmail}
                  </span>
                  . Acepta en un clic para unirte al roster de{" "}
                  <span className="font-bold text-cyan-300">{coachName}</span>.
                </p>
              </div>

              {error && (
                <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-300">
                  {error}
                </div>
              )}

              <button
                type="button"
                disabled={loading}
                onClick={handleOneClickAccept}
                className="min-h-[48px] w-full rounded-xl bg-white hover:bg-zinc-200 py-3.5 text-sm font-bold text-zinc-950 shadow-lg shadow-none transition  disabled:opacity-60"
              >
                {loading
                  ? "Vinculando cuenta..."
                  : `Aceptar invitación de ${coachName}`}
              </button>
            </div>
          ) : inviteMeta?.has_existing_account && !isDemoMode ? (
            <div className="space-y-5 text-center">
              <div className="rounded-2xl border border-white/[0.08] bg-cyan-500/10 p-4 text-left text-xs text-zinc-300">
                <p className="flex items-center gap-1.5 font-bold text-cyan-300">
                  <UserCheck className="h-4 w-4" />
                  ¡Ya tienes una cuenta en MiGymBrou!
                </p>
                <p className="mt-1.5">
                  Inicia sesión con{" "}
                  <span className="font-mono text-white">{invitedEmail}</span>{" "}
                  para aceptar la invitación de{" "}
                  <span className="font-semibold text-white">{coachName}</span> en
                  un clic sin perder tu historial.
                </p>
              </div>
              <Link
                href={loginReturnUrl}
                className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-white hover:bg-zinc-200 py-3.5 text-sm font-bold text-zinc-950 shadow-lg shadow-none"
              >
                <LogIn className="h-4 w-4" />
                Iniciar sesión y aceptar en 1 clic
              </Link>
            </div>
          ) : (
            <form onSubmit={handleActivate} className="space-y-4">
              <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3 text-xs text-emerald-200">
                <p className="flex items-center gap-1.5 font-semibold">
                  <UserCheck className="h-4 w-4 text-emerald-400" />
                  Invitación verificada · {planName}
                </p>
                <p className="mt-1 text-emerald-300/80">
                  Correo: <span className="font-mono">{invitedEmail}</span>
                </p>
              </div>

              {error && (
                <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-300">
                  {error}
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-zinc-300">
                  Tu nombre completo
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="min-h-[44px] w-full rounded-xl border border-white/15 bg-[#060607] px-3.5 py-2.5 text-base text-white outline-none focus:border-emerald-500 sm:text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-zinc-300">
                    Objetivo inicial
                  </label>
                  <select
                    value={fitnessGoal}
                    onChange={(e) => setFitnessGoal(e.target.value)}
                    className="min-h-[44px] w-full rounded-xl border border-white/15 bg-[#060607] px-3 py-2.5 text-base text-white outline-none focus:border-emerald-500 sm:text-sm"
                  >
                    <option value="Recomposición corporal">Recomposición</option>
                    <option value="Pérdida de grasa">Pérdida de grasa</option>
                    <option value="Hipertrofia">Ganar músculo</option>
                    <option value="Fuerza">Fuerza</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-zinc-300">
                    Guía visual
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as Gender)}
                    className="min-h-[44px] w-full rounded-xl border border-white/15 bg-[#060607] px-3 py-2.5 text-base text-white outline-none focus:border-emerald-500 sm:text-sm"
                  >
                    <option value="female">Femenino</option>
                    <option value="male">Masculino</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-zinc-300">
                  Define tu contraseña *
                </label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    className="min-h-[44px] w-full rounded-xl border border-white/15 bg-[#060607] py-2.5 pl-10 pr-11 text-base text-white outline-none focus:border-emerald-500 sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? "Ocultar" : "Mostrar"}
                    className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-400 hover:bg-white/[0.06] hover:text-white"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-zinc-300">
                  Confirmar contraseña *
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite tu contraseña"
                  className="min-h-[44px] w-full rounded-xl border border-white/15 bg-[#060607] px-3.5 py-2.5 text-base text-white outline-none focus:border-emerald-500 sm:text-sm"
                />
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/[0.08] bg-[#060607] p-3.5">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-0.5 h-5 w-5 rounded border-slate-600 bg-[#0e0f12] text-emerald-500 focus:ring-emerald-500"
                />
                <span className="text-xs leading-relaxed text-zinc-300">
                  Acepto obligatoriamente los{" "}
                  <span className="font-semibold text-emerald-400">
                    Términos y Condiciones
                  </span>{" "}
                  y la Política de Privacidad para vincular mi perfil con{" "}
                  <span className="font-semibold text-white">{coachName}</span>.
                </span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="min-h-[48px] w-full rounded-xl bg-white hover:bg-zinc-200 py-3.5 text-sm font-bold text-zinc-950 shadow-lg shadow-none transition  disabled:opacity-60"
              >
                {loading ? "Activando cuenta..." : "Activar Cuenta y Entrar"}
              </button>
            </form>
          )}
        </div>

        <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-zinc-500">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          <Link href={loginReturnUrl} className="hover:text-zinc-300">
            ¿Ya tienes cuenta en MiGymBrou? Inicia sesión para vincular en 1 clic
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ActivatePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#060607] text-sm text-zinc-400">
          Verificando invitación...
        </div>
      }
    >
      <ActivateAccountContent />
    </Suspense>
  );
}
