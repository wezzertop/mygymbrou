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
  [/\bdeadlift\b/gi, "Peso Muerto"],
  [/\bromanian deadlift\b/gi, "Peso Muerto Rumano"],
  [/\bsquat\b/gi, "Sentadilla"],
  [/\blunge\b/gi, "Zancada / Desplante"],
  [/\bbulgarian split squat\b/gi, "Sentadilla Búlgara"],
  [/\blat pulldown\b/gi, "Jalón al Pecho"],
  [/\bpull[\s-]?up\b/gi, "Dominada"],
  [/\bchin[\s-]?up\b/gi, "Dominada Supina"],
  [/\brow\b/gi, "Remo"],
  [/\bpush[\s-]?up\b/gi, "Flexión de Pecho"],
  [/\bchest fly\b|\bflye?\b/gi, "Aperturas"],
  [/\blateral raise\b/gi, "Elevación Lateral"],
  [/\bfront raise\b/gi, "Elevación Frontal"],
  [/\bface pull\b/gi, "Jalón a la Cara (Face Pull)"],
  [/\bbicep curl\b|\bcurl\b/gi, "Curl"],
  [/\bhammer curl\b/gi, "Curl Martillo"],
  [/\btricep pushdown\b|\bpushdown\b/gi, "Extensión en Polea"],
  [/\bskull crusher\b/gi, "Press Francés"],
  [/\bdip\b/gi, "Fondos"],
  [/\bplank\b/gi, "Plancha Abdominal"],
  [/\bcrunch\b/gi, "Crunch Abdominal"],
  [/\bleg raise\b/gi, "Elevación de Piernas"],
  [/\bshrug\b/gi, "Encogimientos de Trapecio"],
];

function cap(str: string) {
  return str
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ""))
    .join(" ");
}

