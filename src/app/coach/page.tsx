"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Clock,
  Dumbbell,
  Plus,
  RefreshCw,
  UserPlus,
  Utensils,
  X,
} from "lucide-react";
import { getDaysRemaining, useApp } from "@/context/AppContext";
import { canInviteMoreStudents, getSaasPlanById } from "@/lib/saas-plans";
import { DynamicBannerHeader } from "@/components/DynamicBannerHeader";
import { FreeTierAdSlot } from "@/components/FreeTierAdSlot";

type RosterFilter = "all" | "active" | "expiring" | "expired" | "pending";
type QuickModal = "workout" | "diet" | "renew" | null;

export default function CoachDashboardPage() {
  const {
    coachProfile,
    students,
    appointments,
    assessments,
    workouts,
    nutritionPlans,
    subscriptionPlans,
    assignWorkoutToStudent,
    assignNutritionToStudent,
    assignSubscriptionPlanToStudent,
  } = useApp();

  const [fabOpen, setFabOpen] = useState(false);
  const [rosterFilter, setRosterFilter] = useState<RosterFilter>("all");
  const [quickModal, setQuickModal] = useState<QuickModal>(null);
  const [targetStudentId, setTargetStudentId] = useState<string>("");
  const [targetRelationId, setTargetRelationId] = useState<string>("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  const activeStudents = students.filter((s) => s.invite_status === "active");
  const pendingInvites = students.filter((s) => s.invite_status === "pending");
  const firstActiveStudentId = activeStudents.find((s) => s.student_id)?.student_id;
  const newAssessmentHref = firstActiveStudentId
    ? `/coach/students/${firstActiveStudentId}?tab=assessment`
    : "/coach/students?invite=true";

  const isExpiringSoon = (s: (typeof students)[number]) => {
    if (s.invite_status !== "active") return false;
    const days = getDaysRemaining(s.expires_at || s.next_billing_date);
    return (
      s.subscription_status === "pending_payment" ||
      (s.subscription_status === "active" && days >= 0 && days <= 7)
    );
  };

  const isExpired = (s: (typeof students)[number]) => {
    if (s.invite_status !== "active") return false;
    const days = getDaysRemaining(s.expires_at || s.next_billing_date);
    return s.subscription_status === "expired" || days < 0;
  };

  const expiringCount = students.filter(isExpiringSoon).length;
  const expiredCount = students.filter(isExpired).length;

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (rosterFilter === "active")
        return s.invite_status === "active" && !isExpired(s) && !isExpiringSoon(s);
      if (rosterFilter === "expiring") return isExpiringSoon(s);
      if (rosterFilter === "expired") return isExpired(s);
      if (rosterFilter === "pending") return s.invite_status === "pending";
      return true;
    });
  }, [students, rosterFilter]);

  const upcomingAppointments = appointments
    .filter((a) => a.status === "scheduled")
    .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));

  const monthlyRevenue = students
    .filter((s) => s.subscription_status === "active")
    .reduce((sum, s) => sum + s.subscription_price, 0);

  const currentSaasPlan = getSaasPlanById(coachProfile.saas_plan_tier);
  const occupiedSlots = activeStudents.length + pendingInvites.length;
  const quota = canInviteMoreStudents(
    occupiedSlots,
    coachProfile.saas_plan_tier,
    coachProfile.saas_student_limit
  );

  const openQuickModal = (
    mode: QuickModal,
    preselectedRelationId?: string
  ) => {
    const firstActive = activeStudents[0];
    setTargetStudentId(firstActive?.student_id || "");
    setTargetRelationId(preselectedRelationId || students[0]?.id || "");
    if (mode === "workout") {
      setSelectedTemplateId(workouts[0]?.id || "");
    } else if (mode === "diet") {
      setSelectedTemplateId(nutritionPlans[0]?.id || "");
    } else if (mode === "renew") {
      setSelectedTemplateId(subscriptionPlans[0]?.id || "");
    }
    setQuickModal(mode);
  };

  const handleQuickActionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickModal === "workout" && selectedTemplateId && targetStudentId) {
      assignWorkoutToStudent(selectedTemplateId, targetStudentId);
      showToast("Rutina asignada y notificada al alumno.");
    } else if (quickModal === "diet" && selectedTemplateId && targetStudentId) {
      assignNutritionToStudent(selectedTemplateId, targetStudentId);
      showToast("Plan nutricional actualizado y enviado al alumno.");
    } else if (
      quickModal === "renew" &&
      selectedTemplateId &&
      targetRelationId
    ) {
      assignSubscriptionPlanToStudent(targetRelationId, selectedTemplateId);
      showToast("Plan de alumno renovado correctamente.");
    }
    setQuickModal(null);
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Cover + Motivational Quote Header */}
      <DynamicBannerHeader
        role="coach"
        eyebrow={coachProfile.brand_name || "Panel Coach"}
        title={`Hola, ${coachProfile.full_name.split(" ")[0]}`}
        actions={
          <>
            <Link
              href="/coach/plans?tab=saas"
              className="inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-full border border-white/10 bg-[#060607] px-4 text-xs font-medium text-zinc-300 transition hover:border-white/25 hover:text-white"
            >
              <span>{currentSaasPlan.name}</span>
              <span className="h-1 w-1 rounded-full bg-zinc-600" />
              <span className="font-semibold tabular-nums text-emerald-400">
                {quota.limit === null
                  ? `${occupiedSlots} / ∞`
                  : `${occupiedSlots} / ${quota.limit}`}
              </span>
            </Link>
            <Link
              href="/coach/students?invite=true"
              className="inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-full bg-white px-5 text-xs font-semibold text-zinc-950 transition hover:bg-zinc-200 active:scale-[0.98]"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Invitar Alumno
            </Link>
          </>
        }
      />

      {/* Toast Feedback */}
      {toast && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs font-medium text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {toast}
        </div>
      )}

      {/* Architectural KPI Strip (Stripe / Linear style) */}
      <div className="grid grid-cols-2 divide-x divide-y divide-white/[0.06] overflow-hidden rounded-xl border border-white/[0.08] bg-[#0e0f12] lg:grid-cols-4 lg:divide-y-0">
        <Link
          href="/coach/students"
          className="p-4 transition hover:bg-white/[0.02] sm:p-5"
        >
          <p className="text-[11px] font-medium text-zinc-500">Alumnos activos</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums text-white sm:text-3xl">
            {activeStudents.length}
          </p>
          <p className="mt-1 text-[11px] text-zinc-400">
            +{pendingInvites.length} pendiente(s)
          </p>
        </Link>

        <Link
          href="/coach/plans"
          className="p-4 transition hover:bg-white/[0.02] sm:p-5"
        >
          <p className="text-[11px] font-medium text-zinc-500">Ingresos activos</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums text-emerald-400 sm:text-3xl">
            ${monthlyRevenue.toLocaleString("es-MX")}
          </p>
          <p className="mt-1 text-[11px] text-zinc-400">
            {expiringCount} por vencer · {expiredCount} vencido(s)
          </p>
        </Link>

        <Link
          href="/coach/agenda"
          className="p-4 transition hover:bg-white/[0.02] sm:p-5"
        >
          <p className="text-[11px] font-medium text-zinc-500">Próximas citas</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums text-white sm:text-3xl">
            {upcomingAppointments.length}
          </p>
          <p className="mt-1 text-[11px] text-zinc-400">
            Valoraciones y check-ins
          </p>
        </Link>

        <Link
          href={newAssessmentHref}
          className="p-4 transition hover:bg-white/[0.02] sm:p-5"
        >
          <p className="text-[11px] font-medium text-zinc-500">Evaluaciones</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums text-white sm:text-3xl">
            {assessments.length}
          </p>
          <p className="mt-1 text-[11px] text-zinc-400">
            Historial antropométrico
          </p>
        </Link>
      </div>

      {/* Sleek Daily Quick Actions */}
      <section aria-label="Acciones rápidas del Coach">
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1 sm:grid sm:grid-cols-5 sm:overflow-visible">
          <button
            type="button"
            onClick={() => openQuickModal("workout")}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-white/[0.08] bg-[#0e0f12] px-4 text-xs font-medium text-zinc-200 transition hover:border-white/20 hover:bg-white/[0.04] hover:text-white"
          >
            <Dumbbell className="h-4 w-4 text-emerald-400" />
            Asignar Rutina
          </button>
          <button
            type="button"
            onClick={() => openQuickModal("diet")}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-white/[0.08] bg-[#0e0f12] px-4 text-xs font-medium text-zinc-200 transition hover:border-white/20 hover:bg-white/[0.04] hover:text-white"
          >
            <Utensils className="h-4 w-4 text-emerald-400" />
            Actualizar Dieta
          </button>
          <Link
            href={newAssessmentHref}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-white/[0.08] bg-[#0e0f12] px-4 text-xs font-medium text-zinc-200 transition hover:border-white/20 hover:bg-white/[0.04] hover:text-white"
          >
            <Activity className="h-4 w-4 text-emerald-400" />
            Evaluación
          </Link>
          <Link
            href="/coach/agenda"
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-white/[0.08] bg-[#0e0f12] px-4 text-xs font-medium text-zinc-200 transition hover:border-white/20 hover:bg-white/[0.04] hover:text-white"
          >
            <Calendar className="h-4 w-4 text-emerald-400" />
            Agendar Cita
          </Link>
          <button
            type="button"
            onClick={() => openQuickModal("renew")}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-white/[0.08] bg-[#0e0f12] px-4 text-xs font-medium text-zinc-200 transition hover:border-white/20 hover:bg-white/[0.04] hover:text-white"
          >
            <RefreshCw className="h-4 w-4 text-emerald-400" />
            Renovar Plan
          </button>
        </div>
      </section>

      {/* Strategic Visible Ad Slot (320x50 — Only on Free plan) */}
      <FreeTierAdSlot viewerRole="coach" />

      {/* Main Two-Column Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Roster Status with Clean Filters */}
        <section className="min-w-0 rounded-xl border border-white/[0.08] bg-[#0e0f12] p-5 lg:col-span-7">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold tracking-tight text-white">
              Estado de Cartera
            </h2>
            <Link
              href="/coach/students"
              className="inline-flex items-center gap-1 text-xs font-medium text-zinc-400 transition hover:text-white"
            >
              Ver todos
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Quick Status Pills */}
          <div className="no-scrollbar mb-4 flex gap-1.5 overflow-x-auto pb-1">
            {(
              [
                { key: "all", label: `Todos (${students.length})` },
                { key: "active", label: "Activos" },
                { key: "expiring", label: `Por vencer (${expiringCount})` },
                { key: "expired", label: `Vencidos (${expiredCount})` },
                { key: "pending", label: `Pendientes (${pendingInvites.length})` },
              ] as const
            ).map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setRosterFilter(f.key)}
                className={`h-8 shrink-0 whitespace-nowrap rounded-lg px-3.5 text-xs font-medium transition ${
                  rosterFilter === f.key
                    ? "bg-emerald-500 text-zinc-950 font-semibold"
                    : "border border-white/10 bg-transparent text-zinc-400 hover:border-white/25 hover:text-white"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="divide-y divide-white/[0.06] border-t border-white/[0.06]">
            {filteredStudents.map((st) => {
              const targetId = st.student_id || st.id;
              const expired = isExpired(st);
              const expiring = isExpiringSoon(st);
              return (
                <div
                  key={st.id}
                  className="flex flex-col justify-between gap-3 py-3.5 sm:flex-row sm:items-center"
                >
                  <Link
                    href={
                      st.student_id
                        ? `/coach/students/${targetId}`
                        : "/coach/students"
                    }
                    className="flex min-w-0 flex-1 items-center gap-3 group"
                  >
                    {st.avatar_url ? (
                      <img
                        src={st.avatar_url}
                        alt={st.invited_name}
                        className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-white/10"
                      />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-xs font-semibold text-zinc-300">
                        {st.invited_name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white transition group-hover:text-emerald-400">
                        {st.invited_name}
                      </p>
                      <p className="truncate text-xs text-zinc-500">
                        {st.subscription_plan_name} · Vence{" "}
                        {st.expires_at || st.next_billing_date}
                      </p>
                    </div>
                  </Link>

                  <div className="flex items-center justify-between gap-2 sm:justify-end">
                    {st.invite_status === "pending" ? (
                      <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-300">
                        Pendiente
                      </span>
                    ) : expired ? (
                      <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-0.5 text-[11px] font-medium text-rose-300">
                        Vencido
                      </span>
                    ) : expiring ? (
                      <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-300">
                        Por vencer
                      </span>
                    ) : (
                      <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400">
                        Activo
                      </span>
                    )}

                    {(expired || expiring) && (
                      <button
                        type="button"
                        onClick={() => openQuickModal("renew", st.id)}
                        className="h-8 rounded-full bg-white px-3 text-[11px] font-semibold text-zinc-950 transition hover:bg-zinc-200"
                      >
                        Renovar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {filteredStudents.length === 0 && (
              <div className="py-10 text-center">
                <p className="text-sm text-zinc-500">
                  No hay alumnos en esta categoría.
                </p>
                {students.length === 0 && (
                  <Link
                    href="/coach/students?invite=true"
                    className="mt-4 inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-5 text-xs font-semibold text-zinc-950"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    Invitar primer alumno
                  </Link>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Upcoming Appointments */}
        <section className="min-w-0 rounded-xl border border-white/[0.08] bg-[#0e0f12] p-5 lg:col-span-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold tracking-tight text-white">
              Agenda Próxima
            </h2>
            <Link
              href="/coach/agenda"
              className="inline-flex items-center gap-1 text-xs font-medium text-zinc-400 transition hover:text-white"
            >
              Ver agenda
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-white/[0.06] border-t border-white/[0.06]">
            {upcomingAppointments.slice(0, 4).map((apt) => (
              <div key={apt.id} className="space-y-2 py-3.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-emerald-400">
                    {apt.student_name}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-zinc-500">
                    <Clock className="h-3 w-3" />
                    {new Date(apt.scheduled_at).toLocaleString("es-MX", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
                <p className="text-sm font-medium text-white">{apt.title}</p>
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-xs text-zinc-500">
                    {apt.location_or_link}
                  </p>
                  <Link
                    href={`/coach/students/${apt.student_id}`}
                    className="shrink-0 text-xs font-medium text-zinc-300 transition hover:text-white"
                  >
                    Expediente →
                  </Link>
                </div>
              </div>
            ))}
            {upcomingAppointments.length === 0 && (
              <div className="py-10 text-center">
                <p className="text-sm text-zinc-500">
                  No tienes citas programadas por ahora.
                </p>
                <Link
                  href="/coach/agenda"
                  className="mt-4 inline-flex h-10 items-center gap-1.5 rounded-full border border-white/15 px-4 text-xs font-medium text-zinc-200 transition hover:border-white/30 hover:text-white"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Programar cita
                </Link>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Quick Action Modal */}
      {quickModal && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setQuickModal(null)}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-3 backdrop-blur-sm sm:items-center sm:p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-xl border border-white/10 bg-[#0e0f12] p-5 shadow-2xl sm:p-6"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight text-white">
                {quickModal === "workout"
                  ? "Asignar Rutina Rápida"
                  : quickModal === "diet"
                  ? "Actualizar Dieta Rápida"
                  : "Renovar Plan de Alumno"}
              </h2>
              <button
                type="button"
                onClick={() => setQuickModal(null)}
                aria-label="Cerrar"
                className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 hover:bg-white/[0.06] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleQuickActionSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                  Selecciona el alumno
                </label>
                {quickModal === "renew" ? (
                  <select
                    required
                    value={targetRelationId}
                    onChange={(e) => setTargetRelationId(e.target.value)}
                    className="min-h-[44px] w-full rounded-xl border border-white/10 bg-[#060607] px-3 text-white outline-none focus:border-emerald-500/60"
                  >
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.invited_name} ({s.subscription_plan_name})
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    required
                    value={targetStudentId}
                    onChange={(e) => setTargetStudentId(e.target.value)}
                    className="min-h-[44px] w-full rounded-xl border border-white/10 bg-[#060607] px-3 text-white outline-none focus:border-emerald-500/60"
                  >
                    {activeStudents
                      .filter((s) => s.student_id)
                      .map((s) => (
                        <option key={s.id} value={s.student_id!}>
                          {s.invited_name}
                        </option>
                      ))}
                  </select>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                  {quickModal === "workout"
                    ? "Plantilla de rutina"
                    : quickModal === "diet"
                    ? "Plantilla nutricional"
                    : "Plan de suscripción a renovar"}
                </label>
                <select
                  required
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="min-h-[44px] w-full rounded-xl border border-white/10 bg-[#060607] px-3 text-white outline-none focus:border-emerald-500/60"
                >
                  {quickModal === "workout" &&
                    workouts.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.title} ({w.days.length} días)
                      </option>
                    ))}
                  {quickModal === "diet" &&
                    nutritionPlans.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.title} ({n.daily_calories} kcal)
                      </option>
                    ))}
                  {quickModal === "renew" &&
                    subscriptionPlans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — ${p.price} MXN / {p.duration_days} días
                      </option>
                    ))}
                </select>
              </div>

              <button
                type="submit"
                className="h-12 w-full rounded-full bg-white text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200"
              >
                Confirmar y notificar
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Minimalist Mobile FAB */}
      {fabOpen && (
        <div
          aria-hidden="true"
          onClick={() => setFabOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-[2px] lg:hidden"
        />
      )}
      <div className="fixed bottom-24 right-4 z-40 flex flex-col items-end gap-2 lg:hidden">
        {fabOpen && (
          <div className="flex flex-col items-end gap-2">
            <Link
              href="/coach/students?invite=true"
              onClick={() => setFabOpen(false)}
              className="flex h-10 items-center gap-2 rounded-full border border-white/15 bg-[#0e0f12] px-4 text-xs font-medium text-white shadow-xl"
            >
              <UserPlus className="h-3.5 w-3.5 text-emerald-400" />
              Invitar Alumno
            </Link>
            <button
              type="button"
              onClick={() => {
                setFabOpen(false);
                openQuickModal("workout");
              }}
              className="flex h-10 items-center gap-2 rounded-full border border-white/15 bg-[#0e0f12] px-4 text-xs font-medium text-white shadow-xl"
            >
              <Dumbbell className="h-3.5 w-3.5 text-emerald-400" />
              Asignar Rutina
            </button>
            <button
              type="button"
              onClick={() => {
                setFabOpen(false);
                openQuickModal("renew");
              }}
              className="flex h-10 items-center gap-2 rounded-full border border-white/15 bg-[#0e0f12] px-4 text-xs font-medium text-white shadow-xl"
            >
              <RefreshCw className="h-3.5 w-3.5 text-emerald-400" />
              Renovar Plan
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={() => setFabOpen((o) => !o)}
          aria-expanded={fabOpen}
          aria-label={fabOpen ? "Cerrar acciones rápidas" : "Abrir acciones rápidas"}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-zinc-950 shadow-2xl transition hover:bg-zinc-200 active:scale-95"
        >
          {fabOpen ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}
