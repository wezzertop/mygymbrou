"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Dumbbell,
  MapPin,
} from "lucide-react";
import { useApp } from "@/context/AppContext";

const WEEKDAY_HEADERS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function toIsoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export default function StudentCalendarPage() {
  const { studentProfile, students, workouts, workoutLogs, appointments } =
    useApp();

  const todayIso = useMemo(() => toIsoDate(new Date()), []);
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(() => toIsoDate(new Date()));

  const handlePrevPeriod = () => {
    if (viewMode === "week") {
      const d = new Date(`${selectedDate}T12:00:00`);
      d.setDate(d.getDate() - 7);
      setSelectedDate(toIsoDate(d));
      setCurrentMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    } else {
      setCurrentMonth(
        new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
      );
    }
  };

  const handleNextPeriod = () => {
    if (viewMode === "week") {
      const d = new Date(`${selectedDate}T12:00:00`);
      d.setDate(d.getDate() + 7);
      setSelectedDate(toIsoDate(d));
      setCurrentMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    } else {
      setCurrentMonth(
        new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
      );
    }
  };

  const handleJumpToday = () => {
    const now = new Date();
    setSelectedDate(toIsoDate(now));
    setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  const relation = students.find((s) => s.student_id === studentProfile.id);
  const expiresIso = relation?.expires_at || relation?.next_billing_date;

  const activeWorkout = workouts.find(
    (w) => w.student_id === studentProfile.id && w.is_active
  );

  const myLogs = workoutLogs.filter((l) => l.student_id === studentProfile.id);
  const myAppointments = appointments.filter(
    (a) => a.student_id === studentProfile.id && a.status !== "cancelled"
  );

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    if (viewMode === "week") {
      const sel = new Date(`${selectedDate}T12:00:00`);
      const weekStart = new Date(sel);
      weekStart.setDate(sel.getDate() - sel.getDay());
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + i);
        return d;
      });
    }

    const cells: Date[] = [];
    for (let i = 0; i < firstDay.getDay(); i++) {
      cells.push(new Date(year, month, 1 - (firstDay.getDay() - i)));
    }
    for (let day = 1; day <= lastDay.getDate(); day++) {
      cells.push(new Date(year, month, day));
    }
    while (cells.length % 7 !== 0) {
      const last = cells[cells.length - 1];
      const next = new Date(last);
      next.setDate(last.getDate() + 1);
      cells.push(next);
    }
    return cells;
  }, [currentMonth, viewMode, selectedDate]);

  const getDayInfo = (iso: string, weekday: number) => {
    const dayIndex = activeWorkout
      ? activeWorkout.days.findIndex((d) =>
          d.assigned_weekdays?.includes(weekday)
        )
      : -1;
    const assignedDay =
      dayIndex >= 0 && activeWorkout ? activeWorkout.days[dayIndex] : null;
    const completedLog = myLogs.find((l) => l.completed_date === iso);
    const dayApts = myAppointments.filter(
      (a) => a.scheduled_at.split("T")[0] === iso
    );
    const isExpirationDay = expiresIso === iso;

    return { assignedDay, dayIndex, completedLog, dayApts, isExpirationDay };
  };

  const selWeekday = new Date(`${selectedDate}T12:00:00`).getDay();
  const selInfo = getDayInfo(selectedDate, selWeekday);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
            Agenda Sincronizada
          </span>
          <h1 className="text-2xl font-extrabold text-white">Mi Calendario</h1>
          <p className="text-xs text-zinc-400">
            Días de entreno, rutinas cumplidas, citas y fecha de corte de tu
            plan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/student/appointments"
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-cyan-500/35 bg-cyan-500/10 px-3.5 py-2 text-xs font-bold text-cyan-300 transition hover:bg-cyan-500/20"
          >
            <CalendarDays className="h-3.5 w-3.5" />
            Mis Citas
          </Link>

          <div className="flex rounded-xl border border-white/[0.08] bg-[#060607] p-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setViewMode("month")}
              className={`rounded-lg px-3 py-1.5 transition ${
                viewMode === "month"
                  ? "bg-emerald-500 text-zinc-950"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Mensual
            </button>
            <button
              type="button"
              onClick={() => setViewMode("week")}
              className={`rounded-lg px-3 py-1.5 transition ${
                viewMode === "week"
                  ? "bg-emerald-500 text-zinc-950"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Semanal
            </button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-[11px] text-zinc-300">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          Rutina completada
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
          Día de entreno asignado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
          Cita con Coach
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          Corte de Plan
        </span>
      </div>

      {/* Calendar */}
      <div className="min-w-0 rounded-2xl border border-white/[0.08] bg-[#0e0f12] p-3 sm:p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold capitalize text-white">
            {currentMonth.toLocaleDateString("es-MX", {
              month: "long",
              year: "numeric",
            })}
          </h2>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrevPeriod}
              aria-label={viewMode === "week" ? "Semana anterior" : "Mes anterior"}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-[#060607] text-zinc-300 transition hover:border-emerald-500 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleJumpToday}
              className="h-8 rounded-lg border border-white/[0.08] bg-[#060607] px-2.5 text-[11px] font-bold text-emerald-300 transition hover:border-emerald-500 hover:bg-[#0e0f12]"
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={handleNextPeriod}
              aria-label={viewMode === "week" ? "Semana siguiente" : "Mes siguiente"}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-[#060607] text-zinc-300 transition hover:border-emerald-500 hover:text-white"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-zinc-400">
          {WEEKDAY_HEADERS.map((h) => (
            <div key={h} className="py-1">
              {h}
            </div>
          ))}
        </div>

        <div className="mt-1 grid grid-cols-7 gap-1 sm:gap-1.5">
          {calendarDays.map((dayObj) => {
            const iso = toIsoDate(dayObj);
            const isCurrentMonth =
              dayObj.getMonth() === currentMonth.getMonth();
            const isSelected = iso === selectedDate;
            const isToday = iso === todayIso;
            const info = getDayInfo(iso, dayObj.getDay());

            return (
              <button
                key={iso}
                type="button"
                onClick={() => setSelectedDate(iso)}
                className={`flex min-h-[48px] flex-col items-start justify-between rounded-xl border p-1 text-left transition sm:min-h-[58px] sm:p-2 ${
                  isSelected
                    ? "border-emerald-400 bg-emerald-500/15"
                    : isToday
                    ? "border-cyan-500/60 bg-[#0e0f12]"
                    : "border-white/[0.08] bg-[#060607] hover:border-white/15"
                } ${!isCurrentMonth && viewMode === "month" ? "opacity-35" : ""}`}
              >
                <div className="flex w-full items-center justify-between">
                  <span
                    className={`text-xs font-bold ${
                      isToday ? "text-cyan-400" : "text-zinc-200"
                    }`}
                  >
                    {dayObj.getDate()}
                  </span>
                  {info.completedLog && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  )}
                </div>

                <div className="flex flex-wrap gap-1">
                  {info.assignedDay && !info.completedLog && (
                    <span className="h-2 w-2 rounded-full bg-slate-400" />
                  )}
                  {info.dayApts.length > 0 && (
                    <span className="h-2 w-2 rounded-full bg-cyan-400" />
                  )}
                  {info.isExpirationDay && (
                    <span className="h-2 w-2 rounded-full bg-amber-400" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Interactive Panel */}
      <section className="space-y-3 rounded-2xl border border-white/[0.08] bg-[#0e0f12] p-5">
        <h3 className="text-base font-bold capitalize text-white">
          {new Date(`${selectedDate}T12:00:00`).toLocaleDateString("es-MX", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </h3>

        {selInfo.isExpirationDay && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3.5 text-xs">
            <div className="flex items-center gap-2 text-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <span>
                <strong>Fecha de corte:</strong> Vence tu{" "}
                {relation?.subscription_plan_name}.
              </span>
            </div>
            <Link
              href="/student/subscription"
              className="shrink-0 rounded-lg bg-amber-400 px-3 py-1.5 text-[11px] font-bold text-zinc-950"
            >
              Renovar
            </Link>
          </div>
        )}

        {selInfo.assignedDay ? (
          <div className="flex flex-col justify-between gap-3 rounded-xl border border-white/[0.08] bg-[#060607] p-4 sm:flex-row sm:items-center">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Dumbbell className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-bold text-white">
                  {selInfo.assignedDay.title}
                </span>
              </div>
              {selInfo.completedLog ? (
                <p className="flex items-center gap-1 text-xs font-semibold text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Rutina completada ({selInfo.completedLog.exercises_completed}/
                  {selInfo.completedLog.total_exercises} ejercicios)
                </p>
              ) : (
                <p className="text-xs text-zinc-400">
                  {selInfo.assignedDay.exercises.length} ejercicios ·{" "}
                  {selInfo.assignedDay.estimated_minutes || 55} min
                </p>
              )}
            </div>
            <Link
              href={`/student/workouts?day=${selInfo.dayIndex}`}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-white hover:bg-zinc-200 px-4 py-2 text-xs font-bold text-zinc-950"
            >
              {selInfo.completedLog ? "Ver Rutina" : "Abrir y Entrenar"}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <p className="rounded-xl border border-white/[0.08] bg-[#060607] p-3.5 text-xs text-zinc-400">
            Día de descanso activo / recuperación. ¡Aprovecha para cumplir tus
            macros e hidratación!
          </p>
        )}

        {selInfo.dayApts.map((apt) => (
          <div
            key={apt.id}
            className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-4 text-xs"
          >
            <p className="flex items-center gap-1.5 font-bold text-cyan-300">
              <CalendarDays className="h-4 w-4" />
              Cita con tu Coach: {apt.title}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-zinc-200">
              <Clock className="h-3.5 w-3.5 text-cyan-400" />
              {new Date(apt.scheduled_at).toLocaleTimeString("es-MX", {
                timeStyle: "short",
              })}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-zinc-300">
              <MapPin className="h-3.5 w-3.5 text-emerald-400" />
              {apt.location_or_link}
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}
