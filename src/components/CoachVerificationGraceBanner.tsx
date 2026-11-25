"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock, Lock, ShieldAlert, ShieldCheck } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { getCoachVerificationGraceStatus } from "@/lib/referrals";

export function CoachVerificationGraceBanner({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { coachProfile, isDemoMode, hydrated } = useApp();

  if (!hydrated) {
    return <>{children}</>;
  }

  // En modo demo mostramos aviso informativo pero no bloqueamos la exploración
  const grace = getCoachVerificationGraceStatus(coachProfile);

  if (grace.state === "verified") {
    return <>{children}</>;
  }

  const isOnProfilePage = pathname.startsWith("/coach/profile");

  // Si venció el plazo de 15 días sin enviar verificación, bloqueamos operación excepto en /coach/profile
  if (!isDemoMode && grace.state === "expired_locked" && !isOnProfilePage) {
    return (
      <div className="mx-auto my-8 max-w-lg rounded-xl border border-rose-500/35 bg-[#0e0f12] p-6 text-center shadow-2xl sm:p-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-rose-500/15 text-rose-400">
          <Lock className="h-7 w-7" />
        </div>
        <h2 className="mt-4 text-xl font-bold text-white">
          Verificación de identidad requerida (Plazo de 15 días vencido)
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-zinc-400 sm:text-sm">
          Para prevenir cuentas múltiples y proteger a los alumnos, todo Coach debe
          subir su <strong className="text-zinc-200">Identificación Oficial</strong> y{" "}
          <strong className="text-zinc-200">Comprobación de Rostro (selfie)</strong>{" "}
          dentro de los primeros 15 días naturales desde su registro.
        </p>
        <p className="mt-2 text-xs text-zinc-400">
          En cuanto envíes tus documentos para revisión, tu acceso operativo se
          restablecerá.
        </p>
        <Link
          href="/coach/profile?tab=verificacion"
          className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-emerald-500 px-6 text-xs font-bold text-[#0a0a0a] transition hover:bg-emerald-400"
        >
          <ShieldCheck className="h-4 w-4" />
          Completar verificación ahora
        </Link>
      </div>
    );
  }

  return (
    <>
      {grace.state === "grace_active" && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
          <div className="flex items-start gap-2">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            <span>
              <strong>Verificación obligatoria:</strong> te quedan{" "}
              <strong className="text-white">{grace.daysRemaining} día(s)</strong> de
              15 para subir tu ID oficial y foto de rostro y mantener tu panel activo.
            </span>
          </div>
          {!isOnProfilePage && (
            <Link
              href="/coach/profile?tab=verificacion"
              className="shrink-0 rounded-full bg-emerald-500 px-3.5 py-1.5 text-[11px] font-bold text-[#0a0a0a] transition hover:bg-emerald-400"
            >
              Verificar ahora →
            </Link>
          )}
        </div>
      )}

      {grace.state === "pending_review" && !isOnProfilePage && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs text-zinc-300">
          <Clock className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>
            Tu verificación de identidad y rostro fue enviada y está en revisión por
            administración.
          </span>
        </div>
      )}

      {children}
    </>
  );
}
