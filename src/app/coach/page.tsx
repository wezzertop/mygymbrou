"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Plus,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useApp } from "@/context/AppContext";

export default function CoachDashboardPage() {
  const { coachProfile, students, appointments, assessments } = useApp();
  const [fabOpen, setFabOpen] = useState(false);

  const activeStudents = students.filter((s) => s.invite_status === "active");
  const firstActiveStudentId = activeStudents.find((s) => s.student_id)?.student_id;
  const newAssessmentHref = firstActiveStudentId
    ? `/coach/students/${firstActiveStudentId}?tab=assessment`
    : "/coach/students?invite=true";
  const pendingInvites = students.filter((s) => s.invite_status === "pending");
  const expiringSubs = students.filter(
    (s) =>
      s.subscription_status === "pending_payment" ||
      s.subscription_status === "expired"
  );
  const upcomingAppointments = appointments
    .filter((a) => a.status === "scheduled")
    .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));

  const monthlyRevenue = students
    .filter((s) => s.subscription_status === "active")
    .reduce((sum, s) => sum + s.subscription_price, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
            {coachProfile.brand_name || "Panel de Control"}
          </p>
          <h1 className="mt-1 text-2xl font-extrabold text-white sm:text-3xl">
            Hola, {coachProfile.full_name.split(" ")[0]}
          </h1>
          <p className="text-sm text-slate-400">
            Resumen diario de tus alumnos, evaluaciones y suscripciones.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Link
            href="/coach/students?invite=true"
            className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:brightness-110 active:scale-[0.98]"
          >
            <UserPlus className="h-4 w-4" />
            Invitar Alumno
          </Link>
          <Link
            href={newAssessmentHref}
            className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs font-bold text-white transition hover:border-cyan-500/50 hover:bg-slate-800 active:scale-[0.98]"
          >
            <Activity className="h-4 w-4 text-cyan-400" />
            Nueva Evaluación
          </Link>
          <Link
            href="/coach/agenda"
            className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs font-bold text-white transition hover:border-emerald-500/50 hover:bg-slate-800 active:scale-[0.98]"
          >
            <Calendar className="h-4 w-4 text-emerald-400" />
            Agendar Cita
          </Link>
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <Link
          href="/coach/students"
          className="rounded-2xl border border-slate-800/90 bg-slate-900/70 p-4 transition hover:border-cyan-500/40 hover:bg-slate-900"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              Alumnos Activos
            </span>
            <Users className="h-4 w-4 text-cyan-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-white">
            {activeStudents.length}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            +{pendingInvites.length} invitación pendiente
          </p>
        </Link>

        <Link
          href="/coach/plans"
          className="rounded-2xl border border-slate-800/90 bg-slate-900/70 p-4 transition hover:border-emerald-500/40 hover:bg-slate-900"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              Ingresos Activos
            </span>
            <CreditCard className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-400">
            ${monthlyRevenue.toLocaleString("es-MX")}
          </p>
          <p className="mt-1 text-[11px] text-amber-400">
            {expiringSubs.length} por vencer / pendiente
          </p>
        </Link>

        <Link
          href="/coach/agenda"
          className="rounded-2xl border border-slate-800/90 bg-slate-900/70 p-4 transition hover:border-cyan-500/40 hover:bg-slate-900"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              Próximas Citas
            </span>
            <Calendar className="h-4 w-4 text-cyan-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-white">
            {upcomingAppointments.length}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            Valoraciones y check-ins
          </p>
        </Link>

        <Link
          href={newAssessmentHref}
          className="rounded-2xl border border-slate-800/90 bg-slate-900/70 p-4 transition hover:border-emerald-500/40 hover:bg-slate-900"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              Evaluaciones
            </span>
            <Activity className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-white">
            {assessments.length}
          </p>
          <p className="mt-1 text-[11px] text-emerald-400">
            Historial antropométrico
          </p>
        </Link>
      </div>

      {/* Main Two-Column Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Próximas Citas */}
        <section className="min-w-0 rounded-2xl border border-slate-800/90 bg-slate-900/60 p-4 sm:p-5 lg:col-span-7">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-white">
              Agenda Próxima
            </h2>
            <Link
              href="/coach/agenda"
              className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300"
            >
              Ver agenda
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {upcomingAppointments.slice(0, 4).map((apt) => (
              <div
                key={apt.id}
                className="flex flex-col justify-between gap-2 rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 sm:flex-row sm:items-center"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-cyan-500/15 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
                      {apt.student_name}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Clock className="h-3 w-3" />
                      {new Date(apt.scheduled_at).toLocaleString("es-MX", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-white">{apt.title}</p>
                  <p className="text-xs text-slate-400">{apt.location_or_link}</p>
                </div>
                <Link
                  href={`/coach/students/${apt.student_id}`}
                  className="shrink-0 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-center text-xs font-semibold text-slate-200 transition hover:border-cyan-500/40"
                >
                  Expediente
                </Link>
              </div>
            ))}
            {upcomingAppointments.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-800 py-6 text-center">
                <p className="text-sm text-slate-400">
                  No tienes citas programadas por ahora.
                </p>
                <Link
                  href="/coach/agenda"
                  className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-cyan-500/15 px-3.5 py-2 text-xs font-bold text-cyan-300 transition hover:bg-cyan-500/25"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Programar primera cita
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Alertas de Alumnos y Suscripciones */}
        <section className="min-w-0 rounded-2xl border border-slate-800/90 bg-slate-900/60 p-4 sm:p-5 lg:col-span-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-white">
              Estado de Cartera
            </h2>
            <Link
              href="/coach/students"
              className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300"
            >
              Todos
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {students.map((st) => {
              const targetId = st.student_id || st.id;
              return (
                <Link
                  key={st.id}
                  href={
                    st.student_id
                      ? `/coach/students/${targetId}`
                      : "/coach/students"
                  }
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/70 p-3 transition hover:border-cyan-500/40"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {st.avatar_url ? (
                      <img
                        src={st.avatar_url}
                        alt={st.invited_name}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-cyan-400">
                        {st.invited_name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">
                        {st.invited_name}
                      </p>
                      <p className="truncate text-xs text-slate-400">
                        {st.subscription_plan_name}
                      </p>
                    </div>
                  </div>

                  {st.invite_status === "pending" ? (
                    <span className="shrink-0 rounded-full bg-amber-500/15 px-2.5 py-1 text-[10px] font-bold text-amber-300">
                      Invitación pendiente
                    </span>
                  ) : st.subscription_status === "pending_payment" ||
                    st.subscription_status === "expired" ? (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-rose-500/15 px-2.5 py-1 text-[10px] font-bold text-rose-300">
                      <AlertTriangle className="h-3 w-3" />
                      Por vencer
                    </span>
                  ) : (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold text-emerald-300">
                      <CheckCircle2 className="h-3 w-3" />
                      Al día
                    </span>
                  )}
                </Link>
              );
            })}
            {students.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-800 py-6 text-center">
                <p className="text-sm text-slate-400">
                  Aún no tienes alumnos registrados.
                </p>
                <Link
                  href="/coach/students?invite=true"
                  className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-4 py-2 text-xs font-bold text-slate-950"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Invitar Primer Alumno
                </Link>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Mobile Floating Action Button (FAB) — desktop uses header CTAs */}
      {fabOpen && (
        <div
          aria-hidden="true"
          onClick={() => setFabOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-[1px] lg:hidden"
        />
      )}
      <div className="fixed bottom-20 right-4 z-40 flex flex-col items-end gap-2 lg:hidden">
        {fabOpen && (
          <div className="flex flex-col items-end gap-2">
            <Link
              href="/coach/students?invite=true"
              onClick={() => setFabOpen(false)}
              className="flex items-center gap-2 rounded-full border border-cyan-500/40 bg-slate-900 px-4 py-2.5 text-xs font-bold text-cyan-300 shadow-xl transition hover:bg-slate-800"
            >
              <UserPlus className="h-4 w-4" />
              Invitar Alumno
            </Link>
            <Link
              href={newAssessmentHref}
              onClick={() => setFabOpen(false)}
              className="flex items-center gap-2 rounded-full border border-emerald-500/40 bg-slate-900 px-4 py-2.5 text-xs font-bold text-emerald-300 shadow-xl transition hover:bg-slate-800"
            >
              <Activity className="h-4 w-4" />
              Nueva Evaluación
            </Link>
            <Link
              href="/coach/agenda"
              onClick={() => setFabOpen(false)}
              className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-xl transition hover:bg-slate-800"
            >
              <Calendar className="h-4 w-4 text-cyan-400" />
              Agendar Cita
            </Link>
          </div>
        )}
        <button
          type="button"
          onClick={() => setFabOpen((o) => !o)}
          aria-expanded={fabOpen}
          aria-label={fabOpen ? "Cerrar acciones rápidas" : "Abrir acciones rápidas"}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 shadow-2xl shadow-cyan-500/30 transition hover:scale-105 active:scale-95"
        >
          {fabOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
        </button>
      </div>
    </div>
  );
}
