"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  CreditCard,
  Crown,
  Image as ImageIcon,
  Pencil,
  Plus,
  Trash2,
  Upload,
  UserCheck,
  Utensils,
  X,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { createClient } from "@/lib/supabase/client";
import { CoachReferralsCard } from "@/components/CoachReferralsCard";
import { CoachSubscriptionPlan, CoachingMode } from "@/types/database";
import {
  calculatePlanChangeQuote,
  canInviteMoreStudents,
  getPlanCapabilities,
  getSaasPlanById,
  PLAN_RANK,
  PRICING_FOOTNOTE_MXN,
  SAAS_PLANS_MXN,
  SaasPlanTier,
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
    updateSubscriptionPlan,
    deleteSubscriptionPlan,
    assignSubscriptionPlanToStudent,
    addNutritionPlan,
    assignNutritionToStudent,
    updateCoachProfile,
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
    students.find((s) => s.invite_status === "active")?.id || students[0]?.id || ""
  );
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingPlan, setEditingPlan] = useState<CoachSubscriptionPlan | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPrice, setEditPrice] = useState("1200");
  const [editDurationDays, setEditDurationDays] = useState("30");
  const [editCoachingMode, setEditCoachingMode] = useState<CoachingMode>("intermittent");
  const [editNutrition, setEditNutrition] = useState(true);
  const [editWorkouts, setEditWorkouts] = useState(true);
  const [editAssessments, setEditAssessments] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const openEditPlan = (plan: CoachSubscriptionPlan) => {
    setEditingPlan(plan);
    setEditName(plan.name);
    setEditDescription(plan.description || "");
    setEditPrice(String(plan.price));
    setEditDurationDays(String(plan.duration_days));
    setEditCoachingMode(plan.coaching_mode);
    setEditNutrition(plan.includes_nutrition);
    setEditWorkouts(plan.includes_workouts);
    setEditAssessments(plan.includes_assessments);
  };

  const handleSaveEditPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan || !editName.trim()) return;
    updateSubscriptionPlan(editingPlan.id, {
      name: editName.trim(),
      description: editDescription.trim() || "Paquete personalizado diseñado por tu entrenador.",
      price: Number(editPrice) || 0,
      duration_days: Number(editDurationDays) || 30,
      coaching_mode: editCoachingMode,
      includes_nutrition: editNutrition,
      includes_workouts: editWorkouts,
      includes_assessments: editAssessments,
    });
    setEditingPlan(null);
    notify(`Plan "${editName.trim()}" actualizado correctamente.`);
  };

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
  const [dImageUrl, setDImageUrl] = useState<string>("");
  const [uploadingDietImg, setUploadingDietImg] = useState(false);

  // Plan Change Modal (Upgrade with proration / Downgrade at period end)
  const [targetChangeTier, setTargetChangeTier] = useState<SaasPlanTier | null>(null);
  const [acceptChangeTerms, setAcceptChangeTerms] = useState(false);
  const [submittingChange, setSubmittingChange] = useState(false);
  const [openingPortal, setOpeningPortal] = useState(false);

  const paymentStatusParam = searchParams.get("payment");

  const handleOpenStripePortal = async () => {
    setOpeningPortal(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      notify(data.error || "No se pudo abrir el portal de facturación.");
    } catch {
      notify("Error de conexión al abrir el portal de Stripe.");
    } finally {
      setOpeningPortal(false);
    }
  };

  const changeQuote = targetChangeTier
    ? calculatePlanChangeQuote({
        currentTier: currentSaasPlan.id,
        targetTier: targetChangeTier,
        periodEndIso: coachProfile.saas_period_end,
      })
    : null;

  const handleConfirmPlanChange = async () => {
    if (!changeQuote || !acceptChangeTerms) return;
    setSubmittingChange(true);
    const acceptedAt = new Date().toISOString();
    try {
      // 1) Si viene de Free hacia un plan de pago, intentamos Stripe Checkout directo
      if (changeQuote.fromPlan.id === "free" && changeQuote.mode === "upgrade") {
        const res = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            target_plan: changeQuote.toPlan.id,
            coach_email: coachProfile.email,
            coach_name: coachProfile.full_name,
          }),
        });
        const data = await res.json();
        if (res.ok && data.url) {
          window.location.href = data.url;
          return;
        }
        // Fallback a SPEI si Stripe no está configurado en entorno local
        if (data.fallback === "spei") {
          setTargetChangeTier(null);
          setAcceptChangeTerms(false);
          router.push(`/coach/billing/checkout?plan=${changeQuote.toPlan.id}`);
          return;
        }
        notify(data.error || "No se pudo iniciar el pago con Stripe.");
        return;
      }

      // 2) Upgrade desde plan de pago o Downgrade -> /api/stripe/change-plan
      const res = await fetch("/api/stripe/change-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from_plan: changeQuote.fromPlan.id,
          to_plan: changeQuote.toPlan.id,
          period_end_iso: coachProfile.saas_period_end || null,
          coach_email: coachProfile.email,
          accepted_terms_at: acceptedAt,
        }),
      });
      const data = await res.json();

      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }

      if (res.ok && data.upgradedImmediately) {
        updateCoachProfile({
          saas_plan_tier: changeQuote.toPlan.id,
          saas_student_limit: changeQuote.toPlan.studentLimit,
          saas_subscription_status: "active",
          scheduled_downgrade_plan_tier: null,
        });
        setTargetChangeTier(null);
        setAcceptChangeTerms(false);
        notify(`¡Upgrade completado! Ya estás en ${changeQuote.toPlan.name}.`);
        return;
      }

      if (changeQuote.mode === "downgrade") {
        updateCoachProfile({
          scheduled_downgrade_plan_tier: changeQuote.toPlan.id,
          saas_period_end: changeQuote.effectiveAtIso,
        });
        setTargetChangeTier(null);
        setAcceptChangeTerms(false);
        notify(
          `Cambio programado a ${changeQuote.toPlan.name} al cierre de tu corte (${new Date(
            changeQuote.effectiveAtIso
          ).toLocaleDateString("es-MX")}). Sin cargos ni devoluciones.`
        );
        return;
      }

      // Fallback SPEI en upgrade si Stripe no está configurado
      const qs = new URLSearchParams({
        plan: changeQuote.toPlan.id,
        net: String(changeQuote.netPayableTodayMxn),
        credit: String(changeQuote.creditMxn),
        days: String(changeQuote.remainingDays),
      });
      setTargetChangeTier(null);
      setAcceptChangeTerms(false);
      router.push(`/coach/billing/checkout?${qs.toString()}`);
    } finally {
      setSubmittingChange(false);
    }
  };

  const planCaps = getPlanCapabilities(coachProfile.saas_plan_tier);
  const dietTemplatesCount = nutritionPlans.filter((n) => n.is_template).length;
  const dietLimitReached =
    planCaps.maxDietTemplates !== null &&
    dietTemplatesCount >= planCaps.maxDietTemplates;

  const handleDietImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      notify("La imagen supera el límite de 5 MB.");
      return;
    }
    setUploadingDietImg(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${coachProfile.id || "coach"}/diet-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("diet-images")
        .upload(path, file, { upsert: true });
      if (!error) {
        const { data } = supabase.storage.from("diet-images").getPublicUrl(path);
        if (data?.publicUrl) {
          setDImageUrl(data.publicUrl);
          setUploadingDietImg(false);
          return;
        }
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") setDImageUrl(reader.result);
        setUploadingDietImg(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setUploadingDietImg(false);
    }
  };

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
    if (dietLimitReached && planCaps.maxDietTemplates !== null) {
      notify(
        `Alcanzaste el límite de ${planCaps.maxDietTemplates} plantillas de dieta de tu plan ${currentSaasPlan.name}. Mejora tu plan para agregar más.`
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
      image_url: dImageUrl || undefined,
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
    setDImageUrl("");
    notify("Plantilla de dieta guardada con éxito.");
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
          {paymentStatusParam === "success" && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-3 text-xs font-semibold text-emerald-300">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              ¡Pago completado en Stripe! Tu suscripción y tus nuevos cupos ya están activos.
            </div>
          )}
          {paymentStatusParam === "canceled" && (
            <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-xs font-medium text-amber-200">
              Pago cancelado. No se realizó ningún cargo; puedes intentarlo de nuevo cuando gustes.
            </div>
          )}
          {coachProfile.saas_subscription_status === "past_due" && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-500/40 bg-rose-500/15 p-4 text-xs text-rose-200">
              <div>
                <p className="font-bold text-rose-300">
                  Pago pendiente — Actualiza tu tarjeta
                </p>
                <p className="mt-0.5 text-rose-200/85">
                  No pudimos procesar tu última renovación en Stripe. Actualiza tu
                  método de pago para conservar tus cupos extendidos.
                </p>
              </div>
              <button
                type="button"
                disabled={openingPortal}
                onClick={handleOpenStripePortal}
                className="shrink-0 rounded-full bg-white px-4 py-2 text-xs font-bold text-zinc-950 hover:bg-zinc-200 disabled:opacity-50"
              >
                {openingPortal ? "Abriendo..." : "Actualizar tarjeta"}
              </button>
            </div>
          )}

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
                Actualiza tu plan en cualquier momento con equivalencia transparente de
                días o administra tu método de pago en Stripe.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  disabled={openingPortal}
                  onClick={handleOpenStripePortal}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-3.5 text-xs font-semibold text-zinc-200 transition hover:border-emerald-500/40 hover:text-white disabled:opacity-50"
                >
                  <CreditCard className="h-3.5 w-3.5 text-emerald-400" />
                  {openingPortal
                    ? "Abriendo portal..."
                    : "Administrar facturación y tarjeta"}
                </button>
              </div>
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

          {coachProfile.scheduled_downgrade_plan_tier && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-200">
              <div>
                <p className="font-bold text-amber-300">
                  Cambio de plan programado al cierre de tu corte
                </p>
                <p className="mt-0.5 text-amber-200/85">
                  Conservarás todos los beneficios de{" "}
                  <strong>{currentSaasPlan.name}</strong> hasta{" "}
                  <strong>
                    {coachProfile.saas_period_end
                      ? new Date(coachProfile.saas_period_end).toLocaleDateString("es-MX")
                      : "el cierre de tu ciclo"}
                  </strong>
                  . Después cambiará automáticamente a{" "}
                  <strong>
                    {getSaasPlanById(coachProfile.scheduled_downgrade_plan_tier).name}
                  </strong>
                  .
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  updateCoachProfile({ scheduled_downgrade_plan_tier: null });
                  notify("Cambio programado cancelado. Mantienes tu plan actual.");
                }}
                className="shrink-0 rounded-full border border-amber-400/40 px-3 py-1.5 text-[11px] font-semibold text-amber-200 hover:bg-amber-500/20"
              >
                Cancelar cambio
              </button>
            </div>
          )}

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
                      setAcceptChangeTerms(false);
                      setTargetChangeTier(plan.id);
                    }}
                    className={`min-h-[44px] w-full rounded-full px-4 py-2.5 text-xs font-semibold transition ${
                      isCurrent
                        ? "border border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                        : PLAN_RANK[plan.id] > PLAN_RANK[currentSaasPlan.id]
                        ? "bg-emerald-500 text-[#0a0a0a] hover:bg-emerald-400"
                        : "border border-white/15 bg-white/[0.04] text-zinc-200 hover:border-white/30 hover:text-white"
                    }`}
                  >
                    {isCurrent
                      ? "Plan Activo Actual"
                      : PLAN_RANK[plan.id] > PLAN_RANK[currentSaasPlan.id]
                      ? `Subir a ${plan.name}`
                      : `Cambiar a ${plan.name}`}
                  </button>
                </div>
              );
            })}
          </div>

          <p className="rounded-xl border border-white/[0.08] bg-[#0e0f12] p-3.5 text-center text-xs text-zinc-400">
            {PRICING_FOOTNOTE_MXN}
          </p>

          <CoachReferralsCard />
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
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditPlan(plan)}
                          aria-label={`Editar ${plan.name}`}
                          title="Editar plan"
                          className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-white/[0.06] hover:text-emerald-400"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(plan.id)}
                          aria-label={`Eliminar ${plan.name}`}
                          title="Eliminar plan"
                          className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-white/[0.06] hover:text-rose-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
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
                  className="inline-flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/15 py-2.5 text-xs font-bold text-emerald-300 transition hover:bg-emerald-500 hover:text-zinc-950 active:scale-[0.98] disabled:opacity-40"
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
            <div className="flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-base font-bold text-white">
                <Plus className="h-4 w-4 text-emerald-400" />
                Nueva Plantilla de Dieta
              </h2>
              <span className="rounded-full border border-white/10 bg-[#060607] px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
                {planCaps.maxDietTemplates === null
                  ? `${dietTemplatesCount} / ∞`
                  : `${dietTemplatesCount}/${planCaps.maxDietTemplates} (${currentSaasPlan.name})`}
              </span>
            </div>

            {dietLimitReached && (
              <div className="flex items-center justify-between gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                <span>
                  Límite de {planCaps.maxDietTemplates} plantillas alcanzado en{" "}
                  <strong>{currentSaasPlan.name}</strong>.
                </span>
                <button
                  type="button"
                  onClick={() => setTab("saas")}
                  className="shrink-0 rounded-full bg-white px-3 py-1 text-[11px] font-bold text-zinc-950"
                >
                  Mejorar
                </button>
              </div>
            )}
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
            <div>
              <label className="mb-1 block text-xs text-zinc-400">
                Imagen de referencia / platillo (visible para el alumno)
              </label>
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-[#060607] px-3 py-3 text-xs font-medium text-zinc-300 transition hover:border-emerald-500/50 hover:text-white">
                <Upload className="h-4 w-4 text-emerald-400" />
                <span>
                  {uploadingDietImg
                    ? "Subiendo imagen..."
                    : dImageUrl
                    ? "Cambiar imagen adjunta"
                    : "Subir imagen (JPG, PNG, WEBP · máx. 5 MB)"}
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleDietImageUpload}
                  className="hidden"
                />
              </label>
              {dImageUrl && (
                <div className="relative mt-2 overflow-hidden rounded-xl border border-white/10">
                  <img
                    src={dImageUrl}
                    alt="Vista previa de plantilla de dieta"
                    className="h-28 w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setDImageUrl("")}
                    aria-label="Quitar imagen"
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/75 text-white hover:bg-rose-500"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={uploadingDietImg}
              className="w-full rounded-xl bg-emerald-500 py-3 text-xs font-bold text-[#0a0a0a] transition hover:bg-emerald-400 disabled:opacity-50"
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
                <div className="flex min-w-0 items-center gap-3">
                  {plan.image_url ? (
                    <img
                      src={plan.image_url}
                      alt={plan.title}
                      className="h-12 w-12 shrink-0 rounded-lg object-cover ring-1 ring-white/10"
                    />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-zinc-500">
                      <ImageIcon className="h-5 w-5" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-bold text-white">
                      {plan.title}
                    </h3>
                    <p className="text-xs text-zinc-400">
                      {plan.daily_calories} kcal · P:{plan.protein_g}g · C:
                      {plan.carbs_g}g · G:{plan.fats_g}g
                    </p>
                  </div>
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

      {/* Modal: Cambio de Plan (Upgrade con equivalencia de días / Downgrade al cierre de corte) */}
      {changeQuote && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Confirmar cambio de plan"
          onClick={() => setTargetChangeTier(null)}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-3 backdrop-blur-sm sm:items-center sm:p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md space-y-4 rounded-xl border border-white/10 bg-[#0e0f12] p-5 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-400">
                  {changeQuote.mode === "upgrade"
                    ? "Upgrade de Suscripción"
                    : "Downgrade Programado"}
                </p>
                <h2 className="mt-0.5 text-base font-bold text-white">
                  {changeQuote.fromPlan.name} → {changeQuote.toPlan.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setTargetChangeTier(null)}
                aria-label="Cerrar"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-white/[0.06] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {changeQuote.mode === "upgrade" ? (
              <div className="space-y-2.5 rounded-xl border border-emerald-500/25 bg-[#060607] p-4 text-xs">
                <div className="flex items-center justify-between text-zinc-300">
                  <span>Precio de {changeQuote.toPlan.name}</span>
                  <span className="font-semibold tabular-nums text-white">
                    ${changeQuote.toPlan.priceMxn.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN
                  </span>
                </div>
                {changeQuote.creditMxn > 0 && (
                  <div className="flex items-start justify-between gap-2 text-emerald-400">
                    <span>
                      Equivalencia de días restantes ({changeQuote.remainingDays} días × $
                      {changeQuote.dailyRateCurrentMxn.toFixed(2)}/día)
                    </span>
                    <span className="shrink-0 font-semibold tabular-nums">
                      -${changeQuote.creditMxn.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-white/[0.08] pt-2.5 text-sm font-bold">
                  <span className="text-white">Monto neto a pagar hoy</span>
                  <span className="tabular-nums text-emerald-400">
                    ${changeQuote.netPayableTodayMxn.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN
                  </span>
                </div>
                <p className="pt-1 text-[11px] leading-relaxed text-zinc-400">
                  Tu saldo de días no disfrutados del plan actual se descuenta
                  automáticamente (base 30 días). El nuevo plan y ciclo de corte se
                  activan al completar tu pago.
                </p>
              </div>
            ) : (
              <div className="space-y-3 rounded-xl border border-amber-500/25 bg-[#060607] p-4 text-xs">
                <p className="font-semibold text-amber-300">
                  Sin devolución de dinero · Efectivo al término de tu corte
                </p>
                <p className="leading-relaxed text-zinc-300">
                  Conservarás todos los beneficios y límites de{" "}
                  <strong className="text-white">{changeQuote.fromPlan.name}</strong>{" "}
                  hasta el{" "}
                  <strong className="text-white">
                    {new Date(changeQuote.effectiveAtIso).toLocaleDateString("es-MX", {
                      dateStyle: "long",
                    })}
                  </strong>
                  . Al vencer tu corte, se aplicará automáticamente{" "}
                  <strong className="text-white">{changeQuote.toPlan.name}</strong>.
                </p>
                {changeQuote.toPlan.studentLimit !== null &&
                  occupiedSlots > changeQuote.toPlan.studentLimit && (
                    <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 text-[11px] text-rose-200">
                      Aviso: tienes <strong>{occupiedSlots} alumnos activos</strong> y{" "}
                      {changeQuote.toPlan.name} permite hasta{" "}
                      <strong>{changeQuote.toPlan.studentLimit}</strong>. Finaliza el
                      asesoramiento de alumnos excedentes antes de tu corte.
                    </div>
                  )}
                {(() => {
                  const nextCaps = getPlanCapabilities(changeQuote.toPlan.id);
                  if (
                    nextCaps.maxDietTemplates !== null &&
                    dietTemplatesCount > nextCaps.maxDietTemplates
                  ) {
                    return (
                      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-[11px] text-amber-200">
                        Tienes <strong>{dietTemplatesCount} plantillas de dieta</strong> y{" "}
                        {changeQuote.toPlan.name} permite hasta{" "}
                        <strong>{nextCaps.maxDietTemplates}</strong>.
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            )}

            <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-white/[0.08] bg-[#060607] p-3">
              <input
                type="checkbox"
                checked={acceptChangeTerms}
                onChange={(e) => setAcceptChangeTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded accent-emerald-500"
              />
              <span className="text-[11px] leading-relaxed text-zinc-300">
                Acepto las reglas de cambio de plan (equivalencia de días restantes en
                upgrades; sin devoluciones en downgrades con efecto al fin de corte) y los{" "}
                <Link
                  href="/terminos"
                  target="_blank"
                  className="font-semibold text-emerald-400 underline"
                >
                  Términos y Condiciones
                </Link>
                .
              </span>
            </label>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTargetChangeTier(null)}
                className="h-10 flex-1 rounded-xl border border-white/15 text-xs font-semibold text-zinc-300 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!acceptChangeTerms || submittingChange}
                onClick={handleConfirmPlanChange}
                className="h-10 flex-1 rounded-xl bg-emerald-500 px-3 text-xs font-bold text-[#0a0a0a] transition hover:bg-emerald-400 disabled:opacity-40"
              >
                {submittingChange
                  ? "Procesando..."
                  : changeQuote.mode === "upgrade"
                  ? `Continuar ($${changeQuote.netPayableTodayMxn.toLocaleString("es-MX")} MXN)`
                  : "Programar cambio"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Editar Plan del Coach */}
      {editingPlan && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Editar plan"
          onClick={() => setEditingPlan(null)}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-3 backdrop-blur-sm sm:items-center sm:p-4"
        >
          <form
            onSubmit={handleSaveEditPlan}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[88vh] w-full max-w-md flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0e0f12] shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-white">Editar plan</h2>
                <p className="text-[11px] text-zinc-400">
                  Los cambios aplican a nuevas asignaciones sin afectar historial.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingPlan(null)}
                aria-label="Cerrar"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-white/[0.06] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-3.5 overflow-y-auto p-5">
              <div>
                <label className="mb-1 block text-xs text-zinc-300">Nombre *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-[#060607] px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-zinc-300">Descripción</label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-[#060607] p-2.5 text-xs text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-zinc-300">Precio ($)</label>
                  <input
                    type="number"
                    required
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-[#060607] px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-zinc-300">Duración</label>
                  <select
                    value={editDurationDays}
                    onChange={(e) => setEditDurationDays(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-[#060607] px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                  >
                    <option value="7">7 días</option>
                    <option value="15">15 días</option>
                    <option value="30">30 días (Mes)</option>
                    <option value="90">90 días (Trim.)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs text-zinc-300">Modalidad</label>
                <select
                  value={editCoachingMode}
                  onChange={(e) => setEditCoachingMode(e.target.value as CoachingMode)}
                  className="w-full rounded-xl border border-white/15 bg-[#060607] px-3 py-2.5 text-xs text-white outline-none focus:border-emerald-500"
                >
                  <option value="none">Sin sesiones 1:1 (Solo app)</option>
                  <option value="intermittent">Coach Online Intermitente</option>
                  <option value="in_person">Coach Presencial</option>
                </select>
              </div>

              <div className="space-y-2 rounded-xl border border-white/[0.08] bg-[#060607] p-3 text-xs">
                <p className="font-semibold text-zinc-300">Módulos incluidos:</p>
                <label className="flex cursor-pointer items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={editNutrition}
                    onChange={(e) => setEditNutrition(e.target.checked)}
                    className="h-4 w-4 rounded accent-emerald-500"
                  />
                  <span>Plan nutricional</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={editWorkouts}
                    onChange={(e) => setEditWorkouts(e.target.checked)}
                    className="h-4 w-4 rounded accent-emerald-500"
                  />
                  <span>Rutinas guiadas</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={editAssessments}
                    onChange={(e) => setEditAssessments(e.target.checked)}
                    className="h-4 w-4 rounded accent-emerald-500"
                  />
                  <span>Evaluaciones</span>
                </label>
              </div>
            </div>

            <div className="flex gap-2 border-t border-white/[0.08] p-4">
              <button
                type="button"
                onClick={() => setEditingPlan(null)}
                className="h-10 flex-1 rounded-xl border border-white/15 text-xs font-semibold text-zinc-300 transition hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="h-10 flex-1 rounded-xl bg-emerald-500 text-xs font-bold text-[#0a0a0a] transition hover:bg-emerald-400"
              >
                Guardar cambios
              </button>
            </div>
          </form>
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