function translateExerciseNameToSpanish(rawName: string): string {
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

/**
 * Catálogo curado en español con alias bilingües (ES/EN) para búsqueda instantánea.
 * Todos los nombres y descripciones técnicas se muestran en español claro.
 */
export const CURATED_BILINGUAL_EXERCISES: ExerciseLibraryItem[] = [
  // PECHO
  {
    id: "cur-bench-press",
    coach_id: null,
    name: "Press de Banca Plano con Barra",
    search_aliases: ["bench press", "flat bench", "barbell bench press", "chest press", "pecho", "pectoral"],
    muscle_group: "Pecho",
    primary_muscles: ["Pectoral mayor"],
    secondary_muscles: ["Tríceps", "Deltoides anterior"],
    equipment: "Barra",
    instructions:
      "1. Acuéstate con escápulas retraídas y pies firmes en el suelo. 2. Desciende la barra con control hacia la parte media del pecho. 3. Empuja explosivo exhalando hasta extender los brazos sin perder estabilidad.",
    media_type: "svg_anim",
    animation_key: "bench_press",
  },
  {
    id: "cur-incline-db-press",
    coach_id: null,
    name: "Press Inclinado con Mancuernas",
    search_aliases: ["incline dumbbell press", "incline bench", "upper chest", "pecho superior"],
    muscle_group: "Pecho",
    primary_muscles: ["Pectoral superior"],
    secondary_muscles: ["Deltoides anterior", "Tríceps"],
    equipment: "Mancuernas",
    instructions:
      "1. Ajusta el banco a 30° y apoya firme la espalda. 2. Baja las mancuernas a los costados del pecho con codos a 45°. 3. Empuja arriba juntando ligeramente las mancuernas sin chocarlas.",
    media_type: "svg_anim",
    animation_key: "bench_press",
  },
  {
    id: "cur-cable-fly",
    coach_id: null,
    name: "Cruce de Poleas para Pecho",
    search_aliases: ["cable crossover", "cable fly", "chest fly", "aperturas", "pec deck"],
    muscle_group: "Pecho",
    primary_muscles: ["Pectoral mayor"],
    secondary_muscles: ["Deltoides anterior"],
    equipment: "Polea",
    instructions:
      "1. Da un paso al frente con torso ligeramente inclinado y codos semiflexionados. 2. Junta las manos al frente apretando el pectoral 1 segundo. 3. Abre con control hasta sentir estiramiento.",
    media_type: "svg_anim",
    animation_key: "bench_press",
  },
  // ESPALDA
  {
    id: "cur-lat-pulldown",
    coach_id: null,
    name: "Jalón al Pecho en Polea",
    search_aliases: ["lat pulldown", "pulldown", "back", "lats", "dorsal", "espalda"],
    muscle_group: "Espalda",
    primary_muscles: ["Dorsal ancho"],
    secondary_muscles: ["Bíceps", "Romboides"],
    equipment: "Polea",
    instructions:
      "1. Toma la barra ligeramente más ancho que tus hombros y saca pecho. 2. Jala hacia la clavícula llevando los codos hacia abajo y atrás. 3. Regresa lento estirando el dorsal sin encoger hombros.",
    media_type: "svg_anim",
    animation_key: "lat_pulldown",
  },
  {
    id: "cur-barbell-row",
    coach_id: null,
    name: "Remo con Barra Inclinado",
    search_aliases: ["barbell row", "bent over row", "row", "back row", "remo", "espalda"],
    muscle_group: "Espalda",
    primary_muscles: ["Dorsal ancho", "Espalda media"],
    secondary_muscles: ["Bíceps", "Lumbar"],
    equipment: "Barra",
    instructions:
      "1. Inclina el torso a 45° con espalda completamente neutra y core firme. 2. Lleva la barra hacia el ombligo apretando las escápulas. 3. Desciende controlado sin perder la postura lumbar.",
    media_type: "svg_anim",
    animation_key: "row",
  },
  {
    id: "cur-seated-cable-row",
    coach_id: null,
    name: "Remo Sentado en Polea Baja",
    search_aliases: ["seated cable row", "low row", "cable row", "remo gironda", "espalda media"],
    muscle_group: "Espalda",
    primary_muscles: ["Espalda media", "Dorsal ancho"],
    secondary_muscles: ["Romboides", "Bíceps"],
    equipment: "Polea",
    instructions:
      "1. Siéntate erguido con rodillas semiflexionadas y pecho arriba. 2. Tira del agarre hacia el abdomen retrayendo escápulas. 3. Extiende los brazos de forma controlada sin balancear el tronco.",
    media_type: "svg_anim",
    animation_key: "row",
  },
  {
    id: "cur-pullups",
    coach_id: null,
    name: "Dominadas Pronas",
    search_aliases: ["pull up", "pullups", "chin up", "bodyweight back", "dominadas"],
    muscle_group: "Espalda",
    primary_muscles: ["Dorsal ancho"],
    secondary_muscles: ["Bíceps", "Core"],
    equipment: "Peso corporal",
    instructions:
      "1. Cuélgate con agarre prono y activa las escápulas hacia abajo. 2. Sube llevando el pecho hacia la barra sin patear. 3. Desciende lentamente hasta extensión controlada.",
    media_type: "svg_anim",
    animation_key: "lat_pulldown",
  },
  // PIERNA (CUÁDRICEPS, FEMORAL, GLÚTEO)
  {
    id: "cur-back-squat",
    coach_id: null,
    name: "Sentadilla Libre con Barra",
    search_aliases: ["squat", "back squat", "barbell squat", "quads", "cuadriceps", "gluteo", "pierna"],
    muscle_group: "Pierna",
    primary_muscles: ["Cuádriceps", "Glúteos"],
    secondary_muscles: ["Core", "Isquiotibiales / Femoral"],
    equipment: "Barra",
    instructions:
      "1. Apoya la barra sobre el trapecio y abre pies al ancho de hombros. 2. Desciende flexionando cadera y rodillas manteniendo el torso firme. 3. Sube empujando el piso con toda la planta del pie.",
    media_type: "svg_anim",
    animation_key: "squat",
  },
  {
    id: "cur-hip-thrust",
    coach_id: null,
    name: "Hip Thrust con Barra (Empuje de Cadera)",
    search_aliases: ["hip thrust", "glute bridge", "glutes", "gluteo", "gluteos", "cadera"],
    muscle_group: "Pierna",
    primary_muscles: ["Glúteo mayor"],
    secondary_muscles: ["Isquiotibiales / Femoral", "Core"],
    equipment: "Barra",
    instructions:
      "1. Apoya la parte baja de las escápulas en el banco con la barra sobre la cadera. 2. Empuja con los talones elevando la pelvis hasta alinear torso y muslos. 3. Sostén 1 segundo arriba apretando glúteos y baja controlado.",
    media_type: "svg_anim",
    animation_key: "hip_thrust",
  },
  {
    id: "cur-rdl",
    coach_id: null,
    name: "Peso Muerto Rumano (RDL)",
    search_aliases: ["romanian deadlift", "rdl", "deadlift", "hamstrings", "femoral", "isquiotibiales", "gluteos"],
    muscle_group: "Pierna",
    primary_muscles: ["Isquiotibiales / Femoral", "Glúteos"],
    secondary_muscles: ["Espalda baja"],
    equipment: "Barra",
    instructions:
      "1. Mantén rodillas ligeramente flexionadas y espalda recta. 2. Empuja la cadera hacia atrás bajando la barra pegada a las piernas hasta sentir tensión femoral. 3. Extiende la cadera al frente contrayendo glúteos.",
    media_type: "svg_anim",
    animation_key: "rdl",
  },
  {
    id: "cur-bulgarian-squat",
    coach_id: null,
    name: "Sentadilla Búlgara con Mancuernas",
    search_aliases: ["bulgarian split squat", "split squat", "lunge", "zancada", "gluteo", "cuadriceps"],
    muscle_group: "Pierna",
    primary_muscles: ["Cuádriceps", "Glúteos"],
    secondary_muscles: ["Core", "Estabilizadores de cadera"],
    equipment: "Mancuernas",
    instructions:
      "1. Apoya el empeine trasero en un banco y adelanta la pierna de trabajo. 2. Baja verticalmente manteniendo la rodilla alineada con la punta del pie. 3. Empuja desde el pie delantero sin impulsarte con la pierna trasera.",
    media_type: "svg_anim",
    animation_key: "squat",
  },
  {
    id: "cur-leg-press",
    coach_id: null,
    name: "Prensa de Piernas 45°",
    search_aliases: ["leg press", "quads", "cuadriceps", "gluteos", "pierna", "machine"],
    muscle_group: "Pierna",
    primary_muscles: ["Cuádriceps", "Glúteos"],
    secondary_muscles: ["Isquiotibiales / Femoral"],
    equipment: "Máquina",
    instructions:
      "1. Apoya espalda y cadera pegadas al respaldo sin despegar el sacro. 2. Baja la plataforma de forma controlada hasta 90° de rodilla. 3. Empuja sin bloquear por completo las rodillas arriba.",
    media_type: "svg_anim",
    animation_key: "squat",
  },
  // HOMBRO
  {
    id: "cur-shoulder-press",
    coach_id: null,
    name: "Press Militar con Mancuernas",
    search_aliases: ["shoulder press", "overhead press", "military press", "delts", "hombro", "hombros"],
    muscle_group: "Hombro",
    primary_muscles: ["Deltoides anterior", "Deltoides medio"],
    secondary_muscles: ["Tríceps", "Core"],
    equipment: "Mancuernas",
    instructions:
      "1. Siéntate con respaldo vertical y abdomen firme. 2. Empuja las mancuernas hacia arriba sin arquear la espalda baja. 3. Desciende con control hasta la altura de las orejas.",
    media_type: "svg_anim",
    animation_key: "shoulder_press",
  },
  {
    id: "cur-lateral-raise",
    coach_id: null,
    name: "Elevaciones Laterales con Mancuernas",
    search_aliases: ["lateral raise", "side raise", "shoulder", "deltoides", "hombro lateral"],
    muscle_group: "Hombro",
    primary_muscles: ["Deltoides lateral"],
    secondary_muscles: ["Trapecio superior"],
    equipment: "Mancuernas",
    instructions:
      "1. De pie con codos ligeramente flexionados y torso estable. 2. Eleva los brazos hacia los lados hasta la línea de los hombros. 3. Desciende lento evitando balancear el tronco.",
    media_type: "svg_anim",
    animation_key: "lateral_raise",
  },
  {
    id: "cur-face-pull",
    coach_id: null,
    name: "Face Pull en Polea Alta",
    search_aliases: ["face pull", "rear delt", "deltoides posterior", "hombro posterior", "postura"],
    muscle_group: "Hombro",
    primary_muscles: ["Deltoides posterior"],
    secondary_muscles: ["Romboides", "Manguito rotador"],
    equipment: "Polea",
    instructions:
      "1. Toma la cuerda a la altura del rostro y da un paso atrás. 2. Jala separando la cuerda hacia tus orejas con codos altos. 3. Sostén 1 segundo y regresa controlado.",
    media_type: "svg_anim",
    animation_key: "row",
  },
  // BÍCEPS
  {
    id: "cur-bicep-curl",
    coach_id: null,
    name: "Curl de Bíceps con Barra Z",
    search_aliases: ["bicep curl", "barbell curl", "ez bar curl", "biceps", "brazo"],
    muscle_group: "Bíceps",
    primary_muscles: ["Bíceps braquial"],
    secondary_muscles: ["Braquial", "Antebrazos"],
    equipment: "Barra Z",
    instructions:
      "1. Mantén los codos fijos a los costados y pecho erguido. 2. Sube la barra contrayendo el bíceps sin balancear la espalda. 3. Baja lentamente en 2–3 segundos.",
    media_type: "svg_anim",
    animation_key: "bicep_curl",
  },
  {
    id: "cur-hammer-curl",
    coach_id: null,
    name: "Curl Martillo con Mancuernas",
    search_aliases: ["hammer curl", "dumbbell curl", "biceps", "braquial", "antebrazo"],
    muscle_group: "Bíceps",
    primary_muscles: ["Braquial", "Bíceps braquial"],
    secondary_muscles: ["Braquiorradial"],
    equipment: "Mancuernas",
    instructions:
      "1. Sujeta las mancuernas con palmas enfrentadas (agarre neutro). 2. Flexiona los codos elevando las mancuernas sin mover el hombro. 3. Controla el descenso completo.",
    media_type: "svg_anim",
    animation_key: "bicep_curl",
  },
  // TRÍCEPS
  {
    id: "cur-tricep-pushdown",
    coach_id: null,
    name: "Extensión de Tríceps en Polea con Cuerda",
    search_aliases: ["tricep pushdown", "rope pushdown", "cable tricep", "triceps", "brazo"],
    muscle_group: "Tríceps",
    primary_muscles: ["Tríceps braquial"],
    secondary_muscles: ["Antebrazos"],
    equipment: "Polea",
    instructions:
      "1. Pega los codos al torso e inclina ligeramente el pecho al frente. 2. Extiende hacia abajo abriendo ligeramente la cuerda al final. 3. Sube con control sin despegar los codos.",
    media_type: "svg_anim",
    animation_key: "tricep_pushdown",
  },
  {
    id: "cur-skull-crusher",
    coach_id: null,
    name: "Press Francés con Barra Z",
    search_aliases: ["skull crusher", "french press", "tricep extension", "triceps"],
    muscle_group: "Tríceps",
    primary_muscles: ["Tríceps cabeza larga"],
    secondary_muscles: ["Tríceps lateral"],
    equipment: "Barra Z",
    instructions:
      "1. Acuéstate en banco plano con brazos ligeramente inclinados hacia atrás. 2. Flexiona los codos bajando la barra detrás de la frente. 3. Extiende controladamente sin abrir los codos.",
    media_type: "svg_anim",
    animation_key: "tricep_pushdown",
  },
  // ABDOMEN / CORE
  {
    id: "cur-plank",
    coach_id: null,
    name: "Plancha Abdominal Isométrica",
    search_aliases: ["plank", "core", "abs", "abdomen", "isometrico"],
    muscle_group: "Abdomen",
    primary_muscles: ["Core", "Recto abdominal"],
    secondary_muscles: ["Oblicuos", "Glúteos"],
    equipment: "Peso corporal",
    instructions:
      "1. Apoya antebrazos debajo de los hombros formando una línea recta de cabeza a talones. 2. Contrae abdomen y glúteos evitando hundir la lumbar. 3. Respira constante manteniendo la tensión.",
    media_type: "svg_anim",
    animation_key: "plank",
  },
  {
    id: "cur-cable-crunch",
    coach_id: null,
    name: "Crunch Abdominal en Polea Alta",
    search_aliases: ["cable crunch", "crunch", "abs", "abdomen", "core"],
    muscle_group: "Abdomen",
    primary_muscles: ["Recto abdominal"],
    secondary_muscles: ["Core"],
    equipment: "Polea",
    instructions:
      "1. Arrodíllate frente a la polea sujetando la cuerda junto a la cabeza. 2. Flexiona la columna llevando costillas hacia la pelvis (sin bajar la cadera). 3. Exhala al contraer y regresa lento.",
    media_type: "svg_anim",
    animation_key: "crunch",
  },
  // CARDIO / FULL BODY
  {
    id: "cur-hiit-jump",
    coach_id: null,
    name: "Intervalos HIIT / Saltos de Potencia",
    search_aliases: ["cardio", "hiit", "jumping jacks", "full body", "burpees", "acondicionamiento"],
    muscle_group: "Cardio",
    primary_muscles: ["Cardio / Full Body"],
    secondary_muscles: ["Pierna", "Core"],
    equipment: "Peso corporal",
    instructions:
      "1. Realiza bloques de esfuerzo alto de 30–40 segundos manteniendo buena técnica. 2. Amortigua cada aterrizaje con rodillas suaves. 3. Recupera 20–30 segundos controlando la respiración.",
    media_type: "svg_anim",
    animation_key: "cardio_jump",
  },
];

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
 * Carga catálogo amplio bilingüe (búsqueda ES/EN, visualización siempre en español):
 * 1) Incluye siempre nuestro catálogo curado en español con alias EN/ES.
 * 2) Complementa con ExerciseDB Open V1 y Free Exercise DB traduciendo nombres, músculos e indicaciones al español.
 */
