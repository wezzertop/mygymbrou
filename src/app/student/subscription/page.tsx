"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Award,
  Building2,
  Calendar,
  CheckCircle2,
  CreditCard,
  Eye,
  FileText,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { getDaysRemaining, useApp } from "@/context/AppContext";
import {
  CoachCertification,
  CoachingMode,
  CoachSubscriptionPlan,
} from "@/types/database";
import {
  CertifiedCoachBadge,
  VerifiedPersonBadge,
} from "@/components/VerificationBadge";
import { DiplomaViewerModal } from "@/components/DiplomaViewerModal";

const COACHING_TEXT: Record<CoachingMode, string> = {
  none: "Seguimiento en App",
  intermittent: "Coach Online Intermitente",
  in_person: "Coach Presencial 1:1",
};

export default function StudentSubscriptionPage() {
  const {
    studentProfile,
    coachProfile,
    coachCertifications,
    students,
    subscriptionPlans,
    requestPlanUpgrade,
  } = useApp();

  const [selectedUpgrade, setSelectedUpgrade] =
    useState<CoachSubscriptionPlan | null>(null);
  const [requestSent, setRequestSent] = useState(false);
  const [viewingCert, setViewingCert] = useState<CoachCertification | null>(
    null
  );

  const activeCoachCerts = coachCertifications.filter(
    (c) => !coachProfile.id || c.coach_id === coachProfile.id
  );

  useEffect(() => {
    if (!selectedUpgrade) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedUpgrade(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedUpgrade]);

  const relation = students.find((s) => s.student_id === studentProfile.id);
  const currentPlan = subscriptionPlans.find(
    (p) => p.id === relation?.plan_id
  );
  const expiresAt = relation?.expires_at || relation?.next_billing_date;
  const daysLeft = getDaysRemaining(expiresAt);

  const handleRequestUpgrade = (plan: CoachSubscriptionPlan) => {
    setSelectedUpgrade(plan);
    setRequestSent(false);
  };

  const confirmUpgradeRequest = () => {
    if (!selectedUpgrade) return;
    requestPlanUpgrade(studentProfile.id, selectedUpgrade);
    setRequestSent(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
          Membresía y Beneficios
        </span>
        <h1 className="text-2xl font-extrabold text-white">
          Mi Plan con {coachProfile.full_name}
        </h1>
        <p className="text-xs text-slate-400">
          Consulta tus módulos activos, días restantes y opciones para subir de
          nivel.
        </p>
      </div>

      {/* Active Plan Strategic Card */}
      <section className="relative overflow-hidden rounded-3xl border border-emerald-500/35 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 p-6 shadow-2xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <img
              src={
                coachProfile.avatar_url ||
                "https://images.unsplash.com/photo-1567013127542-490d757e51fc?auto=format&fit=crop&w=128&q=80"
              }
              alt={coachProfile.full_name}
              className="h-14 w-14 rounded-2xl object-cover ring-2 ring-emerald-500/40"
            />
            <div>
              <p className="text-xs text-slate-400">Plan Activo Actual</p>
              <h2 className="text-xl font-black text-white">
                {relation?.subscription_plan_name || "Plan Oro"}
              </h2>
              <p className="text-xs font-medium text-cyan-400">
                {coachProfile.brand_name}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <VerifiedPersonBadge
                  verified={coachProfile.is_verified_identity}
                />
                <CertifiedCoachBadge diplomaCount={activeCoachCerts.length} />
              </div>
            </div>
          </div>

          <span
            className={`rounded-full border px-3.5 py-1 text-xs font-bold ${
              daysLeft > 5
                ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                : "border-amber-500/40 bg-amber-500/15 text-amber-300"
            }`}
          >
            {daysLeft > 0 ? `${daysLeft} días restantes` : "Plan por renovar"}
          </span>
        </div>

        {/* Included Benefits Pills */}
        {currentPlan && (
          <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold">
            {currentPlan.includes_nutrition && (
              <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-500/15 px-3 py-1.5 text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Nutrición
              </span>
            )}
            {currentPlan.includes_workouts && (
              <span className="inline-flex items-center gap-1 rounded-xl bg-cyan-500/15 px-3 py-1.5 text-cyan-300">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Rutinas Visuales
              </span>
            )}
            {currentPlan.includes_assessments && (
              <span className="inline-flex items-center gap-1 rounded-xl bg-slate-800 px-3 py-1.5 text-slate-200">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                Antropometría
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-slate-200">
              {COACHING_TEXT[currentPlan.coaching_mode]}
            </span>
          </div>
        )}

        <div className="mt-5 grid gap-4 border-y border-slate-800 py-4 sm:grid-cols-3">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-slate-400">
              Inversión
            </p>
            <p className="mt-0.5 text-2xl font-black text-emerald-400">
              ${(relation?.subscription_price || 1250).toLocaleString("es-MX")}
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-slate-400">
              Vencimiento Exacto
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-sm font-bold text-white">
              <Calendar className="h-4 w-4 text-cyan-400" />
              {expiresAt || "2026-12-05"}
            </p>
          </div>
          <div className="flex items-center sm:justify-end">
            <Link
              href="/student/calendar"
              className="inline-flex items-center gap-1 text-xs font-bold text-cyan-400 hover:underline"
            >
              Ver corte en Calendario
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          Renovación y upgrades gestionados directamente con tu Coach (listo para
          Stripe / Mercado Pago).
        </div>
      </section>

      {/* Coach Diplomas & Certifications Showcase */}
      <section className="space-y-3 rounded-3xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-base font-extrabold text-white">
              <Award className="h-4 w-4 text-emerald-400" />
              Diplomas y Certificaciones de {coachProfile.full_name}
            </h2>
            <p className="text-xs text-slate-400">
              Inspecciona los archivos oficiales que acreditan la preparación de
              tu Coach.
            </p>
          </div>

          <Link
            href="/student/coaches"
            className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/35 bg-cyan-500/10 px-3.5 py-2 text-xs font-bold text-cyan-300 transition hover:bg-cyan-500/20"
          >
            <Search className="h-3.5 w-3.5" />
            Explorar Otros Coaches
          </Link>
        </div>

        {activeCoachCerts.length === 0 ? (
          <p className="text-xs text-slate-500">
            Tu coach aún no ha publicado archivos de diplomas.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {activeCoachCerts.map((cert) => (
              <button
                key={cert.id}
                type="button"
                onClick={() => setViewingCert(cert)}
                className="group flex flex-col justify-between gap-2 rounded-2xl border border-slate-800 bg-slate-950/85 p-4 text-left transition hover:border-emerald-500/50"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                      <FileText className="h-3 w-3" />
                      {cert.file_type === "pdf" ? "PDF" : "Diploma"} ·{" "}
                      {cert.issue_year}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-400">
                      <Eye className="h-3.5 w-3.5" />
                      Ver archivo
                    </span>
                  </div>
                  <p className="text-xs font-bold text-white">{cert.title}</p>
                  <p className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Building2 className="h-3 w-3 shrink-0 text-slate-500" />
                    <span className="truncate">{cert.institution}</span>
                  </p>
                </div>
                {cert.credential_id && (
                  <p className="font-mono text-[10px] text-slate-500">
                    Folio: {cert.credential_id}
                  </p>
                )}
              </button>
            ))}
          </div>
        )}
      </section>

      <DiplomaViewerModal
        certification={viewingCert}
        coachName={coachProfile.full_name}
        onClose={() => setViewingCert(null)}
      />

      {/* All Plans Offered by Coach (Upgrade Showcase) */}
      <section className="space-y-4">
        <div>
          <h2 className="flex items-center gap-2 text-base font-extrabold text-white">
            <Sparkles className="h-4 w-4 text-cyan-400" />
            Planes Disponibles de {coachProfile.full_name}
          </h2>
          <p className="text-xs text-slate-400">
            ¿Quieres agregar rutinas guiadas o sesiones presenciales? Solicita un
            upgrade o renueva en un clic.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {subscriptionPlans.map((plan) => {
            const isCurrent = plan.id === relation?.plan_id;
            return (
              <div
                key={plan.id}
                className={`flex flex-col justify-between gap-4 rounded-2xl border p-5 transition ${
                  isCurrent
                    ? "border-emerald-500/50 bg-emerald-950/20"
                    : "border-slate-800 bg-slate-900/75 hover:border-cyan-500/40"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base font-extrabold text-white">
                      {plan.name}
                    </h3>
                    {isCurrent ? (
                      <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                        Tu Plan Actual
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[10px] font-semibold text-slate-300">
                        {plan.duration_days} días
                      </span>
                    )}
                  </div>

                  <p className="text-2xl font-black text-white">
                    ${plan.price.toLocaleString("es-MX")}
                    <span className="text-xs font-normal text-slate-400">
                      {" "}
                      / {plan.duration_days} días
                    </span>
                  </p>

                  <p className="text-xs leading-relaxed text-slate-400">
                    {plan.description}
                  </p>

                  <ul className="space-y-1.5 pt-2 text-xs text-slate-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle2
                        className={`h-3.5 w-3.5 ${
                          plan.includes_nutrition
                            ? "text-emerald-400"
                            : "text-slate-600"
                        }`}
                      />
                      <span
                        className={
                          plan.includes_nutrition ? "" : "text-slate-500 line-through"
                        }
                      >
                        Plan Nutricional y Macros
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2
                        className={`h-3.5 w-3.5 ${
                          plan.includes_workouts
                            ? "text-cyan-400"
                            : "text-slate-600"
                        }`}
                      />
                      <span
                        className={
                          plan.includes_workouts ? "" : "text-slate-500 line-through"
                        }
                      >
                        Rutinas Guiadas con Videos/Animaciones
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      <span>{COACHING_TEXT[plan.coaching_mode]}</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => handleRequestUpgrade(plan)}
                  className={`inline-flex w-full items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold transition ${
                    isCurrent
                      ? "border border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"
                      : "bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 hover:brightness-110"
                  }`}
                >
                  <CreditCard className="h-4 w-4" />
                  {isCurrent
                    ? "Renovar Plan Actual"
                    : `Solicitar ${plan.name}`}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Upgrade / Renewal Modal */}
      {selectedUpgrade && (
        <div
          onClick={() => setSelectedUpgrade(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl"
          >
            {requestSent ? (
              <div className="space-y-4 py-4 text-center">
                <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" />
                <h2 className="text-lg font-bold text-white">
                  ¡Solicitud enviada a tu Coach!
                </h2>
                <p className="text-xs leading-relaxed text-slate-300">
                  Notificamos a <strong>{coachProfile.full_name}</strong> tu
                  interés en <strong>{selectedUpgrade.name}</strong> ($
                  {selectedUpgrade.price} / {selectedUpgrade.duration_days}{" "}
                  días).
                </p>
                <button
                  type="button"
                  onClick={() => setSelectedUpgrade(null)}
                  className="min-h-[42px] w-full rounded-xl bg-emerald-500 py-3 text-xs font-bold text-slate-950 transition hover:bg-emerald-400"
                >
                  Listo
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-lg font-bold text-white">
                    Confirmar {selectedUpgrade.name}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setSelectedUpgrade(null)}
                    aria-label="Cerrar modal"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <p className="text-xs leading-relaxed text-slate-300">
                  {selectedUpgrade.description}
                </p>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 text-xs">
                  <p className="flex justify-between">
                    <span className="text-slate-400">Precio:</span>
                    <span className="font-bold text-emerald-400">
                      ${selectedUpgrade.price}
                    </span>
                  </p>
                  <p className="mt-1 flex justify-between">
                    <span className="text-slate-400">Duración:</span>
                    <span className="font-bold text-white">
                      {selectedUpgrade.duration_days} días
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={confirmUpgradeRequest}
                  className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 py-3.5 text-xs font-bold text-slate-950"
                >
                  Enviar Solicitud / Renovar
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedUpgrade(null)}
                  className="w-full rounded-xl border border-slate-800 py-2.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
