"use client";

import React, { useEffect } from "react";
import {
  Award,
  BadgeCheck,
  Building2,
  Calendar,
  Download,
  ExternalLink,
  FileText,
  Hash,
  X,
} from "lucide-react";
import { CoachCertification } from "@/types/database";

const CATEGORY_LABELS: Record<CoachCertification["category"], string> = {
  entrenamiento: "Entrenamiento",
  nutricion: "Nutrición",
  salud: "Salud / Antropometría",
  especialidad: "Especialidad",
};

export function DiplomaViewerModal({
  certification,
  coachName,
  onClose,
}: {
  certification: CoachCertification | null;
  coachName?: string;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!certification) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [certification, onClose]);

  if (!certification) return null;

  const isPdf =
    certification.file_type === "pdf" ||
    certification.file_name.toLowerCase().endsWith(".pdf") ||
    certification.file_url.startsWith("data:application/pdf");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`Diploma: ${certification.title}`}
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-white/15 bg-[#060607] shadow-2xl shadow-cyan-950/60"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] bg-[#060607] px-5 py-4">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                <BadgeCheck className="h-3 w-3" />
                Archivo Certificado
              </span>
              <span className="rounded-full border border-white/15 bg-[#0e0f12] px-2.5 py-0.5 text-[10px] font-semibold text-zinc-300">
                {CATEGORY_LABELS[certification.category]}
              </span>
            </div>
            <h2 className="truncate text-base font-extrabold text-white sm:text-lg">
              {certification.title}
            </h2>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400">
              <span className="inline-flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5 text-cyan-400" />
                {certification.institution}
              </span>
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-emerald-400" />
                Año {certification.issue_year}
              </span>
              {certification.credential_id && (
                <span className="inline-flex items-center gap-1 font-mono text-[11px] text-zinc-300">
                  <Hash className="h-3 w-3 text-amber-400" />
                  {certification.credential_id}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar visor"
            className="rounded-xl border border-white/[0.08] bg-[#0e0f12] p-2 text-zinc-400 transition hover:border-slate-600 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Document Preview Body */}
        <div className="flex-1 overflow-auto bg-[#060607] p-4 sm:p-6">
          {isPdf ? (
            <div className="space-y-3">
              <iframe
                src={certification.file_url}
                title={certification.title}
                className="h-[55vh] w-full rounded-2xl border border-white/[0.08] bg-[#0e0f12]"
              />
              <p className="text-center text-xs text-zinc-400">
                Si tu navegador bloquea la vista previa del PDF, usa el botón de
                descarga o abrir en nueva pestaña.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center">
              <img
                src={certification.file_url}
                alt={certification.title}
                className="max-h-[58vh] w-auto rounded-2xl border border-white/[0.08] object-contain shadow-xl"
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.08] bg-[#060607] px-5 py-3.5">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <FileText className="h-4 w-4 text-cyan-400" />
            <span className="max-w-[220px] truncate font-mono text-[11px] text-zinc-300 sm:max-w-xs">
              {certification.file_name}
            </span>
            {coachName && (
              <span className="hidden text-zinc-500 sm:inline">
                · Coach: {coachName}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <a
              href={certification.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-[#0e0f12] px-3.5 py-2 text-xs font-semibold text-zinc-200 transition hover:border-cyan-500/50 hover:text-white"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Abrir
            </a>
            <a
              href={certification.file_url}
              download={certification.file_name}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white hover:bg-zinc-200 px-4 py-2 text-xs font-bold text-zinc-950 transition "
            >
              <Download className="h-3.5 w-3.5" />
              Descargar Archivo
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
