"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  CreditCard,
  Dumbbell,
  Eye,
  FileDown,
  Plus,
  Save,
  Share2,
  ShieldCheck,
  Target,
  UserMinus,
  Utensils,
  X,
  XCircle,
} from "lucide-react";
import { getDaysRemaining, useApp } from "@/context/AppContext";
import { ProgressCharts } from "@/components/ProgressCharts";
import { SubscriptionStatus } from "@/types/database";
import {
  VerificationStatusPill,
  VerifiedPersonBadge,
} from "@/components/VerificationBadge";
import {
  buildFriendlyShareSummary,
  exportStudentPdf,
  PdfExportSection,
} from "@/lib/pdf-export";

type TabKey = "assessment" | "workout" | "diet" | "subscription";

function DeltaBadge({
  current,
  previous,
  unit,
  lowerIsBetter = false,
}: {
  current?: number;
  previous?: number;
  unit: string;
  lowerIsBetter?: boolean;
}) {
  if (current === undefined || previous === undefined) return null;
  const diff = Number((current - previous).toFixed(1));
  if (diff === 0)
    return <span className="text-[11px] text-zinc-400">Sin cambio</span>;

  const isPositive = lowerIsBetter ? diff < 0 : diff > 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[11px] font-bold ${
        isPositive ? "text-emerald-400" : "text-amber-400"
      }`}
    >
      {diff > 0 ? (
        <ArrowUpRight className="h-3 w-3" />
      ) : (
        <ArrowDownRight className="h-3 w-3" />
      )}
      {diff > 0 ? `+${diff}` : diff} {unit}
    </span>
  );
}

export default function Student360Page() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const studentId = params.id;

  const {
    coachProfile,
    students,
    studentGoals,
    subscriptionPlans,
    assessments,
    appointments,
    workouts,
    nutritionPlans,
    addAssessment,
    assignWorkoutToStudent,
    assignNutritionToStudent,
    assignSubscriptionPlanToStudent,
    updateStudentSubscription,
    endStudentCoaching,
    reviewStudentVerification,
  } = useApp();

  const [showIdPreview, setShowIdPreview] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [endModalOpen, setEndModalOpen] = useState(false);
  const [endReason, setEndReason] = useState("");

  const initialTab = (searchParams.get("tab") as TabKey) || "assessment";
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [showNewForm, setShowNewForm] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const student = students.find(
    (s) => s.student_id === studentId || s.id === studentId
  );

  const studentGoal = studentGoals.find((g) => g.student_id === studentId);
  const daysRemaining = getDaysRemaining(
    student?.expires_at || student?.next_billing_date
  );
  const [selectedPlanId, setSelectedPlanId] = useState(
    student?.plan_id || subscriptionPlans[2]?.id || ""
  );
  const [planStartDate, setPlanStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const studentAssessments = useMemo(
    () =>
      assessments
        .filter((a) => a.student_id === studentId)
        .sort((a, b) => b.assessment_date.localeCompare(a.assessment_date)),
    [assessments, studentId]
  );

  const latest = studentAssessments[0];
  const previous = studentAssessments[1];

  const activeWorkout = workouts.find(
    (w) => w.student_id === studentId && w.is_active
  );
  const workoutTemplates = workouts.filter((w) => w.is_template);

  const activeDiet = nutritionPlans.find(
    (n) => n.student_id === studentId && n.is_active
  );
  const dietTemplates = nutritionPlans.filter((n) => n.is_template);
  const studentAppointments = useMemo(
    () => appointments.filter((a) => a.student_id === studentId),
    [appointments, studentId]
  );

  const handleExportPdf = (section: PdfExportSection) => {
    if (!student) return;
    exportStudentPdf({
      section,
      coach: coachProfile,
      student,
      workout: activeWorkout,
      diet: activeDiet,
      assessments: studentAssessments,
      appointments: studentAppointments,
    });
    setExportModalOpen(false);
    showToast("Documento PDF listo para guardar o compartir.");
  };

  const handleShareFriendly = async (viaWhatsApp = false) => {
    if (!student) return;
    const text = buildFriendlyShareSummary({
      section: "full",
      coach: coachProfile,
      student,
      workout: activeWorkout,
      diet: activeDiet,
      assessments: studentAssessments,
      appointments: studentAppointments,
    });
    if (viaWhatsApp) {
      window.open(
        `https://wa.me/?text=${encodeURIComponent(text)}`,
        "_blank",
        "noopener,noreferrer"
      );
      return;
    }
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `Resumen de ${student.invited_name} — MiGymBrou`,
          text,
        });
        return;
      } catch {
        // user cancelled or fallback to clipboard
      }
    }
    navigator.clipboard?.writeText(text);
    showToast("Resumen copiado. Ya puedes pegarlo y enviarlo a tu alumno.");
  };

  // Assessment form state
  const [form, setForm] = useState({
    assessment_date: new Date().toISOString().split("T")[0],
    weight_kg: latest?.weight_kg?.toString() || "62.0",
    height_cm: latest?.height_cm?.toString() || "165",
    body_fat_percentage: latest?.body_fat_percentage?.toString() || "",
    muscle_mass_kg: latest?.muscle_mass_kg?.toString() || "",
    chest_cm: latest?.chest_cm?.toString() || "",
    back_width_cm: latest?.back_width_cm?.toString() || "",
    waist_cm: latest?.waist_cm?.toString() || "",
    abdomen_cm: latest?.abdomen_cm?.toString() || "",
    hip_cm: latest?.hip_cm?.toString() || "",
    bicep_left_cm: latest?.bicep_left_cm?.toString() || "",
    bicep_right_cm: latest?.bicep_right_cm?.toString() || "",
    thigh_left_cm: latest?.thigh_left_cm?.toString() || "",
    thigh_right_cm: latest?.thigh_right_cm?.toString() || "",
    calf_cm: latest?.calf_cm?.toString() || "",
    goal_tag: latest?.goal_tag || "Recomposición",
    coach_analysis_notes: "",
  });

  // Subscription edit state
  const [subPlan, setSubPlan] = useState(
    student?.subscription_plan_name || "Plan Transformación 360°"
  );
  const [subPrice, setSubPrice] = useState(
    String(student?.subscription_price || 1200)
  );
  const [subStatus, setSubStatus] = useState<SubscriptionStatus>(
    student?.subscription_status || "active"
  );
  const [subDate, setSubDate] = useState(
    student?.next_billing_date || "2026-12-15"
  );

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  if (!student) {
    return (
      <div className="space-y-4 py-10 text-center">
        <p className="text-zinc-400">No encontramos este expediente.</p>
        <Link
          href="/coach/students"
          className="inline-block rounded-xl bg-white text-zinc-950 px-4 py-2 text-xs font-bold text-zinc-950"
        >
          Volver a Alumnos
        </Link>
      </div>
    );
  }

  const num = (v: string) => (v.trim() === "" ? undefined : Number(v));

  const handleSaveAssessment = (e: React.FormEvent) => {
    e.preventDefault();
    addAssessment({
      student_id: studentId,
      coach_id: coachProfile.id,
      assessment_date: form.assessment_date,
      weight_kg: Number(form.weight_kg) || 60,
      height_cm: num(form.height_cm),
      body_fat_percentage: num(form.body_fat_percentage),
      muscle_mass_kg: num(form.muscle_mass_kg),
      chest_cm: num(form.chest_cm),
      back_width_cm: num(form.back_width_cm),
      waist_cm: num(form.waist_cm),
      abdomen_cm: num(form.abdomen_cm),
      hip_cm: num(form.hip_cm),
      bicep_left_cm: num(form.bicep_left_cm),
      bicep_right_cm: num(form.bicep_right_cm),
      thigh_left_cm: num(form.thigh_left_cm),
      thigh_right_cm: num(form.thigh_right_cm),
      calf_cm: num(form.calf_cm),
      goal_tag: form.goal_tag,
      coach_analysis_notes:
        form.coach_analysis_notes ||
        "Evaluación registrada con progreso constante.",
      progress_photos: [],
    });
    setShowNewForm(false);
    setForm((prev) => ({ ...prev, coach_analysis_notes: "" }));
    showToast("Evaluación guardada y notificación enviada al alumno.");
  };

  const handleSaveSubscription = (e: React.FormEvent) => {
    e.preventDefault();
    updateStudentSubscription(student.id, {
      subscription_plan_name: subPlan,
      subscription_price: Number(subPrice) || 0,
      subscription_status: subStatus,
      next_billing_date: subDate,
    });
    showToast("Suscripción actualizada correctamente.");
  };

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div className="space-y-4">
        <Link
          href="/coach/students"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Mis Alumnos
        </Link>

        <div className="flex flex-col justify-between gap-4 rounded-xl border border-white/[0.08] bg-[#0e0f12] p-4 sm:flex-row sm:items-center sm:p-5">
          <div className="flex min-w-0 items-center gap-3.5 sm:gap-4">
            {student.avatar_url ? (
              <img
                src={student.avatar_url}
                alt={student.invited_name}
                className="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-cyan-500/50"
              />
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-lg font-bold text-emerald-400">
                {student.invited_name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-xl font-extrabold text-white">
                  {student.invited_name}
                </h1>
                <VerifiedPersonBadge verified={student.is_verified_identity} />
                {!student.is_verified_identity && (
                  <VerificationStatusPill
                    status={student.verification_status || "unverified"}
                  />
                )}
              </div>
              <p className="truncate text-xs text-zinc-400">{student.invited_email}</p>
              <span className="mt-1 inline-block rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
                {student.fitness_goal || "Plan Personalizado"}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setExportModalOpen(true)}
              className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl border border-emerald-500/35 bg-emerald-500/15 px-3.5 py-2.5 text-xs font-bold text-emerald-300 transition hover:bg-emerald-500 hover:text-[#0a0a0a] active:scale-[0.98]"
            >
              <FileDown className="h-4 w-4" />
              Exportar PDF
            </button>
            <Link
              href={`/coach/agenda?student=${studentId}`}
              className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl border border-white/15 bg-[#060607] px-4 py-2.5 text-xs font-bold text-zinc-200 transition hover:border-white/25 hover:text-white active:scale-[0.98]"
            >
              <Calendar className="h-4 w-4 text-emerald-400" />
              Agendar Cita
            </Link>
            <button
              type="button"
              onClick={() => {
                setActiveTab("assessment");
                setShowNewForm(true);
              }}
              className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-zinc-950 transition hover:bg-zinc-200 active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              Nueva Medición
            </button>
            {student.invite_status !== "finalizado" &&
              student.invite_status !== "inactive" && (
                <button
                  type="button"
                  onClick={() => {
                    setEndReason("");
                    setEndModalOpen(true);
                  }}
                  className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20"
                >
                  <UserMinus className="h-4 w-4" />
                  Finalizar
                </button>
              )}
          </div>
        </div>

        {/* Export PDF & Friendly Share Modal */}
        {exportModalOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Exportar PDF del alumno"
            onClick={() => setExportModalOpen(false)}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-3 backdrop-blur-sm sm:items-center sm:p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md space-y-4 rounded-xl border border-white/10 bg-[#0e0f12] p-5 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-white">
                    Exportar y compartir PDF
                  </h2>
                  <p className="mt-0.5 text-xs text-zinc-400">
                    Genera documentos profesionales de{" "}
                    <strong className="text-white">{student.invited_name}</strong>{" "}
                    con tu marca de Coach.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setExportModalOpen(false)}
                  aria-label="Cerrar"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-white/[0.06] hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleExportPdf("full")}
                  className="flex w-full items-center justify-between rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-left transition hover:bg-emerald-500/20"
                >
                  <div>
                    <p className="text-xs font-bold text-emerald-300">
                      Expediente Completo 360° (PDF)
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      Progreso, rutina, dieta y citas en un solo reporte
                    </p>
                  </div>
                  <FileDown className="h-4 w-4 shrink-0 text-emerald-400" />
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleExportPdf("workout")}
                    className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#060607] px-3 py-2.5 text-left text-xs font-semibold text-zinc-200 transition hover:border-emerald-500/40 hover:text-white"
                  >
                    <Dumbbell className="h-4 w-4 shrink-0 text-emerald-400" />
                    Solo Rutina
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExportPdf("diet")}
                    className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#060607] px-3 py-2.5 text-left text-xs font-semibold text-zinc-200 transition hover:border-emerald-500/40 hover:text-white"
                  >
                    <Utensils className="h-4 w-4 shrink-0 text-emerald-400" />
                    Solo Dieta
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExportPdf("progress")}
                    className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#060607] px-3 py-2.5 text-left text-xs font-semibold text-zinc-200 transition hover:border-emerald-500/40 hover:text-white"
                  >
                    <Activity className="h-4 w-4 shrink-0 text-emerald-400" />
                    Solo Progreso
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExportPdf("appointments")}
                    className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#060607] px-3 py-2.5 text-left text-xs font-semibold text-zinc-200 transition hover:border-emerald-500/40 hover:text-white"
                  >
                    <Calendar className="h-4 w-4 shrink-0 text-emerald-400" />
                    Solo Citas
                  </button>
                </div>
              </div>

              <div className="border-t border-white/[0.08] pt-3">
                <p className="mb-2 text-[11px] font-medium text-zinc-400">
                  Compartir resumen rápido con el alumno:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleShareFriendly(true)}
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-emerald-500 text-xs font-bold text-[#0a0a0a] transition hover:bg-emerald-400"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    WhatsApp
                  </button>
                  <button
                    type="button"
                    onClick={() => handleShareFriendly(false)}
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.04] text-xs font-semibold text-zinc-200 transition hover:border-white/30 hover:text-white"
                  >
                    <Share2 className="h-3.5 w-3.5 text-emerald-400" />
                    Compartir / Copiar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Confirm End Coaching Modal */}
        {endModalOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Finalizar asesoramiento"
            onClick={() => setEndModalOpen(false)}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-3 backdrop-blur-sm sm:items-center sm:p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md space-y-4 rounded-xl border border-white/10 bg-[#0e0f12] p-5 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-white">
                    Finalizar asesoramiento
                  </h2>
                  <p className="mt-1 text-xs text-zinc-400">
                    Se cerrará el seguimiento activo con{" "}
                    <strong className="text-white">{student.invited_name}</strong>.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEndModalOpen(false)}
                  aria-label="Cerrar"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-white/[0.06] hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-3 text-xs text-zinc-300">
                <p>
                  • <strong className="text-emerald-400">Libera 1 cupo</strong> en tu
                  plan inmediatamente.
                </p>
                <p>
                  • <strong className="text-white">Historial íntegro:</strong> el alumno
                  conserva todas sus medidas, evaluaciones y registros en su cuenta.
                </p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-300">
                  Motivo (opcional)
                </label>
                <input
                  type="text"
                  value={endReason}
                  onChange={(e) => setEndReason(e.target.value)}
                  placeholder="Ej. Concluyó su objetivo, pausa temporal..."
                  className="w-full rounded-xl border border-white/15 bg-[#060607] px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEndModalOpen(false)}
                  className="h-10 flex-1 rounded-xl border border-white/15 text-xs font-semibold text-zinc-300 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    endStudentCoaching(student.id, endReason);
                    setEndModalOpen(false);
                    showToast(
                      "Asesoramiento finalizado. Se liberó 1 cupo en tu plan."
                    );
                  }}
                  className="h-10 flex-1 rounded-xl bg-rose-500 text-xs font-bold text-white hover:bg-rose-400"
                >
                  Confirmar baja
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Identity Verification Review Panel for Coach */}
        {(student.verification_status === "pending" ||
          student.identity_document_url) && (
          <div className="rounded-xl border border-white/[0.08] bg-[#0e0f12] p-4">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div className="space-y-1">
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-400">
                  <ShieldCheck className="h-4 w-4" />
                  Validación de Persona Real
                </p>
                <p className="text-xs text-zinc-300">
                  {student.is_verified_identity
                    ? `Identidad confirmada${
                        student.verified_at
                          ? ` el ${new Date(student.verified_at).toLocaleDateString("es-MX")}`
                          : ""
                      }. El alumno cuenta con su marca de persona real verificada.`
                    : "Este alumno subió su documento de identidad y espera tu aprobación para obtener su insignia de persona real verificada."}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {student.identity_document_url && (
                  <button
                    type="button"
                    onClick={() => setShowIdPreview((v) => !v)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-[#060607] px-3 py-2 text-xs font-semibold text-zinc-200 transition hover:border-sky-500/50 hover:text-white"
                  >
                    <Eye className="h-3.5 w-3.5 text-sky-400" />
                    {showIdPreview ? "Ocultar Documento" : "Ver Documento ID"}
                  </button>
                )}

                {!student.is_verified_identity && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        reviewStudentVerification(
                          student.student_id || student.id,
                          "verified"
                        );
                        showToast(
                          `¡${student.invited_name} fue verificado como Persona Real!`
                        );
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-sky-500 px-3.5 py-2 text-xs font-bold text-zinc-950 transition hover:bg-sky-400"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Aprobar Persona Real
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        reviewStudentVerification(
                          student.student_id || student.id,
                          "rejected",
                          "Por favor sube una foto más nítida de tu identificación oficial."
                        );
                        showToast("Se notificó al alumno para subir un nuevo documento.");
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-300 transition hover:bg-rose-500/20"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Rechazar
                    </button>
                  </>
                )}
              </div>
            </div>

            {showIdPreview && student.identity_document_url && (
              <div className="mt-3 overflow-hidden rounded-xl border border-white/[0.08] bg-[#060607] p-3">
                <p className="mb-2 text-[11px] font-mono text-zinc-400">
                  Archivo: {student.identity_document_name || "documento-identidad"}
                </p>
                <img
                  src={student.identity_document_url}
                  alt={`Identificación de ${student.invited_name}`}
                  className="max-h-64 w-auto rounded-lg border border-white/[0.08] object-contain"
                />
              </div>
            )}
          </div>
        )}

        {/* Metas Activas y Limitaciones del Alumno (Sincronizadas en vivo) */}
        {studentGoal && (
          <div className="rounded-xl border border-emerald-500/30 bg-[#0e0f12] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
                <Target className="h-4 w-4" />
                Metas Activas del Alumno (Sincronizadas)
              </p>
              <span className="text-[11px] text-zinc-400">
                {studentGoal.days_per_week} días/sem disponibles
                {studentGoal.target_weight_kg
                  ? ` · Peso objetivo: ${studentGoal.target_weight_kg} kg`
                  : ""}
              </span>
            </div>

            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-300">
                {studentGoal.primary_goal}
              </span>
              {studentGoal.priority_zones.map((zone) => (
                <span
                  key={zone}
                  className="rounded-lg border border-white/15 bg-[#060607] px-2.5 py-1 text-[11px] font-semibold text-zinc-200"
                >
                  Zona: {zone}
                </span>
              ))}
            </div>

            {studentGoal.limitations_or_injuries && (
              <p className="mt-2.5 flex items-start gap-1.5 rounded-xl border border-amber-500/25 bg-amber-500/10 p-2.5 text-xs text-amber-200">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
                <span>
                  <strong>Limitaciones / Lesiones:</strong>{" "}
                  {studentGoal.limitations_or_injuries}
                </span>
              </p>
            )}
          </div>
        )}
      </div>

      {toast && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-3 text-xs font-semibold text-emerald-300">
          <CheckCircle2 className="h-4 w-4" />
          {toast}
        </div>
      )}

      {/* 360° Tabs */}
      <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/[0.08] bg-[#060607] p-1.5 sm:grid-cols-4">
        {(
          [
            { key: "assessment", label: "Evaluación y Medidas", icon: Activity },
            { key: "workout", label: "Rutina Asignada", icon: Dumbbell },
            { key: "diet", label: "Dieta Asignada", icon: Utensils },
            { key: "subscription", label: "Suscripción", icon: CreditCard },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold transition ${
                active
                  ? "bg-white text-zinc-950 shadow"
                  : "text-zinc-400 hover:bg-[#0e0f12] hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: EVALUACIÓN Y MEDIDAS */}
      {activeTab === "assessment" && (
        <div className="space-y-6">
          {showNewForm && (
            <form
              onSubmit={handleSaveAssessment}
              className="space-y-4 rounded-xl border border-white/15 bg-[#0e0f12] p-5"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white">
                  Capturar Nueva Evaluación Antropométrica
                </h2>
                <button
                  type="button"
                  onClick={() => setShowNewForm(false)}
                  className="text-xs text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div>
                  <label className="mb-1 block text-[11px] text-zinc-400">
                    Fecha
                  </label>
                  <input
                    type="date"
                    required
                    value={form.assessment_date}
                    onChange={(e) =>
                      setForm({ ...form, assessment_date: e.target.value })
                    }
                    className="w-full rounded-xl border border-white/15 bg-[#060607] px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-zinc-400">
                    Peso (kg) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={form.weight_kg}
                    onChange={(e) =>
                      setForm({ ...form, weight_kg: e.target.value })
                    }
                    className="w-full rounded-xl border border-white/15 bg-[#060607] px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-zinc-400">
                    % Grasa
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.body_fat_percentage}
                    onChange={(e) =>
                      setForm({ ...form, body_fat_percentage: e.target.value })
                    }
                    className="w-full rounded-xl border border-white/15 bg-[#060607] px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-zinc-400">
                    Masa Muscular (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.muscle_mass_kg}
                    onChange={(e) =>
                      setForm({ ...form, muscle_mass_kg: e.target.value })
                    }
                    className="w-full rounded-xl border border-white/15 bg-[#060607] px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <p className="text-xs font-semibold text-emerald-400">
                Perímetros Corporales (cm)
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {(
                  [
                    ["abdomen_cm", "Abdomen (cm)"],
                    ["waist_cm", "Cintura (cm)"],
                    ["chest_cm", "Pecho (cm)"],
                    ["back_width_cm", "Espalda (cm)"],
                    ["bicep_left_cm", "Bíceps Izq (cm)"],
                    ["bicep_right_cm", "Bíceps Der (cm)"],
                    ["thigh_left_cm", "Pierna Izq (cm)"],
                    ["thigh_right_cm", "Pierna Der (cm)"],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key}>
                    <label className="mb-1 block text-[11px] text-zinc-400">
                      {label}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={form[key]}
                      onChange={(e) =>
                        setForm({ ...form, [key]: e.target.value })
                      }
                      className="w-full rounded-xl border border-white/15 bg-[#060607] px-3 py-2 text-xs text-white"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-300">
                  Análisis y Diagnóstico Profesional del Coach *
                </label>
                <textarea
                  rows={3}
                  required
                  value={form.coach_analysis_notes}
                  onChange={(e) =>
                    setForm({ ...form, coach_analysis_notes: e.target.value })
                  }
                  placeholder="Ej. Excelente reducción abdominal manteniendo masa magra. Ajustaremos cargas en tren superior..."
                  className="w-full rounded-xl border border-white/15 bg-[#060607] p-3 text-sm text-white outline-none focus:border-emerald-500/60"
                />
              </div>

              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-white hover:bg-zinc-200 px-5 py-2.5 text-xs font-bold text-zinc-950"
              >
                <Save className="h-4 w-4" />
                Guardar Evaluación y Notificar Alumno
              </button>
            </form>
          )}

          {/* Latest Comparison Grid */}
          {latest && (
            <div className="space-y-4">
              <div className="rounded-xl border border-white/[0.08] bg-[#0e0f12] p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-bold text-emerald-300">
                    Último Análisis — {latest.assessment_date}
                  </span>
                  {latest.goal_tag && (
                    <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-bold text-emerald-300">
                      {latest.goal_tag}
                    </span>
                  )}
                </div>
                <p className="mt-3 text-sm leading-relaxed text-zinc-200">
                  {latest.coach_analysis_notes}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  {
                    label: "Peso",
                    val: latest.weight_kg,
                    prev: previous?.weight_kg,
                    unit: "kg",
                    lowerIsBetter: true,
                  },
                  {
                    label: "Abdomen",
                    val: latest.abdomen_cm,
                    prev: previous?.abdomen_cm,
                    unit: "cm",
                    lowerIsBetter: true,
                  },
                  {
                    label: "Cintura",
                    val: latest.waist_cm,
                    prev: previous?.waist_cm,
                    unit: "cm",
                    lowerIsBetter: true,
                  },
                  {
                    label: "Espalda",
                    val: latest.back_width_cm,
                    prev: previous?.back_width_cm,
                    unit: "cm",
                  },
                  {
                    label: "Pecho",
                    val: latest.chest_cm,
                    prev: previous?.chest_cm,
                    unit: "cm",
                  },
                  {
                    label: "Bíceps Der.",
                    val: latest.bicep_right_cm,
                    prev: previous?.bicep_right_cm,
                    unit: "cm",
                  },
                  {
                    label: "Pierna Der.",
                    val: latest.thigh_right_cm,
                    prev: previous?.thigh_right_cm,
                    unit: "cm",
                  },
                  {
                    label: "% Grasa",
                    val: latest.body_fat_percentage,
                    prev: previous?.body_fat_percentage,
                    unit: "%",
                    lowerIsBetter: true,
                  },
                ].map((m) => (
                  <div
                    key={m.label}
                    className="rounded-xl border border-white/[0.08] bg-[#0e0f12] p-3.5"
                  >
                    <p className="text-[11px] text-zinc-400">{m.label}</p>
                    <p className="mt-1 text-xl font-extrabold text-white">
                      {m.val ?? "—"}{" "}
                      <span className="text-xs font-normal text-zinc-400">
                        {m.val !== undefined ? m.unit : ""}
                      </span>
                    </p>
                    <div className="mt-1">
                      <DeltaBadge
                        current={m.val}
                        previous={m.prev}
                        unit={m.unit}
                        lowerIsBetter={m.lowerIsBetter}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <ProgressCharts assessments={studentAssessments} />
            </div>
          )}
        </div>
      )}

      {/* TAB 2: RUTINA ASIGNADA */}
      {activeTab === "workout" && (
        <div className="space-y-5">
          {activeWorkout ? (
            <div className="space-y-4 rounded-xl border border-white/[0.08] bg-[#0e0f12] p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] font-bold uppercase text-emerald-400">
                    Rutina Activa
                  </span>
                  <h2 className="text-lg font-bold text-white">
                    {activeWorkout.title}
                  </h2>
                  <p className="text-xs text-zinc-400">
                    {activeWorkout.description}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {activeWorkout.days.map((day) => (
                  <div
                    key={day.id}
                    className="rounded-xl border border-white/[0.08] bg-[#060607] p-4"
                  >
                    <h3 className="text-sm font-bold text-emerald-300">
                      {day.title}
                    </h3>
                    <div className="mt-2.5 divide-y divide-white/[0.06]/70">
                      {day.exercises.map((ex) => (
                        <div
                          key={ex.id}
                          className="flex flex-wrap items-center justify-between gap-2 py-2 text-xs"
                        >
                          <div>
                            <p className="font-semibold text-white">{ex.name}</p>
                            <p className="text-[11px] text-zinc-400">
                              {ex.muscle_group} · {ex.target_weight_or_rpe}
                            </p>
                          </div>
                          <span className="rounded-lg bg-white/[0.06] px-2.5 py-1 font-mono text-[11px] text-emerald-300">
                            {ex.sets}x{ex.reps} · {ex.rest_seconds}s
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-white/[0.08] bg-[#0e0f12] p-6 text-center text-sm text-zinc-400">
              Este alumno aún no tiene una rutina asignada.
            </div>
          )}

          {/* Assign template */}
          <div className="rounded-xl border border-white/[0.08] bg-[#0e0f12] p-5">
            <h3 className="text-sm font-bold text-white">
              Asignar desde Plantilla Reutilizable
            </h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {workoutTemplates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-[#060607] p-3.5"
                >
                  <div>
                    <p className="text-xs font-bold text-white">{tpl.title}</p>
                    <p className="text-[11px] text-zinc-400">
                      {tpl.days.length} día(s) · {tpl.goal}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      assignWorkoutToStudent(tpl.id, studentId);
                      showToast("Rutina asignada y alumno notificado.");
                    }}
                    className="rounded-lg bg-white text-zinc-950 px-3 py-1.5 text-xs font-bold text-zinc-950 hover:bg-zinc-200"
                  >
                    Asignar
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DIETA ASIGNADA */}
      {activeTab === "diet" && (
        <div className="space-y-5">
          {activeDiet ? (
            <div className="space-y-4 rounded-xl border border-white/[0.08] bg-[#0e0f12] p-5">
              <div>
                <span className="text-[11px] font-bold uppercase text-emerald-400">
                  Plan Nutricional Activo
                </span>
                <h2 className="text-lg font-bold text-white">
                  {activeDiet.title}
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                <div className="rounded-xl bg-[#060607] p-3 text-center">
                  <p className="text-[10px] text-zinc-400">Calorías</p>
                  <p className="text-base font-black text-white">
                    {activeDiet.daily_calories}
                  </p>
                </div>
                <div className="rounded-xl bg-[#060607] p-3 text-center">
                  <p className="text-[10px] text-zinc-400">Proteína</p>
                  <p className="text-base font-black text-emerald-400">
                    {activeDiet.protein_g}g
                  </p>
                </div>
                <div className="rounded-xl bg-[#060607] p-3 text-center">
                  <p className="text-[10px] text-zinc-400">Carbs</p>
                  <p className="text-base font-black text-emerald-400">
                    {activeDiet.carbs_g}g
                  </p>
                </div>
                <div className="rounded-xl bg-[#060607] p-3 text-center">
                  <p className="text-[10px] text-zinc-400">Grasas</p>
                  <p className="text-base font-black text-amber-400">
                    {activeDiet.fats_g}g
                  </p>
                </div>
                <div className="rounded-xl bg-[#060607] p-3 text-center">
                  <p className="text-[10px] text-zinc-400">Agua</p>
                  <p className="text-base font-black text-sky-400">
                    {activeDiet.water_liters}L
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                {activeDiet.meals.map((meal) => (
                  <div
                    key={meal.id}
                    className="rounded-xl border border-white/[0.08] bg-[#060607] p-3.5"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-emerald-300">
                        {meal.meal_time}
                      </p>
                      <span className="text-[11px] text-zinc-400">
                        {meal.suggested_hour} · {meal.calories} kcal
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-zinc-200">
                      {meal.foods_description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-white/[0.08] bg-[#0e0f12] p-6 text-center text-sm text-zinc-400">
              Este alumno aún no tiene una dieta asignada.
            </div>
          )}

          <div className="rounded-xl border border-white/[0.08] bg-[#0e0f12] p-5">
            <h3 className="text-sm font-bold text-white">
              Asignar Plantilla de Dieta
            </h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {dietTemplates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-[#060607] p-3.5"
                >
                  <div>
                    <p className="text-xs font-bold text-white">{tpl.title}</p>
                    <p className="text-[11px] text-zinc-400">
                      {tpl.daily_calories} kcal · {tpl.protein_g}g P
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      assignNutritionToStudent(tpl.id, studentId);
                      showToast("Plan nutricional asignado al alumno.");
                    }}
                    className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-zinc-950"
                  >
                    Asignar
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SUSCRIPCIÓN */}
      {activeTab === "subscription" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Quick Assign Coach Plan */}
          <div className="min-w-0 space-y-4 rounded-xl border border-white/[0.08] bg-[#0e0f12] p-4 sm:p-6 lg:col-span-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white">
                Asignar o Renovar Plan del Coach
              </h2>
              <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
                {daysRemaining > 0
                  ? `${daysRemaining} días restantes`
                  : "Vencido"}
              </span>
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-[#060607] p-3.5 text-xs">
              <p className="text-zinc-400">Plan actual:</p>
              <p className="mt-0.5 text-sm font-bold text-white">
                {student.subscription_plan_name} — ${student.subscription_price}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-300">
                <Calendar className="h-3.5 w-3.5" />
                Vence el: {student.expires_at || student.next_billing_date}
              </p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-zinc-300">
                Elegir paquete configurado
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-[#060607] px-3 py-2.5 text-sm text-white"
              >
                {subscriptionPlans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — ${p.price} ({p.duration_days} días)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-zinc-300">
                Fecha de inicio (calcula vencimiento automático)
              </label>
              <input
                type="date"
                value={planStartDate}
                onChange={(e) => setPlanStartDate(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-[#060607] px-3.5 py-2.5 text-sm text-white"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                if (!selectedPlanId) return;
                assignSubscriptionPlanToStudent(
                  student.id,
                  selectedPlanId,
                  planStartDate
                );
                showToast(
                  "Plan asignado. Fecha de vencimiento y permisos actualizados en la app del alumno."
                );
              }}
              className="w-full rounded-xl bg-white hover:bg-zinc-200 py-3 text-xs font-bold text-zinc-950"
            >
              Aplicar Plan y Calcular Vencimiento
            </button>
          </div>

          {/* Manual override */}
          <form
            onSubmit={handleSaveSubscription}
            className="min-w-0 space-y-4 rounded-xl border border-white/[0.08] bg-[#0e0f12] p-4 sm:p-6 lg:col-span-6"
          >
            <h2 className="text-base font-bold text-white">
              Ajuste Manual de Suscripción
            </h2>
            <div>
              <label className="mb-1 block text-xs font-semibold text-zinc-300">
                Nombre del Plan
              </label>
              <input
                type="text"
                value={subPlan}
                onChange={(e) => setSubPlan(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-[#060607] px-3.5 py-2.5 text-sm text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-300">
                  Estado de Pago
                </label>
                <select
                  value={subStatus}
                  onChange={(e) =>
                    setSubStatus(e.target.value as SubscriptionStatus)
                  }
                  className="w-full rounded-xl border border-white/15 bg-[#060607] px-3 py-2.5 text-sm text-white"
                >
                  <option value="active">Activa</option>
                  <option value="trial">Prueba</option>
                  <option value="pending_payment">Pago pendiente</option>
                  <option value="expired">Vencida</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-300">
                  Costo ($)
                </label>
                <input
                  type="number"
                  value={subPrice}
                  onChange={(e) => setSubPrice(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-[#060607] px-3.5 py-2.5 text-sm text-white"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-zinc-300">
                Fecha de vencimiento / corte
              </label>
              <input
                type="date"
                value={subDate}
                onChange={(e) => setSubDate(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-[#060607] px-3.5 py-2.5 text-sm text-white"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-5 py-3 text-xs font-bold text-white hover:bg-white/[0.12]"
            >
              <Save className="h-4 w-4" />
              Guardar Ajuste Manual
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
