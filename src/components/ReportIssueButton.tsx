"use client";

import React, { useState } from "react";
import { CheckCircle2, Flag, X } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { ReportCategory } from "@/types/database";

export function ReportIssueButton({
  defaultReportedRole,
  defaultReportedName = "",
}: {
  defaultReportedRole: "coach" | "student";
  defaultReportedName?: string;
}) {
  const { submitUserReport } = useApp();
  const [open, setOpen] = useState(false);
  const [reportedName, setReportedName] = useState(defaultReportedName);
  const [category, setCategory] = useState<ReportCategory>("servicio");
  const [description, setDescription] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportedName.trim() || !description.trim()) return;
    setSending(true);
    await submitUserReport({
      reported_user_name: reportedName.trim(),
      reported_role: defaultReportedRole,
      category,
      description: description.trim(),
    });
    setSending(false);
    setSent(true);
    setDescription("");
    setTimeout(() => {
      setSent(false);
      setOpen(false);
    }, 1800);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.03] px-5 text-xs font-medium text-zinc-300 transition hover:border-white/30 hover:text-white"
      >
        <Flag className="h-3.5 w-3.5 text-amber-400" />
        Reportar problema
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-3 backdrop-blur-sm sm:items-center sm:p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0e0f12] p-5 shadow-2xl sm:p-6"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">
                Enviar reporte a Moderación
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar"
                className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-white/[0.06] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {sent ? (
              <div className="space-y-2 py-6 text-center">
                <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400" />
                <p className="text-sm font-semibold text-white">
                  Reporte enviado correctamente
                </p>
                <p className="text-xs text-zinc-400">
                  Nuestro equipo de administración revisará tu caso pronto.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                    Nombre del {defaultReportedRole === "coach" ? "Coach" : "Alumno"} o cuenta
                  </label>
                  <input
                    type="text"
                    required
                    value={reportedName}
                    onChange={(e) => setReportedName(e.target.value)}
                    placeholder="Ej. Nombre completo"
                    className="min-h-[44px] w-full rounded-xl border border-white/10 bg-[#060607] px-3.5 text-sm text-white outline-none focus:border-emerald-500/60"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                    Categoría
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ReportCategory)}
                    className="min-h-[44px] w-full rounded-xl border border-white/10 bg-[#060607] px-3.5 text-sm text-white outline-none focus:border-emerald-500/60"
                  >
                    <option value="servicio">Problema con el servicio</option>
                    <option value="seguimiento">Falta de seguimiento</option>
                    <option value="conducta">Conducta inapropiada</option>
                    <option value="contenido">Contenido inadecuado</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                    Descripción del problema *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Cuéntanos qué ocurrió para poder ayudarte..."
                    className="w-full rounded-xl border border-white/10 bg-[#060607] p-3 text-sm text-white outline-none focus:border-emerald-500/60"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="h-11 w-full rounded-full bg-white text-xs font-semibold text-zinc-950 transition hover:bg-zinc-200 disabled:opacity-50"
                >
                  {sending ? "Enviando reporte..." : "Enviar reporte"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
