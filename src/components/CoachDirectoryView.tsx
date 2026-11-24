"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  Award,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Eye,
  FileText,
  MapPin,
  Search,
  Send,
  ShieldCheck,
  Star,
  Users,
  X,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { CoachCertification, PublicCoachProfile } from "@/types/database";
import {
  CertifiedCoachBadge,
  VerifiedPersonBadge,
} from "@/components/VerificationBadge";
import { DiplomaViewerModal } from "@/components/DiplomaViewerModal";

export function CoachDirectoryView({
  mode = "public",
}: {
  mode?: "public" | "student";
}) {
  const {
    directoryCoaches,
    studentProfile,
    sendCoachInquiry,
  } = useApp();

  const [query, setQuery] = useState("");
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [onlyWithDiplomas, setOnlyWithDiplomas] = useState(false);
  const [viewingCert, setViewingCert] = useState<{
    cert: CoachCertification;
    coachName: string;
  } | null>(null);

  // Inquiry modal state
  const [selectedCoach, setSelectedCoach] = useState<PublicCoachProfile | null>(
    null
  );
  const [reqName, setReqName] = useState(
    mode === "student" ? studentProfile.full_name : ""
  );
  const [reqEmail, setReqEmail] = useState(
    mode === "student" ? studentProfile.email : ""
  );
  const [reqGoal, setReqGoal] = useState(
    mode === "student"
      ? studentProfile.fitness_goal || "Recomposición corporal"
      : "Recomposición corporal"
  );
  const [reqPlan, setReqPlan] = useState("");
  const [reqMessage, setReqMessage] = useState("");
  const [sentSuccess, setSentSuccess] = useState(false);

  const filteredCoaches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return directoryCoaches.filter((c) => {
      if (onlyVerified && !c.is_verified_identity) return false;
      if (onlyWithDiplomas && c.certifications.length === 0) return false;
      if (!q) return true;
      const inBasic =
        c.full_name.toLowerCase().includes(q) ||
        (c.brand_name || "").toLowerCase().includes(q) ||
        (c.specialty || "").toLowerCase().includes(q) ||
        (c.city || "").toLowerCase().includes(q);
      const inCerts = c.certifications.some(
        (cert) =>
          cert.title.toLowerCase().includes(q) ||
          cert.institution.toLowerCase().includes(q)
      );
      return inBasic || inCerts;
    });
  }, [directoryCoaches, query, onlyVerified, onlyWithDiplomas]);

  const openInquiryModal = (coach: PublicCoachProfile) => {
    setSelectedCoach(coach);
    setReqName(mode === "student" ? studentProfile.full_name : "");
    setReqEmail(mode === "student" ? studentProfile.email : "");
    setReqPlan(coach.plans[0]?.name || "Plan Personalizado");
    setReqMessage("");
    setSentSuccess(false);
  };

  const handleSendInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCoach) return;
    sendCoachInquiry({
      coach_id: selectedCoach.id,
      student_id: mode === "student" ? studentProfile.id : undefined,
      student_name: reqName.trim() || "Alumno Interesado",
      student_email: reqEmail.trim(),
      student_is_verified:
        mode === "student" ? Boolean(studentProfile.is_verified_identity) : false,
      goal: reqGoal.trim() || "Entrenamiento personalizado",
      preferred_plan_name: reqPlan,
      message:
        reqMessage.trim() ||
        "Hola Coach, revisé tus certificaciones y me gustaría empezar a entrenar contigo.",
    });
    setSentSuccess(true);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/40 p-6 sm:p-7">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/35 bg-sky-500/15 px-3 py-1 text-[11px] font-bold text-sky-300">
              <ShieldCheck className="h-3.5 w-3.5" />
              Directorio con Identidad Verificada y Diplomas Comprobables
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
              Encuentra a tu Coach Certificado
            </h1>
            <p className="text-sm leading-relaxed text-zinc-300">
              Explora entrenadores reales verificados, revisa sus diplomas y
              certificaciones directamente en archivo antes de elegir, y envía
              tu solicitud en segundos.
            </p>
          </div>

          {mode === "student" && !studentProfile.is_verified_identity && (
            <Link
              href="/student/profile"
              className="inline-flex shrink-0 items-center gap-2 rounded-2xl border border-sky-400/40 bg-sky-500/15 px-4 py-3 text-xs font-bold text-sky-200 transition hover:bg-sky-500/25"
            >
              <BadgeCheck className="h-4 w-4 text-sky-400" />
              Verifica tu identidad para destacar
            </Link>
          )}
        </div>

        {/* Search & Filters */}
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre, especialidad, ciudad o diploma (ej. ISAK, Nutrición, Fuerza)..."
              className="w-full rounded-xl border border-white/15 bg-[#060607] py-2.5 pl-10 pr-9 text-sm text-white outline-none transition focus:border-cyan-500"
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

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setOnlyVerified((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-xs font-bold transition ${
                onlyVerified
                  ? "border border-sky-400/50 bg-sky-500/20 text-sky-200"
                  : "border border-white/15 bg-[#060607] text-zinc-300 hover:border-sky-500/40"
              }`}
            >
              <BadgeCheck className="h-3.5 w-3.5 text-sky-400" />
              Solo Verificados
            </button>
            <button
              type="button"
              onClick={() => setOnlyWithDiplomas((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-xs font-bold transition ${
                onlyWithDiplomas
                  ? "border border-emerald-400/50 bg-emerald-500/20 text-emerald-200"
                  : "border border-white/15 bg-[#060607] text-zinc-300 hover:border-emerald-500/40"
              }`}
            >
              <Award className="h-3.5 w-3.5 text-emerald-400" />
              Con Diplomas
            </button>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-xs text-zinc-400">
        <span>
          Mostrando{" "}
          <strong className="text-white">{filteredCoaches.length}</strong>{" "}
          {filteredCoaches.length === 1 ? "coach disponible" : "coaches disponibles"}
        </span>
        <span className="hidden sm:inline">
          Haz clic en cualquier diploma para inspeccionar el archivo oficial
        </span>
      </div>

      {/* Coaches Grid */}
      {filteredCoaches.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/[0.08] bg-[#0e0f12] p-10 text-center">
          <Search className="mx-auto h-8 w-8 text-slate-600" />
          <p className="mt-3 text-sm font-bold text-white">
            No encontramos coaches con esos filtros
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            Prueba quitando algún filtro o buscando por otra especialidad.
          </p>
        </div>
      ) : (
        <div className="grid gap-5">
          {filteredCoaches.map((coach) => {
            const minPrice =
              coach.plans.length > 0
                ? Math.min(...coach.plans.map((p) => p.price))
                : null;

            return (
              <article
                key={coach.id}
                className="overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0e0f12]/75 p-5 transition hover:border-cyan-500/40 sm:p-6"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  {/* Coach Identity & Bio */}
                  <div className="flex flex-1 flex-col gap-4 sm:flex-row">
                    <div className="relative shrink-0 self-start">
                      <img
                        src={
                          coach.avatar_url ||
                          "https://images.unsplash.com/photo-1567013127542-490d757e51fc?auto=format&fit=crop&w=256&q=80"
                        }
                        alt={coach.full_name}
                        className="h-20 w-20 rounded-2xl object-cover ring-2 ring-cyan-500/40"
                      />
                      {coach.is_verified_identity && (
                        <span
                          title="Persona Real Verificada"
                          className="absolute -bottom-1.5 -right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-sky-500 text-zinc-950 ring-2 ring-[#0b1120]"
                        >
                          <BadgeCheck className="h-4 w-4" />
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-extrabold text-white sm:text-xl">
                          {coach.full_name}
                        </h2>
                        <VerifiedPersonBadge
                          verified={coach.is_verified_identity}
                        />
                        <CertifiedCoachBadge
                          diplomaCount={coach.certifications.length}
                        />
                      </div>

                      <p className="text-xs font-semibold text-cyan-400">
                        {coach.brand_name || "Coach Independiente"} ·{" "}
                        {coach.specialty || "Entrenamiento Personalizado"}
                      </p>

                      {coach.bio && (
                        <p className="text-xs leading-relaxed text-zinc-300">
                          {coach.bio}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1 text-[11px] text-zinc-400">
                        {coach.city && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                            {coach.city}
                          </span>
                        )}
                        {coach.years_experience && (
                          <span className="inline-flex items-center gap-1">
                            <Award className="h-3.5 w-3.5 text-amber-400" />
                            {coach.years_experience} años de experiencia
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3.5 w-3.5 text-cyan-400" />
                          {coach.active_students_count} alumnos activos
                        </span>
                        {coach.rating && (
                          <span className="inline-flex items-center gap-1 font-bold text-amber-300">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            {coach.rating.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* CTA & Starting Price */}
                  <div className="flex shrink-0 flex-row items-center justify-between gap-3 border-t border-white/[0.08] pt-4 lg:w-56 lg:flex-col lg:items-stretch lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                        Planes desde
                      </p>
                      <p className="text-2xl font-black text-emerald-400">
                        {minPrice ? `$${minPrice.toLocaleString("es-MX")}` : "A medida"}
                        {minPrice && (
                          <span className="text-xs font-medium text-zinc-400">
                            /mes
                          </span>
                        )}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => openInquiryModal(coach)}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-white hover:bg-zinc-200 px-4 py-3 text-xs font-bold text-zinc-950 shadow-lg shadow-none transition "
                    >
                      <Send className="h-3.5 w-3.5" />
                      Solicitar Coach
                    </button>
                  </div>
                </div>

                {/* Diplomas & Certifications Files Showcase */}
                <div className="mt-5 border-t border-white/[0.08] pt-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400">
                      <Award className="h-4 w-4" />
                      Diplomas y Archivos que Certifican a este Coach (
                      {coach.certifications.length})
                    </p>
                  </div>

                  {coach.certifications.length === 0 ? (
                    <p className="text-xs text-zinc-500">
                      Este coach aún no ha subido archivos de diplomas.
                    </p>
                  ) : (
                    <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                      {coach.certifications.map((cert) => (
                        <button
                          key={cert.id}
                          type="button"
                          onClick={() =>
                            setViewingCert({
                              cert,
                              coachName: coach.full_name,
                            })
                          }
                          className="group flex flex-col justify-between gap-2 rounded-2xl border border-white/[0.08] bg-[#060607]/85 p-3.5 text-left transition hover:border-emerald-500/50 hover:bg-[#060607]"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                                <FileText className="h-3 w-3" />
                                {cert.file_type === "pdf" ? "PDF" : "Diploma"} ·{" "}
                                {cert.issue_year}
                              </span>
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-cyan-400 opacity-85 group-hover:opacity-100">
                                <Eye className="h-3 w-3" />
                                Ver archivo
                              </span>
                            </div>
                            <p className="line-clamp-2 text-xs font-bold text-white">
                              {cert.title}
                            </p>
                            <p className="flex items-center gap-1 truncate text-[11px] text-zinc-400">
                              <Building2 className="h-3 w-3 shrink-0 text-zinc-500" />
                              <span className="truncate">{cert.institution}</span>
                            </p>
                          </div>
                          {cert.credential_id && (
                            <p className="truncate font-mono text-[10px] text-zinc-500">
                              Folio: {cert.credential_id}
                            </p>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Diploma Document Viewer Modal */}
      <DiplomaViewerModal
        certification={viewingCert?.cert || null}
        coachName={viewingCert?.coachName}
        onClose={() => setViewingCert(null)}
      />

      {/* Coaching Request Modal */}
      {selectedCoach && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedCoach(null)}
        >
          <div
            className="w-full max-w-lg rounded-3xl border border-white/15 bg-[#060607] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                  Solicitud de Entrenamiento
                </p>
                <h2 className="text-lg font-extrabold text-white">
                  Contactar a {selectedCoach.full_name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCoach(null)}
                className="rounded-xl border border-white/[0.08] bg-[#0e0f12] p-2 text-zinc-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {sentSuccess ? (
              <div className="space-y-4 py-4 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-white">
                  ¡Solicitud enviada al Coach!
                </h3>
                <p className="text-xs leading-relaxed text-zinc-300">
                  {selectedCoach.full_name} recibió tu solicitud en su panel de
                  alumnos. Cuando la acepte, recibirás tu invitación para
                  comenzar tu plan.
                </p>
                <button
                  type="button"
                  onClick={() => setSelectedCoach(null)}
                  className="rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-bold text-zinc-950"
                >
                  Entendido
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendInquiry} className="space-y-3.5">
                {mode === "student" && studentProfile.is_verified_identity && (
                  <div className="flex items-center gap-2 rounded-xl border border-sky-500/35 bg-sky-500/10 px-3 py-2 text-xs text-sky-200">
                    <BadgeCheck className="h-4 w-4 shrink-0 text-sky-400" />
                    Tu solicitud incluirá tu insignia de{" "}
                    <strong>Persona Real Verificada</strong>.
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-zinc-300">
                      Tu nombre completo *
                    </label>
                    <input
                      type="text"
                      required
                      value={reqName}
                      onChange={(e) => setReqName(e.target.value)}
                      placeholder="Ej. Luis Martínez"
                      className="w-full rounded-xl border border-white/15 bg-[#060607] px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-zinc-300">
                      Tu correo electrónico *
                    </label>
                    <input
                      type="email"
                      required
                      value={reqEmail}
                      onChange={(e) => setReqEmail(e.target.value)}
                      placeholder="tu@correo.com"
                      className="w-full rounded-xl border border-white/15 bg-[#060607] px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-zinc-300">
                      Objetivo principal *
                    </label>
                    <input
                      type="text"
                      required
                      value={reqGoal}
                      onChange={(e) => setReqGoal(e.target.value)}
                      placeholder="Ej. Ganar masa muscular"
                      className="w-full rounded-xl border border-white/15 bg-[#060607] px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-zinc-300">
                      Plan de interés
                    </label>
                    <select
                      value={reqPlan}
                      onChange={(e) => setReqPlan(e.target.value)}
                      className="w-full rounded-xl border border-white/15 bg-[#060607] px-3 py-2 text-xs text-white"
                    >
                      {selectedCoach.plans.map((p) => (
                        <option key={p.id} value={p.name}>
                          {p.name} (${p.price.toLocaleString("es-MX")})
                        </option>
                      ))}
                      {selectedCoach.plans.length === 0 && (
                        <option value="Plan Personalizado">
                          Plan Personalizado
                        </option>
                      )}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-300">
                    Mensaje para el Coach *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={reqMessage}
                    onChange={(e) => setReqMessage(e.target.value)}
                    placeholder="Cuéntale tu experiencia, días disponibles y qué te gustaría lograr..."
                    className="w-full rounded-xl border border-white/15 bg-[#060607] p-3 text-xs text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCoach(null)}
                    className="rounded-xl border border-white/15 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-white/[0.06]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-white hover:bg-zinc-200 px-4 py-2 text-xs font-bold text-zinc-950"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Enviar Solicitud
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
