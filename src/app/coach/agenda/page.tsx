"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  Clock,
  MapPin,
  XCircle,
} from "lucide-react";
import { useApp } from "@/context/AppContext";

function CoachAgendaContent() {
  const searchParams = useSearchParams();
  const preselectedStudent = searchParams.get("student");

  const {
    coachProfile,
    students,
    appointments,
    addAppointment,
    updateAppointmentStatus,
  } = useApp();

  const activeStudents = students.filter((s) => s.student_id);

  const [studentId, setStudentId] = useState(
    preselectedStudent || activeStudents[0]?.student_id || ""
  );
  const [title, setTitle] = useState("Toma de Medidas Mensuales");
  const [dateTime, setDateTime] = useState(() => {
    const next = new Date();
    next.setDate(next.getDate() + 2);
    next.setHours(17, 0, 0, 0);
    return next.toISOString().slice(0, 16);
  });
  const [location, setLocation] = useState(
    `${coachProfile.brand_name || "Estudio"} — Consultorio`
  );
  const [notes, setNotes] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const handleSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    const st = activeStudents.find((s) => s.student_id === studentId);
    if (!st || !st.student_id) return;

    addAppointment({
      coach_id: coachProfile.id,
      student_id: st.student_id,
      student_name: st.invited_name,
      title,
      scheduled_at: new Date(dateTime).toISOString(),
      location_or_link: location,
      status: "scheduled",
      notes,
    });

    setNotes("");
    setToast(
      `Cita agendada para ${st.invited_name}. Se envió notificación automática al alumno.`
    );
    setTimeout(() => setToast(null), 3500);
  };

  const sorted = [...appointments].sort((a, b) =>
    b.scheduled_at.localeCompare(a.scheduled_at)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Agenda de Citas</h1>
          <p className="text-sm text-zinc-400">
            Programa evaluaciones presenciales u online. Cada cita notifica
            automáticamente al alumno.
          </p>
        </div>
        <Link
          href="/coach/calendar"
          className="inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-[#0e0f12] px-3.5 py-2 text-xs font-bold text-zinc-200 transition hover:border-cyan-500/50 hover:text-white"
        >
          <CalendarDays className="h-4 w-4 text-cyan-400" />
          Ver en Calendario
        </Link>
      </div>

      {toast && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-3 text-xs font-semibold text-emerald-300">
          <CheckCircle2 className="h-4 w-4" />
          {toast}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* New Appointment Form */}
        <form
          onSubmit={handleSchedule}
          className="min-w-0 space-y-4 rounded-2xl border border-white/[0.08] bg-[#0e0f12] p-4 sm:p-5 lg:col-span-5"
        >
          <h2 className="flex items-center gap-2 text-base font-bold text-white">
            <CalendarPlus className="h-4 w-4 text-cyan-400" />
            Programar Nueva Cita
          </h2>

          <div>
            <label className="mb-1 block text-xs font-semibold text-zinc-300">
              Alumno
            </label>
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-[#060607] px-3 py-2.5 text-sm text-white"
            >
              {activeStudents.map((s) => (
                <option key={s.id} value={s.student_id || ""}>
                  {s.invited_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-zinc-300">
              Motivo de la cita *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Toma de medidas y ajuste de dieta"
              className="w-full rounded-xl border border-white/15 bg-[#060607] px-3 py-2.5 text-sm text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-zinc-300">
              Fecha y hora *
            </label>
            <input
              type="datetime-local"
              required
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-[#060607] px-3 py-2.5 text-sm text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-zinc-300">
              Ubicación o Enlace Online *
            </label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Consultorio o link de Google Meet / Zoom"
              className="w-full rounded-xl border border-white/15 bg-[#060607] px-3 py-2.5 text-sm text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-zinc-300">
              Indicaciones previas
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Ropa deportiva ligera y 2h de ayuno."
              className="w-full rounded-xl border border-white/15 bg-[#060607] p-3 text-xs text-white"
            />
          </div>

          <button
            type="submit"
            disabled={activeStudents.length === 0}
            className="min-h-[42px] w-full rounded-xl bg-white hover:bg-zinc-200 py-3 text-xs font-bold text-zinc-950 shadow-lg shadow-none transition  active:scale-[0.98] disabled:opacity-40"
          >
            {activeStudents.length === 0
              ? "Activa un alumno primero para agendar"
              : "Agendar y Notificar Alumno"}
          </button>
        </form>

        {/* Appointments List */}
        <div className="min-w-0 space-y-3 lg:col-span-7">
          {sorted.length === 0 && (
            <div className="rounded-2xl border border-dashed border-white/[0.08] bg-[#0e0f12]/40 p-8 text-center">
              <p className="text-sm font-bold text-white">
                Sin citas registradas todavía
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                Usa el formulario para programar tu primera valoración o check-in.
              </p>
            </div>
          )}
          {sorted.map((apt) => (
            <div
              key={apt.id}
              className="rounded-2xl border border-white/[0.08] bg-[#0e0f12] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-cyan-500/15 px-2.5 py-0.5 text-[11px] font-bold text-cyan-300">
                      {apt.student_name}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        apt.status === "scheduled"
                          ? "bg-amber-500/15 text-amber-300"
                          : apt.status === "completed"
                          ? "bg-emerald-500/15 text-emerald-300"
                          : "bg-rose-500/15 text-rose-300"
                      }`}
                    >
                      {apt.status === "scheduled"
                        ? "Programada"
                        : apt.status === "completed"
                        ? "Completada"
                        : "Cancelada"}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white">{apt.title}</h3>
                  <p className="flex items-center gap-1.5 text-xs text-zinc-400">
                    <Clock className="h-3.5 w-3.5 text-cyan-400" />
                    {new Date(apt.scheduled_at).toLocaleString("es-MX", {
                      dateStyle: "full",
                      timeStyle: "short",
                    })}
                  </p>
                  <p className="flex items-center gap-1.5 text-xs text-zinc-400">
                    <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                    {apt.location_or_link}
                  </p>
                  {apt.notes && (
                    <p className="pt-1 text-xs text-zinc-300">{apt.notes}</p>
                  )}
                </div>

                {apt.status === "scheduled" && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => updateAppointmentStatus(apt.id, "completed")}
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 px-2.5 py-1.5 text-[11px] font-bold text-emerald-300 hover:bg-emerald-500/25"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Completar
                    </button>
                    <button
                      type="button"
                      onClick={() => updateAppointmentStatus(apt.id, "cancelled")}
                      className="inline-flex items-center gap-1 rounded-lg bg-rose-500/15 px-2.5 py-1.5 text-[11px] font-bold text-rose-300 hover:bg-rose-500/25"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CoachAgendaPage() {
  return (
    <Suspense
      fallback={
        <div className="py-10 text-center text-sm text-zinc-400">
          Cargando agenda...
        </div>
      }
    >
      <CoachAgendaContent />
    </Suspense>
  );
}
