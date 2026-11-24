"use client";

import React from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  ExternalLink,
  MapPin,
} from "lucide-react";
import { useApp } from "@/context/AppContext";

export default function StudentAppointmentsPage() {
  const { studentProfile, coachProfile, appointments } = useApp();

  const myAppointments = appointments
    .filter((a) => a.student_id === studentProfile.id)
    .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));

  const upcoming = myAppointments.filter((a) => a.status === "scheduled");
  const past = myAppointments.filter((a) => a.status !== "scheduled");
  const nextApt = upcoming[0];

  return (
    <div className="space-y-6">
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
          Seguimiento con tu Coach
        </span>
        <h1 className="text-2xl font-extrabold text-white">Mis Citas</h1>
        <p className="text-xs text-zinc-400">
          Evaluaciones presenciales, toma de medidas y sesiones de revisión.
        </p>
      </div>

      {/* Featured Next Appointment */}
      {nextApt ? (
        <section className="rounded-3xl border border-white/15 bg-[#0e0f12] p-6 shadow-xl">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/15 px-3 py-1 text-[11px] font-bold text-emerald-300">
              <CalendarDays className="h-3.5 w-3.5" />
              Próxima Cita Agendada
            </span>
            <span className="text-xs text-zinc-400">
              Coach {coachProfile.full_name}
            </span>
          </div>

          <h2 className="mt-4 text-xl font-extrabold text-white">
            {nextApt.title}
          </h2>

          <div className="mt-4 space-y-2 text-sm text-zinc-200">
            <p className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-400" />
              {new Date(nextApt.scheduled_at).toLocaleString("es-MX", {
                dateStyle: "full",
                timeStyle: "short",
              })}
            </p>
            <p className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-emerald-400" />
              {nextApt.location_or_link.startsWith("http") ? (
                <a
                  href={nextApt.location_or_link}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-emerald-400 hover:underline"
                >
                  Unirse a la videollamada
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : (
                <span>{nextApt.location_or_link}</span>
              )}
            </p>
          </div>

          {nextApt.notes && (
            <div className="mt-4 rounded-2xl border border-white/[0.08] bg-[#060607] p-3.5 text-xs leading-relaxed text-zinc-300">
              <span className="font-semibold text-emerald-400">
                Recomendaciones previas:{" "}
              </span>
              {nextApt.notes}
            </div>
          )}
        </section>
      ) : (
        <div className="rounded-2xl border border-white/[0.08] bg-[#0e0f12] p-6 text-center text-sm text-zinc-400">
          No tienes citas próximas agendadas por el momento.
        </div>
      )}

      {/* Other Upcoming */}
      {upcoming.length > 1 && (
        <section className="space-y-3">
          <h3 className="text-sm font-bold text-white">Otras citas próximas</h3>
          {upcoming.slice(1).map((apt) => (
            <div
              key={apt.id}
              className="rounded-2xl border border-white/[0.08] bg-[#0e0f12] p-4"
            >
              <p className="text-sm font-bold text-white">{apt.title}</p>
              <p className="mt-1 text-xs text-zinc-400">
                {new Date(apt.scheduled_at).toLocaleString("es-MX", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}{" "}
                · {apt.location_or_link}
              </p>
            </div>
          ))}
        </section>
      )}

      {/* History */}
      <section className="space-y-3">
        <h3 className="text-sm font-bold text-white">Historial de Citas</h3>
        {past.map((apt) => (
          <div
            key={apt.id}
            className="rounded-2xl border border-white/[0.08] bg-[#0e0f12] p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-bold text-zinc-200">{apt.title}</p>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                <CheckCircle2 className="h-3 w-3" />
                {apt.status === "completed" ? "Completada" : "Cancelada"}
              </span>
            </div>
            <p className="mt-1 text-xs text-zinc-400">
              {new Date(apt.scheduled_at).toLocaleDateString("es-MX", {
                dateStyle: "long",
              })}
            </p>
            {apt.notes && (
              <p className="mt-2 text-xs text-zinc-300">{apt.notes}</p>
            )}
          </div>
        ))}
        {past.length === 0 && (
          <p className="text-xs text-zinc-500">
            Aún no hay citas anteriores registradas.
          </p>
        )}
      </section>
    </div>
  );
}
