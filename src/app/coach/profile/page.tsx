"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ExternalLink,
  HelpCircle,
  LogOut,
  RotateCcw,
  Save,
  ShieldCheck,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  CertifiedCoachBadge,
  VerifiedPersonBadge,
} from "@/components/VerificationBadge";
import { IdentityVerificationCard } from "@/components/IdentityVerificationCard";
import { CoachCertificationsManager } from "@/components/CoachCertificationsManager";

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
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-white">
            Perfil, Verificación y Diplomas
          </h1>
          <p className="text-sm text-slate-400">
            Administra tu identidad verificada, tus archivos de diplomas y tu
            perfil público para alumnos buscando coach.
          </p>
        </div>

        <Link
          href="/coaches"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-3.5 py-2 text-xs font-bold text-cyan-300 transition hover:bg-cyan-500/20"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Ver en Directorio
        </Link>
      </div>

      {saved && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-3 text-xs font-semibold text-emerald-300">
          <CheckCircle2 className="h-4 w-4" />
          Perfil público actualizado correctamente.
        </div>
      )}

      {/* Identity Verification Module */}
      <IdentityVerificationCard role="coach" profile={coachProfile} />

      {/* Coach Diplomas & Certifications File Manager */}
      <CoachCertificationsManager />

      {/* Coach Public Profile Form */}
      <form
        onSubmit={handleSave}
        className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-6"
      >
        <div className="flex flex-wrap items-center gap-4 pb-2">
          <img
            src={
              coachProfile.avatar_url ||
              "https://images.unsplash.com/photo-1567013127542-490d757e51fc?auto=format&fit=crop&w=128&q=80"
            }
            alt={coachProfile.full_name}
            className="h-16 w-16 rounded-full object-cover ring-2 ring-cyan-500/50"
          />
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-base font-bold text-white">
                {coachProfile.full_name}
              </p>
              <VerifiedPersonBadge
                verified={coachProfile.is_verified_identity}
                compact
              />
              <CertifiedCoachBadge diplomaCount={myDiplomasCount} compact />
            </div>
            <p className="text-xs text-slate-400">{coachProfile.email}</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-300">
              Nombre completo
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-300">
              Marca / Gimnasio
            </label>
            <input
              type="text"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-300">
            Especialidad
          </label>
          <input
            type="text"
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-1">
            <label className="mb-1 block text-xs font-semibold text-slate-300">
              Teléfono / WhatsApp
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
            />
          </div>
          <div className="sm:col-span-1">
            <label className="mb-1 block text-xs font-semibold text-slate-300">
              Ciudad / Modalidad
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ej. CDMX (Online y Presencial)"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
            />
          </div>
          <div className="sm:col-span-1">
            <label className="mb-1 block text-xs font-semibold text-slate-300">
              Años de experiencia
            </label>
            <input
              type="number"
              min={0}
              max={50}
              value={yearsExperience}
              onChange={(e) => setYearsExperience(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-300">
            Biografía profesional (visible para alumnos buscando coach)
          </label>
          <textarea
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Describe tu metodología, experiencia y cómo ayudas a tus alumnos..."
            className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-white outline-none focus:border-cyan-500"
          />
        </div>

        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-3">
          <div>
            <p className="text-xs font-bold text-white">
              Visible en el directorio &ldquo;Buscar Coach&rdquo;
            </p>
            <p className="text-[11px] text-slate-400">
              Permite que alumnos nuevos vean tus diplomas y te envíen solicitudes.
            </p>
          </div>
          <input
            type="checkbox"
            checked={acceptingStudents}
            onChange={(e) => setAcceptingStudents(e.target.checked)}
            className="h-4 w-4 accent-emerald-500"
          />
        </label>

        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-5 py-3 text-xs font-bold text-slate-950"
        >
          <Save className="h-4 w-4" />
          Guardar Cambios
        </button>
      </form>

      <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-xs text-slate-400">
        <p className="flex items-center gap-2 font-semibold text-slate-200">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          Términos y Condiciones Aceptados
        </p>
        <p>
          Registro de aceptación:{" "}
          <span className="font-mono text-slate-300">
            {new Date(coachProfile.terms_accepted_at).toLocaleString("es-MX")}
          </span>
        </p>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            onClick={() => resetOnboarding("coach")}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-500/20"
          >
            <HelpCircle className="h-4 w-4" />
            Ver Tutorial Guiado nuevamente
          </button>
          {isDemoMode && (
            <button
              type="button"
              onClick={() => {
                resetDemoData();
                setSaved(true);
                setTimeout(() => setSaved(false), 2500);
              }}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-700"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Restaurar Datos Demo
            </button>
          )}
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20 disabled:opacity-50"
          >
            <LogOut className="h-3.5 w-3.5" />
            {signingOut ? "Cerrando sesión..." : "Cerrar Sesión"}
          </button>
        </div>
      </div>
    </div>
  );
}
