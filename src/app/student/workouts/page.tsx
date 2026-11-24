"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Lock,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Timer,
  Trophy,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { NonIntrusiveAdBanner } from "@/components/NonIntrusiveAdBanner";
import { ExerciseVisualDemo } from "@/components/ExerciseVisualDemo";

function StudentWorkoutsContent() {
  const searchParams = useSearchParams();
  const initialDay = Number(searchParams.get("day") || "0");

  const {
    studentProfile,
    students,
    subscriptionPlans,
    workouts,
    workoutLogs,
    completedExercises,
    toggleExerciseComplete,
    logWorkoutCompleted,
  } = useApp();

  const relation = students.find((s) => s.student_id === studentProfile.id);
  const activePlan = subscriptionPlans.find((p) => p.id === relation?.plan_id);

  // Smart Access Control: if coach assigned a plan without workouts (e.g. Plan Básico)
  if (activePlan && !activePlan.includes_workouts) {
    return (
      <div className="space-y-6">
        <div className="rounded-3xl border border-white/[0.08] bg-[#0e0f12] p-7 text-center shadow-2xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-400">
            <Lock className="h-7 w-7" />
          </div>
          <span className="mt-4 inline-block rounded-full bg-amber-500/15 px-3 py-1 text-[11px] font-bold text-amber-300">
            Tu plan actual: {activePlan.name} (Solo Nutrición)
          </span>
          <h1 className="mt-3 text-2xl font-extrabold text-white">
            Desbloquea Rutinas Guiadas con Videos y Animaciones
          </h1>
          <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-zinc-300">
            El módulo de Rutinas Visuales, temporizador de descanso y registro de
            cargas pertenece al <strong>Plan Medio, Plan Oro y Plan Premium</strong>{" "}
            de tu coach.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/student/subscription"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white hover:bg-zinc-200 px-6 py-3.5 text-xs font-bold text-zinc-950"
            >
              <Sparkles className="h-4 w-4" />
              Ver Planes y Solicitar Actualización
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const activeWorkout = workouts.find(
    (w) => w.student_id === studentProfile.id && w.is_active
  );

  const [selectedDayIdx, setSelectedDayIdx] = useState(
    isNaN(initialDay) ? 0 : initialDay
  );
  const [openInstructions, setOpenInstructions] = useState<
    Record<string, boolean>
  >({});
  const [completedToast, setCompletedToast] = useState(false);

  // Integrated Rest Timer
  const [selectedPreset, setSelectedPreset] = useState(90);
  const [secondsLeft, setSecondsLeft] = useState(90);
  const [timerRunning, setTimerRunning] = useState(false);

  useEffect(() => {
    if (!timerRunning) return;
    if (secondsLeft <= 0) {
      setTimerRunning(false);
      return;
    }
    const id = setInterval(() => {
      setSecondsLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [timerRunning, secondsLeft]);

  const startRest = (sec: number) => {
    setSelectedPreset(sec);
    setSecondsLeft(sec);
    setTimerRunning(true);
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (!activeWorkout) {
    return (
      <div className="rounded-2xl border border-white/[0.08] bg-[#0e0f12] p-8 text-center">
        <p className="text-base font-bold text-white">
          Aún no tienes una rutina asignada
        </p>
        <p className="mt-1 text-xs text-zinc-400">
          Tu coach publicará tu plan de entrenamiento pronto.
        </p>
      </div>
    );
  }

  const currentDay =
    activeWorkout.days[selectedDayIdx] || activeWorkout.days[0];
  const completedCount = currentDay.exercises.filter(
    (e) => completedExercises[e.id]
  ).length;
  const progressPct = Math.round(
    (completedCount / Math.max(currentDay.exercises.length, 1)) * 100
  );

  const todayIso = new Date().toISOString().split("T")[0];
  const alreadyLoggedToday = workoutLogs.some(
    (l) =>
      l.student_id === studentProfile.id &&
      l.workout_day_id === currentDay.id &&
      l.completed_date === todayIso
  );

  const handleFinishSession = () => {
    logWorkoutCompleted({
      student_id: studentProfile.id,
      workout_day_id: currentDay.id,
      workout_day_title: currentDay.title,
      completed_date: todayIso,
      exercises_completed: Math.max(completedCount, currentDay.exercises.length),
      total_exercises: currentDay.exercises.length,
    });
    setCompletedToast(true);
    setTimeout(() => setCompletedToast(false), 3500);
  };

  return (
    <div className="space-y-5">
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
          Rutina Guiada con Animación Visual
        </span>
        <h1 className="text-2xl font-extrabold text-white">
          {activeWorkout.title}
        </h1>
        {activeWorkout.description && (
          <p className="mt-1 text-xs text-zinc-400">
            {activeWorkout.description}
          </p>
        )}
      </div>

      {/* Day Selector */}
      <div className="no-scrollbar flex max-w-full gap-2 overflow-x-auto pb-1">
        {activeWorkout.days.map((day, idx) => (
          <button
            key={day.id}
            type="button"
            onClick={() => setSelectedDayIdx(idx)}
            className={`shrink-0 rounded-2xl px-4 py-2.5 text-xs font-bold transition ${
              idx === selectedDayIdx
                ? "bg-white hover:bg-zinc-200 text-zinc-950 shadow-lg shadow-none"
                : "border border-white/[0.08] bg-[#0e0f12] text-zinc-300 hover:border-white/15"
            }`}
          >
            Día {day.day_number} · {day.focus_area || "Entreno"}
          </button>
        ))}
      </div>

      {/* Integrated Rest Timer Bar */}
      <div className="sticky top-14 z-20 rounded-2xl border border-white/[0.08] bg-[#060607]/95 p-3.5 shadow-xl backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-400">
              <Timer className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                Temporizador de Descanso
              </p>
              <p
                className={`flex items-center gap-2 font-mono text-2xl font-black ${
                  secondsLeft === 0 ? "text-emerald-400" : "text-white"
                }`}
              >
                {formatTime(secondsLeft)}
                {secondsLeft === 0 && (
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 font-sans text-[10px] font-bold text-emerald-300">
                    ¡Siguiente serie!
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {[60, 90, 120].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => startRest(preset)}
                className={`min-h-[36px] rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition active:scale-95 ${
                  selectedPreset === preset
                    ? "border-cyan-500 bg-cyan-500/20 text-cyan-300"
                    : "border-white/15 bg-[#0e0f12] text-zinc-200 hover:border-cyan-500/60"
                }`}
              >
                {preset}s
              </button>
            ))}
            <button
              type="button"
              onClick={() => setTimerRunning((r) => !r)}
              aria-label={timerRunning ? "Pausar temporizador" : "Iniciar temporizador"}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500 text-zinc-950 transition hover:bg-cyan-400 active:scale-95"
            >
              {timerRunning ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setTimerRunning(false);
                setSecondsLeft(selectedPreset);
              }}
              aria-label="Reiniciar temporizador"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-[#0e0f12] text-zinc-300 transition hover:border-slate-500 hover:text-white active:scale-95"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Day Header & Progress */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#0e0f12] p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-white">
              {currentDay.title}
            </h2>
            <p className="text-xs text-zinc-400">
              Duración estimada: {currentDay.estimated_minutes || 55} min
            </p>
          </div>
          <span className="text-sm font-black text-emerald-400">
            {completedCount}/{currentDay.exercises.length} ({progressPct}%)
          </span>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full bg-white hover:bg-zinc-200 transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {completedToast && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-500/15 p-4 text-xs font-bold text-emerald-300">
          <Trophy className="h-5 w-5 shrink-0" />
          ¡Rutina guardada en tu calendario y sincronizada con tu Coach!
        </div>
      )}

      {/* Exercises List with Direct Visual Animation & Expandable Instructions */}
      <div className="space-y-4">
        {currentDay.exercises.map((ex, index) => {
          const done = Boolean(completedExercises[ex.id]);
          const showInstr = Boolean(openInstructions[ex.id]);

          return (
            <div
              key={ex.id}
              className={`overflow-hidden rounded-2xl border p-4 transition ${
                done
                  ? "border-emerald-500/40 bg-emerald-950/20"
                  : "border-white/[0.08] bg-[#0e0f12]/75"
              }`}
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
                {/* Visual Looping Anatomical Sequence */}
                <div className="min-w-0 sm:col-span-5">
                  <ExerciseVisualDemo
                    name={ex.name}
                    gender={studentProfile.gender || "female"}
                    frames={ex.frames}
                    frameIntervalMs={ex.frame_interval_ms}
                    mediaUrl={ex.media_url}
                    mediaType={ex.media_type}
                    primaryMuscles={ex.primary_muscles}
                    secondaryMuscles={ex.secondary_muscles}
                    instructions={ex.instructions}
                  />
                </div>

                {/* Details + Large Tactile Checkbox */}
                <div className="flex min-w-0 flex-col justify-between space-y-3 sm:col-span-7">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                        Ejercicio {index + 1} · {ex.muscle_group}
                      </span>
                      <h3
                        className={`text-base font-bold ${
                          done ? "text-zinc-400 line-through" : "text-white"
                        }`}
                      >
                        {ex.name}
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleExerciseComplete(ex.id)}
                      aria-label={`Marcar ${ex.name} completado`}
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border-2 transition active:scale-95 ${
                        done
                          ? "border-emerald-400 bg-emerald-500 text-zinc-950"
                          : "border-slate-600 bg-[#060607] text-transparent hover:border-cyan-400"
                      }`}
                    >
                      <Check className="h-6 w-6 stroke-[3]" />
                    </button>
                  </div>

                  {/* Sets / Reps / Rest */}
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-lg bg-white/[0.06] px-2.5 py-1 font-bold text-white">
                      {ex.sets} series × {ex.reps}
                    </span>
                    {ex.target_weight_or_rpe && (
                      <span className="rounded-lg bg-cyan-500/15 px-2.5 py-1 font-semibold text-cyan-300">
                        {ex.target_weight_or_rpe}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => startRest(ex.rest_seconds)}
                      className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-[#060607] px-2.5 py-1 font-semibold text-emerald-300 hover:border-emerald-500"
                    >
                      <Clock className="h-3.5 w-3.5" />
                      Descanso {ex.rest_seconds}s
                    </button>
                  </div>

                  {ex.coach_notes && (
                    <p className="rounded-xl bg-[#060607] p-2.5 text-xs text-zinc-300">
                      <span className="font-semibold text-cyan-400">
                        Nota del Coach:{" "}
                      </span>
                      {ex.coach_notes}
                    </p>
                  )}

                  {/* Expandable Technical Instructions */}
                  {ex.instructions && (
                    <div>
                      <button
                        type="button"
                        onClick={() =>
                          setOpenInstructions((prev) => ({
                            ...prev,
                            [ex.id]: !prev[ex.id],
                          }))
                        }
                        className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
                      >
                        {showInstr
                          ? "Ocultar técnica paso a paso"
                          : "Ver técnica paso a paso"}
                        {showInstr ? (
                          <ChevronUp className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )}
                      </button>
                      {showInstr && (
                        <p className="mt-2 rounded-xl border border-white/[0.08] bg-[#060607] p-3 text-xs leading-relaxed text-zinc-300">
                          {ex.instructions}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Complete Workout Button -> Saves to workout_logs & Calendar */}
      <button
        type="button"
        onClick={handleFinishSession}
        className={`flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-extrabold shadow-xl transition active:scale-[0.99] ${
          alreadyLoggedToday
            ? "border border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
            : "bg-white hover:bg-zinc-200 text-zinc-950 shadow-emerald-500/25 "
        }`}
      >
        <CheckCircle2 className="h-5 w-5" />
        {alreadyLoggedToday
          ? "Rutina Completada Hoy (Sincronizada en Calendario)"
          : "Marcar Rutina Completada Hoy"}
      </button>

      {/* Discreet Post-Workout Ad Banner */}
      <NonIntrusiveAdBanner slot="post_workout" />
    </div>
  );
}

export default function StudentWorkoutsPage() {
  return (
    <Suspense
      fallback={
        <div className="py-10 text-center text-sm text-zinc-400">
          Cargando rutina visual...
        </div>
      }
    >
      <StudentWorkoutsContent />
    </Suspense>
  );
}
