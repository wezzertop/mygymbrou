"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Award,
  BadgeCheck,
  Ban,
  Building2,
  CheckCircle2,
  Dumbbell,
  ExternalLink,
  Flag,
  Gift,
  Landmark,
  Lock,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Undo2,
  XCircle,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  CoachCertification,
  PaymentRequestStatus,
  Profile,
  ReportStatus,
  SaasPaymentRequest,
  SanctionType,
  UserReport,
  UserSanction,
} from "@/types/database";
import { getSaasPlanById } from "@/lib/saas-plans";
import { DEFAULT_APPROVED_GYMS, GymRecord } from "@/lib/coach-catalogs";
import { DEFAULT_PROMO_CODES, PromoCodeRecord } from "@/lib/referrals";

type AdminTab = "pagos" | "verificaciones" | "gimnasios" | "codigos" | "reportes" | "sanciones";

const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  pendiente: "Pendiente",
  en_revision: "En revisión",
  resuelto: "Resuelto",
  descartado: "Descartado",
};

const SANCTION_LABELS: Record<SanctionType, string> = {
  warning: "Advertencia formal",
  temporary_suspension: "Suspensión temporal",
  permanent_ban: "Suspensión indefinida / Baneo",
};

export default function AdminDashboardPage() {
  const {
    hydrated,
    isDemoMode,
    authUserRole,
    coachProfile,
    studentProfile,
    directoryCoaches,
    coachCertifications,
    userReports,
    userSanctions,
    updateReportStatus,
    issueSanction,
    liftSanction,
  } = useApp();

  const [tab, setTab] = useState<AdminTab>("pagos");
  const [loading, setLoading] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Real Supabase admin data
  const [dbProfiles, setDbProfiles] = useState<Profile[]>([]);
  const [dbCerts, setDbCerts] = useState<CoachCertification[]>([]);
  const [dbReports, setDbReports] = useState<UserReport[]>([]);
  const [dbSanctions, setDbSanctions] = useState<UserSanction[]>([]);
  const [dbPayments, setDbPayments] = useState<SaasPaymentRequest[]>([]);
  const [gymsList, setGymsList] = useState<GymRecord[]>(DEFAULT_APPROVED_GYMS);
  const [gymEdits, setGymEdits] = useState<Record<string, { name: string; city: string }>>({});
  const [promoCodes, setPromoCodes] = useState<PromoCodeRecord[]>(DEFAULT_PROMO_CODES);
  const [newPromoCode, setNewPromoCode] = useState("");
  const [newPromoDesc, setNewPromoDesc] = useState("");
  const [newPromoType, setNewPromoType] = useState<"percent" | "fixed_mxn">("percent");
  const [newPromoValue, setNewPromoValue] = useState("25");
  const [newPromoMaxUses, setNewPromoMaxUses] = useState("100");
  const [paymentFilter, setPaymentFilter] = useState<
    PaymentRequestStatus | "all"
  >("all");
  const [paymentNotes, setPaymentNotes] = useState<Record<string, string>>({});

  // Verification rejection reason per coach
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({});

  // Report filters & admin notes
  const [reportFilter, setReportFilter] = useState<ReportStatus | "all">("all");
  const [reportNotesDraft, setReportNotesDraft] = useState<
    Record<string, string>
  >({});

  // New Sanction Form
  const [selectedUserId, setSelectedUserId] = useState("");
  const [sanctionType, setSanctionType] = useState<SanctionType>("warning");
  const [durationDays, setDurationDays] = useState("7");
  const [sanctionReason, setSanctionReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const loadGyms = useCallback(async () => {
    try {
      const res = await fetch("/api/gyms?includePending=true");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.gyms)) setGymsList(data.gyms);
      }
    } catch {
      // keep fallback
    }
  }, []);

  const loadPromoCodes = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/promo-codes");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.codes)) setPromoCodes(data.codes);
      }
    } catch {
      // keep fallback
    }
  }, []);

  useEffect(() => {
    loadGyms();
    loadPromoCodes();
  }, [loadGyms, loadPromoCodes]);

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromoCode.trim()) return;
    const res = await fetch("/api/admin/promo-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: newPromoCode.trim().toUpperCase(),
        description: newPromoDesc.trim() || undefined,
        discount_type: newPromoType,
        discount_value: Number(newPromoValue) || 25,
        max_uses: newPromoMaxUses ? Number(newPromoMaxUses) : null,
      }),
    });
    const data = await res.json();
    if (res.ok && data.code) {
      setPromoCodes((prev) => [data.code, ...prev]);
      setNewPromoCode("");
      setNewPromoDesc("");
      showToast(`Código promocional "${data.code.code}" creado.`);
    } else {
      showToast(data.error || "No se pudo crear el código.");
    }
  };

  const handleTogglePromo = async (promo: PromoCodeRecord) => {
    const nextActive = !promo.is_active;
    const res = await fetch("/api/admin/promo-codes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: promo.id, is_active: nextActive }),
    });
    if (res.ok) {
      setPromoCodes((prev) =>
        prev.map((p) => (p.id === promo.id ? { ...p, is_active: nextActive } : p))
      );
      showToast(
        nextActive
          ? `Código "${promo.code}" activado.`
          : `Código "${promo.code}" desactivado.`
      );
    }
  };

  const handleGymAction = async (
    gym: GymRecord,
    status: "approved" | "rejected"
  ) => {
    const edited = gymEdits[gym.id];
    const nextName = edited?.name?.trim() || gym.name;
    const nextCity = edited?.city !== undefined ? edited.city.trim() : gym.city || "";
    const res = await fetch("/api/gyms", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: gym.id,
        status,
        name: nextName,
        city: nextCity,
      }),
    });
    if (res.ok) {
      setGymsList((prev) =>
        prev.map((g) =>
          g.id === gym.id
            ? { ...g, status, name: nextName, city: nextCity || null }
            : g
        )
      );
      showToast(
        status === "approved"
          ? `Gimnasio "${nextName}" aprobado en el catálogo oficial.`
          : `Gimnasio "${nextName}" rechazado.`
      );
    }
  };

  const pendingGymsCount = gymsList.filter((g) => g.status === "pending").length;

  const loadAdminData = useCallback(async () => {
    if (isDemoMode) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/moderation");
      if (res.status === 401 || res.status === 403) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setDbProfiles(data.profiles || []);
        setDbCerts(data.certifications || []);
        setDbReports(data.reports || []);
        setDbSanctions(data.sanctions || []);
        setDbPayments(data.paymentRequests || []);
        setAccessDenied(false);
      }
    } catch {
      // ignore network error
    } finally {
      setLoading(false);
    }
  }, [isDemoMode]);

  useEffect(() => {
    if (!hydrated) return;
    if (!isDemoMode && authUserRole !== "admin") {
      setAccessDenied(true);
      return;
    }
    loadAdminData();
  }, [hydrated, isDemoMode, authUserRole, loadAdminData]);

  // Unified data source (Supabase in prod, AppContext in Demo)
  const profiles: Profile[] = isDemoMode
    ? [
        coachProfile,
        ...directoryCoaches.filter((c) => c.id !== coachProfile.id),
        studentProfile,
      ]
    : dbProfiles;

  const certs: CoachCertification[] = isDemoMode
    ? coachCertifications
    : dbCerts;
  const reports: UserReport[] = isDemoMode ? userReports : dbReports;
  const sanctions: UserSanction[] = isDemoMode ? userSanctions : dbSanctions;

  const coaches = profiles.filter((p) => p.role === "coach");
  const pendingCoachesCount = coaches.filter(
    (c) => !c.is_verified_identity || c.verification_status === "pending"
  ).length;
  const openReportsCount = reports.filter(
    (r) => r.status === "pendiente" || r.status === "en_revision"
  ).length;
  const activeSanctionsCount = sanctions.filter((s) => s.is_active).length;
  const pendingPaymentsCount = dbPayments.filter(
    (p) => p.status === "pendiente"
  ).length;

  const filteredPayments = dbPayments.filter(
    (p) => paymentFilter === "all" || p.status === paymentFilter
  );

  const handleReviewPayment = async (
    paymentId: string,
    decision: "aprobado" | "rechazado"
  ) => {
    const adminNotes = paymentNotes[paymentId]?.trim();
    if (decision === "rechazado" && !adminNotes) {
      showToast("Indica el motivo del rechazo antes de continuar.");
      return;
    }

    if (!isDemoMode) {
      const res = await fetch("/api/admin/moderation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "review_payment",
          paymentId,
          decision,
          adminNotes,
        }),
      });
      if (res.ok) {
        await loadAdminData();
        showToast(
          decision === "aprobado"
            ? "Pago aprobado y plan activado automáticamente."
            : "Comprobante rechazado y notificación enviada al Coach."
        );
      }
      return;
    }

    showToast(
      decision === "aprobado"
        ? "Pago aprobado (Modo Demo)."
        : "Pago rechazado (Modo Demo)."
    );
  };

  const filteredReports = reports.filter(
    (r) => reportFilter === "all" || r.status === reportFilter
  );

  // Actions
  const handleReviewCoach = async (
    coachId: string,
    decision: "verified" | "rejected"
  ) => {
    const notes = rejectReasons[coachId]?.trim();
    if (decision === "rejected" && !notes) {
      showToast("Indica un motivo claro antes de rechazar la verificación.");
      return;
    }

    if (!isDemoMode) {
      const res = await fetch("/api/admin/moderation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "review_coach", coachId, decision, notes }),
      });
      if (res.ok) {
        await loadAdminData();
        showToast(
          decision === "verified"
            ? "Coach aprobado y verificado correctamente."
            : "Verificación rechazada con retroalimentación enviada al Coach."
        );
      }
      return;
    }

    showToast(
      decision === "verified"
        ? "Coach aprobado (Modo Demo)."
        : "Solicitud rechazada con motivo (Modo Demo)."
    );
  };

  const handleUpdateReport = async (reportId: string, status: ReportStatus) => {
    const adminNotes = reportNotesDraft[reportId];
    if (!isDemoMode) {
      const res = await fetch("/api/admin/moderation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_report",
          reportId,
          status,
          adminNotes,
        }),
      });
      if (res.ok) {
        await loadAdminData();
        showToast(`Reporte actualizado a "${REPORT_STATUS_LABELS[status]}".`);
      }
      return;
    }
    updateReportStatus(reportId, status, adminNotes);
    showToast(`Reporte marcado como "${REPORT_STATUS_LABELS[status]}".`);
  };

  const handleIssueSanction = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = profiles.find((p) => p.id === selectedUserId);
    if (!target || !sanctionReason.trim()) return;
    setSubmitting(true);

    const payload = {
      user_id: target.id,
      user_name: target.full_name,
      user_role: (target.role === "coach" ? "coach" : "student") as
        | "coach"
        | "student",
      sanction_type: sanctionType,
      reason: sanctionReason.trim(),
      duration_days:
        sanctionType === "temporary_suspension" ? Number(durationDays) || 7 : undefined,
    };

    if (!isDemoMode) {
      const res = await fetch("/api/admin/moderation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "issue_sanction",
          userId: payload.user_id,
          userName: payload.user_name,
          userRole: payload.user_role,
          sanctionType: payload.sanction_type,
          reason: payload.reason,
          durationDays: payload.duration_days,
        }),
      });
      if (res.ok) {
        await loadAdminData();
        showToast(`Sanción aplicada a ${target.full_name}.`);
      }
    } else {
      issueSanction(payload);
      showToast(`Sanción aplicada a ${target.full_name}.`);
    }

    setSanctionReason("");
    setSubmitting(false);
  };

  const handleLiftSanction = async (sanction: UserSanction) => {
    if (!isDemoMode) {
      const res = await fetch("/api/admin/moderation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "lift_sanction",
          sanctionId: sanction.id,
          userId: sanction.user_id,
        }),
      });
      if (res.ok) {
        await loadAdminData();
        showToast(`Sanción levantada para ${sanction.user_name}.`);
      }
      return;
    }
    liftSanction(sanction.id);
    showToast(`Sanción levantada para ${sanction.user_name}.`);
  };

  // Strict Role Protection Screen
  if (hydrated && !isDemoMode && accessDenied) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#060607] px-4 py-10">
        <div className="w-full max-w-md space-y-5 rounded-xl border border-white/[0.08] bg-[#0e0f12] p-7 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400">
            <Lock className="h-6 w-6" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-xl font-semibold text-white">
              Acceso Restringido
            </h1>
            <p className="text-xs leading-relaxed text-zinc-400">
              Esta sección es exclusiva para administradores de{" "}
              <strong className="text-white">MiGymBrou</strong> (`role = &apos;admin&apos;`).
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex h-11 w-full items-center justify-center rounded-full bg-white text-xs font-semibold text-zinc-950 transition hover:bg-zinc-200"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060607] text-zinc-100">
      {/* Admin Topbar */}
      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#060607]/90 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-zinc-950">
                <Dumbbell className="h-4 w-4 stroke-[2.25]" />
              </span>
              <span className="text-[15px] font-semibold tracking-tight text-white">
                MiGym<span className="text-emerald-400">Brou</span>
              </span>
            </Link>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
              Admin
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!isDemoMode && (
              <button
                type="button"
                onClick={loadAdminData}
                disabled={loading}
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/10 px-3 text-xs font-medium text-zinc-300 transition hover:border-white/25 hover:text-white"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
                />
                <span className="hidden sm:inline">Actualizar</span>
              </button>
            )}
            <Link
              href="/"
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/10 px-3.5 text-xs font-medium text-zinc-300 transition hover:border-white/25 hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Salir
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-400">
            Moderación y Seguridad
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-white sm:text-3xl">
            Panel de Administración
          </h1>
          <p className="mt-1 text-xs text-zinc-400 sm:text-sm">
            Verificación de coaches y diplomas, gestión de reportes y sanciones graduadas.
          </p>
        </div>

        {toast && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs font-medium text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {toast}
          </div>
        )}

        {/* KPI Strip */}
        <div className="grid grid-cols-2 divide-x divide-y divide-white/[0.06] overflow-hidden rounded-xl border border-white/[0.08] bg-[#0e0f12] sm:grid-cols-4 sm:divide-y-0">
          <div className="p-4 sm:p-5">
            <p className="text-[11px] font-medium text-zinc-500">
              Pagos SPEI pendientes
            </p>
            <p className="mt-1.5 text-2xl font-semibold tabular-nums text-emerald-400 sm:text-3xl">
              {pendingPaymentsCount}
            </p>
          </div>
          <div className="p-4 sm:p-5">
            <p className="text-[11px] font-medium text-zinc-500">
              Coaches por verificar
            </p>
            <p className="mt-1.5 text-2xl font-semibold tabular-nums text-white sm:text-3xl">
              {pendingCoachesCount}
            </p>
          </div>
          <div className="p-4 sm:p-5">
            <p className="text-[11px] font-medium text-zinc-500">
              Reportes abiertos
            </p>
            <p className="mt-1.5 text-2xl font-semibold tabular-nums text-amber-400 sm:text-3xl">
              {openReportsCount}
            </p>
          </div>
          <div className="p-4 sm:p-5">
            <p className="text-[11px] font-medium text-zinc-500">
              Sanciones activas
            </p>
            <p className="mt-1.5 text-2xl font-semibold tabular-nums text-rose-400 sm:text-3xl">
              {activeSanctionsCount}
            </p>
          </div>
        </div>

        {/* Clean Pill Tabs */}
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1">
          {(
            [
              {
                key: "pagos",
                label: `Pagos SPEI (${pendingPaymentsCount})`,
                icon: Landmark,
              },
              {
                key: "verificaciones",
                label: `Verificaciones (${coaches.length})`,
                icon: ShieldCheck,
              },
              {
                key: "gimnasios",
                label: `Gimnasios (${pendingGymsCount})`,
                icon: Building2,
              },
              {
                key: "codigos",
                label: `Códigos (${promoCodes.filter((p) => p.is_active).length})`,
                icon: Gift,
              },
              {
                key: "reportes",
                label: `Reportes (${reports.length})`,
                icon: Flag,
              },
              {
                key: "sanciones",
                label: `Sanciones (${activeSanctionsCount})`,
                icon: ShieldAlert,
              },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            const active = tab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key)}
                className={`inline-flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-xs font-medium transition ${
                  active
                    ? "bg-white text-zinc-950"
                    : "border border-white/10 bg-[#0e0f12] text-zinc-400 hover:border-white/25 hover:text-white"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* ================= TAB 0: PAGOS SPEI Y COMPROBANTES ================= */}
        {tab === "pagos" && (
          <div className="space-y-4">
            <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1">
              {(["all", "pendiente", "aprobado", "rechazado"] as const).map(
                (st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setPaymentFilter(st)}
                    className={`h-8 shrink-0 rounded-full px-3.5 text-xs font-medium transition ${
                      paymentFilter === st
                        ? "bg-white text-zinc-950"
                        : "border border-white/10 text-zinc-400 hover:text-white"
                    }`}
                  >
                    {st === "all"
                      ? "Todos"
                      : st === "pendiente"
                      ? "Pendientes"
                      : st === "aprobado"
                      ? "Aprobados"
                      : "Rechazados"}
                  </button>
                )
              )}
            </div>

            {filteredPayments.map((pay) => {
              const planInfo = getSaasPlanById(pay.plan_tier);
              return (
                <div
                  key={pay.id}
                  className="space-y-4 rounded-xl border border-white/[0.08] bg-[#0e0f12] p-5"
                >
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-semibold text-white">
                          {pay.coach_name}
                        </h2>
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400">
                          {planInfo.name} · ${pay.amount_mxn} MXN
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                            pay.status === "aprobado"
                              ? "bg-emerald-500/15 text-emerald-400"
                              : pay.status === "rechazado"
                              ? "bg-rose-500/15 text-rose-300"
                              : "bg-amber-500/15 text-amber-300"
                          }`}
                        >
                          {pay.status === "aprobado"
                            ? "Aprobado"
                            : pay.status === "rechazado"
                            ? "Rechazado"
                            : "Pendiente de validación"}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400">
                        {pay.coach_email} ·{" "}
                        {new Date(pay.created_at).toLocaleString("es-MX", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                      {pay.transfer_reference && (
                        <p className="text-xs text-zinc-300">
                          Referencia SPEI:{" "}
                          <span className="font-mono text-white">
                            {pay.transfer_reference}
                          </span>
                        </p>
                      )}
                      {pay.notes && (
                        <p className="text-xs italic text-zinc-400">
                          &ldquo;{pay.notes}&rdquo;
                        </p>
                      )}
                    </div>

                    <a
                      href={pay.receipt_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-9 shrink-0 items-center gap-1.5 self-start rounded-full border border-white/15 bg-white/[0.04] px-4 text-xs font-medium text-white transition hover:border-white/30"
                    >
                      Ver comprobante
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>

                  {pay.status === "pendiente" && (
                    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                      <input
                        type="text"
                        value={paymentNotes[pay.id] || ""}
                        onChange={(e) =>
                          setPaymentNotes((prev) => ({
                            ...prev,
                            [pay.id]: e.target.value,
                          }))
                        }
                        placeholder="Notas internas o motivo de rechazo..."
                        className="min-h-[42px] flex-1 rounded-xl border border-white/10 bg-[#060607] px-3.5 text-xs text-white outline-none focus:border-emerald-500/60"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleReviewPayment(pay.id, "aprobado")}
                          className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-4 text-xs font-semibold text-zinc-950 transition hover:bg-zinc-200"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Aprobar y activar plan
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReviewPayment(pay.id, "rechazado")}
                          className="inline-flex h-10 items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-4 text-xs font-medium text-rose-300 transition hover:bg-rose-500/20"
                        >
                          <XCircle className="h-4 w-4" />
                          Rechazar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {filteredPayments.length === 0 && (
              <div className="rounded-xl border border-white/[0.08] bg-[#0e0f12] py-12 text-center text-sm text-zinc-500">
                No hay solicitudes de pago SPEI en esta categoría.
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 1: VERIFICACIONES DE COACHES ================= */}
        {tab === "verificaciones" && (
          <div className="space-y-4">
            {coaches.map((coach) => {
              const coachDocs = certs.filter((c) => c.coach_id === coach.id);
              const status =
                coach.verification_status ||
                (coach.is_verified_identity ? "verified" : "unverified");
              return (
                <div
                  key={coach.id}
                  className="space-y-4 rounded-xl border border-white/[0.08] bg-[#0e0f12] p-5"
                >
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-semibold text-white">
                          {coach.full_name}
                        </h2>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                            status === "verified"
                              ? "bg-emerald-500/15 text-emerald-400"
                              : status === "pending"
                              ? "bg-amber-500/15 text-amber-300"
                              : status === "rejected"
                              ? "bg-rose-500/15 text-rose-300"
                              : "bg-white/[0.06] text-zinc-400"
                          }`}
                        >
                          {status === "verified"
                            ? "Verificado"
                            : status === "pending"
                            ? "Pendiente de revisión"
                            : status === "rejected"
                            ? "Rechazado"
                            : "Sin verificar"}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400">
                        {coach.email} · {coach.brand_name || "Sin marca"} ·{" "}
                        {coach.specialty || "General"}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 self-start">
                      {coach.identity_document_url && (
                        <a
                          href={coach.identity_document_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/15 px-3.5 text-xs font-medium text-zinc-200 hover:border-white/30 hover:text-white"
                        >
                          Ver ID oficial
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                      {coach.face_verification_url && (
                        <a
                          href={coach.face_verification_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-emerald-500/35 bg-emerald-500/10 px-3.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20"
                        >
                          Ver Rostro / Selfie
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Diplomas list */}
                  <div className="rounded-xl border border-white/[0.06] bg-[#060607] p-3.5">
                    <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                      <Award className="h-3.5 w-3.5 text-emerald-400" />
                      Diplomas y certificaciones ({coachDocs.length})
                    </p>
                    {coachDocs.length > 0 ? (
                      <div className="divide-y divide-white/[0.06]">
                        {coachDocs.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between gap-2 py-2 text-xs"
                          >
                            <div className="min-w-0">
                              <p className="truncate font-medium text-zinc-200">
                                {doc.title}
                              </p>
                              <p className="text-[11px] text-zinc-500">
                                {doc.institution} · {doc.issue_year}
                              </p>
                            </div>
                            {doc.file_url && (
                              <a
                                href={doc.file_url}
                                target="_blank"
                                rel="noreferrer"
                                className="shrink-0 text-[11px] font-medium text-emerald-400 hover:underline"
                              >
                                Abrir archivo →
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-500">
                        Este coach aún no ha subido diplomas.
                      </p>
                    )}
                  </div>

                  {/* Admin Decision Controls */}
                  <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                    <input
                      type="text"
                      value={rejectReasons[coach.id] || ""}
                      onChange={(e) =>
                        setRejectReasons((prev) => ({
                          ...prev,
                          [coach.id]: e.target.value,
                        }))
                      }
                      placeholder="Motivo de rechazo o comentario al coach..."
                      className="min-h-[42px] flex-1 rounded-xl border border-white/10 bg-[#060607] px-3.5 text-xs text-white outline-none focus:border-emerald-500/60"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleReviewCoach(coach.id, "verified")}
                        className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-4 text-xs font-semibold text-zinc-950 transition hover:bg-zinc-200"
                      >
                        <BadgeCheck className="h-4 w-4" />
                        Aprobar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReviewCoach(coach.id, "rejected")}
                        className="inline-flex h-10 items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-4 text-xs font-medium text-rose-300 transition hover:bg-rose-500/20"
                      >
                        <XCircle className="h-4 w-4" />
                        Rechazar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            {coaches.length === 0 && (
              <div className="rounded-xl border border-white/[0.08] bg-[#0e0f12] py-12 text-center text-sm text-zinc-500">
                No hay solicitudes de coaches registradas aún.
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: REPORTES DE USUARIOS ================= */}
        {tab === "reportes" && (
          <div className="space-y-4">
            <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1">
              {(
                [
                  "all",
                  "pendiente",
                  "en_revision",
                  "resuelto",
                  "descartado",
                ] as const
              ).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setReportFilter(st)}
                  className={`h-8 shrink-0 rounded-full px-3.5 text-xs font-medium transition ${
                    reportFilter === st
                      ? "bg-white text-zinc-950"
                      : "border border-white/10 text-zinc-400 hover:text-white"
                  }`}
                >
                  {st === "all" ? "Todos" : REPORT_STATUS_LABELS[st]}
                </button>
              ))}
            </div>

            {filteredReports.map((rep) => (
              <div
                key={rep.id}
                className="space-y-3 rounded-xl border border-white/[0.08] bg-[#0e0f12] p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[10px] font-semibold uppercase text-zinc-300">
                      {rep.category}
                    </span>
                    <span className="text-xs font-medium text-white">
                      Reportado: {rep.reported_user_name} ({rep.reported_role})
                    </span>
                  </div>
                  <span className="text-[11px] text-zinc-500">
                    Por {rep.reporter_name} ·{" "}
                    {new Date(rep.created_at).toLocaleDateString("es-MX")}
                  </span>
                </div>

                <p className="rounded-xl border border-white/[0.06] bg-[#060607] p-3.5 text-xs leading-relaxed text-zinc-300">
                  {rep.description}
                </p>

                <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                  <input
                    type="text"
                    value={
                      reportNotesDraft[rep.id] ?? rep.admin_notes ?? ""
                    }
                    onChange={(e) =>
                      setReportNotesDraft((prev) => ({
                        ...prev,
                        [rep.id]: e.target.value,
                      }))
                    }
                    placeholder="Notas internas de resolución del administrador..."
                    className="min-h-[40px] flex-1 rounded-xl border border-white/10 bg-[#060607] px-3 text-xs text-white outline-none focus:border-emerald-500/60"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {(
                      [
                        "pendiente",
                        "en_revision",
                        "resuelto",
                        "descartado",
                      ] as ReportStatus[]
                    ).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => handleUpdateReport(rep.id, st)}
                        className={`h-8 rounded-full px-3 text-[11px] font-medium transition ${
                          rep.status === st
                            ? "bg-emerald-500 text-zinc-950"
                            : "border border-white/10 text-zinc-400 hover:border-white/25 hover:text-white"
                        }`}
                      >
                        {REPORT_STATUS_LABELS[st]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {filteredReports.length === 0 && (
              <div className="rounded-xl border border-white/[0.08] bg-[#0e0f12] py-12 text-center text-sm text-zinc-500">
                No hay reportes en esta categoría.
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: SANCIONES ================= */}
        {tab === "sanciones" && (
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Issue Sanction Form */}
            <form
              onSubmit={handleIssueSanction}
              className="space-y-4 rounded-xl border border-white/[0.08] bg-[#0e0f12] p-5 lg:col-span-5"
            >
              <div>
                <h2 className="text-base font-semibold text-white">
                  Aplicar sanción graduada
                </h2>
                <p className="mt-0.5 text-xs text-zinc-400">
                  Aplica a coaches o alumnos con registro de motivo y trazabilidad.
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                  Usuario (Coach o Alumno)
                </label>
                <select
                  required
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="min-h-[44px] w-full rounded-xl border border-white/10 bg-[#060607] px-3 text-xs text-white outline-none focus:border-emerald-500/60"
                >
                  <option value="">Selecciona una cuenta...</option>
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name} ({p.role === "coach" ? "Coach" : "Alumno"}) —{" "}
                      {p.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                  Nivel de sanción
                </label>
                <select
                  value={sanctionType}
                  onChange={(e) =>
                    setSanctionType(e.target.value as SanctionType)
                  }
                  className="min-h-[44px] w-full rounded-xl border border-white/10 bg-[#060607] px-3 text-xs text-white outline-none focus:border-emerald-500/60"
                >
                  <option value="warning">Advertencia formal / Aviso</option>
                  <option value="temporary_suspension">
                    Suspensión temporal (por días)
                  </option>
                  <option value="permanent_ban">
                    Suspensión indefinida / Baneo
                  </option>
                </select>
              </div>

              {sanctionType === "temporary_suspension" && (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                    Duración en días
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    required
                    value={durationDays}
                    onChange={(e) => setDurationDays(e.target.value)}
                    className="min-h-[44px] w-full rounded-xl border border-white/10 bg-[#060607] px-3.5 text-sm text-white outline-none focus:border-emerald-500/60"
                  />
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                  Motivo detallado (visible para el usuario) *
                </label>
                <textarea
                  rows={3}
                  required
                  value={sanctionReason}
                  onChange={(e) => setSanctionReason(e.target.value)}
                  placeholder="Describe claramente la falta o el motivo de la sanción..."
                  className="w-full rounded-xl border border-white/10 bg-[#060607] p-3 text-xs text-white outline-none focus:border-emerald-500/60"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="h-11 w-full rounded-full bg-white text-xs font-semibold text-zinc-950 transition hover:bg-zinc-200 disabled:opacity-50"
              >
                {submitting ? "Aplicando..." : "Aplicar sanción"}
              </button>
            </form>

            {/* Sanctions History */}
            <div className="space-y-3 rounded-xl border border-white/[0.08] bg-[#0e0f12] p-5 lg:col-span-7">
              <h2 className="text-base font-semibold text-white">
                Historial de sanciones ({sanctions.length})
              </h2>

              <div className="divide-y divide-white/[0.06] border-t border-white/[0.06]">
                {sanctions.map((s) => (
                  <div key={s.id} className="space-y-2 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {s.sanction_type === "warning" ? (
                          <AlertTriangle className="h-4 w-4 text-amber-400" />
                        ) : (
                          <Ban className="h-4 w-4 text-rose-400" />
                        )}
                        <p className="text-sm font-medium text-white">
                          {s.user_name}{" "}
                          <span className="text-xs text-zinc-500">
                            ({s.user_role})
                          </span>
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                          !s.is_active
                            ? "bg-white/[0.06] text-zinc-400"
                            : s.sanction_type === "warning"
                            ? "bg-amber-500/15 text-amber-300"
                            : "bg-rose-500/15 text-rose-300"
                        }`}
                      >
                        {s.is_active
                          ? SANCTION_LABELS[s.sanction_type]
                          : "Levantada"}
                      </span>
                    </div>

                    <p className="text-xs leading-relaxed text-zinc-400">
                      {s.reason}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-500">
                      <span>
                        Emitida:{" "}
                        {new Date(s.created_at).toLocaleDateString("es-MX")}
                        {s.expires_at
                          ? ` · Expira: ${new Date(
                              s.expires_at
                            ).toLocaleDateString("es-MX")}`
                          : ""}
                      </span>
                      {s.is_active && (
                        <button
                          type="button"
                          onClick={() => handleLiftSanction(s)}
                          className="inline-flex h-8 items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 text-[11px] font-medium text-emerald-300 transition hover:bg-emerald-500/20"
                        >
                          <Undo2 className="h-3 w-3" />
                          Levantar sanción
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {sanctions.length === 0 && (
                  <p className="py-10 text-center text-xs text-zinc-500">
                    No hay sanciones registradas en el historial.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB: CATÁLOGO DE GIMNASIOS Y APROBACIÓN */}
        {tab === "gimnasios" && (
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold text-white">
                  Catálogo de Gimnasios y Solicitudes Pendientes
                </h2>
                <p className="text-xs text-zinc-400">
                  Aprueba, corrige el nombre o rechaza gimnasios sugeridos por coaches.
                </p>
              </div>
              <button
                type="button"
                onClick={loadGyms}
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/10 px-3.5 text-xs font-medium text-zinc-300 hover:border-white/25 hover:text-white"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Actualizar
              </button>
            </div>

            <div className="grid gap-3">
              {gymsList.map((gym) => {
                const draft = gymEdits[gym.id] || {
                  name: gym.name,
                  city: gym.city || "",
                };
                return (
                  <div
                    key={gym.id}
                    className="flex flex-col justify-between gap-3 rounded-xl border border-white/[0.08] bg-[#0e0f12] p-4 sm:flex-row sm:items-center"
                  >
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                            gym.status === "approved"
                              ? "bg-emerald-500/15 text-emerald-400"
                              : gym.status === "pending"
                              ? "bg-amber-500/15 text-amber-300"
                              : "bg-rose-500/15 text-rose-300"
                          }`}
                        >
                          {gym.status === "approved"
                            ? "Aprobado"
                            : gym.status === "pending"
                            ? "Pendiente"
                            : "Rechazado"}
                        </span>
                        {gym.submitted_by_email && (
                          <span className="text-[11px] text-zinc-400">
                            Sugerido por: {gym.submitted_by_email}
                          </span>
                        )}
                      </div>

                      {gym.status === "pending" ? (
                        <div className="grid gap-2 sm:grid-cols-2">
                          <input
                            type="text"
                            value={draft.name}
                            onChange={(e) =>
                              setGymEdits((prev) => ({
                                ...prev,
                                [gym.id]: { ...draft, name: e.target.value },
                              }))
                            }
                            aria-label="Nombre del gimnasio"
                            className="h-9 rounded-lg border border-white/10 bg-[#060607] px-3 text-xs text-white outline-none focus:border-emerald-500"
                          />
                          <input
                            type="text"
                            value={draft.city}
                            onChange={(e) =>
                              setGymEdits((prev) => ({
                                ...prev,
                                [gym.id]: { ...draft, city: e.target.value },
                              }))
                            }
                            placeholder="Ciudad / Zona"
                            aria-label="Ciudad del gimnasio"
                            className="h-9 rounded-lg border border-white/10 bg-[#060607] px-3 text-xs text-white outline-none focus:border-emerald-500"
                          />
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {gym.name}
                          </p>
                          {gym.city && (
                            <p className="text-xs text-zinc-400">{gym.city}</p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      {gym.status !== "approved" && (
                        <button
                          type="button"
                          onClick={() => handleGymAction(gym, "approved")}
                          className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 text-xs font-bold text-[#0a0a0a] transition hover:bg-emerald-400"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Aprobar
                        </button>
                      )}
                      {gym.status !== "rejected" && (
                        <button
                          type="button"
                          onClick={() => handleGymAction(gym, "rejected")}
                          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Rechazar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* TAB: CÓDIGOS PROMOCIONALES Y REFERIDOS */}
        {tab === "codigos" && (
          <section className="grid gap-6 lg:grid-cols-12">
            <form
              onSubmit={handleCreatePromo}
              className="space-y-4 rounded-xl border border-white/[0.08] bg-[#0e0f12] p-5 lg:col-span-5"
            >
              <div>
                <h2 className="text-base font-semibold text-white">
                  Nuevo Código Promocional
                </h2>
                <p className="text-xs text-zinc-400">
                  Uso único al registrarse (recomendado 25%–35% en primer mes).
                </p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-300">
                  Código *
                </label>
                <input
                  type="text"
                  required
                  value={newPromoCode}
                  onChange={(e) => setNewPromoCode(e.target.value.toUpperCase())}
                  placeholder="Ej. COACH30"
                  className="h-10 w-full rounded-xl border border-white/15 bg-[#060607] px-3 font-mono text-sm uppercase text-white outline-none focus:border-emerald-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-300">
                    Tipo
                  </label>
                  <select
                    value={newPromoType}
                    onChange={(e) =>
                      setNewPromoType(e.target.value as "percent" | "fixed_mxn")
                    }
                    className="h-10 w-full rounded-xl border border-white/15 bg-[#060607] px-3 text-xs text-white"
                  >
                    <option value="percent">Porcentaje (%)</option>
                    <option value="fixed_mxn">Monto fijo (MXN)</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-300">
                    Valor *
                  </label>
                  <input
                    type="number"
                    required
                    value={newPromoValue}
                    onChange={(e) => setNewPromoValue(e.target.value)}
                    className="h-10 w-full rounded-xl border border-white/15 bg-[#060607] px-3 text-sm text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-300">
                    Límite de usos
                  </label>
                  <input
                    type="number"
                    value={newPromoMaxUses}
                    onChange={(e) => setNewPromoMaxUses(e.target.value)}
                    placeholder="100"
                    className="h-10 w-full rounded-xl border border-white/15 bg-[#060607] px-3 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-300">
                    Descripción
                  </label>
                  <input
                    type="text"
                    value={newPromoDesc}
                    onChange={(e) => setNewPromoDesc(e.target.value)}
                    placeholder="Ej. Campaña verano"
                    className="h-10 w-full rounded-xl border border-white/15 bg-[#060607] px-3 text-xs text-white"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="h-10 w-full rounded-xl bg-emerald-500 text-xs font-bold text-[#0a0a0a] transition hover:bg-emerald-400"
              >
                Crear código promocional
              </button>
            </form>

            <div className="space-y-3 lg:col-span-7">
              {promoCodes.map((promo) => (
                <div
                  key={promo.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-[#0e0f12] p-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-emerald-400">
                        {promo.code}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          promo.is_active
                            ? "bg-emerald-500/15 text-emerald-300"
                            : "bg-zinc-500/15 text-zinc-400"
                        }`}
                      >
                        {promo.is_active ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-300">
                      {promo.discount_type === "percent"
                        ? `${promo.discount_value}% de descuento`
                        : `$${promo.discount_value} MXN de descuento`}{" "}
                      · Usos: {promo.used_count}
                      {promo.max_uses ? ` / ${promo.max_uses}` : ""}
                    </p>
                    {promo.description && (
                      <p className="text-[11px] text-zinc-500">
                        {promo.description}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTogglePromo(promo)}
                    className="h-9 rounded-xl border border-white/15 px-3 text-xs font-semibold text-zinc-200 transition hover:border-emerald-500/40 hover:text-white"
                  >
                    {promo.is_active ? "Desactivar" : "Activar"}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
