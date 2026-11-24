"use client";

import React from "react";
import {
  Award,
  BadgeCheck,
  Clock,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
} from "lucide-react";
import { VerificationStatus } from "@/types/database";

export function VerifiedPersonBadge({
  verified,
  compact = false,
  label = "Persona Real Verificada",
}: {
  verified?: boolean;
  compact?: boolean;
  label?: string;
}) {
  if (!verified) return null;

  if (compact) {
    return (
      <span
        title={label}
        aria-label={label}
        className="inline-flex shrink-0 items-center justify-center rounded-full bg-sky-500/20 p-0.5 text-sky-400 ring-1 ring-sky-400/40"
      >
        <BadgeCheck className="h-3.5 w-3.5" />
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/40 bg-sky-500/15 px-2.5 py-1 text-[11px] font-bold text-sky-300 shadow-sm shadow-sky-500/10">
      <BadgeCheck className="h-3.5 w-3.5 text-sky-400" />
      <span>{label}</span>
    </span>
  );
}

export function CertifiedCoachBadge({
  diplomaCount,
  compact = false,
}: {
  diplomaCount: number;
  compact?: boolean;
}) {
  if (diplomaCount <= 0) return null;

  if (compact) {
    return (
      <span
        title={`Coach Certificado (${diplomaCount} ${
          diplomaCount === 1 ? "diploma" : "diplomas"
        })`}
        className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300"
      >
        <Award className="h-3 w-3 text-emerald-400" />
        {diplomaCount} {diplomaCount === 1 ? "Diploma" : "Diplomas"}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-2.5 py-1 text-[11px] font-bold text-emerald-300 shadow-sm shadow-emerald-500/10">
      <Award className="h-3.5 w-3.5 text-emerald-400" />
      <span>
        Coach Certificado · {diplomaCount}{" "}
        {diplomaCount === 1 ? "Diploma" : "Diplomas"}
      </span>
    </span>
  );
}

export function VerificationStatusPill({
  status = "unverified",
}: {
  status?: VerificationStatus;
}) {
  if (status === "verified") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/40 bg-sky-500/15 px-2.5 py-0.5 text-[10px] font-bold text-sky-300">
        <ShieldCheck className="h-3 w-3 text-sky-400" />
        Persona Verificada
      </span>
    );
  }

  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-bold text-amber-300">
        <Clock className="h-3 w-3 text-amber-400" />
        Verificación en revisión
      </span>
    );
  }

  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/40 bg-rose-500/15 px-2.5 py-0.5 text-[10px] font-bold text-rose-300">
        <ShieldAlert className="h-3 w-3 text-rose-400" />
        Requiere nuevo documento
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-slate-800/80 px-2.5 py-0.5 text-[10px] font-semibold text-zinc-400">
      <ShieldQuestion className="h-3 w-3 text-zinc-500" />
      Sin verificar
    </span>
  );
}
