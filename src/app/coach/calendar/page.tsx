"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Dumbbell,
  XCircle,
} from "lucide-react";
import { useApp } from "@/context/AppContext";

const WEEKDAY_HEADERS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function toIsoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export default function CoachCalendarPage() {
  const { students, workouts, workoutLogs, appointments } = useApp();

  const activeStudents = students.filter((s) => s.student_id);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"month" | "week">("month");

  const todayIso = useMemo(() => toIsoDate(new Date()), []);
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

  const visibleStudents = useMemo(
    () =>
      selectedStudentId === "all"
        ? activeStudents
        : activeStudents.filter((s) => s.student_id === selectedStudentId),
    [activeStudents, selectedStudentId]
  );

  // Build calendar cells
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const cells: Date[] = [];
    for (let i = 0; i < firstDay.getDay(); i++) {
      const d = new Date(year, month, 1 - (firstDay.getDay() - i));
      cells.push(d);
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
    if (viewMode === "week") {
      const selDateObj = new Date(`${selectedDate}T12:00:00`);
      const weekStart = new Date(selDateObj);
      weekStart.setDate(selDateObj.getDate() - selDateObj.getDay());
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + i);
        return d;
      });
    }
    return cells;
  }, [currentMonth, viewMode, selectedDate]);

  const getDaySummary = (dateIso: string, weekday: number) => {
    const assigned: { studentId: string; name: string; dayTitle: string; completed: boolean }[] = [];

    visibleStudents.forEach((st) => {
      if (!st.student_id) return;
      const w = workouts.find(
        (wk) => wk.student_id === st.student_id && wk.is_active
      );
      if (!w) return;
      const matchingDay = w.days.find((d) =>
        d.assigned_weekdays?.includes(weekday)
      );
      if (matchingDay) {
        const logged = workoutLogs.some(
          (l) =>
            l.student_id === st.student_id &&
            l.completed_date === dateIso
        );
        assigned.push({
          studentId: st.student_id,
          name: st.invited_name,
          dayTitle: matchingDay.title,
          completed: logged,
        });
      }
    });

    const dayApts = appointments.filter((a) => {
      const aptIso = a.scheduled_at.split("T")[0];
      const matchSt =
        selectedStudentId === "all" || a.student_id === selectedStudentId;
      return aptIso === dateIso && matchSt && a.status !== "cancelled";
    });

    const expiring = visibleStudents.filter(
      (s) => (s.expires_at || s.next_billing_date) === dateIso
    );

    return { assigned, dayApts, expiring };
  };

  const selectedWeekday = new Date(`${selectedDate}T12:00:00`).getDay();
  const selectedDetails = getDaySummary(selectedDate, selectedWeekday);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-white">
            Calendario Operativo del Coach
          </h1>
          <p className="text-sm text-slate-400">
            Supervisa cumplimiento de rutinas, citas y alertas de vencimiento de
            suscripciones.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/coach/agenda"
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-cyan-500/35 bg-cyan-500/10 px-3.5 py-2 text-xs font-bold text-cyan-300 transition hover:bg-cyan-500/20"
          >
            <Calendar className="h-3.5 w-3.5" />
            Agenda de Citas
          </Link>
          <select
            aria-label="Filtrar por alumno"
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="min-h-[38px] rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-semibold text-white outline-none focus:border-cyan-500"
          >
            <option value="all">Todos los alumnos</option>
            {activeStudents.map((s) => (
              <option key={s.id} value={s.student_id || ""}>
                {s.invited_name}
              </option>
            ))}
          </select>

          <div className="flex rounded-xl border border-slate-800 bg-slate-950 p-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setViewMode("month")}
              className={`rounded-lg px-3 py-1 ${
                viewMode === "month"
                  ? "bg-cyan-500 text-slate-950"
                  : "text-slate-400"
              }`}
            >
              Mensual
            </button>
            <button
              type="button"
              onClick={() => setViewMode("week")}
              className={`rounded-lg px-3 py-1 ${
                viewMode === "week"
                  ? "bg-cyan-500 text-slate-950"
                  : "text-slate-400"
              }`}
            >
              Semanal
            </button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-[11px] text-slate-300">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          Cumplió rutina
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
          Faltó / Pendiente
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
          Cita agendada
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          Vencimiento de plan
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Calendar Grid */}
        <div className="min-w-0 rounded-2xl border border-slate-800 bg-slate-900/70 p-3 sm:p-4 lg:col-span-8">
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
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-950 text-slate-300 transition hover:border-cyan-500 hover:text-white"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleJumpToday}
                className="h-8 rounded-lg border border-slate-800 bg-slate-950 px-2.5 text-[11px] font-bold text-cyan-300 transition hover:border-cyan-500 hover:bg-slate-900"
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={handleNextPeriod}
                aria-label={viewMode === "week" ? "Semana siguiente" : "Mes siguiente"}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-950 text-slate-300 transition hover:border-cyan-500 hover:text-white"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-slate-400">
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
              const { assigned, dayApts, expiring } = getDaySummary(
                iso,
                dayObj.getDay()
              );
              const completedCnt = assigned.filter((a) => a.completed).length;
              const missedCnt =
                iso < todayIso
                  ? assigned.filter((a) => !a.completed).length
                  : 0;

              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => setSelectedDate(iso)}
                  className={`flex min-h-[48px] flex-col items-start justify-between rounded-xl border p-1.5 text-left transition sm:min-h-[64px] sm:p-2 ${
                    isSelected
                      ? "border-cyan-400 bg-cyan-500/15"
                      : isToday
                      ? "border-emerald-500/50 bg-slate-900"
                      : "border-slate-800/80 bg-slate-950/70 hover:border-slate-700"
                  } ${!isCurrentMonth && viewMode === "month" ? "opacity-35" : ""}`}
                >
                  <span
                    className={`text-xs font-bold ${
                      isToday ? "text-emerald-400" : "text-slate-200"
                    }`}
                  >
                    {dayObj.getDate()}
                  </span>

                  <div className="flex flex-wrap gap-1">
                    {completedCnt > 0 && (
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    )}
                    {missedCnt > 0 && (
                      <span className="h-2 w-2 rounded-full bg-rose-400" />
                    )}
                    {dayApts.length > 0 && (
                      <span className="h-2 w-2 rounded-full bg-cyan-400" />
                    )}
                    {expiring.length > 0 && (
                      <span className="h-2 w-2 rounded-full bg-amber-400" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Operational Details */}
        <aside className="min-w-0 space-y-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 sm:p-5 lg:col-span-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <p className="text-[11px] font-semibold uppercase text-cyan-400">
                Detalle del Día
              </p>
              <h3 className="text-base font-bold capitalize text-white">
                {new Date(`${selectedDate}T12:00:00`).toLocaleDateString(
                  "es-MX",
                  { weekday: "long", day: "numeric", month: "long" }
                )}
              </h3>
            </div>
            <Link
              href="/coach/agenda"
              className="rounded-lg bg-slate-800 px-2.5 py-1.5 text-[11px] font-bold text-cyan-300 hover:bg-slate-700"
            >
              + Cita
            </Link>
          </div>

          {/* Expiring Plans */}
          {selectedDetails.expiring.length > 0 && (
            <div className="space-y-2">
              <p className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                <AlertTriangle className="h-3.5 w-3.5" />
                Vencimientos de Plan
              </p>
              {selectedDetails.expiring.map((st) => (
                <Link
                  key={st.id}
                  href={`/coach/students/${st.student_id}?tab=subscription`}
                  className="block rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs"
                >
                  <p className="font-bold text-white">{st.invited_name}</p>
                  <p className="text-amber-200">
                    Vence {st.subscription_plan_name} (${st.subscription_price})
                  </p>
                </Link>
              ))}
            </div>
          )}

          {/* Appointments */}
          {selectedDetails.dayApts.length > 0 && (
            <div className="space-y-2">
              <p className="flex items-center gap-1.5 text-xs font-bold text-cyan-400">
                <Calendar className="h-3.5 w-3.5" />
                Citas Programadas
              </p>
              {selectedDetails.dayApts.map((apt) => (
                <div
                  key={apt.id}
                  className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3 text-xs"
                >
                  <p className="font-bold text-white">{apt.student_name}</p>
                  <p className="text-cyan-200">{apt.title}</p>
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-300">
                    <Clock className="h-3 w-3" />
                    {new Date(apt.scheduled_at).toLocaleTimeString("es-MX", {
                      timeStyle: "short",
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Routine Adherence */}
          <div className="space-y-2">
            <p className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
              <Dumbbell className="h-3.5 w-3.5 text-emerald-400" />
              Cumplimiento de Rutinas ({selectedDetails.assigned.length})
            </p>
            {selectedDetails.assigned.map((item) => {
              const isPastMissed = !item.completed && selectedDate < todayIso;
              return (
                <Link
                  key={`${item.studentId}-${item.dayTitle}`}
                  href={`/coach/students/${item.studentId}`}
                  className="flex items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-950/80 p-3 text-xs transition hover:border-cyan-500/40"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-white">{item.name}</p>
                    <p className="truncate text-[11px] text-slate-400">
                      {item.dayTitle}
                    </p>
                  </div>
                  {item.completed ? (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                      <CheckCircle2 className="h-3 w-3" />
                      Cumplió
                    </span>
                  ) : isPastMissed ? (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-bold text-rose-300">
                      <XCircle className="h-3 w-3" />
                      Faltó
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                      Programada
                    </span>
                  )}
                </Link>
              );
            })}
            {selectedDetails.assigned.length === 0 && (
              <p className="text-xs text-slate-500">
                Sin rutinas programadas para este día.
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