export async function loadLiveExerciseCatalog(): Promise<ExerciseLibraryItem[]> {
  if (cachedCatalog && cachedCatalog.length > 0) return cachedCatalog;

  const collected: ExerciseLibraryItem[] = [...CURATED_BILINGUAL_EXERCISES];
  const seenNames = new Set<string>(
    CURATED_BILINGUAL_EXERCISES.map((e) => normalizeSearchText(e.name))
  );

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
        const translatedName = translateExerciseNameToSpanish(cap(r.name));
        const key = normalizeSearchText(translatedName);
        if (seenNames.has(key)) continue;
        seenNames.add(key);

        const group = mapGroup(r.targetMuscles || [], r.bodyParts || []);
        const equip = (r.equipments?.[0] || "body weight").toLowerCase();

        collected.push({
          id: `edb-${r.exerciseId}`,
          coach_id: null,
          name: translatedName,
          search_aliases: [
            r.name.toLowerCase(),
            ...(r.targetMuscles || []).map((m) => m.toLowerCase()),
            ...(r.bodyParts || []).map((b) => b.toLowerCase()),
            equip,
          ],
          muscle_group: group,
          primary_muscles: (r.targetMuscles || []).map(
            (m) => MUSCLE_ES[m.toLowerCase()] || cap(m)
          ),
          secondary_muscles: (r.secondaryMuscles || [])
            .slice(0, 2)
            .map((m) => MUSCLE_ES[m.toLowerCase()] || cap(m)),
          equipment: EQUIPMENT_ES[equip] || cap(equip),
          instructions: GROUP_DEFAULT_INSTRUCTIONS_ES[group],
          media_url: r.gifUrl,
          media_type: "gif",
        });
      }
    }
  } catch {
    // Fallback below
  }

  // Source 2: Free Exercise DB (GitHub CDN)
  if (collected.length < 80) {
    try {
      const res = await fetch(
        "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json"
      );
      if (res.ok) {
        const list: FreeExerciseDbItem[] = await res.json();
        const baseImg =
          "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";

        for (const item of list) {
          if (collected.length >= 160) break;
          if (!item.name || !item.images || item.images.length === 0) continue;
          const translatedName = translateExerciseNameToSpanish(item.name);
          const key = normalizeSearchText(translatedName);
          if (seenNames.has(key)) continue;
          seenNames.add(key);

          const group = mapGroup(
            item.primaryMuscles || [],
            [],
            item.category || ""
          );
          const equipKey = (item.equipment || "body only").toLowerCase();
          const frames = item.images.slice(0, 2).map((img, i) => ({
            phase: i + 1,
            label: i === 0 ? "Inicio" : "Ejecución",
            image_url: `${baseImg}${img}`,
          }));

          collected.push({
            id: `fedb-${item.id}`,
            coach_id: null,
            name: translatedName,
            search_aliases: [
              item.name.toLowerCase(),
              ...(item.primaryMuscles || []).map((m) => m.toLowerCase()),
              equipKey,
            ],
            muscle_group: group,
            primary_muscles: (item.primaryMuscles || []).map(
              (m) => MUSCLE_ES[m.toLowerCase()] || cap(m)
            ),
            secondary_muscles: (item.secondaryMuscles || [])
              .slice(0, 2)
              .map((m) => MUSCLE_ES[m.toLowerCase()] || cap(m)),
            equipment: EQUIPMENT_ES[equipKey] || cap(equipKey),
            instructions: GROUP_DEFAULT_INSTRUCTIONS_ES[group],
            media_type: "sequence",
            frames: { female: frames, male: frames },
            frame_interval_ms: 850,
          });
        }
      }
    } catch {
      // Keep curated catalog
    }
  }

  cachedCatalog = collected;
  return collected;
}
