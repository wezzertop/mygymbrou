import type {
  GymExperienceLevel,
  SessionDurationOption,
} from "@/types/database";

export const INITIAL_GOAL_OPTIONS: string[] = [
  "Hipertrofia / Ganancia muscular",
  "Pérdida de grasa / Definición",
  "Recomposición corporal",
  "Fuerza / Rendimiento",
  "Condición física / Salud general",
  "Readaptación / Movilidad",
  "Preparación competencia / Evento",
];

export const GYM_EXPERIENCE_OPTIONS: GymExperienceLevel[] = [
  "Principiante / Nuevo",
  "< 6 meses",
  "6 meses a 1 año",
  "1 a 3 años",
  "> 3 años",
];

export const AVAILABLE_DAYS_OPTIONS: number[] = [2, 3, 4, 5, 6, 7];

export const SESSION_DURATION_OPTIONS: SessionDurationOption[] = [
  "1 hora",
  "1.5 horas",
  "2 horas",
  "3 horas",
];

export function computeBmi(
  weightKg?: number | string | null,
  heightCm?: number | string | null
): { value: number; label: string; tone: string } | null {
  const w = Number(weightKg);
  const h = Number(heightCm);
  if (!w || !h || Number.isNaN(w) || Number.isNaN(h) || w <= 0 || h <= 0) {
    return null;
  }
  const heightM = h / 100;
  const bmi = Number((w / (heightM * heightM)).toFixed(1));
  if (bmi < 18.5) {
    return { value: bmi, label: "Bajo peso", tone: "text-sky-300" };
  }
  if (bmi < 25) {
    return { value: bmi, label: "Saludable", tone: "text-[#00FF90]" };
  }
  if (bmi < 30) {
    return { value: bmi, label: "Sobrepeso", tone: "text-amber-300" };
  }
  return { value: bmi, label: "Obesidad", tone: "text-rose-300" };
}

export function isPendingInviteStatus(status?: string | null): boolean {
  return (
    status === "pending" ||
    status === "pending_signup" ||
    status === "pending_acceptance"
  );
}
