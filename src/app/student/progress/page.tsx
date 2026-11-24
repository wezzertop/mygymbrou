"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  Camera,
  CheckCircle2,
  CreditCard,
  Plus,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import { getDaysRemaining, useApp } from "@/context/AppContext";
import { ProgressCharts } from "@/components/ProgressCharts";
import { NonIntrusiveAdBanner } from "@/components/NonIntrusiveAdBanner";

export default function StudentProgressPage() {
  const {
    studentProfile,
    coachProfile,
    students,
    subscriptionPlans,
    studentGoals,
    assessments,
    addAssessment,
  } = useApp();

  const relation = students.find((s) => s.student_id === studentProfile.id);
  const activePlan = subscriptionPlans.find((p) => p.id === relation?.plan_id);
  const expiresAt = relation?.expires_at || relation?.next_billing_date;
  const daysLeft = getDaysRemaining(expiresAt);
  const myGoal = studentGoals.find((g) => g.student_id === studentProfile.id);
  const [compareMode, setCompareMode] = useState<"previous" | "initial">(
    "previous"
  );
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [weightInput, setWeightInput] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!checkInOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCheckInOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [checkInOpen]);

  const myAssessments = useMemo(
    () =>
      assessments
        .filter((a) => a.student_id === studentProfile.id)
        .sort((a, b) => b.assessment_date.localeCompare(a.assessment_date)),
    [assessments, studentProfile.id]
  );

  const latest = myAssessments[0];
  const baseline =
    compareMode === "previous"
      ? myAssessments[1]
      : myAssessments[myAssessments.length - 1];

  const handleQuickCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!weightInput) return;
    addAssessment(
      {
        student_id: studentProfile.id,
        coach_id: coachProfile.id,
        assessment_date: new Date().toISOString().split("T")[0],
        weight_kg: Number(weightInput),
        height_cm: latest?.height_cm,
        body_fat_percentage: latest?.body_fat_percentage,
        muscle_mass_kg: latest?.muscle_mass_kg,
        chest_cm: latest?.chest_cm,
        back_width_cm: latest?.back_width_cm,
        waist_cm: latest?.waist_cm,
        abdomen_cm: latest?.abdomen_cm,
        bicep_left_cm: latest?.bicep_left_cm,
        bicep_right_cm: latest?.bicep_right_cm,
        thigh_left_cm: latest?.thigh_left_cm,
        thigh_right_cm: latest?.thigh_right_cm,
        goal_tag: latest?.goal_tag || "Check-in Semanal",
        coach_analysis_notes:
          latest?.coach_analysis_notes ||
          "Registro semanal subido por el alumno. Pendiente revisión del coach.",
        progress_photos: photoUrl
          ? [{ label: "Progreso Semanal", url: photoUrl }]
          : [],
      },
      false
    );
    setCheckInOpen(false);
    setWeightInput("");
    setPhotoUrl("");
    setToast("¡Check-in semanal registrado en tu historial!");
    setTimeout(() => setToast(null), 3000);
  };

  const metrics = latest
    ? [
        {
          label: "Peso",
          val: latest.weight_kg,
          base: baseline?.weight_kg,
          unit: "kg",
          lowerIsBetter: true,
        },
        {
          label: "Abdomen",
          val: latest.abdomen_cm,
          base: baseline?.abdomen_cm,
          unit: "cm",
          lowerIsBetter: true,
        },
        {
          label: "Espalda",
          val: latest.back_width_cm,
          base: baseline?.back_width_cm,
          unit: "cm",
          lowerIsBetter: false,
        },
        {
          label: "Bíceps",
          val: latest.bicep_right_cm ?? latest.bicep_left_cm,
          base: baseline?.bicep_right_cm ?? baseline?.bicep_left_cm,
          unit: "cm",
          lowerIsBetter: false,
        },
        {
          label: "Pecho",
          val: latest.chest_cm,
          base: baseline?.chest_cm,
          unit: "cm",
          lowerIsBetter: false,
        },
        {
          label: "Cintura",
          val: latest.waist_cm,
          base: baseline?.waist_cm,
          unit: "cm",
          lowerIsBetter: true,
        },
        {
          label: "Pierna",
          val: latest.thigh_right_cm ?? latest.thigh_left_cm,
          base: baseline?.thigh_right_cm ?? baseline?.thigh_left_cm,
          unit: "cm",
          lowerIsBetter: false,
        },
        {
          label: "Masa Muscular",
          val: latest.muscle_mass_kg,
          base: baseline?.muscle_mass_kg,
          unit: "kg",
          lowerIsBetter: false,
        },
      ]
    : [];

  const allPhotos = myAssessments.flatMap((a) =>
    a.progress_photos.map((p) => ({ ...p, date: a.assessment_date }))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Mis Avances</h1>
          <p className="text-xs text-zinc-400">
            Seguimiento antropométrico y análisis directo de tu coach.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Primary Check-in CTA (placed cleanly in header — zero overlap) */}
          <button
            type="button"
            onClick={() => setCheckInOpen(true)}
            className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl bg-white hover:bg-zinc-200 px-4 py-2 text-xs font-bold text-zinc-950 shadow-lg shadow-none transition  active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            Registrar Progreso
          </button>

          {/* Toggle Mes anterior vs Inicio */}
          <div className="flex rounded-xl border border-white/[0.08] bg-[#060607] p-1 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setCompareMode("previous")}
              className={`rounded-lg px-3 py-1.5 transition ${
                compareMode === "previous"
                  ? "bg-emerald-500 text-zinc-950"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Mes anterior
            </button>
            <button
              type="button"
              onClick={() => setCompareMode("initial")}
              className={`rounded-lg px-3 py-1.5 transition ${
                compareMode === "initial"
                  ? "bg-emerald-500 text-zinc-950"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Antes vs. Hoy
            </button>
          </div>
        </div>
      </div>

      {toast && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-3 text-xs font-semibold text-emerald-300">
          <CheckCircle2 className="h-4 w-4" />
          {toast}
        </div>
      )}

      {/* Strategic Active Plan + Quick Goals Strip */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/student/subscription"
          className="flex flex-col justify-between gap-2 rounded-xl border border-white/[0.08] bg-[#0e0f12] p-4 transition hover:border-white/20"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
              <CreditCard className="h-3.5 w-3.5" />
              {relation?.subscription_plan_name || "Sin plan asignado"}
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[10px] font-medium text-zinc-300">
              {daysLeft > 0 ? `${daysLeft} días restantes` : "Por activar"}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 text-[10px] font-medium text-zinc-400">
            {activePlan?.includes_nutrition && (
              <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-zinc-300">Nutrición</span>
            )}
            {activePlan?.includes_workouts && (
              <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-zinc-300">Rutinas</span>
            )}
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3 text-emerald-400" />
              {expiresAt ? `Vence: ${expiresAt}` : "Sin fecha de corte asignada"}
            </span>
          </div>
        </Link>

        <Link
          href="/student/profile"
          className="flex flex-col justify-between gap-2 rounded-xl border border-white/[0.08] bg-[#0e0f12] p-4 transition hover:border-white/20"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
              <Target className="h-3.5 w-3.5" />
              Mi Meta Actual
            </span>
            <span className="text-[10px] font-medium text-zinc-400">
              Editar →
            </span>
          </div>
          <p className="text-xs font-bold text-white">
            {myGoal?.primary_goal || studentProfile.fitness_goal}
            {myGoal?.target_weight_kg ? ` · Meta: ${myGoal.target_weight_kg} kg` : ""}
          </p>
          {myGoal && myGoal.priority_zones.length > 0 && (
            <p className="truncate text-[11px] text-zinc-400">
              Foco: {myGoal.priority_zones.join(", ")} ({myGoal.days_per_week}d/sem)
            </p>
          )}
        </Link>
      </div>

      {/* Featured Coach Analysis Card */}
      {latest && (
        <section className="rounded-xl border border-white/[0.08] bg-[#0e0f12] p-5 shadow-xl shadow-cyan-950/20">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <img
                src={
                  coachProfile.avatar_url ||
                  "https://images.unsplash.com/photo-1567013127542-490d757e51fc?auto=format&fit=crop&w=128&q=80"
                }
                alt={coachProfile.full_name}
                className="h-10 w-10 rounded-full object-cover ring-2 ring-cyan-500/50"
              />
              <div>
                <p className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
Último Análisis del Coach
                </p>
                <p className="text-[11px] text-zinc-400">
                  {coachProfile.full_name} · {latest.assessment_date}
                </p>
              </div>
            </div>
            {latest.goal_tag && (
              <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-[10px] font-bold text-emerald-300">
                {latest.goal_tag}
              </span>
            )}
          </div>
          <p className="mt-3.5 text-sm leading-relaxed text-zinc-100">
            &ldquo;{latest.coach_analysis_notes}&rdquo;
          </p>
        </section>
      )}

      {/* Visual Anthropometry Comparison Grid */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">
            Comparativa de Medidas Corporales
          </h2>
          {baseline && (
            <span className="text-[11px] text-zinc-400">
              vs. {baseline.assessment_date}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {metrics.map((m) => {
            const diff =
              m.val !== undefined && m.base !== undefined
                ? Number((m.val - m.base).toFixed(1))
                : null;
            const improved =
              diff !== null &&
              diff !== 0 &&
              (m.lowerIsBetter ? diff < 0 : diff > 0);

            return (
              <div
                key={m.label}
                className="rounded-xl border border-white/[0.08] bg-[#0e0f12]/75 p-3.5"
              >
                <p className="text-[11px] font-medium text-zinc-400">
                  {m.label}
                </p>
                <p className="mt-1 text-xl font-black text-white">
                  {m.val ?? "—"}{" "}
                  <span className="text-xs font-medium text-zinc-400">
                    {m.val !== undefined ? m.unit : ""}
                  </span>
                </p>
                {diff !== null && diff !== 0 ? (
                  <p
                    className={`mt-1 inline-flex items-center gap-0.5 text-[11px] font-bold ${
                      improved ? "text-emerald-400" : "text-amber-400"
                    }`}
                  >
                    {diff > 0 ? (
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    ) : (
                      <ArrowDownRight className="h-3.5 w-3.5" />
                    )}
                    {diff > 0 ? `+${diff}` : diff} {m.unit}
                  </p>
                ) : (
                  <p className="mt-1 text-[11px] text-zinc-500">Estable</p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Evolution Charts */}
      <ProgressCharts assessments={myAssessments} />

      {/* Progress Photos */}
      {allPhotos.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-white">Fotos de Progreso</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {allPhotos.map((photo, idx) => (
              <div
                key={`${photo.url}-${idx}`}
                className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#0e0f12]"
              >
                <img
                  src={photo.url}
                  alt={photo.label}
                  className="h-40 w-full object-cover"
                />
                <div className="flex items-center justify-between px-3 py-2 text-[11px]">
                  <span className="font-semibold text-white">{photo.label}</span>
                  <span className="text-zinc-400">{photo.date}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Non-intrusive Ad Banner */}
      <NonIntrusiveAdBanner slot="student_footer" />

      {/* Quick Check-in Modal */}
      {checkInOpen && (
        <div
          onClick={() => setCheckInOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-xl border border-white/[0.08] bg-[#0e0f12] p-6 shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                Registrar Peso / Foto Semanal
              </h2>
              <button
                type="button"
                onClick={() => setCheckInOpen(false)}
                aria-label="Cerrar modal"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-white/[0.06] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleQuickCheckIn} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-300">
                  Peso actual en ayunas (kg) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  placeholder={latest ? String(latest.weight_kg) : "62.0"}
                  className="w-full rounded-xl border border-white/15 bg-[#060607] px-3.5 py-3 text-sm text-white outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-300">
                  URL de foto de progreso (opcional)
                </label>
                <div className="relative">
                  <Camera className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="url"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="https://... (URL de tu foto de progreso)"
                    className="w-full rounded-xl border border-white/15 bg-[#060607] py-3 pl-10 pr-3.5 text-xs text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-white hover:bg-zinc-200 py-3.5 text-sm font-bold text-zinc-950"
              >
                Guardar Check-in Semanal
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
