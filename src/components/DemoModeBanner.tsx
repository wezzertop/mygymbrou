"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Eye } from "lucide-react";

interface DemoModeBannerProps {
  role: "coach" | "student";
}

export function DemoModeBanner({ role }: DemoModeBannerProps) {
  const isCoach = role === "coach";

  return (
    <div
      role="status"
      className="mb-5 flex flex-col justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/[0.08] px-4 py-3 sm:flex-row sm:items-center"
    >
      <div className="flex min-w-0 items-start gap-2.5 sm:items-center">
        <span className="mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-md bg-amber-400 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-950 sm:mt-0">
          <Eye className="h-3 w-3" />
          Demostración
        </span>
        <p className="text-xs leading-relaxed text-amber-100/90">
          {isCoach ? (
            <>
              <strong className="font-semibold text-white">
                Sección de Demostración (Coach):
              </strong>{" "}
              estás explorando una vista previa interactiva con datos de ejemplo.
            </>
          ) : (
            <>
              <strong className="font-semibold text-white">
                Sección de Demostración (Alumno):
              </strong>{" "}
              vista previa con datos de ejemplo. Para ver tu plan real, inicia sesión.
            </>
          )}
        </p>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Link
          href={isCoach ? "/student" : "/coach"}
          className="inline-flex h-8 items-center rounded-lg border border-amber-400/30 bg-black/30 px-3 text-[11px] font-medium text-amber-200 transition hover:border-amber-400/60 hover:text-white"
        >
          {isCoach ? "Ver Demo Alumno" : "Ver Demo Coach"}
        </Link>
        <Link
          href={isCoach ? "/auth/register-coach" : "/auth"}
          className="inline-flex h-8 items-center gap-1 rounded-lg bg-emerald-500 px-3 text-[11px] font-semibold text-zinc-950 transition hover:bg-emerald-400"
        >
          {isCoach ? "Crear cuenta real" : "Iniciar sesión"}
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
