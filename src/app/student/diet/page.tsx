"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Droplets,
  Flame,
  Lock,
  Minus,
  Plus,
  Repeat2,
  Sparkles,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { NonIntrusiveAdBanner } from "@/components/NonIntrusiveAdBanner";

export default function StudentDietPage() {
  const {
    studentProfile,
    students,
    subscriptionPlans,
    nutritionPlans,
    completedMeals,
    toggleMealComplete,
  } = useApp();

  const relation = students.find((s) => s.student_id === studentProfile.id);
  const activePlan = subscriptionPlans.find((p) => p.id === relation?.plan_id);

  const plan = nutritionPlans.find(
    (n) => n.student_id === studentProfile.id && n.is_active
  );

  const [expandedMeal, setExpandedMeal] = useState<string | null>(
    plan?.meals[0]?.id || null
  );
  const [waterGlasses, setWaterGlasses] = useState(5);

  if (activePlan && !activePlan.includes_nutrition) {
    return (
      <div className="space-y-6">
        <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/30 p-7 text-center shadow-2xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400">
            <Lock className="h-7 w-7" />
          </div>
          <span className="mt-4 inline-block rounded-full bg-amber-500/15 px-3 py-1 text-[11px] font-bold text-amber-300">
            Tu plan actual: {activePlan.name}
          </span>
          <h1 className="mt-3 text-2xl font-extrabold text-white">
            Desbloquea tu Plan Nutricional Personalizado
          </h1>
          <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-slate-300">
            El seguimiento diario de comidas, macros e intercambios está
            disponible en los planes con módulo de nutrición de tu coach.
          </p>
          <div className="mt-6 flex justify-center">
            <Link
              href="/student/subscription"
              className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-3 text-xs font-bold text-slate-950 transition hover:brightness-110"
            >
              <Sparkles className="h-4 w-4" />
              Ver Planes Disponibles
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-8 text-center">
        <p className="text-base font-bold text-white">
          Aún no tienes un plan nutricional activo
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Tu coach asignará tu dieta personalizada muy pronto.
        </p>
      </div>
    );
  }

  const completedMealsList = plan.meals.filter((m) => completedMeals[m.id]);
  const completedCount = completedMealsList.length;
  const consumedCalories = completedMealsList.reduce(
    (sum, m) => sum + (m.calories || 0),
    0
  );
  const consumedProtein = completedMealsList.reduce(
    (sum, m) => sum + (m.protein_g || 0),
    0
  );
  const consumedCarbs = completedMealsList.reduce(
    (sum, m) => sum + (m.carbs_g || 0),
    0
  );
  const consumedFats = completedMealsList.reduce(
    (sum, m) => sum + (m.fats_g || 0),
    0
  );
  const pct = (val: number, goal: number) =>
    Math.min(100, Math.round((val / Math.max(goal, 1)) * 100));

  const totalWaterTargetGlasses = Math.max(1, Math.round(plan.water_liters * 4)); // 250ml por vaso

  return (
    <div className="space-y-6">
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
          Plan Nutricional
        </span>
        <h1 className="text-2xl font-extrabold text-white">{plan.title}</h1>
        {plan.notes && (
          <p className="mt-1 text-xs leading-relaxed text-slate-400">
            {plan.notes}
          </p>
        )}
      </div>

      {/* Macros & Calories Summary Card */}
      <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400">
              <Flame className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Calorías Hoy</p>
              <p className="text-2xl font-black text-white">
                {consumedCalories}{" "}
                <span className="text-xs font-semibold text-slate-400">
                  / {plan.daily_calories} kcal
                </span>
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-sky-500/30 bg-sky-500/10 px-4 py-2.5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Droplets className="h-4 w-4 text-sky-400" />
                <span className="text-xs font-bold text-sky-300">
                  Hidratación ({plan.water_liters} L)
                </span>
              </div>
              <span className="text-[11px] font-bold text-white">
                {waterGlasses}/{totalWaterTargetGlasses} vasos
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setWaterGlasses((w) => Math.max(0, w - 1))}
                aria-label="Quitar 1 vaso de agua"
                disabled={waterGlasses === 0}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-sky-500/40 bg-slate-950 text-sky-300 transition hover:bg-sky-500/20 disabled:opacity-40"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-900">
                <div
                  className="h-full rounded-full bg-sky-400 transition-all duration-300"
                  style={{ width: `${pct(waterGlasses, totalWaterTargetGlasses)}%` }}
                />
              </div>
              <button
                type="button"
                onClick={() =>
                  setWaterGlasses((w) =>
                    Math.min(w + 1, totalWaterTargetGlasses + 4)
                  )
                }
                aria-label="Sumar 1 vaso de agua"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500 text-slate-950 transition hover:bg-sky-400 active:scale-95"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Macro Bars */}
        <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
          <div className="min-w-0 rounded-2xl border border-slate-800 bg-slate-900/80 p-2.5 sm:p-3">
            <p className="truncate text-[10px] text-slate-400 sm:text-[11px]">Proteínas</p>
            <p className="mt-0.5 truncate text-base font-black text-cyan-400 sm:text-lg">
              {consumedProtein}
              <span className="text-[11px] font-semibold text-slate-500 sm:text-xs">
                /{plan.protein_g}g
              </span>
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-cyan-400 transition-all duration-300"
                style={{ width: `${pct(consumedProtein, plan.protein_g)}%` }}
              />
            </div>
          </div>
          <div className="min-w-0 rounded-2xl border border-slate-800 bg-slate-900/80 p-2.5 sm:p-3">
            <p className="truncate text-[10px] text-slate-400 sm:text-[11px]">Carbos</p>
            <p className="mt-0.5 truncate text-base font-black text-emerald-400 sm:text-lg">
              {consumedCarbs}
              <span className="text-[11px] font-semibold text-slate-500 sm:text-xs">
                /{plan.carbs_g}g
              </span>
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-emerald-400 transition-all duration-300"
                style={{ width: `${pct(consumedCarbs, plan.carbs_g)}%` }}
              />
            </div>
          </div>
          <div className="min-w-0 rounded-2xl border border-slate-800 bg-slate-900/80 p-2.5 sm:p-3">
            <p className="truncate text-[10px] text-slate-400 sm:text-[11px]">Grasas</p>
            <p className="mt-0.5 truncate text-base font-black text-amber-400 sm:text-lg">
              {consumedFats}
              <span className="text-[11px] font-semibold text-slate-500 sm:text-xs">
                /{plan.fats_g}g
              </span>
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-amber-400 transition-all duration-300"
                style={{ width: `${pct(consumedFats, plan.fats_g)}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Meals Accordion / Cards */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">Comidas del Día</h2>
          <span className="text-xs font-bold text-emerald-400">
            {completedCount}/{plan.meals.length} cumplidas
          </span>
        </div>

        {plan.meals.map((meal) => {
          const done = Boolean(completedMeals[meal.id]);
          const isOpen = expandedMeal === meal.id;

          return (
            <div
              key={meal.id}
              className={`rounded-2xl border transition ${
                done
                  ? "border-emerald-500/40 bg-emerald-950/20"
                  : "border-slate-800/90 bg-slate-900/75"
              }`}
            >
              <div className="flex items-center justify-between gap-3 p-4">
                <button
                  type="button"
                  onClick={() => toggleMealComplete(meal.id)}
                  aria-label={`Marcar ${meal.meal_time} cumplida`}
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 transition ${
                    done
                      ? "border-emerald-400 bg-emerald-500 text-slate-950"
                      : "border-slate-600 bg-slate-950 text-transparent hover:border-emerald-400"
                  }`}
                >
                  <Check className="h-5 w-5 stroke-[3]" />
                </button>

                <button
                  type="button"
                  onClick={() => setExpandedMeal(isOpen ? null : meal.id)}
                  className="flex min-w-0 flex-1 items-center justify-between gap-2 text-left"
                >
                  <div className="min-w-0">
                    <p
                      className={`text-sm font-bold ${
                        done ? "text-slate-400 line-through" : "text-white"
                      }`}
                    >
                      {meal.meal_time}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {meal.suggested_hour} · {meal.calories} kcal · P:
                      {meal.protein_g}g C:{meal.carbs_g}g G:{meal.fats_g}g
                    </p>
                  </div>
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  )}
                </button>
              </div>

              {isOpen && (
                <div className="space-y-3 border-t border-slate-800/80 px-4 pb-4 pt-3 text-xs">
                  <p className="leading-relaxed text-slate-200">
                    {meal.foods_description}
                  </p>
                  {meal.exchange_options && (
                    <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 text-slate-300">
                      <p className="mb-1 flex items-center gap-1.5 font-semibold text-cyan-300">
                        <Repeat2 className="h-3.5 w-3.5" />
                        Opciones de Intercambio
                      </p>
                      <p className="leading-relaxed">{meal.exchange_options}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </section>

      <NonIntrusiveAdBanner slot="student_footer" />
    </div>
  );
}
