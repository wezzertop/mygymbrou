import {
  ExerciseFrame,
  ExerciseFrameVariants,
  ExerciseLibraryItem,
  MuscleGroup,
} from "@/types/database";

export interface FreeExerciseDbItem {
  id: string;
  name: string;
  force?: string | null;
  level?: string | null;
  mechanic?: string | null;
  equipment?: string | null;
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
  instructions?: string[];
  category?: string;
  images?: string[];
}

export const FREE_EXERCISE_DB_JSON_URL =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json";

export const FREE_EXERCISE_DB_IMG_BASE =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";

const MUSCLE_ES: Record<string, string> = {
  pectorals: "Pectorales",
  chest: "Pectorales",
  lats: "Dorsal ancho",
  "middle back": "Espalda media",
  "upper back": "Espalda alta",
  "lower back": "Espalda baja",
  traps: "Trapecio",
  neck: "Cuello",
  glutes: "Glúteos",
  quads: "Cuádriceps",
  quadriceps: "Cuádriceps",
  hamstrings: "Isquiotibiales / Femoral",
  calves: "Pantorrillas",
  adductors: "Aductores",
  abductors: "Abductores",
  delts: "Deltoides",
  shoulders: "Hombros",
  biceps: "Bíceps",
  triceps: "Tríceps",
  forearms: "Antebrazos",
  abs: "Abdomen / Core",
  abdominals: "Abdomen / Core",
  "cardiovascular system": "Cardio / Full Body",
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
  "foam roll": "Rodillo de espuma",
  "medicine ball": "Balón medicinal",
  other: "Otro equipo",
};

const GROUP_DEFAULT_INSTRUCTIONS_ES: Record<MuscleGroup, string> = {
  Pecho:
    "1. Retrae las escápulas y apoya firme la espalda. 2. Baja la carga con control estirando el pectoral. 3. Empuja con potencia exhalando sin bloquear bruscamente los codos.",
  Espalda:
    "1. Mantén el torso estable y el pecho ligeramente elevado. 2. Inicia el tirón llevando los codos hacia atrás y juntando escápulas. 3. Regresa de forma controlada manteniendo tensión dorsal.",
  Pierna:
    "1. Coloca los pies firmes y activa el core antes de iniciar. 2. Controla la fase excéntrica cuidando la alineación de rodillas. 3. Empuja desde talones y mediopié con extensión controlada.",
  Hombro:
    "1. Activa el abdomen evitando arquear la zona lumbar. 2. Eleva la carga con trayectoria controlada sin balanceo. 3. Desciende lento sintiendo el trabajo en el deltoides.",
  Bíceps:
    "1. Mantén los codos pegados al costado sin balancear el torso. 2. Flexiona contrayendo fuerte el bíceps arriba. 3. Baja lentamente extendiendo casi por completo el brazo.",
  Tríceps:
    "1. Fija los codos en posición estable durante todo el recorrido. 2. Extiende el antebrazo hasta lograr contracción máxima del tríceps. 3. Regresa controlando la carga sin despegar codos.",
  Abdomen:
    "1. Mantén la pelvis neutra y contrae el abdomen desde el primer segundo. 2. Ejecuta el movimiento lento evitando tirar del cuello o lumbar. 3. Exhala en el punto de máxima contracción.",
  Cardio:
    "1. Mantén postura erguida, respiración rítmica y pisada controlada. 2. Sostén un ritmo constante acorde a la intensidad indicada. 3. Finaliza reduciendo la velocidad de forma progresiva.",
};

