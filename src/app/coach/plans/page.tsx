"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  CreditCard,
  Plus,
  Trash2,
  UserCheck,
  Utensils,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { CoachingMode } from "@/types/database";

const COACHING_LABELS: Record<CoachingMode, string> = {
  none: "Sin sesiones 1:1",
  intermittent: "Coach Online Intermitente",
  in_person: "Coach Presencial",
};

export default function CoachPlansPage() {
  const {
    coachProfile,
    students,
    subscriptionPlans,
    nutritionPlans,
    addSubscriptionPlan,
    deleteSubscriptionPlan,
    assignSubscriptionPlanToStudent,
    addNutritionPlan,
    assignNutritionToStudent,
  } = useApp();

  const [tab, setTab] = useState<"subscriptions" | "diets">("subscriptions");
  const [selectedRelationId, setSelectedRelationId] = useState(
    students[0]?.id || ""
  );
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // New Subscription Plan Form
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("1200");
  const [durationDays, setDurationDays] = useState("30");
  const [includesNutrition, setIncludesNutrition] = useState(true);
  const [includesWorkouts, setIncludesWorkouts] = useState(true);
  const [includesAssessments, setIncludesAssessments] = useState(true);
  const [coachingMode, setCoachingMode] = useState<CoachingMode>("intermittent");

  // Diet template creator
  const [dTitle, setDTitle] = useState("");
  const [dCals, setDCals] = useState("2100");
  const [dProt, setDProt] = useState("160");
  const [dCarbs, setDCarbs] = useState("220");
  const [dFats, setDFats] = useState("65");
  const [dWater, setDWater] = useState("3.0");
  const [dMealDesc, setDMealDesc] = useState(
    "3 huevos enteros + 70g avena + 1 fruta + café negro"
  );

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  const handleCreateSubPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addSubscriptionPlan({
      coach_id: coachProfile.id,
      name,
      description:
        description || "Paquete personalizado diseñado por tu entrenador.",
      price: Number(price) || 0,
      duration_days: Number(durationDays) || 30,
      includes_nutrition: includesNutrition,
      includes_workouts: includesWorkouts,
      includes_assessments: includesAssessments,
      coaching_mode: coachingMode,
      is_active: true,
    });
    setName("");
    setDescription("");
    notify("Plan de suscripción creado y disponible para asignar.");
  };

  const handleCreateDietTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dTitle.trim()) return;
    addNutritionPlan({
      coach_id: coachProfile.id,
      student_id: null,
      is_template: true,
      title: `Plantilla: ${dTitle}`,
      notes: "Plan nutricional reutilizable.",
      daily_calories: Number(dCals) || 2000,
      protein_g: Number(dProt) || 150,
      carbs_g: Number(dCarbs) || 200,
      fats_g: Number(dFats) || 60,
      water_liters: Number(dWater) || 2.5,
      is_active: true,
      meals: [
        {
          id: `meal-${Date.now()}`,
          nutrition_plan_id: "pending",
          sort_order: 1,
          meal_time: "Desayuno",
          suggested_hour: "08:00 AM",
          foods_description: dMealDesc,
          calories: 520,
          protein_g: 34,
          carbs_g: 55,
          fats_g: 16,
        },
      ],
    });
    setDTitle("");
    notify("Plantilla de dieta guardada.");
  };

  const selectedStudent = students.find((s) => s.id === selectedRelationId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-white">
            Planes de Suscripción y Dietas
          </h1>
          <p className="text-sm text-slate-400">
            Configura tus paquetes de asesoría con duración y permisos de módulos
            para tus alumnos.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs">
          <span className="text-slate-400">Alumno rápido:</span>
          {students.length > 0 ? (
            <select
              aria-label="Seleccionar alumno para asignación rápida"
              value={selectedRelationId}
              onChange={(e) => setSelectedRelationId(e.target.value)}
              className="bg-transparent font-bold text-cyan-400 outline-none"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                  {s.invited_name}
                </option>
              ))}
            </select>
          ) : (
            <span className="font-semibold text-slate-500">Sin alumnos aún</span>
          )}
        </div>
      </div>

      {toast && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-3 text-xs font-semibold text-emerald-300">
          <CheckCircle2 className="h-4 w-4" />
          {toast}
        </div>
      )}

      {/* Tabs */}
      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-800 bg-slate-950 p-1.5 sm:max-w-md">
        <button
          type="button"
          onClick={() => setTab("subscriptions")}
          className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition ${
            tab === "subscriptions"
              ? "bg-cyan-500 text-slate-950"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <CreditCard className="h-4 w-4" />
          Mis Paquetes ({subscriptionPlans.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("diets")}
          className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition ${
            tab === "diets"
              ? "bg-emerald-500 text-slate-950"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Utensils className="h-4 w-4" />
          Plantillas Dieta ({nutritionPlans.length})
        </button>
      </div>

      {tab === "subscriptions" ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Creator Form */}
          <form
            onSubmit={handleCreateSubPlan}
            className="min-w-0 space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5 lg:col-span-5"
          >
            <h2 className="flex items-center gap-2 text-base font-bold text-white">
              <Plus className="h-4 w-4 text-cyan-400" />
              Crear Nuevo Plan de Suscripción
            </h2>

            <div>
              <label className="mb-1 block text-xs text-slate-300">
                Nombre del Plan *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Plan Trimestral VIP"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-slate-300">
                Descripción visible para alumnos
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej. Incluye nutrición, rutinas guiadas y seguimiento semanal."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-slate-300">
                  Precio ($)
                </label>
                <input
                  type="number"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-300">
                  Duración (días)
                </label>
                <select
                  value={durationDays}
                  onChange={(e) => setDurationDays(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white"
                >
                  <option value="7">7 días (Semanal)</option>
                  <option value="15">15 días (Quincenal)</option>
                  <option value="30">30 días (Mensual)</option>
                  <option value="90">90 días (Trimestral)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs text-slate-300">
                Modalidad de Coaching
              </label>
              <select
                value={coachingMode}
                onChange={(e) =>
                  setCoachingMode(e.target.value as CoachingMode)
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-white"
              >
                <option value="none">Sin sesiones 1:1 (Solo app)</option>
                <option value="intermittent">Coach Online Intermitente</option>
                <option value="in_person">Coach Presencial</option>
              </select>
            </div>

            <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-xs">
              <p className="font-semibold text-slate-300">
                Módulos habilitados para el alumno:
              </p>
              <label className="flex cursor-pointer items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={includesNutrition}
                  onChange={(e) => setIncludesNutrition(e.target.checked)}
                  className="h-4 w-4 rounded text-emerald-500"
                />
                <span>Incluye Plan Nutricional (Dieta)</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={includesWorkouts}
                  onChange={(e) => setIncludesWorkouts(e.target.checked)}
                  className="h-4 w-4 rounded text-emerald-500"
                />
                <span>Incluye Rutinas Guiadas con Videos/Animaciones</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={includesAssessments}
                  onChange={(e) => setIncludesAssessments(e.target.checked)}
                  className="h-4 w-4 rounded text-emerald-500"
                />
                <span>Incluye Evaluaciones Antropométricas</span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 py-3 text-xs font-bold text-slate-950"
            >
              Guardar Plan de Suscripción
            </button>
          </form>

          {/* Existing Plans List */}
          <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-7">
            {subscriptionPlans.map((plan) => (
              <div
                key={plan.id}
                className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/75 p-5 transition hover:border-cyan-500/40"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="rounded-full bg-cyan-500/15 px-2.5 py-0.5 text-[10px] font-bold text-cyan-300">
                        {plan.duration_days} días
                      </span>
                      <h3 className="mt-1.5 text-lg font-extrabold text-white">
                        {plan.name}
                      </h3>
                    </div>
                    {confirmDeleteId === plan.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            deleteSubscriptionPlan(plan.id);
                            setConfirmDeleteId(null);
                            notify(`Plan "${plan.name}" eliminado.`);
                          }}
                          className="rounded-lg bg-rose-500 px-2 py-1 text-[10px] font-bold text-white transition hover:bg-rose-400"
                        >
                          Confirmar
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-[10px] font-semibold text-slate-300 hover:text-white"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(plan.id)}
                        aria-label={`Eliminar ${plan.name}`}
                        className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-800 hover:text-rose-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <p className="text-2xl font-black text-emerald-400">
                    ${plan.price.toLocaleString("es-MX")}
                    <span className="text-xs font-normal text-slate-400">
                      {" "}
                      / {plan.duration_days}d
                    </span>
                  </p>

                  <p className="text-xs leading-relaxed text-slate-400">
                    {plan.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1 text-[10px] font-bold">
                    <span
                      className={`rounded-md px-2 py-0.5 ${
                        plan.includes_nutrition
                          ? "bg-emerald-500/15 text-emerald-300"
                          : "bg-slate-800 text-slate-500 line-through"
                      }`}
                    >
                      Nutrición
                    </span>
                    <span
                      className={`rounded-md px-2 py-0.5 ${
                        plan.includes_workouts
                          ? "bg-cyan-500/15 text-cyan-300"
                          : "bg-slate-800 text-slate-500 line-through"
                      }`}
                    >
                      Rutinas
                    </span>
                    <span className="rounded-md bg-slate-800 px-2 py-0.5 text-slate-200">
                      {COACHING_LABELS[plan.coaching_mode]}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!selectedStudent}
                  onClick={() => {
                    if (!selectedStudent) return;
                    assignSubscriptionPlanToStudent(
                      selectedRelationId,
                      plan.id
                    );
                    notify(
                      `Asignado "${plan.name}" a ${selectedStudent.invited_name}. Fecha de vencimiento calculada automáticamente.`
                    );
                  }}
                  className="inline-flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-xl bg-slate-800 py-2.5 text-xs font-bold text-cyan-300 transition hover:bg-cyan-500 hover:text-slate-950 active:scale-[0.98] disabled:opacity-40"
                >
                  <UserCheck className="h-3.5 w-3.5" />
                  {selectedStudent
                    ? `Asignar a ${selectedStudent.invited_name.split(" ")[0]}`
                    : "Invita un alumno para asignar"}
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <form
            onSubmit={handleCreateDietTemplate}
            className="min-w-0 space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5 lg:col-span-5"
          >
            <h2 className="flex items-center gap-2 text-base font-bold text-white">
              <Plus className="h-4 w-4 text-emerald-400" />
              Nueva Plantilla de Dieta
            </h2>
            <div>
              <label className="mb-1 block text-xs text-slate-400">
                Nombre del plan nutricional *
              </label>
              <input
                type="text"
                required
                value={dTitle}
                onChange={(e) => setDTitle(e.target.value)}
                placeholder="Ej. Definición Moderada 1,900 kcal"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-slate-400">
                  Calorías / día
                </label>
                <input
                  type="number"
                  value={dCals}
                  onChange={(e) => setDCals(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">
                  Agua (Litros)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={dWater}
                  onChange={(e) => setDWater(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="mb-1 block text-[11px] text-slate-400">
                  Proteína (g)
                </label>
                <input
                  type="number"
                  value={dProt}
                  onChange={(e) => setDProt(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-2.5 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] text-slate-400">
                  Carbs (g)
                </label>
                <input
                  type="number"
                  value={dCarbs}
                  onChange={(e) => setDCarbs(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-2.5 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] text-slate-400">
                  Grasas (g)
                </label>
                <input
                  type="number"
                  value={dFats}
                  onChange={(e) => setDFats(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-2.5 py-2 text-xs text-white"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">
                Desayuno base
              </label>
              <textarea
                rows={2}
                value={dMealDesc}
                onChange={(e) => setDMealDesc(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-emerald-500 py-3 text-xs font-bold text-slate-950"
            >
              Guardar Plantilla de Dieta
            </button>
          </form>

          <div className="space-y-3 lg:col-span-7">
            {nutritionPlans.map((plan) => (
              <div
                key={plan.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4"
              >
                <div>
                  <h3 className="text-sm font-bold text-white">{plan.title}</h3>
                  <p className="text-xs text-slate-400">
                    {plan.daily_calories} kcal · P:{plan.protein_g}g · C:
                    {plan.carbs_g}g · G:{plan.fats_g}g
                  </p>
                </div>
                {selectedStudent?.student_id && (
                  <button
                    type="button"
                    onClick={() => {
                      assignNutritionToStudent(
                        plan.id,
                        selectedStudent.student_id!
                      );
                      notify("Plan nutricional asignado al alumno.");
                    }}
                    className="rounded-xl bg-emerald-500/15 px-3 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500 hover:text-slate-950"
                  >
                    Asignar a {selectedStudent.invited_name.split(" ")[0]}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
