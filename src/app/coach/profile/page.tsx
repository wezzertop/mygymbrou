"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Award,
  CheckCircle2,
  ExternalLink,
  HelpCircle,
  LogOut,
  RotateCcw,
  Save,
  ShieldCheck,
  User,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  CertifiedCoachBadge,
  VerifiedPersonBadge,
} from "@/components/VerificationBadge";
import { IdentityVerificationCard } from "@/components/IdentityVerificationCard";
import { CoachCertificationsManager } from "@/components/CoachCertificationsManager";
import { ReportIssueButton } from "@/components/ReportIssueButton";

type CoachProfileTab = "perfil" | "diplomas" | "verificacion" | "cuenta";

export default function CoachProfilePage() {
  const router = useRouter();
  const {
    coachProfile,
    coachCertifications,
    isDemoMode,
    updateCoachProfile,
    resetOnboarding,
    resetDemoData,
    signOut,
  } = useApp();

  const [tab, setTab] = useState<CoachProfileTab>("perfil");
  const [fullName, setFullName] = useState(coachProfile.full_name);
  const [brandName, setBrandName] = useState(coachProfile.brand_name || "");
  const [specialty, setSpecialty] = useState(coachProfile.specialty || "");
  const [phone, setPhone] = useState(coachProfile.phone || "");
  const [city, setCity] = useState(coachProfile.city || "");
  const [yearsExperience, setYearsExperience] = useState(
    String(coachProfile.years_experience ?? 5)
  );
  const [bio, setBio] = useState(coachProfile.bio || "");
  const [acceptingStudents, setAcceptingStudents] = useState(
    coachProfile.accepting_students ?? true
  );
  const [saved, setSaved] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const myDiplomasCount = coachCertifications.filter(
    (c) => c.coach_id === coachProfile.id || !coachProfile.id
  ).length;

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    router.push("/auth");
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateCoachProfile({
      full_name: fullName,
      brand_name: brandName,
      specialty,
      phone,
      city,
      years_experience: Number(yearsExperience) || 1,
      bio,
      accepting_students: acceptingStudents,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Compact Coach Identity Header */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-white/[0.08] bg-[#0e0f12] p-4 sm:flex-row sm:items-center sm:p-5">
        <div className="flex items-center gap-4">
          <img
            src={
              coachProfile.avatar_url ||
              "https://images.unsplash.com/photo-1567013127542-490d757e51fc?auto=format&fit=crop&w=160&q=80"
            }
            alt={coachProfile.full_name}
            className="h-14 w-14 shrink-0 rounded-full object-cover ring-1 ring-white/15"
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-lg font-semibold tracking-tight text-white sm:text-xl">
                {coachProfile.full_name}
              </h1>
              <VerifiedPersonBadge
                verified={coachProfile.is_verified_identity}
                compact
              />
              <CertifiedCoachBadge diplomaCount={myDiplomasCount} compact />
            </div>
            <p className="truncate text-xs text-zinc-400">
              {coachProfile.brand_name || coachProfile.email}
            </p>
          </div>
        </div>

        <Link
          href="/coaches"
          className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-white/15 bg-white/[0.03] px-4 text-xs font-medium text-zinc-200 transition hover:border-white/30 hover:text-white"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Ver en Directorio
        </Link>
      </div>

      {saved && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs font-medium text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Perfil público actualizado correctamente.
        </div>
      )}

      {/* Clean Pill Tabs — Progressive Disclosure */}
      <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1">
        {(
          [
            { key: "perfil", label: "Mi Perfil", icon: User },
            {
              key: "diplomas",
              label: `Diplomas (${myDiplomasCount})`,
              icon: Award,
            },
            { key: "verificacion", label: "Verificación", icon: ShieldCheck },
            { key: "cuenta", label: "Cuenta", icon: HelpCircle },
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

      {/* TAB 1: MI PERFIL */}
      {tab === "perfil" && (
        <form
          onSubmit={handleSave}
          className="space-y-4 rounded-xl border border-white/[0.08] bg-[#0e0f12] p-5 sm:p-6"
        >
          <div>
            <h2 className="text-base font-semibold text-white">
              Perfil Público del Coach
            </h2>
            <p className="mt-0.5 text-xs text-zinc-400">
              Así te verán tus alumnos y quienes busquen entrenador en el directorio.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                Nombre completo
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="min-h-[44px] w-full rounded-xl border border-white/10 bg-[#060607] px-3.5 text-sm text-white outline-none focus:border-emerald-500/60"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                Marca / Gimnasio
              </label>
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                className="min-h-[44px] w-full rounded-xl border border-white/10 bg-[#060607] px-3.5 text-sm text-white outline-none focus:border-emerald-500/60"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">
              Especialidad
            </label>
            <input
              type="text"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="min-h-[44px] w-full rounded-xl border border-white/10 bg-[#060607] px-3.5 text-sm text-white outline-none focus:border-emerald-500/60"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                Teléfono / WhatsApp
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="min-h-[44px] w-full rounded-xl border border-white/10 bg-[#060607] px-3.5 text-sm text-white outline-none focus:border-emerald-500/60"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                Ciudad / Modalidad
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ej. CDMX (Online y Presencial)"
                className="min-h-[44px] w-full rounded-xl border border-white/10 bg-[#060607] px-3.5 text-sm text-white outline-none focus:border-emerald-500/60"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                Años de experiencia
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={yearsExperience}
                onChange={(e) => setYearsExperience(e.target.value)}
                className="min-h-[44px] w-full rounded-xl border border-white/10 bg-[#060607] px-3.5 text-sm text-white outline-none focus:border-emerald-500/60"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">
              Biografía / Metodología
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Describe tu metodología y cómo ayudas a tus alumnos..."
              className="w-full rounded-xl border border-white/10 bg-[#060607] p-3.5 text-sm text-white outline-none focus:border-emerald-500/60"
            />
          </div>

          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-[#060607] p-3.5">
            <div>
              <p className="text-xs font-medium text-white">
                Visible en el directorio &ldquo;Buscar Coach&rdquo;
              </p>
              <p className="text-[11px] text-zinc-500">
                Permite que alumnos nuevos vean tus diplomas y te contacten.
              </p>
            </div>
            <input
              type="checkbox"
              checked={acceptingStudents}
              onChange={(e) => setAcceptingStudents(e.target.checked)}
              className="h-5 w-5 accent-emerald-500"
            />
          </label>

          <button
            type="submit"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-6 text-xs font-semibold text-zinc-950 transition hover:bg-zinc-200"
          >
            <Save className="h-4 w-4" />
            Guardar cambios
          </button>
        </form>
      )}

      {/* TAB 2: DIPLOMAS */}
      {tab === "diplomas" && <CoachCertificationsManager />}

      {/* TAB 3: VERIFICACIÓN */}
      {tab === "verificacion" && (
        <IdentityVerificationCard role="coach" profile={coachProfile} />
      )}

      {/* TAB 4: CUENTA Y AYUDA */}
      {tab === "cuenta" && (
        <div className="space-y-4 rounded-xl border border-white/[0.08] bg-[#0e0f12] p-5 sm:p-6">
          <div>
            <h2 className="text-base font-semibold text-white">
              Cuenta y Ayuda
            </h2>
            <p className="mt-0.5 text-xs text-zinc-400">
              Términos aceptados el{" "}
              <span className="font-mono text-zinc-300">
                {new Date(coachProfile.terms_accepted_at).toLocaleDateString(
                  "es-MX"
                )}
              </span>{" "}
              ·{" "}
              <Link href="/legal" className="text-emerald-400 hover:underline">
                Leer Términos y Privacidad
              </Link>
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => resetOnboarding("coach")}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-5 text-xs font-medium text-white transition hover:bg-white/[0.08]"
            >
              <HelpCircle className="h-4 w-4 text-emerald-400" />
              Ver Tutorial Guiado
            </button>
            <ReportIssueButton defaultReportedRole="student" />
            {isDemoMode && (
              <button
                type="button"
                onClick={() => {
                  resetDemoData();
                  setSaved(true);
                  setTimeout(() => setSaved(false), 2500);
                }}
                className="inline-flex h-11 items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-5 text-xs font-medium text-zinc-300 transition hover:text-white"
              >
                <RotateCcw className="h-4 w-4" />
                Restaurar Demo
              </button>
            )}
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-5 text-xs font-medium text-rose-300 transition hover:bg-rose-500/20 disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" />
              {signingOut ? "Cerrando sesión..." : "Cerrar Sesión"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
