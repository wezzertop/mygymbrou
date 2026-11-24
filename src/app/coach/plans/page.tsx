"use client";

import React, { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  CreditCard,
  Crown,
  Plus,
  Trash2,
  UserCheck,
  Utensils,
  X,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { CoachingMode } from "@/types/database";
import {
  canInviteMoreStudents,
  getPlanCapabilities,
  getSaasPlanById,
  PRICING_FOOTNOTE_MXN,
  SAAS_PLANS_MXN,
} from "@/lib/saas-plans";

const COACHING_LABELS: Record<CoachingMode, string> = {
  none: "Sin sesiones 1:1",
  intermittent: "Coach Online Intermitente",
  in_person: "Coach Presencial",
};

function CoachPlansContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab =
    searchParams.get("tab") === "saas"
      ? "saas"
      : searchParams.get("tab") === "diets"
      ? "diets"
      : "subscriptions";

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
    updateCoachSaasPlan,
  } = useApp();

  const [tab, setTab] = useState<"subscriptions" | "diets" | "saas">(initialTab);
  const currentSaasPlan = getSaasPlanById(coachProfile.saas_plan_tier);
  const occupiedSlots = students.filter(
    (s) => s.invite_status === "active" || s.invite_status === "pending"
  ).length;
  const quota = canInviteMoreStudents(
    occupiedSlots,
    coachProfile.saas_plan_tier,
    coachProfile.saas_student_limit
  );
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
    const caps = getPlanCapabilities(coachProfile.saas_plan_tier);
    if (
      caps.maxSubscriptionPackages !== null &&
      subscriptionPlans.length >= caps.maxSubscriptionPackages
    ) {
      notify(
        "El plan Inicio / Free permite 1 paquete. Mejora a Coach Base para crear paquetes ilimitados sin publicidad."
      );
      setTab("saas");
      return;
    }
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
    const caps = getPlanCapabilities(coachProfile.saas_plan_tier);
    if (!caps.canUseReusableTemplates) {
      notify(
        "Las plantillas reutilizables de dieta se desbloquean desde el plan Coach Base."
      );
      setTab("saas");
      return;
    }
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
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
          Planes y Dietas
        </h1>

        <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-[#0e0f12] px-3 py-2 text-xs">
          <span className="shrink-0 text-zinc-400">Alumno:</span>
          {students.length > 0 ? (
            <select
              aria-label="Seleccionar alumno para asignación rápida"
              value={selectedRelationId}
              onChange={(e) => setSelectedRelationId(e.target.value)}
              className="min-w-0 flex-1 bg-transparent font-bold text-emerald-400 outline-none"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id} className="bg-[#0e0f12] text-white">
                  {s.invited_name}
                </option>
              ))}
            </select>
          ) : (
            <span className="font-semibold text-zinc-500">Sin alumnos</span>
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
      <div className="grid grid-cols-3 gap-1.5 rounded-xl border border-white/[0.08] bg-[#060607] p-1.5 sm:max-w-xl">
        <button
          type="button"
          onClick={() => setTab("subscriptions")}
          className={`flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs font-bold transition ${
            tab === "subscriptions"
              ? "bg-white text-zinc-950"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <CreditCard className="h-4 w-4 shrink-0" />
          <span className="truncate">Paquetes ({subscriptionPlans.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setTab("diets")}
          className={`flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs font-bold transition ${
            tab === "diets"
              ? "bg-emerald-500 text-zinc-950"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <Utensils className="h-4 w-4 shrink-0" />
          <span className="truncate">Dietas ({nutritionPlans.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setTab("saas")}
          className={`flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs font-bold transition ${
            tab === "saas"
              ? "bg-white hover:bg-zinc-200 text-zinc-950"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <Crown className="h-4 w-4 shrink-0" />
          <span className="truncate">Mi Plan MXN</span>
        </button>
      </div>

      {tab === "saas" ? (
        <div className="space-y-6">
          <div className="flex flex-col justify-between gap-4 rounded-xl border border-white/[0.08] bg-[#0e0f12] p-5 sm:flex-row sm:items-center">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-bold text-emerald-300">
                <Crown className="h-3.5 w-3.5" />
                Plan actual: {currentSaasPlan.name} ({currentSaasPlan.priceLabel}{" "}
                {currentSaasPlan.period})
              </span>
              <p className="text-sm font-bold text-white">
                {quota.limit === null
                  ? `Tienes ${occupiedSlots} alumnos en cartera (cupo ilimitado).`
                  : `Cupo usado: ${occupiedSlots} de ${quota.limit} alumnos (${quota.remaining} disponibles).`}
              </p>
              <p className="text-xs text-zinc-400">
                Actualiza tu plan en cualquier momento para ampliar tu límite de alumnos activos.
              </p>
            </div>
            {quota.limit !== null && (
              <div className="w-full sm:w-48">
                <div className="mb-1 flex justify-between text-[11px] font-semibold text-zinc-400">
                  <span>Uso del cupo</span>
                  <span>
                    {Math.min(100, Math.round((occupiedSlots / quota.limit) * 100))}%
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-white hover:bg-zinc-200"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round((occupiedSlots / quota.limit) * 100)
                      )}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {SAAS_PLANS_MXN.map((plan) => {
              const isCurrent = currentSaasPlan.id === plan.id;
              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col rounded-xl border p-5 ${
                    isCurrent
                      ? "border-emerald-500 bg-[#0e0f12] ring-1 ring-emerald-500/40"
                      : plan.featured
                      ? "border-white/15 bg-[#0e0f12]"
                      : "border-white/[0.08] bg-[#0e0f12]/80"
                  }`}
                >
                  {plan.badge && (
                    <span className="absolute -top-2.5 right-4 rounded-full bg-white hover:bg-zinc-200 px-2.5 py-0.5 text-[10px] font-extrabold text-zinc-950">
                      {plan.badge}
                    </span>
                  )}
                  <h3 className="text-base font-extrabold text-white">
                    {plan.name}
                  </h3>
                  <div className="my-3 flex items-baseline gap-1">
                    <span className="text-3xl font-black text-white">
                      {plan.priceLabel}
                    </span>
                    <span className="text-[11px] font-semibold text-zinc-400">
                      {plan.period}
                    </span>
                  </div>
                  <p className="mb-3 rounded-lg bg-[#060607] px-2.5 py-1.5 text-[11px] font-bold text-emerald-300">
                    {plan.studentLimitLabel}
                  </p>
                  <div className="mb-5 flex-1 space-y-3">
                    <ul className="space-y-2 text-xs text-zinc-200">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2">
                          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    {plan.excludedFeatures.length > 0 && (
                      <ul className="space-y-1.5 border-t border-white/[0.06] pt-3 text-[11px] text-zinc-500">
                        {plan.excludedFeatures.map((ex) => (
                          <li key={ex} className="flex items-start gap-2">
                            <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-600" />
                            <span>{ex}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={isCurrent}
                    onClick={() => {
                      if (plan.id === "free") {
                        updateCoachSaasPlan("free");
                        notify("Plan actualizado a Inicio / Free.");
                      } else {
                        router.push(`/coach/billing/checkout?plan=${plan.id}`);
                      }
                    }}
                    className={`min-h-[44px] w-full rounded-full px-4 py-2.5 text-xs font-semibold transition ${
                      isCurrent
                        ? "border border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                        : "bg-white text-zinc-950 hover:bg-zinc-200"
                    }`}
                  >
                    {isCurrent
                      ? "Plan Activo Actual"
                      : plan.id === "free"
                      ? "Cambiar a Inicio / Free"
                      : `Pagar y activar ${plan.name}`}
                  </button>
                </div>
              );
            })}
          </div>

          <p className="rounded-xl border border-white/[0.08] bg-[#0e0f12] p-3.5 text-center text-xs text-zinc-400">
            {PRICING_FOOTNOTE_MXN}
          </p>
        </div>
      ) : tab === "subscriptions" ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Creator Form */}
          <form
            onSubmit={handleCreateSubPlan}
            className="min-w-0 space-y-3.5 rounded-xl border border-white/[0.08] bg-[#0e0f12] p-4 sm:space-y-4 sm:p-5 lg:col-span-5"
          >
            <h2 className="flex items-center gap-2 text-base font-bold text-white">
              <Plus className="h-4 w-4 text-emerald-400" />
              Nuevo plan
            </h2>

            <div>
              <label className="mb-1 block text-xs text-zinc-300">
                Nombre *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Plan Trimestral VIP"
                className="w-full rounded-xl border border-white/15 bg-[#060607] px-3 py-2.5 text-sm text-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-zinc-300">
                Descripción
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej. Nutrición, rutinas y seguimiento semanal."
                className="w-full rounded-xl border border-white/15 bg-[#060607] p-2.5 text-xs text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-zinc-300">
                  Precio ($)
                </label>
                <input
                  type="number"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-[#060607] px-3 py-2.5 text-sm text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-zinc-300">
                  Duración
                </label>
                <select
                  value={durationDays}
                  onChange={(e) => setDurationDays(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-[#060607] px-3 py-2.5 text-sm text-white"
                >
                  <option value="7">7 días</option>
                  <option value="15">15 días</option>
                  <option value="30">30 días (Mes)</option>
                  <option value="90">90 días (Trim.)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs text-zinc-300">
                Modalidad
              </label>
              <select
                value={coachingMode}
                onChange={(e) =>
                  setCoachingMode(e.target.value as CoachingMode)
                }
                className="w-full rounded-xl border border-white/15 bg-[#060607] px-3 py-2.5 text-xs text-white"
              >
                <option value="none">Sin sesiones 1:1 (Solo app)</option>
                <option value="intermittent">Coach Online Intermitente</option>
                <option value="in_person">Coach Presencial</option>
              </select>
            </div>

            <div className="space-y-2 rounded-xl border border-white/[0.08] bg-[#060607] p-3 text-xs">
              <p className="font-semibold text-zinc-300">
                Módulos incluidos:
              </p>
              <label className="flex cursor-pointer items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={includesNutrition}
                  onChange={(e) => setIncludesNutrition(e.target.checked)}
                  className="h-4 w-4 rounded text-emerald-500"
                />
                <span>Plan nutricional</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={includesWorkouts}
                  onChange={(e) => setIncludesWorkouts(e.target.checked)}
                  className="h-4 w-4 rounded text-emerald-500"
                />
                <span>Rutinas guiadas</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={includesAssessments}
                  onChange={(e) => setIncludesAssessments(e.target.checked)}
                  className="h-4 w-4 rounded text-emerald-500"
                />
                <span>Evaluaciones</span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-white py-3 text-xs font-bold text-zinc-950 transition hover:bg-zinc-200"
            >
              Guardar plan
            </button>
          </form>

          {/* Existing Plans List */}
          <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-7">
            {subscriptionPlans.map((plan) => (
              <div
                key={plan.id}
                className="flex flex-col justify-between gap-4 rounded-xl border border-white/[0.08] bg-[#0e0f12]/75 p-5 transition hover:border-white/25"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
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
                          className="rounded-lg border border-white/15 bg-white/[0.06] px-2 py-1 text-[10px] font-semibold text-zinc-300 hover:text-white"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(plan.id)}
                        aria-label={`Eliminar ${plan.name}`}
                        className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-white/[0.06] hover:text-rose-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <p className="text-2xl font-black text-emerald-400">
                    ${plan.price.toLocaleString("es-MX")}
                    <span className="text-xs font-normal text-zinc-400">
                      {" "}
                      / {plan.duration_days}d
                    </span>
                  </p>

                  <p className="text-xs leading-relaxed text-zinc-400">
                    {plan.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1 text-[10px] font-bold">
                    <span
                      className={`rounded-md px-2 py-0.5 ${
                        plan.includes_nutrition
                          ? "bg-emerald-500/15 text-emerald-300"
                          : "bg-white/[0.06] text-zinc-500 line-through"
                      }`}
                    >
                      Nutrición
                    </span>
                    <span
                      className={`rounded-md px-2 py-0.5 ${
                        plan.includes_workouts
                          ? "bg-emerald-500/15 text-emerald-300"
                          : "bg-white/[0.06] text-zinc-500 line-through"
                      }`}
                    >
                      Rutinas
                    </span>
                    <span className="rounded-md bg-white/[0.06] px-2 py-0.5 text-zinc-200">
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
                  className="inline-flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-xl bg-white/[0.06] py-2.5 text-xs font-bold text-emerald-300 transition hover:bg-white text-zinc-950 hover:text-zinc-950 active:scale-[0.98] disabled:opacity-40"
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
            className="min-w-0 space-y-4 rounded-xl border border-white/[0.08] bg-[#0e0f12] p-4 sm:p-5 lg:col-span-5"
          >
            <h2 className="flex items-center gap-2 text-base font-bold text-white">
              <Plus className="h-4 w-4 text-emerald-400" />
              Nueva Plantilla de Dieta
            </h2>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">
                Nombre del plan nutricional *
              </label>
              <input
                type="text"
                required
                value={dTitle}
                onChange={(e) => setDTitle(e.target.value)}
                placeholder="Ej. Definición Moderada 1,900 kcal"
                className="w-full rounded-xl border border-white/15 bg-[#060607] px-3 py-2.5 text-sm text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-zinc-400">
                  Calorías / día
                </label>
                <input
                  type="number"
                  value={dCals}
                  onChange={(e) => setDCals(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-[#060607] px-3 py-2.5 text-sm text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-zinc-400">
                  Agua (Litros)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={dWater}
                  onChange={(e) => setDWater(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-[#060607] px-3 py-2.5 text-sm text-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="mb-1 block text-[11px] text-zinc-400">
                  Proteína (g)
                </label>
                <input
                  type="number"
                  value={dProt}
                  onChange={(e) => setDProt(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-[#060607] px-2.5 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] text-zinc-400">
                  Carbs (g)
                </label>
                <input
                  type="number"
                  value={dCarbs}
                  onChange={(e) => setDCarbs(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-[#060607] px-2.5 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] text-zinc-400">
                  Grasas (g)
                </label>
                <input
                  type="number"
                  value={dFats}
                  onChange={(e) => setDFats(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-[#060607] px-2.5 py-2 text-xs text-white"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">
                Desayuno base
              </label>
              <textarea
                rows={2}
                value={dMealDesc}
                onChange={(e) => setDMealDesc(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-[#060607] p-2.5 text-xs text-white"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-emerald-500 py-3 text-xs font-bold text-zinc-950"
            >
              Guardar Plantilla de Dieta
            </button>
          </form>

          <div className="space-y-3 lg:col-span-7">
            {nutritionPlans.map((plan) => (
              <div
                key={plan.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-[#0e0f12] p-4"
              >
                <div>
                  <h3 className="text-sm font-bold text-white">{plan.title}</h3>
                  <p className="text-xs text-zinc-400">
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
                    className="rounded-xl bg-emerald-500/15 px-3 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500 hover:text-zinc-950"
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

export default function CoachPlansPage() {
  return (
    <Suspense
      fallback={
        <div className="py-12 text-center text-sm text-zinc-400">
          Cargando planes...
        </div>
      }
    >
      <CoachPlansContent />
    </Suspense>
  );
}
