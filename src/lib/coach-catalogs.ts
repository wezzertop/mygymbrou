export type GymStatus = "approved" | "pending" | "rejected";

export interface GymRecord {
  id: string;
  name: string;
  city?: string | null;
  status: GymStatus;
  submitted_by_coach_id?: string | null;
  submitted_by_email?: string | null;
  created_at?: string;
}

export const COACH_SPECIALTIES: string[] = [
  "Hipertrofia",
  "Pérdida de Grasa / Recomposición",
  "Fuerza / Powerlifting",
  "Nutrición Deportiva",
  "Evaluación Antropométrica / ISAK",
  "Entrenamiento Funcional",
  "Readaptación / Movilidad",
  "Preparación Física",
  "Entrenamiento Femenino / Glúteos",
  "Calistenia / Peso Corporal",
  "CrossFit / Acondicionamiento",
  "Salud y Longevidad",
];

export const DEFAULT_APPROVED_GYMS: GymRecord[] = [
  { id: "gym-online", name: "Entrenamiento Online / Independiente", city: "México", status: "approved" },
  { id: "gym-smartfit", name: "Smart Fit", city: "Nacional", status: "approved" },
  { id: "gym-sportsworld", name: "Sports World", city: "Nacional", status: "approved" },
  { id: "gym-sportcity", name: "Sport City", city: "Nacional", status: "approved" },
  { id: "gym-anytime", name: "Anytime Fitness", city: "Nacional", status: "approved" },
  { id: "gym-planet", name: "Planet Fitness", city: "Nacional", status: "approved" },
  { id: "gym-station24", name: "Station 24", city: "Nacional", status: "approved" },
  { id: "gym-goldsgym", name: "Gold's Gym", city: "Nacional", status: "approved" },
  { id: "gym-energy", name: "Energy Fitness", city: "CDMX / Nacional", status: "approved" },
  { id: "gym-apex", name: "Apex Performance Studio", city: "Monterrey", status: "approved" },
];
