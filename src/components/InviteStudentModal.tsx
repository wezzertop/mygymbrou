"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  BellRing,
  Check,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Copy,
  Dumbbell,
  HeartPulse,
  Mail,
  Phone,
  Plus,
  Ruler,
  Send,
  Sparkles,
  UserCheck,
  X,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { canInviteMoreStudents, getSaasPlanById } from "@/lib/saas-plans";
import {
  AVAILABLE_DAYS_OPTIONS,
  computeBmi,
  GYM_EXPERIENCE_OPTIONS,
  INITIAL_GOAL_OPTIONS,
  isPendingInviteStatus,
  SESSION_DURATION_OPTIONS,
} from "@/lib/student-record-constants";
import type { InitialMeasurementsInput } from "@/types/database";

interface InviteStudentModalProps {
  open: boolean;
  onClose: () => void;
}

interface InviteSuccessState {
  email: string;
  link: string;
  mode: string;
  existingUser: boolean;
  status: string;
  message?: string;
}

export function InviteStudentModal({ open, onClose }: InviteStudentModalProps) {
  const {
    students,
    subscriptionPlans,
    coachProfile,
    inviteStudent,
    addAssessment,
    refreshData,
    isDemoMode,
  } = useApp();

  // Nivel A: Datos Básicos
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedGoals, setSelectedGoals] = useState<string[]>([
    "Recomposición corporal",
  ]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>(
    subscriptionPlans[0]?.id || ""
  );

  // Nivel B: Acordeón Expandible (Colapsado por defecto)
  const [showClinicalAccordion, setShowClinicalAccordion] = useState(false);

  // 1. Historial Médico y Salud
  const [hasInjuries, setHasInjuries] = useState(false);
  const [injuriesDetail, setInjuriesDetail] = useState("");
  const [hasChronic, setHasChronic] = useState(false);
  const [chronicDetail, setChronicDetail] = useState("");
  const [takesMeds, setTakesMeds] = useState(false);
  const [medsDetail, setMedsDetail] = useState("");
  const [allergies, setAllergies] = useState("");
  const [supplements, setSupplements] = useState("");

  // 2. Experiencia y Disponibilidad
  const [gymExperience, setGymExperience] = useState<string>("");
  const [daysPerWeek, setDaysPerWeek] = useState<number | undefined>(undefined);
  const [sessionDuration, setSessionDuration] = useState<string>("");

  // 3. Medidas Antropométricas Iniciales (Evaluación #1)
  const [meas, setMeas] = useState({
    weight_kg: "",
    height_cm: "",
    body_fat_percentage: "",
    muscle_mass_kg: "",
    chest_cm: "",
    back_width_cm: "",
    waist_cm: "",
    abdomen_cm: "",
    hip_cm: "",
    bicep_left_cm: "",
    bicep_right_cm: "",
    thigh_left_cm: "",
    thigh_right_cm: "",
    calf_cm: "",
  });
  const [initialCoachNotes, setInitialCoachNotes] = useState("");

  // Submission states
  const [sending, setSending] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [isQuotaError, setIsQuotaError] = useState(false);
  const [inviteResult, setInviteResult] = useState<InviteSuccessState | null>(
    null
  );
  const [copied, setCopied] = useState(false);

  // Sincronizar paquete default cuando cargan los planes del coach
  useEffect(() => {
    if (subscriptionPlans.length > 0 && !selectedPlanId) {
      setSelectedPlanId(subscriptionPlans[0].id);
    }
  }, [subscriptionPlans, selectedPlanId]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const occupiedSlots = useMemo(
    () =>
      students.filter(
        (s) => s.invite_status === "active" || isPendingInviteStatus(s.invite_status)
      ).length,
    [students]
  );

  const currentSaasPlan = getSaasPlanById(coachProfile.saas_plan_tier);
  const quota = canInviteMoreStudents(
    occupiedSlots,
    coachProfile.saas_plan_tier,
    coachProfile.saas_student_limit
  );

  const bmi = useMemo(
    () => computeBmi(meas.weight_kg, meas.height_cm),
    [meas.weight_kg, meas.height_cm]
  );

  const selectedPlan = subscriptionPlans.find((p) => p.id === selectedPlanId);

  const toggleGoal = (goal: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setSelectedGoals(["Recomposición corporal"]);
    setSelectedPlanId(subscriptionPlans[0]?.id || "");
    setShowClinicalAccordion(false);
    setHasInjuries(false);
    setInjuriesDetail("");
    setHasChronic(false);
    setChronicDetail("");
    setTakesMeds(false);
    setMedsDetail("");
    setAllergies("");
    setSupplements("");
    setGymExperience("");
    setDaysPerWeek(undefined);
    setSessionDuration("");
    setMeas({
      weight_kg: "",
      height_cm: "",
      body_fat_percentage: "",
      muscle_mass_kg: "",
      chest_cm: "",
      back_width_cm: "",
      waist_cm: "",
      abdomen_cm: "",
      hip_cm: "",
      bicep_left_cm: "",
      bicep_right_cm: "",
      thigh_left_cm: "",
      thigh_right_cm: "",
      calf_cm: "",
    });
    setInitialCoachNotes("");
    setInviteError(null);
    setIsQuotaError(false);
  };

  const handleClose = () => {
    setInviteResult(null);
    setInviteError(null);
    setIsQuotaError(false);
    onClose();
  };

  const handleCopy = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const num = (v: string): number | undefined => {
    const trimmed = v.trim();
    if (!trimmed) return undefined;
    const parsed = Number(trimmed);
    return Number.isNaN(parsed) ? undefined : parsed;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError(null);
    setIsQuotaError(false);

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || !cleanEmail) {
      setInviteError("Nombre completo y correo electrónico son obligatorios.");
      return;
    }

    // Validación rápida local de duplicado con el mismo coach
    const duplicateLocal = students.find(
      (s) =>
        s.invited_email.toLowerCase() === cleanEmail &&
        (s.invite_status === "active" || isPendingInviteStatus(s.invite_status))
    );
    if (duplicateLocal) {
      setInviteError(
        "Este alumno ya forma parte de tu cartera o tiene una solicitud pendiente contigo."
      );
      return;
    }

    if (!quota.allowed && quota.limit !== null) {
      setIsQuotaError(true);
      setInviteError(
        `Has alcanzado el límite de ${quota.limit} alumnos de tu plan ${currentSaasPlan.name}. Actualiza tu plan en MXN para invitar más alumnos.`
      );
      return;
    }

    const goalsToSave =
      selectedGoals.length > 0 ? selectedGoals : ["Recomposición corporal"];

    const weightNum = num(meas.weight_kg);
    const initialMeasurements: InitialMeasurementsInput | null =
      weightNum && weightNum > 0
        ? {
            assessment_date: new Date().toISOString().split("T")[0],
            weight_kg: weightNum,
            height_cm: num(meas.height_cm),
            body_fat_percentage: num(meas.body_fat_percentage),
            muscle_mass_kg: num(meas.muscle_mass_kg),
            chest_cm: num(meas.chest_cm),
            back_width_cm: num(meas.back_width_cm),
            waist_cm: num(meas.waist_cm),
            abdomen_cm: num(meas.abdomen_cm),
            hip_cm: num(meas.hip_cm),
            bicep_left_cm: num(meas.bicep_left_cm),
            bicep_right_cm: num(meas.bicep_right_cm),
            thigh_left_cm: num(meas.thigh_left_cm),
            thigh_right_cm: num(meas.thigh_right_cm),
            calf_cm: num(meas.calf_cm),
            coach_analysis_notes: initialCoachNotes.trim() || undefined,
          }
        : null;

    const clinicalRecord = {
      has_injuries: hasInjuries,
      injuries_detail: hasInjuries ? injuriesDetail.trim() : undefined,
      has_chronic_conditions: hasChronic,
      chronic_conditions_detail: hasChronic ? chronicDetail.trim() : undefined,
      takes_medications: takesMeds,
      medications_detail: takesMeds ? medsDetail.trim() : undefined,
      allergies: allergies.trim() || undefined,
      current_supplements: supplements.trim() || undefined,
      gym_experience: gymExperience || undefined,
      available_days_per_week: daysPerWeek,
      session_duration_hours: sessionDuration || undefined,
      initial_coach_notes: initialCoachNotes.trim() || undefined,
    };

    const resolvedPlanName = selectedPlan?.name || "Asesoría sin paquete";
    const resolvedPrice = selectedPlan ? selectedPlan.price : 0;
    const resolvedDuration = selectedPlan ? selectedPlan.duration_days : 30;

    setSending(true);

    try {
      if (isDemoMode) {
        const created = inviteStudent({
          name: cleanName,
          email: cleanEmail,
          phone: phone.trim() || undefined,
          planId: selectedPlan?.id,
          planName: resolvedPlanName,
          price: resolvedPrice,
          durationDays: resolvedDuration,
          goals: goalsToSave,
          status: "pending_signup",
          record: clinicalRecord,
          initialMeasurements,
          skipDbInsert: true,
        });

        if (initialMeasurements?.weight_kg) {
          addAssessment(
            {
              student_id: created.id,
              coach_id: coachProfile.id,
              assessment_date:
                initialMeasurements.assessment_date ||
                new Date().toISOString().split("T")[0],
              weight_kg: initialMeasurements.weight_kg,
              height_cm: initialMeasurements.height_cm,
              body_fat_percentage: initialMeasurements.body_fat_percentage,
              muscle_mass_kg: initialMeasurements.muscle_mass_kg,
              chest_cm: initialMeasurements.chest_cm,
              back_width_cm: initialMeasurements.back_width_cm,
              waist_cm: initialMeasurements.waist_cm,
              abdomen_cm: initialMeasurements.abdomen_cm,
              hip_cm: initialMeasurements.hip_cm,
              bicep_left_cm: initialMeasurements.bicep_left_cm,
              bicep_right_cm: initialMeasurements.bicep_right_cm,
              thigh_left_cm: initialMeasurements.thigh_left_cm,
              thigh_right_cm: initialMeasurements.thigh_right_cm,
              calf_cm: initialMeasurements.calf_cm,
              goal_tag: goalsToSave[0],
              coach_analysis_notes:
                initialCoachNotes.trim() ||
                "Evaluación antropométrica inicial #1",
              progress_photos: [],
            },
            false
          );
        }

        const link = `${window.location.origin}/auth/activate?token=${created.invite_token}&email=${encodeURIComponent(
          cleanEmail
        )}&name=${encodeURIComponent(cleanName)}`;

        setInviteResult({
          email: cleanEmail,
          link,
          mode: "demo",
          existingUser: false,
          status: "pending_signup",
          message:
            "Invitación creada con su expediente inicial pre-vinculado. Comparte el enlace para activar la cuenta.",
        });
        resetForm();
        return;
      }

      // Producción Supabase: el endpoint maneja detección dual, RLS, cupos y notificaciones in-app
      const res = await fetch("/api/students/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cleanName,
          email: cleanEmail,
          phone: phone.trim() || undefined,
          coachId: coachProfile.id,
          planId: selectedPlan?.id || null,
          planName: resolvedPlanName,
          price: resolvedPrice,
          durationDays: resolvedDuration,
          goals: goalsToSave,
          record: clinicalRecord,
          initialMeasurements,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setIsQuotaError(data.code === "QUOTA_EXCEEDED");
        setInviteError(data.error || "No se pudo procesar la invitación.");
        return;
      }

      await refreshData();
      setInviteResult({
        email: cleanEmail,
        link: data.activationLink,
        mode: data.mode || "supabase",
        existingUser: Boolean(data.existingUser),
        status: data.status || "pending_signup",
        message: data.message,
      });
      resetForm();
    } catch {
      setInviteError("Error de conexión al enviar la invitación.");
    } finally {
      setSending(false);
    }
  };

  if (!open) return null;

  const filledClinicalCount = [
    hasInjuries,
    hasChronic,
    takesMeds,
    Boolean(allergies.trim()),
    Boolean(supplements.trim()),
    Boolean(gymExperience),
    Boolean(daysPerWeek),
    Boolean(sessionDuration),
    Boolean(meas.weight_kg.trim()),
  ].filter(Boolean).length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Invitar Alumno"
      onClick={handleClose}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-2 backdrop-blur-sm sm:items-center sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0e0f12] shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
          <div>
            <h2 className="text-base font-extrabold text-white sm:text-lg">
              Invitar Alumno
            </h2>
            <p className="mt-0.5 text-[11px] text-zinc-400">
              Detección inteligente: usuario nuevo o cuenta existente en MiGymBrou.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Cerrar modal"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-white/[0.06] hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto px-5 py-4">
          {inviteResult ? (
            <div className="space-y-4">
              <div
                className={`rounded-xl border p-4 text-xs ${
                  inviteResult.existingUser
                    ? "border-[#00FF90]/40 bg-[#00FF90]/10 text-emerald-100"
                    : "border-emerald-500/35 bg-emerald-500/10 text-emerald-200"
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-[#00FF90]">
                  {inviteResult.existingUser ? (
                    <>
                      <BellRing className="h-4 w-4 shrink-0" />
                      <span>
                        Usuario existente detectado · Solicitud enviada a{" "}
                        {inviteResult.email}
                      </span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-4 w-4 shrink-0" />
                      <span>¡Invitación enviada a {inviteResult.email}!</span>
                    </>
                  )}
                </div>
                <p className="mt-1.5 leading-relaxed text-zinc-200">
                  {inviteResult.message ||
                    "Cuando el alumno abra su correo y confirme su cuenta quedará vinculado automáticamente con su expediente inicial."}
                </p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  <span className="rounded-full bg-black/40 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-300">
                    {inviteResult.existingUser
                      ? "Estado: Esperando aceptación in-app"
                      : "Estado: Pendiente de registro"}
                  </span>
                  <span className="rounded-full bg-black/40 px-2.5 py-0.5 text-[10px] font-semibold text-zinc-300">
                    Expediente aislado listo
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-zinc-400">
                  {inviteResult.existingUser
                    ? "Enlace directo opcional (también le llegó notificación en su campana):"
                    : "Enlace personal de activación (también enviado por correo):"}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={inviteResult.link}
                    className="w-full rounded-xl border border-white/15 bg-[#060607] px-3 py-2 text-xs text-emerald-300"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopy(inviteResult.link)}
                    aria-label="Copiar enlace"
                    className="rounded-xl border border-white/15 bg-white/[0.06] p-2 text-zinc-200 hover:bg-white/[0.12]"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-[#00FF90]" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleCopy(inviteResult.link)}
                  className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#00FF90] px-4 text-xs font-bold text-zinc-950 transition hover:bg-[#48b73d]"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      ¡Enlace copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copiar enlace
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="h-11 rounded-xl border border-white/15 bg-white/[0.06] px-5 text-xs font-semibold text-white hover:bg-white/[0.12]"
                >
                  Listo
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {inviteError && (
                <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-300">
                  <p>{inviteError}</p>
                  {isQuotaError && (
                    <Link
                      href="/coach/plans?tab=saas&reason=students"
                      onClick={handleClose}
                      className="mt-1.5 inline-block font-bold text-[#00FF90] underline"
                    >
                      Ver planes disponibles en MXN →
                    </Link>
                  )}
                </div>
              )}

              {/* NIVEL A: Datos Básicos de Invitación */}
              <div className="space-y-3.5">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-semibold text-zinc-300">
                      Nombre completo del alumno *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ej. Daniel Miranda"
                      className="w-full rounded-xl border border-white/15 bg-[#060607] px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-[#00FF90]/60"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-zinc-300">
                      Correo electrónico *
                    </label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="alumno@correo.com"
                        className="w-full rounded-xl border border-white/15 bg-[#060607] py-2.5 pl-9 pr-3 text-sm text-white outline-none transition focus:border-[#00FF90]/60"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-zinc-300">
                      Teléfono / WhatsApp{" "}
                      <span className="font-normal text-zinc-500">
                        (opcional)
                      </span>
                    </label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+52 55 0000 0000"
                        className="w-full rounded-xl border border-white/15 bg-[#060607] py-2.5 pl-9 pr-3 text-sm text-white outline-none transition focus:border-[#00FF90]/60"
                      />
                    </div>
                  </div>
                </div>

                {/* Objetivos Iniciales Multi-Select Chips */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="text-xs font-semibold text-zinc-300">
                      Objetivos iniciales
                    </label>
                    <span className="text-[10px] text-zinc-500">
                      Selecciona uno o varios ({selectedGoals.length})
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {INITIAL_GOAL_OPTIONS.map((goalOpt) => {
                      const active = selectedGoals.includes(goalOpt);
                      return (
                        <button
                          key={goalOpt}
                          type="button"
                          onClick={() => toggleGoal(goalOpt)}
                          className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
                            active
                              ? "border-[#00FF90]/70 bg-[#00FF90]/15 text-[#00FF90]"
                              : "border-white/10 bg-[#060607] text-zinc-400 hover:border-white/25 hover:text-zinc-200"
                          }`}
                        >
                          {active && <Check className="h-3 w-3 shrink-0" />}
                          {goalOpt}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Paquete / Plan de Asesoría del Coach */}
                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-300">
                    Paquete / Plan de Asesoría
                  </label>
                  <select
                    value={selectedPlanId}
                    onChange={(e) => setSelectedPlanId(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-[#060607] px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-[#00FF90]/60"
                  >
                    {subscriptionPlans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — ${p.price} MXN ({p.duration_days} días)
                      </option>
                    ))}
                    <option value="">Asesoría sin paquete asignado</option>
                  </select>
                  {selectedPlan && (
                    <p className="mt-1 text-[11px] text-zinc-500">
                      Incluye:{" "}
                      {[
                        selectedPlan.includes_workouts && "Rutinas",
                        selectedPlan.includes_nutrition && "Nutrición",
                        selectedPlan.includes_assessments && "Evaluaciones",
                      ]
                        .filter(Boolean)
                        .join(" · ") || "Seguimiento personalizado"}
                    </p>
                  )}
                </div>
              </div>

              {/* NIVEL B: Acordeón Expandible (Opcional) */}
              <div className="overflow-hidden rounded-xl border border-white/10 bg-[#08090c]">
                <button
                  type="button"
                  onClick={() => setShowClinicalAccordion((s) => !s)}
                  className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left transition hover:bg-white/[0.03]"
                >
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#00FF90]/15 text-[#00FF90]">
                      <Plus className="h-3.5 w-3.5" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-white">
                        Agregar ficha clínica, experiencia y medidas iniciales
                      </p>
                      <p className="text-[10px] text-zinc-400">
                        Opcional · Puedes capturarlo en consulta o después en el expediente
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {filledClinicalCount > 0 && (
                      <span className="rounded-full bg-[#00FF90]/20 px-2 py-0.5 text-[10px] font-bold text-[#00FF90]">
                        {filledClinicalCount} dato(s)
                      </span>
                    )}
                    {showClinicalAccordion ? (
                      <ChevronUp className="h-4 w-4 text-zinc-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-zinc-400" />
                    )}
                  </div>
                </button>

                {showClinicalAccordion && (
                  <div className="space-y-5 border-t border-white/[0.08] p-4">
                    {/* 1. Historial Médico y Salud */}
                    <div className="space-y-3">
                      <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#00FF90]">
                        <HeartPulse className="h-3.5 w-3.5" />
                        1. Historial Médico y Salud
                      </p>

                      {/* Lesiones */}
                      <div className="space-y-1.5 rounded-xl border border-white/[0.06] bg-[#0e0f12] p-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-medium text-zinc-200">
                            ¿Lesiones previas o actuales?
                          </span>
                          <div className="flex gap-1.5">
                            {[false, true].map((val) => (
                              <button
                                key={String(val)}
                                type="button"
                                onClick={() => setHasInjuries(val)}
                                className={`rounded-lg px-3 py-1 text-[11px] font-bold transition ${
                                  hasInjuries === val
                                    ? val
                                      ? "bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/50"
                                      : "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/50"
                                    : "bg-white/[0.04] text-zinc-500"
                                }`}
                              >
                                {val ? "Sí" : "No"}
                              </button>
                            ))}
                          </div>
                        </div>
                        {hasInjuries && (
                          <input
                            type="text"
                            value={injuriesDetail}
                            onChange={(e) => setInjuriesDetail(e.target.value)}
                            placeholder="Ej. Molestia lumbar L4-L5, esguince tobillo der..."
                            className="w-full rounded-lg border border-white/10 bg-[#060607] px-3 py-2 text-xs text-white outline-none focus:border-amber-400/60"
                          />
                        )}
                      </div>

                      {/* Enfermedades crónicas */}
                      <div className="space-y-1.5 rounded-xl border border-white/[0.06] bg-[#0e0f12] p-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-medium text-zinc-200">
                            ¿Enfermedades crónicas o condiciones médicas?
                          </span>
                          <div className="flex gap-1.5">
                            {[false, true].map((val) => (
                              <button
                                key={String(val)}
                                type="button"
                                onClick={() => setHasChronic(val)}
                                className={`rounded-lg px-3 py-1 text-[11px] font-bold transition ${
                                  hasChronic === val
                                    ? val
                                      ? "bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/50"
                                      : "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/50"
                                    : "bg-white/[0.04] text-zinc-500"
                                }`}
                              >
                                {val ? "Sí" : "No"}
                              </button>
                            ))}
                          </div>
                        </div>
                        {hasChronic && (
                          <input
                            type="text"
                            value={chronicDetail}
                            onChange={(e) => setChronicDetail(e.target.value)}
                            placeholder="Ej. Hipertensión controlada, asma, resistencia a la insulina..."
                            className="w-full rounded-lg border border-white/10 bg-[#060607] px-3 py-2 text-xs text-white outline-none focus:border-amber-400/60"
                          />
                        )}
                      </div>

                      {/* Medicamentos */}
                      <div className="space-y-1.5 rounded-xl border border-white/[0.06] bg-[#0e0f12] p-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-medium text-zinc-200">
                            ¿Toma medicamentos actualmente?
                          </span>
                          <div className="flex gap-1.5">
                            {[false, true].map((val) => (
                              <button
                                key={String(val)}
                                type="button"
                                onClick={() => setTakesMeds(val)}
                                className={`rounded-lg px-3 py-1 text-[11px] font-bold transition ${
                                  takesMeds === val
                                    ? val
                                      ? "bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/50"
                                      : "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/50"
                                    : "bg-white/[0.04] text-zinc-500"
                                }`}
                              >
                                {val ? "Sí" : "No"}
                              </button>
                            ))}
                          </div>
                        </div>
                        {takesMeds && (
                          <input
                            type="text"
                            value={medsDetail}
                            onChange={(e) => setMedsDetail(e.target.value)}
                            placeholder="Indica qué medicamentos y dosis..."
                            className="w-full rounded-lg border border-white/10 bg-[#060607] px-3 py-2 text-xs text-white outline-none focus:border-amber-400/60"
                          />
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-[11px] font-medium text-zinc-400">
                            Alergias o intolerancias alimentarias
                          </label>
                          <input
                            type="text"
                            value={allergies}
                            onChange={(e) => setAllergies(e.target.value)}
                            placeholder="Ej. Lactosa, cacahuate, mariscos..."
                            className="w-full rounded-xl border border-white/10 bg-[#060607] px-3 py-2 text-xs text-white outline-none focus:border-[#00FF90]/50"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-[11px] font-medium text-zinc-400">
                            Suplementación actual
                          </label>
                          <input
                            type="text"
                            value={supplements}
                            onChange={(e) => setSupplements(e.target.value)}
                            placeholder="Ej. Creatina, whey, omega-3..."
                            className="w-full rounded-xl border border-white/10 bg-[#060607] px-3 py-2 text-xs text-white outline-none focus:border-[#00FF90]/50"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 2. Experiencia y Disponibilidad */}
                    <div className="space-y-3 border-t border-white/[0.06] pt-4">
                      <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#00FF90]">
                        <Dumbbell className="h-3.5 w-3.5" />
                        2. Experiencia y Disponibilidad
                      </p>

                      <div>
                        <label className="mb-1.5 block text-[11px] font-medium text-zinc-400">
                          Tiempo entrenando en gimnasio
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {GYM_EXPERIENCE_OPTIONS.map((exp) => (
                            <button
                              key={exp}
                              type="button"
                              onClick={() =>
                                setGymExperience((prev) =>
                                  prev === exp ? "" : exp
                                )
                              }
                              className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition ${
                                gymExperience === exp
                                  ? "border-[#00FF90]/70 bg-[#00FF90]/15 text-[#00FF90]"
                                  : "border-white/10 bg-[#060607] text-zinc-400 hover:text-white"
                              }`}
                            >
                              {exp}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <label className="mb-1.5 block text-[11px] font-medium text-zinc-400">
                            Días disponibles por semana
                          </label>
                          <div className="flex gap-1.5">
                            {AVAILABLE_DAYS_OPTIONS.map((d) => (
                              <button
                                key={d}
                                type="button"
                                onClick={() =>
                                  setDaysPerWeek((prev) =>
                                    prev === d ? undefined : d
                                  )
                                }
                                className={`flex h-9 w-9 items-center justify-center rounded-lg border text-xs font-bold transition ${
                                  daysPerWeek === d
                                    ? "border-[#00FF90] bg-[#00FF90] text-zinc-950"
                                    : "border-white/10 bg-[#060607] text-zinc-300 hover:border-white/25"
                                }`}
                              >
                                {d}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="mb-1.5 block text-[11px] font-medium text-zinc-400">
                            Tiempo disponible por sesión
                          </label>
                          <div className="grid grid-cols-2 gap-1.5">
                            {SESSION_DURATION_OPTIONS.map((dur) => (
                              <button
                                key={dur}
                                type="button"
                                onClick={() =>
                                  setSessionDuration((prev) =>
                                    prev === dur ? "" : dur
                                  )
                                }
                                className={`rounded-lg border px-2.5 py-2 text-[11px] font-semibold transition ${
                                  sessionDuration === dur
                                    ? "border-[#00FF90]/70 bg-[#00FF90]/15 text-[#00FF90]"
                                    : "border-white/10 bg-[#060607] text-zinc-400 hover:text-white"
                                }`}
                              >
                                {dur}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 3. Toma de Medidas Antropométricas Iniciales */}
                    <div className="space-y-3 border-t border-white/[0.06] pt-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#00FF90]">
                          <Ruler className="h-3.5 w-3.5" />
                          3. Medidas Antropométricas Iniciales (Evaluación #1)
                        </p>
                        {bmi && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-[#060607] px-2.5 py-0.5 text-[10px] font-bold">
                            <Activity className="h-3 w-3 text-[#00FF90]" />
                            IMC {bmi.value}{" "}
                            <span className={bmi.tone}>({bmi.label})</span>
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                        {[
                          { key: "weight_kg", label: "Peso (kg)", ph: "72.5" },
                          { key: "height_cm", label: "Estatura (cm)", ph: "174" },
                          { key: "body_fat_percentage", label: "% Grasa", ph: "18.5" },
                          { key: "muscle_mass_kg", label: "Músculo (kg)", ph: "34.0" },
                        ].map((f) => (
                          <div key={f.key}>
                            <label className="mb-1 block text-[10px] font-medium text-zinc-400">
                              {f.label}
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              value={meas[f.key as keyof typeof meas]}
                              onChange={(e) =>
                                setMeas((prev) => ({
                                  ...prev,
                                  [f.key]: e.target.value,
                                }))
                              }
                              placeholder={f.ph}
                              className="w-full rounded-lg border border-white/10 bg-[#060607] px-2.5 py-2 text-xs text-white outline-none focus:border-[#00FF90]/50"
                            />
                          </div>
                        ))}
                      </div>

                      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                        Perímetros (cm)
                      </p>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {[
                          { key: "chest_cm", label: "Pecho / Tórax" },
                          { key: "back_width_cm", label: "Espalda" },
                          { key: "waist_cm", label: "Cintura" },
                          { key: "abdomen_cm", label: "Abdomen" },
                          { key: "hip_cm", label: "Cadera / Glúteo" },
                          { key: "bicep_left_cm", label: "Brazo Izq." },
                          { key: "bicep_right_cm", label: "Brazo Der." },
                          { key: "thigh_left_cm", label: "Muslo Izq." },
                          { key: "thigh_right_cm", label: "Muslo Der." },
                          { key: "calf_cm", label: "Pantorrilla" },
                        ].map((f) => (
                          <div key={f.key}>
                            <label className="mb-0.5 block text-[10px] text-zinc-400">
                              {f.label}
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              value={meas[f.key as keyof typeof meas]}
                              onChange={(e) =>
                                setMeas((prev) => ({
                                  ...prev,
                                  [f.key]: e.target.value,
                                }))
                              }
                              placeholder="cm"
                              className="w-full rounded-lg border border-white/10 bg-[#060607] px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#00FF90]/50"
                            />
                          </div>
                        ))}
                      </div>

                      <div>
                        <label className="mb-1 flex items-center gap-1 text-[11px] font-medium text-zinc-400">
                          <ClipboardList className="h-3 w-3 text-[#00FF90]" />
                          Notas iniciales del Coach
                        </label>
                        <textarea
                          rows={2}
                          value={initialCoachNotes}
                          onChange={(e) => setInitialCoachNotes(e.target.value)}
                          placeholder="Observaciones posturales, preferencias de entrenamiento o notas de consulta..."
                          className="w-full rounded-xl border border-white/10 bg-[#060607] px-3 py-2 text-xs text-white outline-none focus:border-[#00FF90]/50"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="flex items-center gap-1 text-[11px] text-zinc-500">
                  <Sparkles className="h-3.5 w-3.5 text-[#00FF90]" />
                  Expediente aislado multi-tenant
                </span>
                <button
                  type="submit"
                  disabled={sending}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#00FF90] px-6 text-xs font-extrabold text-zinc-950 transition hover:bg-[#48b73d] disabled:opacity-60"
                >
                  <Send className="h-4 w-4" />
                  {sending ? "Procesando..." : "Enviar Invitación"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
