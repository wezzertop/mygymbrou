"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  CalendarCheck,
  Check,
  CheckCircle2,
  Droplets,
  Dumbbell,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Scale,
  Timer,
  Trophy,
  Utensils,
} from "lucide-react";
import { getDaysRemaining, useApp } from "@/context/AppContext";
import { SectionVisualHeader } from "@/components/SectionVisualHeader";

export default function StudentDailyHomePage() {
  const {
    studentProfile,
    coachProfile,
    students,
    workouts,
    workoutLogs,
    nutritionPlans,
    appointments,
    assessments,
    completedExercises,
    completedMeals,
    exerciseLoads,
    toggleExerciseComplete,
    toggleMealComplete,
    setExerciseLoad,
    logWorkoutCompleted,
    addAssessment,
  } = useApp();

  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  // Accessible Rest Timer
  const [timerPreset, setTimerPreset] = useState(90);
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

  const startTimer = (sec: number) => {
    setTimerPreset(sec);
    setSecondsLeft(sec);
    setTimerRunning(true);
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const [waterGlasses, setWaterGlasses] = useState(4);
  const [quickWeight, setQuickWeight] = useState("");
  const [showWeightForm, setShowWeightForm] = useState(false);

  const relation = students.find((s) => s.student_id === studentProfile.id);
  const daysLeft = getDaysRemaining(
    relation?.expires_at || relation?.next_billing_date
  );

  // Today's Workout
  const activeWorkout = workouts.find(
    (w) => w.student_id === studentProfile.id && w.is_active
  );
  const todayWeekday = new Date().getDay();
  const todayDay = useMemo(() => {
    if (!activeWorkout || activeWorkout.days.length === 0) return null;
    return (
      activeWorkout.days.find((d) =>
        d.assigned_weekdays?.includes(todayWeekday)
      ) || activeWorkout.days[0]
    );
  }, [activeWorkout, todayWeekday]);

  const todayIso = new Date().toISOString().split("T")[0];
  const workoutCompletedCount = todayDay
    ? todayDay.exercises.filter((e) => completedExercises[e.id]).length
    : 0;
  const workoutTotal = todayDay?.exercises.length || 0;
  const workoutPct =
    workoutTotal > 0
      ? Math.round((workoutCompletedCount / workoutTotal) * 100)
      : 0;
  const sessionLoggedToday = Boolean(
    todayDay &&
      workoutLogs.some(
        (l) =>
          l.student_id === studentProfile.id &&
          l.workout_day_id === todayDay.id &&
          l.completed_date === todayIso
      )
  );

  // Today's Nutrition
  const activeDiet = nutritionPlans.find(
    (n) => n.student_id === studentProfile.id && n.is_active
  );
  const completedMealsList = activeDiet
    ? activeDiet.meals.filter((m) => completedMeals[m.id])
    : [];
  const consumedCalories = completedMealsList.reduce(
    (sum, m) => sum + (m.calories || 0),
    0
  );
  const consumedProtein = completedMealsList.reduce(
    (sum, m) => sum + (m.protein_g || 0),
    0
  );
  const targetWaterGlasses = Math.max(
    1,
    Math.round((activeDiet?.water_liters || 2.5) * 4)
  );

  const nextAppointment = useMemo(
    () =>
      appointments
        .filter(
          (a) => a.student_id === studentProfile.id && a.status === "scheduled"
        )
        .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))[0],
    [appointments, studentProfile.id]
  );

  const latestAssessment = useMemo(
    () =>
      assessments
        .filter((a) => a.student_id === studentProfile.id)
        .sort((a, b) => b.assessment_date.localeCompare(a.assessment_date))[0],
    [assessments, studentProfile.id]
  );

  const handleCompleteWorkout = () => {
    if (!todayDay) return;
    logWorkoutCompleted({
      student_id: studentProfile.id,
      workout_day_id: todayDay.id,
      workout_day_title: todayDay.title,
      exercises_completed: Math.max(workoutCompletedCount, 1),
      total_exercises: workoutTotal,
    });
    showToast("Sesión registrada en tu calendario.");
  };

  const handleQuickWeightSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(quickWeight);
    if (!val || val < 25 || val > 300) return;
    addAssessment(
      {
        student_id: studentProfile.id,
        coach_id: coachProfile.id,
        assessment_date: todayIso,
        weight_kg: val,
        height_cm: latestAssessment?.height_cm,
        body_fat_percentage: latestAssessment?.body_fat_percentage,
        muscle_mass_kg: latestAssessment?.muscle_mass_kg,
        waist_cm: latestAssessment?.waist_cm,
        abdomen_cm: latestAssessment?.abdomen_cm,
        goal_tag: "Registro Rápido",
        coach_analysis_notes: "Peso registrado rápidamente desde Inicio.",
        progress_photos: [],
      },
      false
    );
    setQuickWeight("");
    setShowWeightForm(false);
    showToast(`Peso actualizado a ${val} kg.`);
  };

  const firstName = studentProfile.full_name?.split(" ")[0] || "Atleta";

  return (
    <div className="space-y-6">
      {/* Editorial Visual Header (mobile-adapted photo, zero text over photo) */}
      <SectionVisualHeader
        imageSrc="/images/landing/hero-athlete.jpg"
        imageAlt="Entrenamiento diario de alto rendimiento"
        imagePosition="object-[center_30%]"
        eyebrow="Resumen de hoy"
        title={`Hola, ${firstName}`}
        subtitle={studentProfile.fitness_goal || "Constancia diaria hacia tu meta"}
        actions={
          <>
            <button
              type="button"
              onClick={() => setShowWeightForm((v) => !v)}
              className="inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-full border border-white/10 bg-[#060607] px-4 text-xs font-medium text-zinc-200 transition hover:border-white/25 hover:text-white"
            >
              <Scale className="h-3.5 w-3.5 text-emerald-400" />
              <span className="tabular-nums">
                {latestAssessment ? `${latestAssessment.weight_kg} kg` : "Registrar peso"}
              </span>
            </button>
            {relation && (
              <Link
                href="/student/subscription"
                className="inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 text-xs font-medium text-emerald-300"
              >
                <span>{relation.subscription_plan_name}</span>
                {daysLeft > 0 && (
                  <span className="tabular-nums text-zinc-400">· {daysLeft}d</span>
                )}
              </Link>
            )}
          </>
        }
      />

      {/* Toast */}
      {toast && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs font-medium text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {toast}
        </div>
      )}

      {/* Quick Inline Weight Log */}
      {showWeightForm && (
        <form
          onSubmit={handleQuickWeightSubmit}
          className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#0e0f12] p-4 sm:flex-row sm:items-end"
        >
          <div className="flex-1">
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">
              Registrar peso de hoy (kg)
            </label>
            <input
              type="number"
              step="0.1"
              min="25"
              max="300"
              required
              value={quickWeight}
              onChange={(e) => setQuickWeight(e.target.value)}
              placeholder={
                latestAssessment ? String(latestAssessment.weight_kg) : "65.0"
              }
              className="min-h-[44px] w-full rounded-xl border border-white/10 bg-[#060607] px-3.5 text-white outline-none focus:border-emerald-500/60"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="h-11 flex-1 rounded-full bg-white px-5 text-xs font-semibold text-zinc-950 transition hover:bg-zinc-200 sm:flex-none"
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={() => setShowWeightForm(false)}
              className="h-11 rounded-full border border-white/10 px-4 text-xs font-medium text-zinc-400 hover:text-white"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Next Appointment Strip */}
      {nextAppointment && (
        <Link
          href="/student/appointments"
          className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-[#0e0f12] p-4 transition hover:border-white/20"
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-emerald-400">
              <CalendarCheck className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                Próxima cita
              </p>
              <p className="truncate text-sm font-medium text-white">
                {nextAppointment.title}
              </p>
              <p className="truncate text-xs text-zinc-400">
                {new Date(nextAppointment.scheduled_at).toLocaleString("es-MX", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}{" "}
                · {nextAppointment.location_or_link}
              </p>
            </div>
          </div>
          <ArrowUpRight className="h-4 w-4 shrink-0 text-zinc-400" />
        </Link>
      )}

      {/* SECTION 1: MI ENTRENAMIENTO DE HOY */}
      <section className="space-y-5 rounded-3xl border border-white/[0.08] bg-[#0e0f12] p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-emerald-400">
              <Dumbbell className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-tight text-white">
                Mi Entrenamiento de Hoy
              </h2>
              <p className="text-xs text-zinc-400">
                {todayDay ? todayDay.title : "Sin rutina asignada"}
              </p>
            </div>
          </div>
          <Link
            href="/student/workouts"
            className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-medium text-zinc-400 transition hover:text-white"
          >
            Ver rutina
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Minimalist Sport Rest Timer */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-[#060607] px-4 py-3">
          <div className="flex items-center gap-3">
            <Timer className="h-4 w-4 text-zinc-500" />
            <span className="font-mono text-xl font-semibold tabular-nums text-white">
              {formatTime(secondsLeft)}
            </span>
            <div className="flex gap-1">
              {[60, 90, 120].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => startTimer(sec)}
                  className={`h-8 rounded-full px-2.5 text-[11px] font-medium transition ${
                    timerPreset === sec && timerRunning
                      ? "bg-white text-zinc-950"
                      : "border border-white/10 text-zinc-400 hover:border-white/25 hover:text-white"
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setTimerRunning((r) => !r)}
              aria-label={timerRunning ? "Pausar temporizador" : "Iniciar temporizador"}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-zinc-950 transition hover:bg-zinc-200"
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
                setSecondsLeft(timerPreset);
              }}
              aria-label="Reiniciar temporizador"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-zinc-400 transition hover:text-white"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {todayDay ? (
          <>
            <div>
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="text-zinc-400">
                  Progreso · {workoutCompletedCount}/{workoutTotal} ejercicios
                </span>
                <span className="font-semibold tabular-nums text-emerald-400">
                  {workoutPct}%
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-emerald-400 transition-all duration-300"
                  style={{ width: `${workoutPct}%` }}
                />
              </div>
            </div>

            <div className="divide-y divide-white/[0.06] border-y border-white/[0.06]">
              {todayDay.exercises.map((ex) => {
                const done = Boolean(completedExercises[ex.id]);
                const loadValue = exerciseLoads[ex.id] || "";
                return (
                  <div
                    key={ex.id}
                    className="flex flex-col gap-2.5 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <button
                      type="button"
                      onClick={() => toggleExerciseComplete(ex.id)}
                      className="flex min-h-[44px] flex-1 items-center gap-3 text-left"
                    >
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition ${
                          done
                            ? "border-emerald-400 bg-emerald-400 text-zinc-950"
                            : "border-white/20 bg-transparent text-transparent"
                        }`}
                      >
                        <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                      </span>
                      <div className="min-w-0">
                        <p
                          className={`text-sm font-medium ${
                            done ? "text-zinc-500 line-through" : "text-white"
                          }`}
                        >
                          {ex.name}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {ex.sets} × {ex.reps} · {ex.rest_seconds}s descanso
                          {ex.target_weight_or_rpe
                            ? ` · ${ex.target_weight_or_rpe}`
                            : ""}
                        </p>
                      </div>
                    </button>

                    <div className="flex items-center gap-2 pl-9 sm:pl-0">
                      <input
                        type="text"
                        value={loadValue}
                        onChange={(e) => setExerciseLoad(ex.id, e.target.value)}
                        placeholder="Carga (kg)"
                        aria-label={`Carga usada en ${ex.name}`}
                        className="min-h-[38px] w-28 rounded-xl border border-white/10 bg-[#060607] px-3 text-xs text-white outline-none focus:border-emerald-500/60"
                      />
                      <button
                        type="button"
                        onClick={() => startTimer(ex.rest_seconds || 90)}
                        className="h-[38px] shrink-0 rounded-xl border border-white/10 px-3 text-[11px] font-medium text-zinc-300 transition hover:border-white/25 hover:text-white"
                      >
                        {ex.rest_seconds || 90}s
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleCompleteWorkout}
              className={`inline-flex h-12 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold transition ${
                sessionLoggedToday
                  ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                  : "bg-white text-zinc-950 hover:bg-zinc-200"
              }`}
            >
              <Trophy className="h-4 w-4" />
              {sessionLoggedToday
                ? "Entrenamiento de hoy completado"
                : "Guardar sesión de hoy"}
            </button>
          </>
        ) : (
          <div className="py-8 text-center text-xs text-zinc-500">
            Tu Coach aún no asigna tu rutina activa.{" "}
            <Link href="/student/coaches" className="font-medium text-white underline">
              Buscar Coach
            </Link>
          </div>
        )}
      </section>

      {/* SECTION 2: MIS COMIDAS DE HOY */}
      <section className="space-y-5 rounded-3xl border border-white/[0.08] bg-[#0e0f12] p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-emerald-400">
              <Utensils className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-tight text-white">
                Mis Comidas de Hoy
              </h2>
              <p className="text-xs text-zinc-400">
                {activeDiet ? activeDiet.title : "Sin plan nutricional activo"}
              </p>
            </div>
          </div>
          <Link
            href="/student/diet"
            className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-medium text-zinc-400 transition hover:text-white"
          >
            Ver dieta
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {activeDiet ? (
          <>
            {/* Clean Macros & Hydration Strip */}
            <div className="grid grid-cols-3 divide-x divide-white/[0.06] overflow-hidden rounded-2xl border border-white/[0.08] bg-[#060607]">
              <div className="p-3.5">
                <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                  Calorías
                </p>
                <p className="mt-1 text-base font-semibold tabular-nums text-white">
                  {consumedCalories}
                  <span className="text-xs font-normal text-zinc-500">
                    /{activeDiet.daily_calories}
                  </span>
                </p>
              </div>
              <div className="p-3.5">
                <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                  Proteína
                </p>
                <p className="mt-1 text-base font-semibold tabular-nums text-emerald-400">
                  {consumedProtein}g
                  <span className="text-xs font-normal text-zinc-500">
                    /{activeDiet.protein_g}g
                  </span>
                </p>
              </div>
              <div className="flex items-center justify-between p-3.5">
                <div>
                  <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                    <Droplets className="h-3 w-3 text-emerald-400" />
                    Agua
                  </p>
                  <p className="mt-1 text-base font-semibold tabular-nums text-white">
                    {waterGlasses}/{targetWaterGlasses}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setWaterGlasses((w) => w + 1)}
                  aria-label="Sumar un vaso de agua"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-white transition hover:bg-white hover:text-zinc-950"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="divide-y divide-white/[0.06] border-t border-white/[0.06]">
              {activeDiet.meals.map((meal) => {
                const done = Boolean(completedMeals[meal.id]);
                return (
                  <button
                    key={meal.id}
                    type="button"
                    onClick={() => toggleMealComplete(meal.id)}
                    className="flex min-h-[56px] w-full items-center justify-between gap-3 py-3.5 text-left transition"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition ${
                          done
                            ? "border-emerald-400 bg-emerald-400 text-zinc-950"
                            : "border-white/20 bg-transparent text-transparent"
                        }`}
                      >
                        <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                      </span>
                      <div className="min-w-0">
                        <p
                          className={`text-sm font-medium ${
                            done ? "text-zinc-500 line-through" : "text-white"
                          }`}
                        >
                          {meal.meal_time}
                          {meal.suggested_hour && (
                            <span className="ml-1.5 text-xs font-normal text-zinc-500">
                              {meal.suggested_hour}
                            </span>
                          )}
                        </p>
                        <p className="truncate text-xs text-zinc-500">
                          {meal.foods_description}
                        </p>
                      </div>
                    </div>
                    {meal.calories && (
                      <span className="shrink-0 text-xs font-medium tabular-nums text-zinc-400">
                        {meal.calories} kcal
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <div className="py-8 text-center text-xs text-zinc-500">
            Tu Coach publicará tu plan nutricional personalizado muy pronto.
          </div>
        )}
      </section>
    </div>
  );
}
