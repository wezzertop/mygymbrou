"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Crown,
  Dumbbell,
  Plus,
  RefreshCw,
  UserPlus,
  Users,
  Utensils,
  X,
} from "lucide-react";
import { getDaysRemaining, useApp } from "@/context/AppContext";
import { canInviteMoreStudents, getSaasPlanById } from "@/lib/saas-plans";

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
      showToast("Rutina asignada y notificada al alumno al instante.");
    } else if (quickModal === "diet" && selectedTemplateId && targetStudentId) {
      assignNutritionToStudent(selectedTemplateId, targetStudentId);
      showToast("Plan nutricional actualizado y enviado al alumno.");
    } else if (
      quickModal === "renew" &&
      selectedTemplateId &&
      targetRelationId
    ) {
      assignSubscriptionPlanToStudent(targetRelationId, selectedTemplateId);
      showToast("Plan de alumno renovado con éxito.");
    }
    setQuickModal(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
            {coachProfile.brand_name || "Panel de Control"}
          </p>
          <h1 className="mt-1 text-2xl font-extrabold text-white sm:text-3xl">
            Hola, {coachProfile.full_name.split(" ")[0]}
          </h1>
          <p className="text-sm text-slate-400">
            Acciones diarias rápidas, cartera de alumnos y citas en un vistazo.
          </p>
        </div>

        <Link
          href="/coach/plans?tab=saas"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-2xl border border-slate-800 bg-[#121212] px-3.5 py-2 text-xs font-semibold text-slate-200 transition hover:border-cyan-500/40"
        >
          <Crown className="h-4 w-4 text-emerald-400" />
          <span>{currentSaasPlan.name}</span>
          <span className="rounded-full bg-cyan-500/15 px-2 py-0.5 text-[11px] font-bold text-cyan-300">
            {quota.limit === null
              ? `${occupiedSlots} / ∞`
              : `${occupiedSlots} / ${quota.limit}`}
          </span>
        </Link>
      </div>

      {/* Toast Feedback */}
      {toast && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-3 text-xs font-semibold text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {toast}
        </div>
      )}

      {/* Daily Quick Actions Bar (Zero Friction) */}
      <section aria-label="Acciones rápidas del Coach">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
          <Link
            href="/coach/students?invite=true"
            className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-3 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:brightness-110 active:scale-[0.98]"
          >
            <UserPlus className="h-4 w-4 shrink-0" />
            <span>Invitar Alumno</span>
          </Link>
          <button
            type="button"
            onClick={() => openQuickModal("workout")}
            className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border border-slate-800 bg-[#121212] px-3 py-2.5 text-xs font-bold text-white transition hover:border-emerald-500/40 active:scale-[0.98]"
          >
            <Dumbbell className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>Asignar Rutina</span>
          </button>
          <button
            type="button"
            onClick={() => openQuickModal("diet")}
            className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border border-slate-800 bg-[#121212] px-3 py-2.5 text-xs font-bold text-white transition hover:border-cyan-500/40 active:scale-[0.98]"
          >
            <Utensils className="h-4 w-4 shrink-0 text-cyan-400" />
            <span>Actualizar Dieta</span>
          </button>
          <Link
            href={newAssessmentHref}
            className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border border-slate-800 bg-[#121212] px-3 py-2.5 text-xs font-bold text-white transition hover:border-emerald-500/40 active:scale-[0.98]"
          >
            <Activity className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>Evaluación</span>
          </Link>
          <Link
            href="/coach/agenda"
            className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border border-slate-800 bg-[#121212] px-3 py-2.5 text-xs font-bold text-white transition hover:border-cyan-500/40 active:scale-[0.98]"
          >
            <Calendar className="h-4 w-4 shrink-0 text-cyan-400" />
            <span>Agendar Cita</span>
          </Link>
          <button
            type="button"
            onClick={() => openQuickModal("renew")}
            className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border border-slate-800 bg-[#121212] px-3 py-2.5 text-xs font-bold text-white transition hover:border-amber-500/40 active:scale-[0.98]"
          >
            <RefreshCw className="h-4 w-4 shrink-0 text-amber-400" />
            <span>Renovar Plan</span>
          </button>
        </div>
      </section>

      {/* KPIs Grid */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <Link
          href="/coach/students"
          className="rounded-2xl border border-slate-800/90 bg-[#121212] p-4 transition hover:border-cyan-500/40"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              Alumnos Activos
            </span>
            <Users className="h-4 w-4 text-cyan-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-white">
            {activeStudents.length}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            +{pendingInvites.length} invitación(es) pendiente(s)
          </p>
        </Link>

        <Link
          href="/coach/plans"
          className="rounded-2xl border border-slate-800/90 bg-[#121212] p-4 transition hover:border-emerald-500/40"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              Ingresos Activos
            </span>
            <CreditCard className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-400">
            ${monthlyRevenue.toLocaleString("es-MX")}
          </p>
          <p className="mt-1 text-[11px] text-amber-400">
            {expiringCount} por vencer · {expiredCount} vencido(s)
          </p>
        </Link>

        <Link
          href="/coach/agenda"
          className="rounded-2xl border border-slate-800/90 bg-[#121212] p-4 transition hover:border-cyan-500/40"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              Próximas Citas
            </span>
            <Calendar className="h-4 w-4 text-cyan-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-white">
            {upcomingAppointments.length}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            Valoraciones y check-ins
          </p>
        </Link>

        <Link
          href={newAssessmentHref}
          className="rounded-2xl border border-slate-800/90 bg-[#121212] p-4 transition hover:border-emerald-500/40"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              Evaluaciones
            </span>
            <Activity className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-white">
            {assessments.length}
          </p>
          <p className="mt-1 text-[11px] text-emerald-400">
            Historial antropométrico
          </p>
        </Link>
      </div>

      {/* Main Two-Column Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Alertas de Alumnos y Suscripciones con Filtros Rápidos */}
        <section className="min-w-0 rounded-2xl border border-slate-800/90 bg-[#121212] p-4 sm:p-5 lg:col-span-7">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold text-white">
              Estado de Cartera
            </h2>
            <Link
              href="/coach/students"
              className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300"
            >
              Ver todos
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Quick Status Filters */}
          <div className="no-scrollbar mb-4 flex gap-1.5 overflow-x-auto pb-1">
            {(
              [
                { key: "all", label: `Todos (${students.length})` },
                { key: "active", label: "Activo" },
                { key: "expiring", label: `Por vencer (${expiringCount})` },
                { key: "expired", label: `Vencido (${expiredCount})` },
                { key: "pending", label: `Pendiente (${pendingInvites.length})` },
              ] as const
            ).map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setRosterFilter(f.key)}
                className={`min-h-[36px] shrink-0 rounded-xl px-3 text-xs font-bold transition ${
                  rosterFilter === f.key
                    ? "bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/40"
                    : "border border-slate-800 bg-[#0a0a0a] text-slate-400 hover:text-white"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="space-y-2.5">
            {filteredStudents.map((st) => {
              const targetId = st.student_id || st.id;
              const expired = isExpired(st);
              const expiring = isExpiringSoon(st);
              return (
                <div
                  key={st.id}
                  className="flex flex-col justify-between gap-2.5 rounded-xl border border-slate-800 bg-[#0a0a0a] p-3 sm:flex-row sm:items-center"
                >
                  <Link
                    href={
                      st.student_id
                        ? `/coach/students/${targetId}`
                        : "/coach/students"
                    }
                    className="flex min-w-0 flex-1 items-center gap-3"
                  >
                    {st.avatar_url ? (
                      <img
                        src={st.avatar_url}
                        alt={st.invited_name}
                        className="h-10 w-10 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-cyan-400">
                        {st.invited_name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">
                        {st.invited_name}
                      </p>
                      <p className="truncate text-xs text-slate-400">
                        {st.subscription_plan_name} · Vence{" "}
                        {st.expires_at || st.next_billing_date}
                      </p>
                    </div>
                  </Link>

                  <div className="flex items-center justify-between gap-2 sm:justify-end">
                    {st.invite_status === "pending" ? (
                      <span className="shrink-0 rounded-full bg-amber-500/15 px-2.5 py-1 text-[10px] font-bold text-amber-300">
                        Invitación pendiente
                      </span>
                    ) : expired ? (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-rose-500/15 px-2.5 py-1 text-[10px] font-bold text-rose-300">
                        <AlertTriangle className="h-3 w-3" />
                        Vencido
                      </span>
                    ) : expiring ? (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 text-[10px] font-bold text-amber-300">
                        <AlertTriangle className="h-3 w-3" />
                        Por vencer
                      </span>
                    ) : (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold text-emerald-300">
                        <CheckCircle2 className="h-3 w-3" />
                        Activo
                      </span>
                    )}

                    {(expired || expiring) && (
                      <button
                        type="button"
                        onClick={() => openQuickModal("renew", st.id)}
                        className="min-h-[34px] rounded-lg bg-emerald-500/15 px-2.5 text-[11px] font-bold text-emerald-300 transition hover:bg-emerald-500 hover:text-slate-950"
                      >
                        Renovar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {filteredStudents.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-800 py-6 text-center">
                <p className="text-sm text-slate-400">
                  No hay alumnos en esta categoría.
                </p>
                {students.length === 0 && (
                  <Link
                    href="/coach/students?invite=true"
                    className="mt-3 inline-flex min-h-[42px] items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-4 py-2 text-xs font-bold text-slate-950"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    Invitar Primer Alumno
                  </Link>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Próximas Citas */}
        <section className="min-w-0 rounded-2xl border border-slate-800/90 bg-[#121212] p-4 sm:p-5 lg:col-span-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-white">
              Agenda Próxima
            </h2>
            <Link
              href="/coach/agenda"
              className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300"
            >
              Ver agenda
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {upcomingAppointments.slice(0, 4).map((apt) => (
              <div
                key={apt.id}
                className="flex flex-col justify-between gap-2 rounded-xl border border-slate-800 bg-[#0a0a0a] p-3.5"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-cyan-500/15 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
                      {apt.student_name}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Clock className="h-3 w-3" />
                      {new Date(apt.scheduled_at).toLocaleString("es-MX", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-white">{apt.title}</p>
                  <p className="text-xs text-slate-400">{apt.location_or_link}</p>
                </div>
                <Link
                  href={`/coach/students/${apt.student_id}`}
                  className="inline-flex min-h-[38px] items-center justify-center rounded-lg border border-slate-700 bg-slate-900 px-3 text-xs font-semibold text-slate-200 transition hover:border-cyan-500/40"
                >
                  Abrir Expediente
                </Link>
              </div>
            ))}
            {upcomingAppointments.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-800 py-6 text-center">
                <p className="text-sm text-slate-400">
                  No tienes citas programadas por ahora.
                </p>
                <Link
                  href="/coach/agenda"
                  className="mt-3 inline-flex min-h-[42px] items-center gap-1.5 rounded-xl bg-cyan-500/15 px-3.5 py-2 text-xs font-bold text-cyan-300 transition hover:bg-cyan-500/25"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Programar primera cita
                </Link>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Quick Action Modal (Asignar Rutina / Actualizar Dieta / Renovar Plan) */}
      {quickModal && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setQuickModal(null)}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-3 backdrop-blur-sm sm:items-center sm:p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl border border-slate-800 bg-[#121212] p-5 shadow-2xl sm:p-6"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-white">
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
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleQuickActionSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                  Selecciona el alumno
                </label>
                {quickModal === "renew" ? (
                  <select
                    required
                    value={targetRelationId}
                    onChange={(e) => setTargetRelationId(e.target.value)}
                    className="min-h-[44px] w-full rounded-xl border border-slate-700 bg-[#0a0a0a] px-3 text-white outline-none focus:border-cyan-500"
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
                    className="min-h-[44px] w-full rounded-xl border border-slate-700 bg-[#0a0a0a] px-3 text-white outline-none focus:border-cyan-500"
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
                <label className="mb-1.5 block text-xs font-semibold text-slate-300">
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
                  className="min-h-[44px] w-full rounded-xl border border-slate-700 bg-[#0a0a0a] px-3 text-white outline-none focus:border-cyan-500"
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
                className="min-h-[48px] w-full rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-sm font-bold text-slate-950 shadow-lg transition hover:brightness-110"
              >
                Confirmar y Notificar al Alumno
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Mobile Floating Action Button (FAB) */}
      {fabOpen && (
        <div
          aria-hidden="true"
          onClick={() => setFabOpen(false)}
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-[1px] lg:hidden"
        />
      )}
      <div className="fixed bottom-24 right-4 z-40 flex flex-col items-end gap-2 lg:hidden">
        {fabOpen && (
          <div className="flex flex-col items-end gap-2">
            <Link
              href="/coach/students?invite=true"
              onClick={() => setFabOpen(false)}
              className="flex min-h-[44px] items-center gap-2 rounded-full border border-cyan-500/40 bg-[#121212] px-4 text-xs font-bold text-cyan-300 shadow-xl"
            >
              <UserPlus className="h-4 w-4" />
              Invitar Alumno
            </Link>
            <button
              type="button"
              onClick={() => {
                setFabOpen(false);
                openQuickModal("workout");
              }}
              className="flex min-h-[44px] items-center gap-2 rounded-full border border-emerald-500/40 bg-[#121212] px-4 text-xs font-bold text-emerald-300 shadow-xl"
            >
              <Dumbbell className="h-4 w-4" />
              Asignar Rutina
            </button>
            <button
              type="button"
              onClick={() => {
                setFabOpen(false);
                openQuickModal("renew");
              }}
              className="flex min-h-[44px] items-center gap-2 rounded-full border border-amber-500/40 bg-[#121212] px-4 text-xs font-bold text-amber-300 shadow-xl"
            >
              <RefreshCw className="h-4 w-4" />
              Renovar Plan
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={() => setFabOpen((o) => !o)}
          aria-expanded={fabOpen}
          aria-label={fabOpen ? "Cerrar acciones rápidas" : "Abrir acciones rápidas"}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 shadow-2xl shadow-cyan-500/30 transition hover:scale-105 active:scale-95"
        >
          {fabOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
        </button>
      </div>
    </div>
  );
}
