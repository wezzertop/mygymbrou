"use client";

import React, { useEffect, useState } from "react";
import {
  Check,
  ClipboardList,
  Dumbbell,
  HeartPulse,
  Phone,
  Save,
  ShieldCheck,
} from "lucide-react";
import {
  AVAILABLE_DAYS_OPTIONS,
  GYM_EXPERIENCE_OPTIONS,
  INITIAL_GOAL_OPTIONS,
  SESSION_DURATION_OPTIONS,
} from "@/lib/student-record-constants";
import type { CoachStudentRecord, CoachStudentRelation } from "@/types/database";

interface StudentClinicalRecordTabProps {
  student: CoachStudentRelation;
  record?: CoachStudentRecord;
  onSave: (
    patch: Partial<
      Omit<
        CoachStudentRecord,
        "id" | "coach_student_id" | "coach_id" | "created_at" | "updated_at"
      >
    >
  ) => void;
}

export function StudentClinicalRecordTab({
  student,
  record,
  onSave,
}: StudentClinicalRecordTabProps) {
  const [phone, setPhone] = useState(record?.phone || student.phone || "");
  const [goals, setGoals] = useState<string[]>(
    record?.goals && record.goals.length > 0
      ? record.goals
      : student.initial_goals && student.initial_goals.length > 0
      ? student.initial_goals
      : student.fitness_goal
      ? [student.fitness_goal]
      : []
  );
  const [hasInjuries, setHasInjuries] = useState(Boolean(record?.has_injuries));
  const [injuriesDetail, setInjuriesDetail] = useState(
    record?.injuries_detail || ""
  );
  const [hasChronic, setHasChronic] = useState(
    Boolean(record?.has_chronic_conditions)
  );
  const [chronicDetail, setChronicDetail] = useState(
    record?.chronic_conditions_detail || ""
  );
  const [takesMeds, setTakesMeds] = useState(
    Boolean(record?.takes_medications)
  );
  const [medsDetail, setMedsDetail] = useState(record?.medications_detail || "");
  const [allergies, setAllergies] = useState(record?.allergies || "");
  const [supplements, setSupplements] = useState(
    record?.current_supplements || ""
  );
  const [gymExperience, setGymExperience] = useState(
    record?.gym_experience || ""
  );
  const [daysPerWeek, setDaysPerWeek] = useState<number | undefined>(
    record?.available_days_per_week
  );
  const [sessionDuration, setSessionDuration] = useState(
    record?.session_duration_hours || ""
  );
  const [coachNotes, setCoachNotes] = useState(
    record?.initial_coach_notes || ""
  );

  useEffect(() => {
    if (!record) return;
    setPhone(record.phone || student.phone || "");
    setGoals(record.goals || []);
    setHasInjuries(Boolean(record.has_injuries));
    setInjuriesDetail(record.injuries_detail || "");
    setHasChronic(Boolean(record.has_chronic_conditions));
    setChronicDetail(record.chronic_conditions_detail || "");
    setTakesMeds(Boolean(record.takes_medications));
    setMedsDetail(record.medications_detail || "");
    setAllergies(record.allergies || "");
    setSupplements(record.current_supplements || "");
    setGymExperience(record.gym_experience || "");
    setDaysPerWeek(record.available_days_per_week);
    setSessionDuration(record.session_duration_hours || "");
    setCoachNotes(record.initial_coach_notes || "");
  }, [record, student.phone]);

  const toggleGoal = (goalOpt: string) => {
    setGoals((prev) =>
      prev.includes(goalOpt)
        ? prev.filter((g) => g !== goalOpt)
        : [...prev, goalOpt]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      phone: phone.trim() || undefined,
      goals,
      has_injuries: hasInjuries,
      injuries_detail: hasInjuries ? injuriesDetail.trim() : undefined,
      has_chronic_conditions: hasChronic,
      chronic_conditions_detail: hasChronic ? chronicDetail.trim() : undefined,
      takes_medications: takesMeds,
      medications_detail: takesMeds ? medsDetail.trim() : undefined,
      allergies: allergies.trim() || undefined,
      current_supplements: supplements.trim() || undefined,
      gym_experience: gymExperience || undefined,
      available_days_per_week: daysPerWeek,
      session_duration_hours: sessionDuration || undefined,
      initial_coach_notes: coachNotes.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Privacy banner */}
      <div className="flex items-start gap-2.5 rounded-xl border border-[#00FF90]/25 bg-[#00FF90]/[0.06] px-4 py-3 text-xs text-zinc-300">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#00FF90]" />
        <div>
          <p className="font-bold text-white">
            Expediente Aislado y Confidencial (Multi-Tenant)
          </p>
          <p className="mt-0.5 text-[11px] text-zinc-400">
            Esta ficha clínica pertenece únicamente a tu relación con{" "}
            <strong className="text-zinc-200">{student.invited_name}</strong> y
            nunca es visible para otros entrenadores.
          </p>
        </div>
      </div>

      {/* Contacto y Objetivos */}
      <div className="space-y-4 rounded-xl border border-white/[0.08] bg-[#0e0f12] p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-zinc-300">
              Teléfono / WhatsApp del alumno
            </label>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+52 55 0000 0000"
                className="w-full rounded-xl border border-white/15 bg-[#060607] py-2.5 pl-9 pr-3 text-sm text-white outline-none focus:border-[#00FF90]/60"
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-semibold text-zinc-300">
              Objetivos del Expediente (Multi-Selección)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {INITIAL_GOAL_OPTIONS.map((opt) => {
                const active = goals.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleGoal(opt)}
                    className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      active
                        ? "border-[#00FF90]/70 bg-[#00FF90]/15 text-[#00FF90]"
                        : "border-white/10 bg-[#060607] text-zinc-400 hover:text-white"
                    }`}
                  >
                    {active && <Check className="h-3 w-3" />}
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Historial Médico y Salud */}
      <div className="space-y-3.5 rounded-xl border border-white/[0.08] bg-[#0e0f12] p-5">
        <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#00FF90]">
          <HeartPulse className="h-4 w-4" />
          Historial Médico y Salud
        </h3>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {/* Lesiones */}
          <div className="space-y-2 rounded-xl border border-white/[0.06] bg-[#060607] p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-200">
                Lesiones previas / actuales
              </span>
              <div className="flex gap-1">
                {[false, true].map((val) => (
                  <button
                    key={String(val)}
                    type="button"
                    onClick={() => setHasInjuries(val)}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${
                      hasInjuries === val
                        ? val
                          ? "bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/50"
                          : "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/50"
                        : "bg-white/[0.04] text-zinc-500"
                    }`}
                  >
                    {val ? "Sí" : "No"}
                  </button>
                ))}
              </div>
            </div>
            {hasInjuries && (
              <textarea
                rows={2}
                value={injuriesDetail}
                onChange={(e) => setInjuriesDetail(e.target.value)}
                placeholder="Zona, fecha o restricción de movimiento..."
                className="w-full rounded-lg border border-white/10 bg-[#0e0f12] px-2.5 py-2 text-xs text-white outline-none focus:border-amber-400/60"
              />
            )}
          </div>

          {/* Condiciones crónicas */}
          <div className="space-y-2 rounded-xl border border-white/[0.06] bg-[#060607] p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-200">
                Enfermedades / condiciones
              </span>
              <div className="flex gap-1">
                {[false, true].map((val) => (
                  <button
                    key={String(val)}
                    type="button"
                    onClick={() => setHasChronic(val)}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${
                      hasChronic === val
                        ? val
                          ? "bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/50"
                          : "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/50"
                        : "bg-white/[0.04] text-zinc-500"
                    }`}
                  >
                    {val ? "Sí" : "No"}
                  </button>
                ))}
              </div>
            </div>
            {hasChronic && (
              <textarea
                rows={2}
                value={chronicDetail}
                onChange={(e) => setChronicDetail(e.target.value)}
                placeholder="Detalle de condición médica..."
                className="w-full rounded-lg border border-white/10 bg-[#0e0f12] px-2.5 py-2 text-xs text-white outline-none focus:border-amber-400/60"
              />
            )}
          </div>

          {/* Medicamentos */}
          <div className="space-y-2 rounded-xl border border-white/[0.06] bg-[#060607] p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-200">
                Medicamentos actuales
              </span>
              <div className="flex gap-1">
                {[false, true].map((val) => (
                  <button
                    key={String(val)}
                    type="button"
                    onClick={() => setTakesMeds(val)}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${
                      takesMeds === val
                        ? val
                          ? "bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/50"
                          : "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/50"
                        : "bg-white/[0.04] text-zinc-500"
                    }`}
                  >
                    {val ? "Sí" : "No"}
                  </button>
                ))}
              </div>
            </div>
            {takesMeds && (
              <textarea
                rows={2}
                value={medsDetail}
                onChange={(e) => setMedsDetail(e.target.value)}
                placeholder="Cuáles toma y frecuencia..."
                className="w-full rounded-lg border border-white/10 bg-[#0e0f12] px-2.5 py-2 text-xs text-white outline-none focus:border-amber-400/60"
              />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-400">
              Alergias o intolerancias alimentarias
            </label>
            <input
              type="text"
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              placeholder="Ej. Lactosa, gluten, mariscos..."
              className="w-full rounded-xl border border-white/10 bg-[#060607] px-3 py-2.5 text-sm text-white outline-none focus:border-[#00FF90]/60"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-400">
              Suplementación actual
            </label>
            <input
              type="text"
              value={supplements}
              onChange={(e) => setSupplements(e.target.value)}
              placeholder="Ej. Proteína aislada, Creatina 5g..."
              className="w-full rounded-xl border border-white/10 bg-[#060607] px-3 py-2.5 text-sm text-white outline-none focus:border-[#00FF90]/60"
            />
          </div>
        </div>
      </div>

      {/* Experiencia y Disponibilidad */}
      <div className="space-y-4 rounded-xl border border-white/[0.08] bg-[#0e0f12] p-5">
        <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#00FF90]">
          <Dumbbell className="h-4 w-4" />
          Experiencia y Disponibilidad
        </h3>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400">
            Tiempo entrenando en gimnasio
          </label>
          <div className="flex flex-wrap gap-1.5">
            {GYM_EXPERIENCE_OPTIONS.map((exp) => (
              <button
                key={exp}
                type="button"
                onClick={() => setGymExperience(exp)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                  gymExperience === exp
                    ? "border-[#00FF90]/70 bg-[#00FF90]/15 text-[#00FF90]"
                    : "border-white/10 bg-[#060607] text-zinc-400 hover:text-white"
                }`}
              >
                {exp}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">
              Días disponibles por semana
            </label>
            <div className="flex gap-1.5">
              {AVAILABLE_DAYS_OPTIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDaysPerWeek(d)}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg border text-xs font-bold transition ${
                    daysPerWeek === d
                      ? "border-[#00FF90] bg-[#00FF90] text-zinc-950"
                      : "border-white/10 bg-[#060607] text-zinc-300 hover:border-white/25"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">
              Tiempo disponible por sesión
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {SESSION_DURATION_OPTIONS.map((dur) => (
                <button
                  key={dur}
                  type="button"
                  onClick={() => setSessionDuration(dur)}
                  className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                    sessionDuration === dur
                      ? "border-[#00FF90]/70 bg-[#00FF90]/15 text-[#00FF90]"
                      : "border-white/10 bg-[#060607] text-zinc-400 hover:text-white"
                  }`}
                >
                  {dur}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-zinc-400">
            <ClipboardList className="h-3.5 w-3.5 text-[#00FF90]" />
            Notas iniciales / clínicas del Coach
          </label>
          <textarea
            rows={3}
            value={coachNotes}
            onChange={(e) => setCoachNotes(e.target.value)}
            placeholder="Observaciones de consulta, historial postural, preferencias..."
            className="w-full rounded-xl border border-white/10 bg-[#060607] px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#00FF90]/60"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#00FF90] px-6 text-xs font-extrabold text-zinc-950 transition hover:bg-[#48b73d]"
        >
          <Save className="h-4 w-4" />
          Guardar Expediente Clínico
        </button>
      </div>
    </form>
  );
}
