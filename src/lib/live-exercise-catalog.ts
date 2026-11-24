import { ExerciseLibraryItem, MuscleGroup } from "@/types/database";

interface ExerciseDbItem {
  exerciseId: string;
  name: string;
  gifUrl: string;
  targetMuscles?: string[];
  bodyParts?: string[];
  equipments?: string[];
  secondaryMuscles?: string[];
  instructions?: string[];
}

interface FreeExerciseDbItem {
  id: string;
  name: string;
  equipment?: string | null;
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
  instructions?: string[];
  category?: string;
  images?: string[];
}

const MUSCLE_ES: Record<string, string> = {
  pectorals: "Pectorales",
  chest: "Pectorales",
  lats: "Dorsal ancho",
  "middle back": "Espalda media",
  "upper back": "Espalda alta",
  "lower back": "Espalda baja",
  traps: "Trapecio",
  glutes: "Glúteos",
  quads: "Cuádriceps",
  quadriceps: "Cuádriceps",
  hamstrings: "Isquiotibiales",
  calves: "Pantorrillas",
  adductors: "Aductores",
  abductors: "Abductores",
  delts: "Deltoides",
  shoulders: "Hombros",
  biceps: "Bíceps",
  triceps: "Tríceps",
  forearms: "Antebrazos",
  abs: "Abdomen",
  abdominals: "Abdomen",
  "cardiovascular system": "Cardio",
};

const EQUIPMENT_ES: Record<string, string> = {
  barbell: "Barra",
  dumbbell: "Mancuernas",
  cable: "Polea",
  "body weight": "Peso corporal",
  "body only": "Peso corporal",
  machine: "Máquina",
  "leverage machine": "Máquina",
  "smith machine": "Máquina Smith",
  kettlebells: "Pesa rusa",
  kettlebell: "Pesa rusa",
  bands: "Banda elástica",
  "e-z curl bar": "Barra Z",
  "ez barbell": "Barra Z",
  "exercise ball": "Fitball",
};

function cap(str: string) {
  return str
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ""))
    .join(" ");
}

function mapGroup(
  primary: string[],
  bodyParts: string[] = [],
  category = ""
): MuscleGroup {
  const all = [...primary, ...bodyParts, category].map((s) => s.toLowerCase());
  if (all.some((s) => s.includes("cardio"))) return "Cardio";
  if (all.some((s) => s.includes("bicep"))) return "Bíceps";
  if (all.some((s) => s.includes("tricep"))) return "Tríceps";
  if (all.some((s) => s.includes("chest") || s.includes("pectoral")))
    return "Pecho";
  if (
    all.some(
      (s) =>
        s.includes("lat") ||
        s.includes("back") ||
        s.includes("trap")
    )
  )
    return "Espalda";
  if (all.some((s) => s.includes("shoulder") || s.includes("delt")))
    return "Hombro";
  if (all.some((s) => s.includes("abs") || s.includes("abdom") || s.includes("waist")))
    return "Abdomen";
  return "Pierna";
}

let cachedCatalog: ExerciseLibraryItem[] | null = null;

/**
 * Carga catálogo real directamente desde el navegador:
 * 1) Intenta ExerciseDB Open V1 (GIFs animados en bucle)
 * 2) Complementa / hace fallback a Free Exercise DB (873 ejercicios públicos en GitHub CDN con frames 0.jpg y 1.jpg)
 */
export async function loadLiveExerciseCatalog(): Promise<ExerciseLibraryItem[]> {
  if (cachedCatalog && cachedCatalog.length > 0) return cachedCatalog;

  const collected: ExerciseLibraryItem[] = [];
  const seenNames = new Set<string>();

  // Source 1: ExerciseDB V1 (animated GIFs)
  try {
    const res = await fetch(
      "https://oss.exercisedb.dev/api/v1/exercises?limit=100",
      { headers: { Accept: "application/json" } }
    );
    if (res.ok) {
      const json = await res.json();
      const rows: ExerciseDbItem[] = Array.isArray(json)
        ? json
        : Array.isArray(json?.data)
        ? json.data
        : Array.isArray(json?.data?.exercises)
        ? json.data.exercises
        : [];

      for (const r of rows) {
        if (!r.gifUrl || !r.name) continue;
        const key = r.name.toLowerCase();
        if (seenNames.has(key)) continue;
        seenNames.add(key);

        const group = mapGroup(r.targetMuscles || [], r.bodyParts || []);
        const equip = (r.equipments?.[0] || "body weight").toLowerCase();

        collected.push({
          id: `edb-${r.exerciseId}`,
          coach_id: null,
          name: cap(r.name),
          muscle_group: group,
          primary_muscles: (r.targetMuscles || []).map(
            (m) => MUSCLE_ES[m.toLowerCase()] || cap(m)
          ),
          secondary_muscles: (r.secondaryMuscles || [])
            .slice(0, 2)
            .map((m) => MUSCLE_ES[m.toLowerCase()] || cap(m)),
          equipment: EQUIPMENT_ES[equip] || cap(equip),
          instructions: (r.instructions || [])
            .map((s) => s.replace(/^Step:\d+\s*/i, ""))
            .slice(0, 3)
            .join(" "),
          media_url: r.gifUrl,
          media_type: "gif",
        });
      }
    }
  } catch {
    // fallback seamlessly to Free Exercise DB
  }

  // Source 2: Free Exercise DB on GitHub CDN (always available, 873 public-domain exercises with 2-frame images)
  if (collected.length < 30) {
    try {
      const res = await fetch(
        "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json"
      );
      if (res.ok) {
        const rows: FreeExerciseDbItem[] = await res.json();
        const perGroupCount: Record<MuscleGroup, number> = {
          Pecho: 0,
          Espalda: 0,
          Pierna: 0,
          Hombro: 0,
          Bíceps: 0,
          Tríceps: 0,
          Abdomen: 0,
          Cardio: 0,
        };

        for (const r of rows) {
          if (!r.images || r.images.length === 0) continue;
          const group = mapGroup(
            r.primaryMuscles || [],
            [],
            r.category || ""
          );
          // Keep up to 14 exercises per muscle group (112 total across all 8 sections!)
          if (perGroupCount[group] >= 14) continue;

          const key = r.name.toLowerCase();
          if (seenNames.has(key)) continue;
          seenNames.add(key);
          perGroupCount[group]++;

          const base =
            "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";
          const frames = r.images.slice(0, 2).map((img, idx) => ({
            phase: idx + 1,
            label: idx === 0 ? "Inicio" : "Ejecución",
            image_url: `${base}${img}`,
          }));
          const equip = (r.equipment || "body only").toLowerCase();

          collected.push({
            id: `fedb-${r.id}`,
            coach_id: null,
            name: r.name,
            muscle_group: group,
            primary_muscles: (r.primaryMuscles || []).map(
              (m) => MUSCLE_ES[m.toLowerCase()] || cap(m)
            ),
            secondary_muscles: (r.secondaryMuscles || [])
              .slice(0, 2)
              .map((m) => MUSCLE_ES[m.toLowerCase()] || cap(m)),
            equipment: EQUIPMENT_ES[equip] || cap(equip),
            instructions: (r.instructions || []).slice(0, 3).join(" "),
            media_type: "sequence",
            frames: { female: frames, male: frames },
            frame_interval_ms: 850,
          });
        }
      }
    } catch {
      // ignore if completely offline
    }
  }

  cachedCatalog = collected;
  return collected;
}
