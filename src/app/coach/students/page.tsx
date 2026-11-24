"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Check,
  CheckCircle2,
  Copy,
  Inbox,
  Mail,
  Search,
  Send,
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

type FilterStatus =
  | "all"
  | "active"
  | "pending"
  | "expiring"
  | "verified"
  | "to_verify";

function CoachStudentsContent() {
  const searchParams = useSearchParams();
  const {
    students,
    subscriptionPlans,
    coachProfile,
    coachInquiries,
    inviteStudent,
    respondToCoachInquiry,
  } = useApp();

  const pendingInquiries = coachInquiries.filter(
    (i) => i.status === "pending" && (!coachProfile.id || i.coach_id === coachProfile.id)
  );

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [modalOpen, setModalOpen] = useState(
    searchParams.get("invite") === "true"
  );

  // Invite form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState<string>(
    subscriptionPlans[0]?.id || ""
  );
  const [planName, setPlanName] = useState(
    subscriptionPlans[0]?.name || "Plan Transformación 360°"
  );
  const [price, setPrice] = useState(
    String(subscriptionPlans[0]?.price ?? 1200)
  );
  const [goal, setGoal] = useState("Recomposición Corporal");
  const [sending, setSending] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteResult, setInviteResult] = useState<{
    email: string;
    link: string;
    mode: string;
    existingUser?: boolean;
    message?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const activeCount = students.filter((s) => s.invite_status === "active").length;
  const pendingCount = students.filter((s) => s.invite_status === "pending").length;
  const occupiedSlots = activeCount + pendingCount;
  const currentSaasPlan = getSaasPlanById(coachProfile.saas_plan_tier);
  const quota = canInviteMoreStudents(
    occupiedSlots,
    coachProfile.saas_plan_tier,
    coachProfile.saas_student_limit
  );

  useEffect(() => {
    if (!modalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [modalOpen]);

  const handlePlanPresetChange = (planId: string) => {
    setSelectedPlanId(planId);
    const matched = subscriptionPlans.find((p) => p.id === planId);
    if (matched) {
      setPlanName(matched.name);
      setPrice(String(matched.price));
    }
  };

  const filtered = students.filter((s) => {
    const matchesQuery =
      s.invited_name.toLowerCase().includes(query.toLowerCase()) ||
      s.invited_email.toLowerCase().includes(query.toLowerCase());
    if (!matchesQuery) return false;
    if (filter === "active") return s.invite_status === "active";
    if (filter === "pending") return s.invite_status === "pending";
    if (filter === "expiring")
      return (
        s.subscription_status === "pending_payment" ||
        s.subscription_status === "expired"
      );
    if (filter === "verified") return Boolean(s.is_verified_identity);
    if (filter === "to_verify") return !s.is_verified_identity;
    return true;
  });

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError(null);

    if (!quota.allowed && quota.limit !== null) {
      setInviteError(
        `Has alcanzado el cupo máximo de ${quota.limit} alumnos de tu plan ${currentSaasPlan.name}. Actualiza tu plan para invitar más alumnos.`
      );
      return;
    }

    setSending(true);
    const created = inviteStudent({
      name,
      email,
      planId: selectedPlanId || undefined,
      planName,
      price: Number(price) || 1000,
      goal,
    });

    try {
      const res = await fetch("/api/students/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          coachId: coachProfile.id,
          token: created.invite_token,
          planName,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setInviteError(data.error || "No se pudo enviar la invitación.");
        setSending(false);
        return;
      }
      setInviteResult({
        email,
        link:
          data.activationLink ||
          `/auth/activate?token=${created.invite_token}&email=${encodeURIComponent(
            email
          )}&name=${encodeURIComponent(name)}`,
        mode: data.mode || "demo",
        existingUser: data.existingUser,
        message: data.message,
      });
    } catch {
      setInviteResult({
        email,
        link: `/auth/activate?token=${created.invite_token}&email=${encodeURIComponent(
          email
        )}&name=${encodeURIComponent(name)}`,
        mode: "demo",
      });
    } finally {
      setSending(false);
      setName("");
      setEmail("");
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Mis Alumnos</h1>
          <p className="text-sm text-slate-400">
            Invita alumnos por correo y accede a su expediente 360°.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setInviteResult(null);
            setInviteError(null);
            setModalOpen(true);
          }}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:brightness-110 active:scale-[0.98]"
        >
          <UserPlus className="h-4 w-4" />
          Invitar Alumno por Correo
        </button>
      </div>

      {/* Live Plan Quota & Roster Counter Bar */}
      <div className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-800 bg-[#121212] p-4 sm:flex-row sm:items-center">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-cyan-500/15 px-2.5 py-0.5 text-[11px] font-bold text-cyan-300">
              {currentSaasPlan.name}
            </span>
            <span className="text-xs font-semibold text-white">
              {activeCount} activos · {pendingCount} invitación(es) pendiente(s)
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            {quota.limit === null
              ? "Tu plan Estudio / Gym incluye cupo ilimitado de alumnos."
              : `Cupo utilizado: ${occupiedSlots} de ${quota.limit} alumnos (${quota.remaining} disponibles).`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {quota.limit !== null && (
            <div className="w-32 sm:w-40">
              <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className={`h-full rounded-full transition-all ${
                    !quota.allowed
                      ? "bg-rose-500"
                      : occupiedSlots / quota.limit >= 0.8
                      ? "bg-amber-400"
                      : "bg-gradient-to-r from-emerald-400 to-cyan-400"
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
            href="/coach/plans?tab=saas"
            className="shrink-0 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-[11px] font-bold text-cyan-300 transition hover:border-cyan-500/50"
          >
            {quota.allowed ? "Ver mi plan" : "Ampliar cupo"}
          </Link>
        </div>
      </div>

      {inviteError && !modalOpen && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-300">
          {inviteError}
        </div>
      )}

      {/* Incoming Coaching Inquiries from Directory */}
      {pendingInquiries.length > 0 && (
        <section className="space-y-3 rounded-2xl border border-emerald-500/35 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/25 p-5">
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
                className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/80 p-4 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-white">
                      {inq.student_name}
                    </p>
                    <VerifiedPersonBadge verified={inq.student_is_verified} />
                    {inq.preferred_plan_name && (
                      <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-300">
                        {inq.preferred_plan_name}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {inq.student_email} · Meta:{" "}
                    <span className="text-slate-200">{inq.goal}</span>
                  </p>
                  <p className="text-xs italic text-slate-300">
                    &ldquo;{inq.message}&rdquo;
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => respondToCoachInquiry(inq.id, "accepted")}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 py-2 text-xs font-bold text-slate-950 transition hover:bg-emerald-400"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Aceptar Alumno
                  </button>
                  <button
                    type="button"
                    onClick={() => respondToCoachInquiry(inq.id, "declined")}
                    className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-400 transition hover:text-white"
                  >
                    Descartar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Search & Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar alumno por nombre o correo..."
            className="w-full rounded-xl border border-slate-800 bg-slate-900/90 py-2.5 pl-10 pr-9 text-sm text-white outline-none transition focus:border-cyan-500"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Limpiar búsqueda"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="no-scrollbar flex max-w-full gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(
            [
              { key: "all", label: "Todos" },
              { key: "active", label: "Activos" },
              { key: "verified", label: "Verificados" },
              { key: "to_verify", label: "Por verificar" },
              { key: "pending", label: "Pendientes" },
              { key: "expiring", label: "Por vencer" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key)}
              className={`shrink-0 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                filter === tab.key
                  ? "bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/40"
                  : "border border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
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
          const isPending = st.invite_status === "pending";
          return (
            <div
              key={st.id}
              className="flex min-w-0 flex-col justify-between gap-4 rounded-2xl border border-slate-800/90 bg-slate-900/70 p-4 transition hover:border-cyan-500/30"
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
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-800 text-sm font-bold text-cyan-400">
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
                    <p className="truncate text-xs text-slate-400">{st.invited_email}</p>
                    <p className="mt-0.5 truncate text-[11px] text-cyan-400">
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
                  className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                    isPending
                      ? "bg-amber-500/15 text-amber-300"
                      : st.subscription_status === "active"
                      ? "bg-emerald-500/15 text-emerald-300"
                      : "bg-rose-500/15 text-rose-300"
                  }`}
                >
                  {isPending
                    ? "Pendiente correo"
                    : st.subscription_status === "active"
                    ? "Suscripción Activa"
                    : "Pago pendiente"}
                </span>
              </div>

              <div className="flex items-center justify-between border-t border-slate-800 pt-3 text-xs">
                <div>
                  <p className="font-semibold text-slate-200">
                    {st.subscription_plan_name}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    ${st.subscription_price}/mes · Corte: {st.next_billing_date}
                  </p>
                </div>

                {st.student_id ? (
                  <Link
                    href={`/coach/students/${st.student_id}`}
                    className="rounded-xl bg-slate-800 px-3.5 py-2 text-xs font-bold text-cyan-300 transition hover:bg-cyan-500 hover:text-slate-950"
                  >
                    Expediente 360°
                  </Link>
                ) : (
                  <Link
                    href={`/auth/activate?token=${st.invite_token}&email=${encodeURIComponent(
                      st.invited_email
                    )}&name=${encodeURIComponent(st.invited_name)}`}
                    className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/20"
                  >
                    Abrir Enlace Activación
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-8 text-center">
          <p className="text-sm font-bold text-white">
            {students.length === 0
              ? "Aún no tienes alumnos registrados"
              : "No encontramos alumnos con ese filtro"}
          </p>
          <p className="mt-1 text-xs text-slate-400">
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
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-700"
              >
                Limpiar filtros
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setInviteResult(null);
                  setModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-4 py-2.5 text-xs font-bold text-slate-950"
              >
                <UserPlus className="h-4 w-4" />
                Invitar Primer Alumno
              </button>
            )}
          </div>
        </div>
      )}

      {/* Invite Student Modal */}
      {modalOpen && (
        <div
          onClick={() => setModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl"
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                Invitar Alumno por Correo
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Cerrar modal"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {inviteResult ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-200">
                  <p className="font-bold text-emerald-300">
                    {inviteResult.existingUser
                      ? `Enlace de vinculación listo para ${inviteResult.email}`
                      : `¡Invitación enviada a ${inviteResult.email}!`}
                  </p>
                  <p className="mt-1 leading-relaxed text-emerald-200/80">
                    {inviteResult.message ||
                      "Cuando el alumno abra su enlace podrá definir su contraseña, aceptar Términos y Condiciones y quedar vinculado automáticamente contigo."}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-400">
                    Enlace de activación ({inviteResult.mode === "supabase" ? "Supabase" : "Demo local"}):
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={inviteResult.link}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-cyan-300"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopy(inviteResult.link)}
                      className="rounded-xl border border-slate-700 bg-slate-800 p-2 text-slate-200 hover:bg-slate-700"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Link
                    href={inviteResult.link}
                    className="flex-1 rounded-xl bg-emerald-500 py-2.5 text-center text-xs font-bold text-slate-950"
                  >
                    Probar Activación Ahora
                  </Link>
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-white"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleInviteSubmit} className="space-y-4">
                {inviteError && (
                  <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-300">
                    <p>{inviteError}</p>
                    <Link
                      href="/coach/plans?tab=saas"
                      className="mt-1.5 inline-block font-bold text-cyan-300 underline"
                    >
                      Ver planes disponibles en MXN →
                    </Link>
                  </div>
                )}
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-300">
                    Nombre completo del alumno *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Andrea López"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-300">
                    Correo electrónico *
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="andrea@correo.com"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-9 pr-3.5 text-sm text-white outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
                {subscriptionPlans.length > 0 && (
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-300">
                      Paquete configurado
                    </label>
                    <select
                      value={selectedPlanId}
                      onChange={(e) => handlePlanPresetChange(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-white outline-none focus:border-cyan-500"
                    >
                      {subscriptionPlans.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} — ${p.price} ({p.duration_days} días)
                        </option>
                      ))}
                      <option value="">Personalizado...</option>
                    </select>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-300">
                      Plan de Suscripción
                    </label>
                    <input
                      type="text"
                      value={planName}
                      onChange={(e) => setPlanName(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-white outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-300">
                      Costo mensual ($)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-white outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-300">
                    Objetivo inicial
                  </label>
                  <input
                    type="text"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder="Hipertrofia, Definición, Recomposición..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-cyan-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={sending}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 py-3 text-sm font-bold text-slate-950"
                >
                  <Send className="h-4 w-4" />
                  {sending ? "Enviando invitación..." : "Enviar Invitación"}
                </button>
              </form>
            )}
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
        <div className="py-10 text-center text-sm text-slate-400">
          Cargando alumnos...
        </div>
      }
    >
      <CoachStudentsContent />
    </Suspense>
  );
}
