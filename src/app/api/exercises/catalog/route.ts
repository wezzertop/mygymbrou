import { NextResponse } from "next/server";
import { ExerciseLibraryItem, MuscleGroup } from "@/types/database";

interface ExerciseDbRaw {
  exerciseId: string;
  name: string;
  gifUrl: string;
  targetMuscles?: string[];
  bodyParts?: string[];
  equipments?: string[];
  secondaryMuscles?: string[];
  instructions?: string[];
}

const GROUP_TO_QUERY: Record<MuscleGroup, { type: "bodyPart" | "target"; value: string }> = {
  Pecho: { type: "bodyPart", value: "chest" },
  Espalda: { type: "bodyPart", value: "back" },
  Pierna: { type: "bodyPart", value: "upper legs" },
  Hombro: { type: "bodyPart", value: "shoulders" },
  Bíceps: { type: "target", value: "biceps" },
  Tríceps: { type: "target", value: "triceps" },
  Abdomen: { type: "bodyPart", value: "waist" },
  Cardio: { type: "bodyPart", value: "cardio" },
};

const MUSCLE_ES: Record<string, string> = {
  pectorals: "Pectorales",
  lats: "Dorsal ancho",
  "upper back": "Espalda alta",
  traps: "Trapecio",
  spine: "Espalda baja",
  glutes: "Glúteos",
  quads: "Cuádriceps",
  hamstrings: "Isquiotibiales",
  calves: "Pantorrillas",
  adductors: "Aductores",
  abductors: "Abductores",
  delts: "Deltoides",
  biceps: "Bíceps",
  triceps: "Tríceps",
  forearms: "Antebrazos",
  abs: "Abdomen",
  "cardiovascular system": "Cardio",
  serratus: "Serrato",
};

const EQUIPMENT_ES: Record<string, string> = {
  barbell: "Barra",
  dumbbell: "Mancuernas",
  cable: "Polea",
  "body weight": "Peso corporal",
  "leverage machine": "Máquina",
  "sled machine": "Prensa / Máquina",
  "smith machine": "Máquina Smith",
  kettlebell: "Pesa rusa",
  band: "Banda elástica",
  "ez barbell": "Barra Z",
  "assisted": "Asistido",
};

function capitalize(str: string) {
  return str
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ""))
    .join(" ");
}

function mapMuscleGroup(raw: ExerciseDbRaw, fallback?: MuscleGroup): MuscleGroup {
  if (fallback) return fallback;
  const targets = (raw.targetMuscles || []).map((t) => t.toLowerCase());
  const parts = (raw.bodyParts || []).map((b) => b.toLowerCase());

  if (targets.includes("biceps")) return "Bíceps";
  if (targets.includes("triceps")) return "Tríceps";
  if (parts.includes("chest")) return "Pecho";
  if (parts.includes("back")) return "Espalda";
  if (parts.includes("shoulders")) return "Hombro";
  if (parts.includes("waist")) return "Abdomen";
  if (parts.includes("cardio")) return "Cardio";
  return "Pierna";
}

function normalizeExercise(
  raw: ExerciseDbRaw,
  fallbackGroup?: MuscleGroup
): ExerciseLibraryItem {
  const equipRaw = (raw.equipments?.[0] || "body weight").toLowerCase();
  const primary = (raw.targetMuscles || []).map(
    (m) => MUSCLE_ES[m.toLowerCase()] || capitalize(m)
  );
  const secondary = (raw.secondaryMuscles || [])
    .slice(0, 2)
    .map((m) => MUSCLE_ES[m.toLowerCase()] || capitalize(m));

  const instructionsText = (raw.instructions || [])
    .map((step) => step.replace(/^Step:\d+\s*/i, ""))
    .slice(0, 3)
    .join(" ");

  return {
    id: `edb-${raw.exerciseId}`,
    coach_id: null,
    name: capitalize(raw.name),
    muscle_group: mapMuscleGroup(raw, fallbackGroup),
    primary_muscles: primary,
    secondary_muscles: secondary,
    equipment: EQUIPMENT_ES[equipRaw] || capitalize(equipRaw),
    instructions:
      instructionsText ||
      "Mantén postura firme, controla la fase excéntrica y respira de forma constante.",
    media_url: raw.gifUrl,
    media_type: "gif",
  };
}

async function fetchFromExerciseDb(url: string): Promise<ExerciseDbRaw[]> {
  const res = await fetch(url, {
    next: { revalidate: 86400 },
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return [];
  const json = await res.json();
  if (Array.isArray(json)) return json;
  if (Array.isArray(json?.data)) return json.data;
  if (Array.isArray(json?.data?.exercises)) return json.data.exercises;
  return [];
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const group = searchParams.get("group") as MuscleGroup | "Todos" | null;
    const q = searchParams.get("q")?.trim();
    const limit = Math.min(Number(searchParams.get("limit") || "12"), 24);

    // Search query across 1,500+ ExerciseDB exercises
    if (q && q.length >= 2) {
      const url = `https://oss.exercisedb.dev/api/v1/exercises/search?q=${encodeURIComponent(
        q
      )}&limit=${limit}`;
      const raw = await fetchFromExerciseDb(url);
      return NextResponse.json({
        source: "exercisedb",
        exercises: raw.map((r) => normalizeExercise(r)),
      });
    }

    // Specific muscle group
    if (group && group !== "Todos" && GROUP_TO_QUERY[group]) {
      const cfg = GROUP_TO_QUERY[group];
      const url =
        cfg.type === "bodyPart"
          ? `https://oss.exercisedb.dev/api/v1/bodyparts/${encodeURIComponent(
              cfg.value
            )}/exercises?limit=${limit}`
          : `https://oss.exercisedb.dev/api/v1/muscles/${encodeURIComponent(
              cfg.value
            )}/exercises?limit=${limit}`;

      const raw = await fetchFromExerciseDb(url);
      return NextResponse.json({
        source: "exercisedb",
        exercises: raw.map((r) => normalizeExercise(r, group)),
      });
    }

    // "Todos": fetch 4 balanced exercises from EACH of the 8 muscle groups in parallel (32 animated GIF exercises!)
    const groups = Object.keys(GROUP_TO_QUERY) as MuscleGroup[];
    const results = await Promise.all(
      groups.map(async (g) => {
        const cfg = GROUP_TO_QUERY[g];
        const url =
          cfg.type === "bodyPart"
            ? `https://oss.exercisedb.dev/api/v1/bodyparts/${encodeURIComponent(
                cfg.value
              )}/exercises?limit=4`
            : `https://oss.exercisedb.dev/api/v1/muscles/${encodeURIComponent(
                cfg.value
              )}/exercises?limit=4`;
        const raw = await fetchFromExerciseDb(url);
        return raw.map((r) => normalizeExercise(r, g));
      })
    );

    // Deduplicate by exerciseId
    const seen = new Set<string>();
    const combined: ExerciseLibraryItem[] = [];
    for (const list of results) {
      for (const item of list) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          combined.push(item);
        }
      }
    }

    return NextResponse.json({
      source: "exercisedb",
      exercises: combined,
    });
  } catch {
    return NextResponse.json(
      { source: "fallback", exercises: [] },
      { status: 200 }
    );
  }
}