const NAME_REPLACEMENTS_ES: [RegExp, string][] = [
  [/\bbarbell\b/gi, "con Barra"],
  [/\bdumbbell\b/gi, "con Mancuernas"],
  [/\bcable\b/gi, "en Polea"],
  [/\bsmith\b/gi, "en Smith"],
  [/\bmachine\b/gi, "en Máquina"],
  [/\bincline\b/gi, "Inclinado"],
  [/\bdecline\b/gi, "Declinado"],
  [/\bseated\b/gi, "Sentado"],
  [/\bstanding\b/gi, "de Pie"],
  [/\blying\b/gi, "Acostado"],
  [/\bbench press\b/gi, "Press de Banca"],
  [/\bchest press\b/gi, "Press de Pecho"],
  [/\bshoulder press\b/gi, "Press de Hombro"],
  [/\boverhead press\b/gi, "Press Militar"],
  [/\bleg press\b/gi, "Prensa de Pierna"],
  [/\bleg extension\b/gi, "Extensión de Cuádriceps"],
  [/\bleg curl\b/gi, "Curl Femoral"],
  [/\bcalf raise\b/gi, "Elevación de Talones"],
  [/\bhip thrust\b/gi, "Empuje de Cadera (Hip Thrust)"],
  [/\bglute bridge\b/gi, "Puente de Glúteo"],
  [/\bromanian deadlift\b/gi, "Peso Muerto Rumano"],
  [/\bdeadlift\b/gi, "Peso Muerto"],
  [/\bsplit squat\b/gi, "Sentadilla Búlgara / Dividida"],
  [/\bsquat\b/gi, "Sentadilla"],
  [/\blunge\b/gi, "Zancada / Desplante"],
  [/\blat pulldown\b/gi, "Jalón al Pecho"],
  [/\bpull[\s-]?up\b/gi, "Dominada"],
  [/\bchin[\s-]?up\b/gi, "Dominada Supina"],
  [/\brow\b/gi, "Remo"],
  [/\bpush[\s-]?up\b/gi, "Flexión de Pecho"],
  [/\bchest fly\b|\bflyes?\b|\bfly\b/gi, "Aperturas"],
  [/\blateral raise\b/gi, "Elevación Lateral"],
  [/\bfront raise\b/gi, "Elevación Frontal"],
  [/\bface pull\b/gi, "Jalón a la Cara (Face Pull)"],
  [/\bhammer curl\b/gi, "Curl Martillo"],
  [/\bbicep curl\b|\bcurl\b/gi, "Curl"],
  [/\btricep pushdown\b|\bpushdown\b/gi, "Extensión de Tríceps en Polea"],
  [/\bskull crusher\b/gi, "Press Francés"],
  [/\bdips?\b/gi, "Fondos"],
  [/\bplank\b/gi, "Plancha Abdominal"],
  [/\bcrunch\b/gi, "Crunch Abdominal"],
  [/\bleg raise\b/gi, "Elevación de Piernas"],
  [/\bshrug\b/gi, "Encogimientos de Trapecio"],
];

/**
 * Ejercicios clave de gimnasio que aparecen primero en el catálogo (todos de Free Exercise DB)
 * para que al abrir el constructor el coach vea de inmediato los movimientos más usados.
 */
const PRIORITY_IDS = new Set([
  "Barbell_Bench_Press_-_Medium_Grip",
  "Incline_Dumbbell_Press",
  "Barbell_Squat",
  "Barbell_Hip_Thrust",
  "Romanian_Deadlift",
  "Split_Squat_with_Dumbbells",
  "Wide-Grip_Lat_Pulldown",
  "Bent_Over_Barbell_Row",
  "Seated_Cable_Rows",
  "Pullups",
  "Leg_Press",
  "Leg_Extensions",
  "Lying_Leg_Curls",
  "Standing_Calf_Raises",
  "Dumbbell_Shoulder_Press",
  "Side_Lateral_Raise",
  "Face_Pull",
  "Dumbbell_Bicep_Curl",
  "Hammer_Curls",
  "EZ-Bar_Curl",
  "Triceps_Pushdown_-_Rope_Attachment",
  "EZ-Bar_Skullcrusher",
  "Dips_-_Triceps_Version",
  "Plank",
  "Cable_Crunch",
  "Hanging_Leg_Raise",
  "Cable_Crossover",
  "Dumbbell_Flyes",
  "Barbell_Deadlift",
  "Dumbbell_Lunges",
]);

function cap(str: string) {
  return str
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ""))
    .join(" ");
}

export function translateExerciseNameToSpanish(rawName: string): string {
  let out = rawName.trim();
  for (const [pattern, replacement] of NAME_REPLACEMENTS_ES) {
    out = out.replace(pattern, replacement);
  }
  return out.replace(/\s+/g, " ").trim();
}

export function normalizeSearchText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function mapFreeDbMuscleGroup(
  primary: string[],
  category = ""
): MuscleGroup {
  const all = [...primary, category].map((s) => s.toLowerCase());
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
        s.includes("trap") ||
        s.includes("neck")
    )
  )
    return "Espalda";
  if (all.some((s) => s.includes("shoulder") || s.includes("delt")))
    return "Hombro";
  if (
    all.some(
      (s) => s.includes("abs") || s.includes("abdom") || s.includes("waist")
    )
  )
    return "Abdomen";
  return "Pierna";
}

