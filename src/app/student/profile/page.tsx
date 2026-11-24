"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  CheckCircle2,
  HelpCircle,
  LogOut,
  Save,
  ShieldCheck,
  Target,
  User,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Gender } from "@/types/database";
import { IdentityVerificationCard } from "@/components/IdentityVerificationCard";
import { VerifiedPersonBadge } from "@/components/VerificationBadge";

const PRIMARY_GOALS = [
  "Pérdida de grasa",
  "Hipertrofia (ganar masa muscular)",
  "Recomposición corporal",
  "Fuerza",
  "Resistencia / Rendimiento",
];

const PRIORITY_ZONES = [
  "Abdomen",
  "Brazos/Bíceps",
  "Espalda",
  "Pierna/Glúteo",
  "Pecho",
  "Hombro",
];

type ProfileTab = "datos" | "metas" | "verificacion" | "cuenta";

export default function StudentProfilePage() {
  const router = useRouter();
  const {
    studentProfile,
    studentGoals,
    updateStudentProfile,
    updateStudentGoal,
    resetOnboarding,
    signOut,
  } = useApp();

  const [tab, setTab] = useState<ProfileTab>("datos");
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    router.push("/auth?role=student");
  };

  const existingGoal = studentGoals.find(
    (g) => g.student_id === studentProfile.id
  );

  // Profile fields
  const [fullName, setFullName] = useState(studentProfile.full_name);
  const [gender, setGender] = useState<Gender>(
    studentProfile.gender || "female"
  );
  const [phone, setPhone] = useState(studentProfile.phone || "");
  const [avatarUrl, setAvatarUrl] = useState(studentProfile.avatar_url || "");

  // Goals fields
  const [primaryGoal, setPrimaryGoal] = useState(
    existingGoal?.primary_goal || "Recomposición corporal"
  );
  const [priorityZones, setPriorityZones] = useState<string[]>(
    existingGoal?.priority_zones || ["Abdomen", "Pierna/Glúteo"]
  );
  const [targetWeight, setTargetWeight] = useState(
    existingGoal?.target_weight_kg?.toString() || ""
  );
  const [daysPerWeek, setDaysPerWeek] = useState(
    existingGoal?.days_per_week || 4
  );
  const [limitations, setLimitations] = useState(
    existingGoal?.limitations_or_injuries || ""
  );

  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const toggleZone = (zone: string) => {
    setPriorityZones((prev) =>
      prev.includes(zone) ? prev.filter((z) => z !== zone) : [...prev, zone]
    );
  };

  const handleSaveGoals = (e: React.FormEvent) => {
    e.preventDefault();
    updateStudentGoal({
      student_id: studentProfile.id,
      primary_goal: primaryGoal,
      priority_zones: priorityZones,
      target_weight_kg: targetWeight ? Number(targetWeight) : undefined,
      days_per_week: daysPerWeek,
      limitations_or_injuries: limitations,
    });
    setSavedMsg("Metas actualizadas y sincronizadas con tu Coach.");
    setTimeout(() => setSavedMsg(null), 3200);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateStudentProfile({
      full_name: fullName,
      gender,
      phone,
      avatar_url: avatarUrl,
    });
    setSavedMsg("Datos personales guardados correctamente.");
    setTimeout(() => setSavedMsg(null), 2800);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Compact Profile Identity Header */}
      <div className="flex items-center gap-4 rounded-2xl border border-white/[0.08] bg-[#0e0f12] p-4 sm:p-5">
        <img
          src={
            studentProfile.avatar_url ||
            "https://images.unsplash.com/photo-1548690312-e3b507d8c110?auto=format&fit=crop&w=160&q=80"
          }
          alt={studentProfile.full_name}
          className="h-14 w-14 shrink-0 rounded-full object-cover ring-1 ring-white/15"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-lg font-semibold tracking-tight text-white sm:text-xl">
              {studentProfile.full_name}
            </h1>
            <VerifiedPersonBadge
              verified={studentProfile.is_verified_identity}
              compact
            />
          </div>
          <p className="truncate text-xs text-zinc-400">
            {studentProfile.email || "Perfil de Alumno"}
          </p>
          <p className="mt-0.5 text-[11px] font-medium text-emerald-400">
            {primaryGoal}
          </p>
        </div>
      </div>

      {savedMsg && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs font-medium text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {savedMsg}
        </div>
      )}

      {/* Clean Pill Tabs — Zero Friction, One Section at a Time */}
      <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1">
        {(
          [
            { key: "datos", label: "Datos", icon: User },
            { key: "metas", label: "Mis Metas", icon: Target },
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

      {/* TAB 1: DATOS PERSONALES */}
      {tab === "datos" && (
        <form
          onSubmit={handleSaveProfile}
          className="space-y-4 rounded-2xl border border-white/[0.08] bg-[#0e0f12] p-5 sm:p-6"
        >
          <div>
            <h2 className="text-base font-semibold text-white">
              Datos Personales
            </h2>
            <p className="mt-0.5 text-xs text-zinc-400">
              Información básica y preferencia de guía visual en tus rutinas.
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
                Teléfono / WhatsApp
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ej. 55 1234 5678"
                className="min-h-[44px] w-full rounded-xl border border-white/10 bg-[#060607] px-3.5 text-sm text-white outline-none focus:border-emerald-500/60"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                Género (Guía Anatómica)
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as Gender)}
                className="min-h-[44px] w-full rounded-xl border border-white/10 bg-[#060607] px-3.5 text-sm text-white outline-none focus:border-emerald-500/60"
              >
                <option value="female">Mujer</option>
                <option value="male">Hombre</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                URL de Foto de Perfil
              </label>
              <div className="relative">
                <Camera className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://..."
                  className="min-h-[44px] w-full rounded-xl border border-white/10 bg-[#060607] pl-9 pr-3.5 text-xs text-white outline-none focus:border-emerald-500/60"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-6 text-xs font-semibold text-zinc-950 transition hover:bg-zinc-200"
            >
              <Save className="h-4 w-4" />
              Guardar cambios
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: MIS METAS */}
      {tab === "metas" && (
        <form
          onSubmit={handleSaveGoals}
          className="space-y-4 rounded-2xl border border-white/[0.08] bg-[#0e0f12] p-5 sm:p-6"
        >
          <div>
            <h2 className="text-base font-semibold text-white">
              Objetivos y Disponibilidad
            </h2>
            <p className="mt-0.5 text-xs text-zinc-400">
              Se sincronizan automáticamente con el expediente de tu Coach.
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">
              Objetivo principal
            </label>
            <select
              value={primaryGoal}
              onChange={(e) => setPrimaryGoal(e.target.value)}
              className="min-h-[44px] w-full rounded-xl border border-white/10 bg-[#060607] px-3.5 text-sm text-white outline-none focus:border-emerald-500/60"
            >
              {PRIMARY_GOALS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-zinc-400">
              Zonas prioritarias
            </label>
            <div className="flex flex-wrap gap-2">
              {PRIORITY_ZONES.map((zone) => {
                const active = priorityZones.includes(zone);
                return (
                  <button
                    key={zone}
                    type="button"
                    onClick={() => toggleZone(zone)}
                    className={`h-9 rounded-full px-3.5 text-xs font-medium transition ${
                      active
                        ? "bg-emerald-500 text-zinc-950"
                        : "border border-white/10 bg-[#060607] text-zinc-300 hover:border-white/25"
                    }`}
                  >
                    {zone}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                Peso objetivo (kg)
              </label>
              <input
                type="number"
                step="0.1"
                value={targetWeight}
                onChange={(e) => setTargetWeight(e.target.value)}
                placeholder="Ej. 60.0"
                className="min-h-[44px] w-full rounded-xl border border-white/10 bg-[#060607] px-3.5 text-sm text-white outline-none focus:border-emerald-500/60"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                Días / semana
              </label>
              <select
                value={daysPerWeek}
                onChange={(e) => setDaysPerWeek(Number(e.target.value))}
                className="min-h-[44px] w-full rounded-xl border border-white/10 bg-[#060607] px-3.5 text-sm text-white outline-none focus:border-emerald-500/60"
              >
                {[2, 3, 4, 5, 6, 7].map((d) => (
                  <option key={d} value={d}>
                    {d} días por semana
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">
              Lesiones o limitaciones (opcional)
            </label>
            <textarea
              rows={2}
              value={limitations}
              onChange={(e) => setLimitations(e.target.value)}
              placeholder="Ej. Molestia en rodilla izquierda con saltos..."
              className="w-full rounded-xl border border-white/10 bg-[#060607] p-3 text-sm text-white outline-none focus:border-emerald-500/60"
            />
          </div>

          <button
            type="submit"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-6 text-xs font-semibold text-zinc-950 transition hover:bg-zinc-200"
          >
            <Save className="h-4 w-4" />
            Guardar y sincronizar metas
          </button>
        </form>
      )}

      {/* TAB 3: VERIFICACIÓN */}
      {tab === "verificacion" && (
        <IdentityVerificationCard role="student" profile={studentProfile} />
      )}

      {/* TAB 4: CUENTA Y AYUDA */}
      {tab === "cuenta" && (
        <div className="space-y-4 rounded-2xl border border-white/[0.08] bg-[#0e0f12] p-5 sm:p-6">
          <div>
            <h2 className="text-base font-semibold text-white">
              Cuenta y Ayuda
            </h2>
            <p className="mt-0.5 text-xs text-zinc-400">
              Términos aceptados el{" "}
              <span className="font-mono text-zinc-300">
                {new Date(studentProfile.terms_accepted_at).toLocaleDateString(
                  "es-MX"
                )}
              </span>
            </p>
          </div>

          <div className="flex flex-col gap-2.5 pt-2 sm:flex-row">
            <button
              type="button"
              onClick={() => resetOnboarding("student")}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-5 text-xs font-medium text-white transition hover:bg-white/[0.08]"
            >
              <HelpCircle className="h-4 w-4 text-emerald-400" />
              Ver Tutorial Guiado
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-5 text-xs font-medium text-rose-300 transition hover:bg-rose-500/20 disabled:opacity-50"
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
