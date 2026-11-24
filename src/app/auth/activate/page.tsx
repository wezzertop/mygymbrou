"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Flame,
  KeyRound,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

function ActivateAccountContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activateInvitedStudent, coachProfile } = useApp();

  const token = searchParams.get("token") || "demo-token-mateo";
  const invitedEmail = searchParams.get("email") || "mateo.herrera@email.com";
  const invitedName = searchParams.get("name") || "Mateo Herrera";

  const [fullName, setFullName] = useState(invitedName);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activated, setActivated] = useState(false);

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
        const { error: updateErr } = await supabase.auth.updateUser({
          password,
          data: {
            role: "student",
            full_name: fullName,
            terms_accepted_at: new Date().toISOString(),
          },
        });
        if (updateErr) {
          setError(updateErr.message);
          setLoading(false);
          return;
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

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0b1120] px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 text-slate-950 shadow-lg shadow-emerald-500/20">
            <Flame className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">
            Activación de Cuenta Alumno
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Invitado por{" "}
            <span className="font-semibold text-cyan-400">
              {coachProfile.full_name} ({coachProfile.brand_name})
            </span>
          </p>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl sm:p-8">
          {activated ? (
            <div className="space-y-4 py-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-bold text-white">
                ¡Cuenta activada con éxito!
              </h2>
              <p className="text-sm text-slate-300">
                Ya estás vinculado automáticamente con tu coach{" "}
                <span className="font-semibold text-white">
                  {coachProfile.full_name}
                </span>
                .
              </p>
              <button
                type="button"
                onClick={() => router.push("/student/progress")}
                className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 py-3.5 text-sm font-bold text-slate-950"
              >
                Entrar a mi App de Alumno
              </button>
            </div>
          ) : (
            <form onSubmit={handleActivate} className="space-y-4">
              <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3 text-xs text-emerald-200">
                <p className="flex items-center gap-1.5 font-semibold">
                  <UserCheck className="h-4 w-4 text-emerald-400" />
                  Invitación verificada
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
                <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                  Tu nombre completo
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-3 text-sm text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                  Define tu contraseña *
                </label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-10 pr-4 text-sm text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                  Confirmar contraseña *
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite tu contraseña"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-3 text-sm text-white outline-none focus:border-emerald-500"
                />
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/70 p-3.5">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-600 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                />
                <span className="text-xs leading-relaxed text-slate-300">
                  Acepto obligatoriamente los{" "}
                  <span className="font-semibold text-emerald-400">
                    Términos y Condiciones
                  </span>{" "}
                  y la Política de Privacidad para vincular mi perfil con mi
                  Coach.
                </span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:brightness-110 disabled:opacity-60"
              >
                {loading ? "Activando cuenta..." : "Activar Cuenta y Entrar"}
              </button>
            </form>
          )}
        </div>

        <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-slate-500">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          <Link href="/auth?role=student" className="hover:text-slate-300">
            ¿Ya activaste tu cuenta? Inicia sesión aquí
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
        <div className="flex min-h-screen items-center justify-center bg-[#0b1120] text-sm text-slate-400">
          Verificando invitación...
        </div>
      }
    >
      <ActivateAccountContent />
    </Suspense>
  );
}
