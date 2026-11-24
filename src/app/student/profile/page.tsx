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

  // Synchronized Goals fields
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
    setSavedMsg(
      "¡Metas actualizadas y sincronizadas directamente con el expediente de tu Coach!"
    );
    setTimeout(() => setSavedMsg(null), 3500);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateStudentProfile({
      full_name: fullName,
      gender,
      phone,
      avatar_url: avatarUrl,
    });
    setSavedMsg("Datos personales y género de guía visual guardados.");
    setTimeout(() => setSavedMsg(null), 2500);
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">
          Mis Metas y Perfil
        </h1>
        <p className="text-xs text-zinc-400">
          Tus objetivos y limitaciones se sincronizan automáticamente con tu Coach
          para adaptar tus rutinas y nutrición.
        </p>
      </div>

      {savedMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-3 text-xs font-semibold text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {savedMsg}
        </div>
      )}

      {/* Real Person Identity Verification */}
      <IdentityVerificationCard role="student" profile={studentProfile} />

      {/* Synchronized Fitness Goals Form */}
      <form
        onSubmit={handleSaveGoals}
        className="space-y-4 rounded-2xl border border-emerald-500/35 bg-[#0e0f12] p-6"
      >
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-emerald-400" />
          <h2 className="text-base font-bold text-white">
            Perfil de Objetivos (Sincronizado con Coach)
          </h2>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-zinc-300">
            Objetivo principal
          </label>
          <select
            value={primaryGoal}
            onChange={(e) => setPrimaryGoal(e.target.value)}
            className="w-full rounded-xl border border-white/15 bg-[#060607] px-3.5 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
          >
            {PRIMARY_GOALS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-zinc-300">
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
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                    active
                      ? "bg-emerald-500 text-zinc-950"
                      : "border border-white/15 bg-[#060607] text-zinc-300 hover:border-emerald-500/50"
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
            <label className="mb-1 block text-xs font-semibold text-zinc-300">
              Peso objetivo (kg, opcional)
            </label>
            <input
              type="number"
              step="0.1"
              value={targetWeight}
              onChange={(e) => setTargetWeight(e.target.value)}
              placeholder="Ej. 60.0"
              className="w-full rounded-xl border border-white/15 bg-[#060607] px-3.5 py-2.5 text-sm text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-zinc-300">
              Días disponibles / semana
            </label>
            <select
              value={daysPerWeek}
              onChange={(e) => setDaysPerWeek(Number(e.target.value))}
              className="w-full rounded-xl border border-white/15 bg-[#060607] px-3.5 py-2.5 text-sm text-white"
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
          <label className="mb-1 block text-xs font-semibold text-zinc-300">
            Lesiones o limitaciones físicas a considerar
          </label>
          <textarea
            rows={2}
            value={limitations}
            onChange={(e) => setLimitations(e.target.value)}
            placeholder="Ej. Molestia en rodilla izquierda con saltos, dolor lumbar..."
            className="w-full rounded-xl border border-white/15 bg-[#060607] p-3 text-xs text-white outline-none focus:border-emerald-500"
          />
        </div>

        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-xl bg-white hover:bg-zinc-200 px-5 py-3 text-xs font-bold text-zinc-950"
        >
          <Save className="h-4 w-4" />
          Guardar y Sincronizar Metas
        </button>
      </form>

      {/* Personal Data Form */}
      <form
        onSubmit={handleSaveProfile}
        className="space-y-4 rounded-2xl border border-white/[0.08] bg-[#0e0f12] p-6"
      >
        <div className="flex items-center gap-4 pb-2">
          <img
            src={
              avatarUrl ||
              "https://images.unsplash.com/photo-1548690312-e3b507d8c110?auto=format&fit=crop&w=128&q=80"
            }
            alt={fullName}
            className="h-14 w-14 rounded-full object-cover ring-2 ring-emerald-500/50"
          />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-base font-bold text-white">{fullName}</p>
              <VerifiedPersonBadge
                verified={studentProfile.is_verified_identity}
                compact
              />
            </div>
            <p className="text-xs text-zinc-400">{studentProfile.email}</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-zinc-300">
              Nombre completo
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-[#060607] px-3.5 py-2.5 text-sm text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-zinc-300">
              Género (Guía Anatómica)
            </label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as Gender)}
              className="w-full rounded-xl border border-white/15 bg-[#060607] px-3.5 py-2.5 text-sm text-white"
            >
              <option value="female">Mujer</option>
              <option value="male">Hombre</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-zinc-300">
              Teléfono
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-[#060607] px-3.5 py-2.5 text-sm text-white"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-zinc-300">
            URL de Foto de Perfil
          </label>
          <div className="relative">
            <Camera className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-[#060607] py-2.5 pl-10 pr-3.5 text-xs text-white"
            />
          </div>
        </div>

        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-5 py-2.5 text-xs font-bold text-white hover:bg-white/[0.12]"
        >
          <Save className="h-4 w-4" />
          Actualizar Datos Personales
        </button>
      </form>

      <div className="space-y-3 rounded-2xl border border-white/[0.08] bg-[#0e0f12] p-5 text-xs text-zinc-400">
        <p className="flex items-center gap-2 font-semibold text-zinc-200">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          Términos y Condiciones Aceptados
        </p>
        <p>
          Aceptado el:{" "}
          <span className="font-mono text-zinc-300">
            {new Date(studentProfile.terms_accepted_at).toLocaleString("es-MX")}
          </span>
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            onClick={() => resetOnboarding("student")}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/20"
          >
            <HelpCircle className="h-4 w-4" />
            Ver Tutorial Guiado nuevamente
          </button>
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
