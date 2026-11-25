"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Inbox,
  Search,
  UserMinus,
  UserPlus,
  X,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  canInviteMoreStudents,
  getSaasPlanById,
} from "@/lib/saas-plans";
import {
  VerificationStatusPill,
  VerifiedPersonBadge,
} from "@/components/VerificationBadge";
import { InviteStudentModal } from "@/components/InviteStudentModal";
import { isPendingInviteStatus } from "@/lib/student-record-constants";

type FilterStatus =
  | "all"
  | "active"
  | "pending"
  | "expiring"
  | "verified"
  | "to_verify"
  | "ended";

function CoachStudentsContent() {
  const searchParams = useSearchParams();
  const {
    students,
    coachProfile,
    coachInquiries,
    endStudentCoaching,
    respondToCoachInquiry,
  } = useApp();

  const pendingInquiries = coachInquiries.filter(
    (i) => i.status === "pending" && (!coachProfile.id || i.coach_id === coachProfile.id)
  );

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("active");
  const [modalOpen, setModalOpen] = useState(
    searchParams.get("invite") === "true"
  );

  const [endingRelation, setEndingRelation] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [endReason, setEndReason] = useState("");
  const [statusToast, setStatusToast] = useState<string | null>(null);

  const activeCount = students.filter((s) => s.invite_status === "active").length;
  const pendingCount = students.filter((s) =>
    isPendingInviteStatus(s.invite_status)
  ).length;
  const endedCount = students.filter(
    (s) => s.invite_status === "finalizado" || s.invite_status === "inactive"
  ).length;
  const occupiedSlots = activeCount + pendingCount;
  const currentSaasPlan = getSaasPlanById(coachProfile.saas_plan_tier);
  const quota = canInviteMoreStudents(
    occupiedSlots,
    coachProfile.saas_plan_tier,
    coachProfile.saas_student_limit
  );

  const filtered = students.filter((s) => {
    const matchesQuery =
      s.invited_name.toLowerCase().includes(query.toLowerCase()) ||
      s.invited_email.toLowerCase().includes(query.toLowerCase());
    if (!matchesQuery) return false;
    if (filter === "active")
      return s.invite_status === "active" && Boolean(s.student_id);
    if (filter === "pending") return isPendingInviteStatus(s.invite_status);
    if (filter === "expiring")
      return (
        s.invite_status === "active" &&
        (s.subscription_status === "pending_payment" ||
          s.subscription_status === "expired")
      );
    if (filter === "verified")
      return s.invite_status === "active" && Boolean(s.is_verified_identity);
    if (filter === "to_verify")
      return s.invite_status === "active" && !s.is_verified_identity;
    if (filter === "ended")
      return s.invite_status === "finalizado" || s.invite_status === "inactive";
    return true;
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
          Alumnos
        </h1>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-[#00FF90] px-4 text-xs font-bold text-zinc-950 transition hover:bg-[#48b73d] active:scale-[0.98]"
        >
          <UserPlus className="h-4 w-4" />
          Invitar alumno
        </button>
      </div>

      {/* Live Plan Quota & Roster Counter Bar */}
      <div className="flex flex-col justify-between gap-3 rounded-xl border border-white/[0.08] bg-[#0e0f12] p-3.5 sm:flex-row sm:items-center sm:p-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
              {currentSaasPlan.name}
            </span>
            <span className="text-xs font-medium text-zinc-200">
              {activeCount} activos · {pendingCount} pendientes
            </span>
          </div>
          <p className="text-[11px] text-zinc-400">
            {quota.limit === null
              ? "Cupo ilimitado de alumnos."
              : `Cupo: ${occupiedSlots} de ${quota.limit} alumnos`}
          </p>
        </div>
        <div className="flex items-center justify-between gap-3 sm:justify-end">
          {quota.limit !== null && (
            <div className="flex-1 sm:w-36 sm:flex-none">
              <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className={`h-full rounded-full transition-all ${
                    !quota.allowed
                      ? "bg-rose-500"
                      : occupiedSlots / quota.limit >= 0.8
                      ? "bg-amber-400"
                      : "bg-emerald-400"
                  }`}
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
          <Link
            href={
              quota.allowed
                ? "/coach/plans?tab=saas"
                : "/coach/plans?tab=saas&reason=students"
            }
            className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-[11px] font-bold transition ${
              quota.allowed
                ? "border border-white/15 bg-[#060607] text-emerald-300 hover:border-white/25"
                : "bg-emerald-500 text-[#0a0a0a] hover:bg-emerald-400"
            }`}
          >
            {quota.allowed ? "Mi plan" : "Subir de plan →"}
          </Link>
        </div>
      </div>

      {/* Incoming Coaching Inquiries from Directory */}
      {pendingInquiries.length > 0 && (
        <section className="space-y-3 rounded-xl border border-white/[0.08] bg-[#0e0f12] p-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Inbox className="h-4 w-4 text-emerald-400" />
              <h2 className="text-sm font-extrabold text-white">
                Solicitudes de Alumnos Buscando Coach ({pendingInquiries.length})
              </h2>
            </div>
            <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
              Desde el Directorio
            </span>
          </div>

          <div className="grid gap-3">
            {pendingInquiries.map((inq) => (
              <div
                key={inq.id}
                className="flex flex-col justify-between gap-3 rounded-xl border border-white/[0.08] bg-[#060607] p-4 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-white">
                      {inq.student_name}
                    </p>
                    <VerifiedPersonBadge verified={inq.student_is_verified} />
                    {inq.preferred_plan_name && (
                      <span className="rounded-full border border-white/[0.08] bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                        {inq.preferred_plan_name}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    {inq.student_email} · Meta:{" "}
                    <span className="text-zinc-200">{inq.goal}</span>
                  </p>
                  <p className="text-xs italic text-zinc-300">
                    &ldquo;{inq.message}&rdquo;
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => respondToCoachInquiry(inq.id, "accepted")}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 py-2 text-xs font-bold text-zinc-950 transition hover:bg-emerald-400"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Aceptar Alumno
                  </button>
                  <button
                    type="button"
                    onClick={() => respondToCoachInquiry(inq.id, "declined")}
                    className="rounded-xl border border-white/15 bg-[#0e0f12] px-3 py-2 text-xs font-semibold text-zinc-400 transition hover:text-white"
                  >
                    Descartar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {statusToast && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs font-medium text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {statusToast}
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar alumno..."
            className="w-full rounded-xl border border-white/[0.08] bg-[#0e0f12] py-2.5 pl-10 pr-9 text-sm text-white outline-none transition focus:border-emerald-500/60"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Limpiar búsqueda"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-zinc-400 hover:bg-white/[0.06] hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="no-scrollbar flex max-w-full gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(
            [
              { key: "active", label: `Activos (${activeCount})` },
              { key: "pending", label: `Pendientes (${pendingCount})` },
              { key: "expiring", label: "Por vencer" },
              { key: "verified", label: "Verificados" },
              { key: "to_verify", label: "Sin verificar" },
              { key: "ended", label: `Finalizados (${endedCount})` },
              { key: "all", label: "Todos" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key)}
              className={`h-9 shrink-0 whitespace-nowrap rounded-lg px-3 text-xs font-medium transition ${
                filter === tab.key
                  ? "bg-emerald-500 text-zinc-950 font-semibold"
                  : "border border-white/10 bg-[#0e0f12] text-zinc-400 hover:border-white/25 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Students List */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {filtered.map((st) => {
          const isPending = isPendingInviteStatus(st.invite_status);
          const isPendingAcceptance = st.invite_status === "pending_acceptance";
          const isEnded =
            st.invite_status === "finalizado" || st.invite_status === "inactive";
          return (
            <div
              key={st.id}
              className="flex min-w-0 flex-col justify-between gap-4 rounded-xl border border-white/[0.08] bg-[#0e0f12] p-4 transition hover:border-white/[0.08]"
            >
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  {st.avatar_url ? (
                    <img
                      src={st.avatar_url}
                      alt={st.invited_name}
                      className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-slate-700"
                    />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-sm font-bold text-emerald-400">
                      {st.invited_name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h2 className="truncate text-base font-bold text-white">
                        {st.invited_name}
                      </h2>
                      <VerifiedPersonBadge
                        verified={st.is_verified_identity}
                        compact
                      />
                    </div>
                    <p className="truncate text-xs text-zinc-400">{st.invited_email}</p>
                    <p className="mt-0.5 truncate text-[11px] text-emerald-400">
                      {st.fitness_goal || "Objetivo general"}
                    </p>
                    <div className="mt-1.5">
                      <VerificationStatusPill
                        status={
                          st.verification_status ||
                          (st.is_verified_identity ? "verified" : "unverified")
                        }
                      />
                    </div>
                  </div>
                </div>

                <span
                  className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-bold ${
                    isEnded
                      ? "bg-zinc-500/15 text-zinc-400"
                      : isPending
                      ? "bg-amber-500/15 text-amber-300"
                      : st.subscription_status === "active"
                      ? "bg-emerald-500/15 text-emerald-300"
                      : "bg-rose-500/15 text-rose-300"
                  }`}
                >
                  {isEnded
                    ? "Finalizado"
                    : isPendingAcceptance
                    ? "Esperando aceptación"
                    : isPending
                    ? "Pendiente registro"
                    : st.subscription_status === "active"
                    ? "Activo"
                    : "Pago pendiente"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-white/[0.08] pt-3 text-xs">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-zinc-200">
                    {st.subscription_plan_name}
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    {isEnded && st.ended_at
                      ? `Finalizado el ${st.ended_at.split("T")[0]}`
                      : `$${st.subscription_price}/mes · Corte: ${st.next_billing_date}`}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  {!isEnded && (
                    <button
                      type="button"
                      onClick={() => {
                        setEndReason("");
                        setEndingRelation({ id: st.id, name: st.invited_name });
                      }}
                      title="Finalizar asesoramiento"
                      aria-label={`Finalizar asesoramiento de ${st.invited_name}`}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-zinc-400 transition hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-300"
                    >
                      <UserMinus className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {st.student_id ? (
                    <Link
                      href={`/coach/students/${st.student_id}`}
                      className="shrink-0 whitespace-nowrap rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500 hover:text-zinc-950"
                    >
                      Ver expediente
                    </Link>
                  ) : (
                    <Link
                      href={`/auth/activate?token=${st.invite_token}&email=${encodeURIComponent(
                        st.invited_email
                      )}&name=${encodeURIComponent(st.invited_name)}`}
                      className="shrink-0 whitespace-nowrap rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/20"
                    >
                      Enlace
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-xl border border-dashed border-white/[0.08] bg-[#0e0f12]/40 p-8 text-center">
          <p className="text-sm font-bold text-white">
            {students.length === 0
              ? "Aún no tienes alumnos registrados"
              : "No encontramos alumnos con ese filtro"}
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            {students.length === 0
              ? "Envía una invitación por correo para vincular a tu primer alumno."
              : "Prueba ajustando la búsqueda o seleccionando otra pestaña."}
          </p>
          <div className="mt-4 flex justify-center gap-2">
            {students.length > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setFilter("all");
                }}
                className="rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2 text-xs font-bold text-white transition hover:bg-white/[0.12]"
              >
                Limpiar filtros
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#00FF90] hover:bg-[#48b73d] px-4 py-2.5 text-xs font-bold text-zinc-950"
              >
                <UserPlus className="h-4 w-4" />
                Invitar Primer Alumno
              </button>
            )}
          </div>
        </div>
      )}

      {/* Invite Student Modal (2-Level Smart Modal) */}
      <InviteStudentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />

      {/* Confirm End Coaching Modal */}
      {endingRelation && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Finalizar asesoramiento"
          onClick={() => setEndingRelation(null)}
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
                  <strong className="text-white">{endingRelation.name}</strong>.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEndingRelation(null)}
                aria-label="Cerrar"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-white/[0.06] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-3 text-xs text-zinc-300">
              <p>
                • <strong className="text-emerald-400">Libera 1 cupo</strong> en tu
                plan inmediatamente para invitar a otro alumno.
              </p>
              <p>
                • <strong className="text-white">Historial íntegro:</strong> el alumno
                conservará sus medidas, evaluaciones y registros en su cuenta personal.
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

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setEndingRelation(null)}
                className="h-10 flex-1 rounded-xl border border-white/15 text-xs font-semibold text-zinc-300 transition hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  endStudentCoaching(endingRelation.id, endReason);
                  setStatusToast(
                    `Asesoramiento de ${endingRelation.name} finalizado. Se liberó 1 cupo en tu plan.`
                  );
                  setTimeout(() => setStatusToast(null), 4000);
                  setEndingRelation(null);
                }}
                className="h-10 flex-1 rounded-xl bg-rose-500 text-xs font-bold text-white transition hover:bg-rose-400"
              >
                Confirmar baja
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CoachStudentsPage() {
  return (
    <Suspense
      fallback={
        <div className="py-10 text-center text-sm text-zinc-400">
          Cargando alumnos...
        </div>
      }
    >
      <CoachStudentsContent />
    </Suspense>
  );
}