export function buildFreeExerciseDbFrames(
  imagePaths: string[]
): ExerciseFrameVariants {
  const frames: ExerciseFrame[] = imagePaths.slice(0, 2).map((img, i) => ({
    phase: i + 1,
    label: i === 0 ? "Inicio" : "Ejecución",
    image_url: img.startsWith("http") ? img : `${FREE_EXERCISE_DB_IMG_BASE}${img}`,
  }));
  return { female: frames, male: frames };
}

/**
 * Reconstruye los frames de secuencia a partir de media_url / demo_url guardados en Supabase
 * para que las rutinas guardadas siempre muestren la animación de 2 fotos de Free Exercise DB.
 */
export function reconstructFramesFromMediaUrls(
  mediaUrl?: string,
  demoUrl?: string
): ExerciseFrameVariants | undefined {
  const urls: string[] = [];
  if (mediaUrl && /\.(jpg|jpeg|png|webp)(\?.*)?$/i.test(mediaUrl)) {
    urls.push(mediaUrl);
  }
  if (
    demoUrl &&
    demoUrl !== mediaUrl &&
    /\.(jpg|jpeg|png|webp)(\?.*)?$/i.test(demoUrl)
  ) {
    urls.push(demoUrl);
  } else if (
    mediaUrl &&
    mediaUrl.includes("free-exercise-db") &&
    /\/0\.jpg$/i.test(mediaUrl)
  ) {
    urls.push(mediaUrl.replace(/\/0\.jpg$/i, "/1.jpg"));
  }

  if (urls.length === 0) return undefined;
  return buildFreeExerciseDbFrames(urls);
}

export function normalizeFreeExerciseDbItem(
  item: FreeExerciseDbItem
): ExerciseLibraryItem | null {
  if (!item.name || !item.images || item.images.length === 0) return null;

  const group = mapFreeDbMuscleGroup(
    item.primaryMuscles || [],
    item.category || ""
  );
  const equipKey = (item.equipment || "body only").toLowerCase();
  const translatedName = translateExerciseNameToSpanish(item.name);
  const frames = buildFreeExerciseDbFrames(item.images);
  const primaryEs = (item.primaryMuscles || []).map(
    (m) => MUSCLE_ES[m.toLowerCase()] || cap(m)
  );
  const secondaryEs = (item.secondaryMuscles || [])
    .slice(0, 2)
    .map((m) => MUSCLE_ES[m.toLowerCase()] || cap(m));

  return {
    id: `fedb-${item.id}`,
    coach_id: null,
    name: translatedName,
    search_aliases: [
      item.name.toLowerCase(),
      item.id.toLowerCase().replace(/_/g, " "),
      ...(item.primaryMuscles || []).map((m) => m.toLowerCase()),
      ...(item.secondaryMuscles || []).map((m) => m.toLowerCase()),
      equipKey,
      (item.category || "").toLowerCase(),
    ].filter(Boolean),
    muscle_group: group,
    primary_muscles: primaryEs,
    secondary_muscles: secondaryEs,
    equipment: EQUIPMENT_ES[equipKey] || cap(equipKey),
    instructions: GROUP_DEFAULT_INSTRUCTIONS_ES[group],
    media_url: frames.female[0]?.image_url,
    media_type: "sequence",
    frames,
    frame_interval_ms: 850,
  };
}

let cachedCatalog: ExerciseLibraryItem[] | null = null;

/**
 * Carga el catálogo completo desde Free Exercise DB (800+ ejercicios con fotos reales).
 * Prioriza los ejercicios compuestos/populares al inicio y mantiene disponible toda la base.
 */
export async function loadLiveExerciseCatalog(): Promise<ExerciseLibraryItem[]> {
  if (cachedCatalog && cachedCatalog.length > 0) return cachedCatalog;

  try {
    const res = await fetch(FREE_EXERCISE_DB_JSON_URL, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];

    const list: FreeExerciseDbItem[] = await res.json();
    const seen = new Set<string>();
    const priorityItems: ExerciseLibraryItem[] = [];
    const regularItems: ExerciseLibraryItem[] = [];

    for (const raw of list) {
      const normalized = normalizeFreeExerciseDbItem(raw);
      if (!normalized) continue;
      if (seen.has(normalized.id)) continue;
      seen.add(normalized.id);

      if (PRIORITY_IDS.has(raw.id)) {
        priorityItems.push(normalized);
      } else {
        regularItems.push(normalized);
      }
    }

    const collected = [...priorityItems, ...regularItems];
    cachedCatalog = collected;
    return collected;
  } catch {
    return [];
  }
}
