"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  Check,
  CheckCircle2,
  Droplets,
  Dumbbell,
  Flame,
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

  // Toast feedback
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  // Accessible Rest Timer right on Home
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

  // Water quick counter
  const [waterGlasses, setWaterGlasses] = useState(4);

  // Quick weight log
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

  // Next Appointment & Latest Weight
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
    showToast("¡Sesión de entrenamiento registrada en tu calendario!");
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
    <div className="space-y-5">
      {/* Greeting Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            Tu Día de Entrenamiento
          </p>
          <h1 className="mt-0.5 text-2xl font-extrabold text-white sm:text-3xl">
            Hola, {firstName}
          </h1>
          <p className="text-xs text-slate-400">
            {studentProfile.fitness_goal || "Constancia diaria hacia tu meta"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowWeightForm((v) => !v)}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-slate-800 bg-[#121212] px-3.5 text-xs font-bold text-slate-200 transition hover:border-emerald-500/40"
          >
            <Scale className="h-4 w-4 text-emerald-400" />
            {latestAssessment ? `${latestAssessment.weight_kg} kg` : "Registrar peso"}
          </button>
          {relation && (
            <Link
              href="/student/subscription"
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 text-xs font-bold text-emerald-300"
            >
              {relation.subscription_plan_name}
              {daysLeft > 0 && (
                <span className="text-slate-300">· {daysLeft}d</span>
              )}
            </Link>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-3 text-xs font-semibold text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {toast}
        </div>
      )}

      {/* Quick Inline Weight Log */}
      {showWeightForm && (
        <form
          onSubmit={handleQuickWeightSubmit}
          className="flex flex-col gap-2.5 rounded-2xl border border-emerald-500/30 bg-[#121212] p-4 sm:flex-row sm:items-center"
        >
          <div className="flex-1">
            <label className="mb-1 block text-xs font-semibold text-slate-300">
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
              className="min-h-[44px] w-full rounded-xl border border-slate-700 bg-[#0a0a0a] px-3.5 text-white outline-none focus:border-emerald-500"
            />
          </div>
          <div className="flex gap-2 sm:pt-5">
            <button
              type="submit"
              className="min-h-[44px] flex-1 rounded-xl bg-emerald-500 px-4 text-xs font-bold text-slate-950 sm:flex-none"
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={() => setShowWeightForm(false)}
              className="min-h-[44px] rounded-xl border border-slate-700 bg-slate-900 px-3 text-xs font-semibold text-slate-300"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Next Appointment Banner */}
      {nextAppointment && (
        <Link
          href="/student/appointments"
          className="flex items-center justify-between gap-3 rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-[#121212] to-cyan-950/30 p-3.5 transition hover:border-cyan-400/50"
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-400">
              <CalendarCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
                Próxima Cita
              </p>
              <p className="truncate text-sm font-bold text-white">
                {nextAppointment.title}
              </p>
              <p className="truncate text-xs text-slate-400">
                {new Date(nextAppointment.scheduled_at).toLocaleString("es-MX", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}{" "}
                · {nextAppointment.location_or_link}
              </p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-cyan-400" />
        </Link>
      )}

      {/* SECTION 1: MI ENTRENAMIENTO DE HOY */}
      <section className="space-y-4 rounded-3xl border border-slate-800 bg-[#121212] p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
              <Dumbbell className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">
                Mi Entrenamiento de Hoy
              </h2>
              <p className="text-xs text-slate-400">
                {todayDay ? todayDay.title : "Sin rutina asignada aún"}
              </p>
            </div>
          </div>
          <Link
            href="/student/workouts"
            className="inline-flex min-h-[38px] items-center gap-1 rounded-xl border border-slate-800 bg-[#0a0a0a] px-3 text-xs font-bold text-emerald-400 transition hover:border-emerald-500/40"
          >
            Ver completo
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Inline Rest Timer (1-tap access in the gym) */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-[#0a0a0a] p-3">
          <div className="flex items-center gap-2.5">
            <Timer className="h-4 w-4 text-cyan-400" />
            <span className="font-mono text-lg font-black text-white">
              {formatTime(secondsLeft)}
            </span>
            <div className="flex gap-1">
              {[60, 90, 120].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => startTimer(sec)}
                  className={`min-h-[34px] rounded-lg px-2 text-[11px] font-bold transition ${
                    timerPreset === sec && timerRunning
                      ? "bg-cyan-500 text-slate-950"
                      : "bg-slate-900 text-slate-300 hover:bg-slate-800"
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
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-slate-950"
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
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-slate-300"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {todayDay ? (
          <>
            {/* Progress bar */}
            <div>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-400">
                  Avance de hoy: {workoutCompletedCount}/{workoutTotal} ejercicios
                </span>
                <span className="font-bold text-emerald-400">{workoutPct}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all duration-300"
                  style={{ width: `${workoutPct}%` }}
                />
              </div>
            </div>

            {/* Interactive Exercise Checklist + Quick Load Input */}
            <div className="space-y-2.5">
              {todayDay.exercises.map((ex) => {
                const done = Boolean(completedExercises[ex.id]);
                const loadValue = exerciseLoads[ex.id] || "";
                return (
                  <div
                    key={ex.id}
                    className={`flex flex-col gap-2.5 rounded-2xl border p-3.5 transition sm:flex-row sm:items-center sm:justify-between ${
                      done
                        ? "border-emerald-500/40 bg-emerald-500/10"
                        : "border-slate-800 bg-[#0a0a0a]"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleExerciseComplete(ex.id)}
                      className="flex min-h-[44px] flex-1 items-center gap-3 text-left"
                    >
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border transition ${
                          done
                            ? "border-emerald-400 bg-emerald-500 text-slate-950"
                            : "border-slate-700 bg-slate-900 text-transparent"
                        }`}
                      >
                        <Check className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p
                          className={`text-sm font-bold ${
                            done ? "text-emerald-300 line-through" : "text-white"
                          }`}
                        >
                          {ex.name}
                        </p>
                        <p className="text-xs text-slate-400">
                          {ex.sets} series × {ex.reps} · Descanso {ex.rest_seconds}s
                          {ex.target_weight_or_rpe
                            ? ` · ${ex.target_weight_or_rpe}`
                            : ""}
                        </p>
                      </div>
                    </button>

                    <div className="flex items-center gap-2 pl-10 sm:pl-0">
                      <input
                        type="text"
                        value={loadValue}
                        onChange={(e) => setExerciseLoad(ex.id, e.target.value)}
                        placeholder="Carga (ej. 40kg)"
                        aria-label={`Carga usada en ${ex.name}`}
                        className="min-h-[40px] w-32 rounded-xl border border-slate-700 bg-slate-950 px-2.5 text-xs text-white outline-none focus:border-cyan-500"
                      />
                      <button
                        type="button"
                        onClick={() => startTimer(ex.rest_seconds || 90)}
                        className="min-h-[40px] shrink-0 rounded-xl border border-slate-700 bg-slate-900 px-2.5 text-[11px] font-bold text-cyan-300 hover:border-cyan-500/50"
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
              className={`inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl text-sm font-bold transition ${
                sessionLoggedToday
                  ? "border border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                  : "bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 shadow-lg shadow-emerald-500/20 hover:brightness-110"
              }`}
            >
              <Trophy className="h-4 w-4" />
              {sessionLoggedToday
                ? "Entrenamiento de hoy completado ✓"
                : "Guardar sesión de hoy como completada"}
            </button>
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-800 py-6 text-center text-xs text-slate-400">
            Tu Coach aún no asigna tu rutina activa. Revisa pronto o visita{" "}
            <Link href="/student/coaches" className="font-bold text-cyan-400 underline">
              Buscar Coach
            </Link>
            .
          </div>
        )}
      </section>

      {/* SECTION 2: MIS COMIDAS DE HOY */}
      <section className="space-y-4 rounded-3xl border border-slate-800 bg-[#121212] p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-400">
              <Utensils className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">
                Mis Comidas de Hoy
              </h2>
              <p className="text-xs text-slate-400">
                {activeDiet
                  ? `${consumedCalories} / ${activeDiet.daily_calories} kcal · ${consumedProtein}g / ${activeDiet.protein_g}g proteína`
                  : "Sin plan nutricional activo"}
              </p>
            </div>
          </div>
          <Link
            href="/student/diet"
            className="inline-flex min-h-[38px] items-center gap-1 rounded-xl border border-slate-800 bg-[#0a0a0a] px-3 text-xs font-bold text-cyan-400 transition hover:border-cyan-500/40"
          >
            Ver dieta
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {activeDiet ? (
          <>
            {/* Quick Macros & Hydration Strip */}
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-800 bg-[#0a0a0a] p-3">
                <p className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                  <Flame className="h-3.5 w-3.5 text-amber-400" />
                  Calorías
                </p>
                <p className="mt-1 text-base font-black text-white">
                  {consumedCalories}{" "}
                  <span className="text-xs font-medium text-slate-500">
                    / {activeDiet.daily_calories}
                  </span>
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-[#0a0a0a] p-3">
                <p className="text-[11px] font-semibold text-slate-400">
                  Proteína
                </p>
                <p className="mt-1 text-base font-black text-emerald-400">
                  {consumedProtein}g{" "}
                  <span className="text-xs font-medium text-slate-500">
                    / {activeDiet.protein_g}g
                  </span>
                </p>
              </div>
              <div className="col-span-2 flex items-center justify-between rounded-2xl border border-slate-800 bg-[#0a0a0a] p-3 sm:col-span-1">
                <div>
                  <p className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                    <Droplets className="h-3.5 w-3.5 text-cyan-400" />
                    Agua ({activeDiet.water_liters}L)
                  </p>
                  <p className="mt-0.5 text-sm font-black text-cyan-300">
                    {waterGlasses}/{targetWaterGlasses} vasos
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setWaterGlasses((w) => w + 1)}
                  aria-label="Sumar un vaso de agua"
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-300 transition hover:bg-cyan-500 hover:text-slate-950"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Interactive Meals Checklist */}
            <div className="space-y-2">
              {activeDiet.meals.map((meal) => {
                const done = Boolean(completedMeals[meal.id]);
                return (
                  <button
                    key={meal.id}
                    type="button"
                    onClick={() => toggleMealComplete(meal.id)}
                    className={`flex min-h-[56px] w-full items-center justify-between gap-3 rounded-2xl border p-3.5 text-left transition ${
                      done
                        ? "border-emerald-500/40 bg-emerald-500/10"
                        : "border-slate-800 bg-[#0a0a0a] hover:border-slate-700"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border transition ${
                          done
                            ? "border-emerald-400 bg-emerald-500 text-slate-950"
                            : "border-slate-700 bg-slate-900 text-transparent"
                        }`}
                      >
                        <Check className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p
                          className={`text-sm font-bold ${
                            done ? "text-emerald-300 line-through" : "text-white"
                          }`}
                        >
                          {meal.meal_time}{" "}
                          {meal.suggested_hour && (
                            <span className="text-xs font-medium text-slate-400">
                              · {meal.suggested_hour}
                            </span>
                          )}
                        </p>
                        <p className="truncate text-xs text-slate-400">
                          {meal.foods_description}
                        </p>
                      </div>
                    </div>
                    {meal.calories && (
                      <span className="shrink-0 rounded-lg bg-slate-900 px-2 py-1 text-[11px] font-bold text-slate-300">
                        {meal.calories} kcal
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-800 py-6 text-center text-xs text-slate-400">
            Tu Coach publicará tu plan nutricional personalizado muy pronto.
          </div>
        )}
      </section>
    </div>
  );
}
