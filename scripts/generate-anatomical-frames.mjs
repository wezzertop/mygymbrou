import fs from "node:fs";
import path from "node:path";

const ROOT = path.join(process.cwd(), "public", "exercises");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

/**
 * Generates a sculpted Dark UI anatomical fitness illustration SVG frame
 * with distinct female/male silhouettes, muscle fiber glow highlights,
 * phase progress accents, and #0b1117 background integration.
 */
function buildFrameSvg({
  gender,
  phase,
  totalPhases,
  phaseLabel,
  primaryMuscleLabel,
  scene,
}) {
  const isFemale = gender === "female";
  const bodyFill = isFemale ? "#334155" : "#3b4759";
  const bodyStroke = "#64748b";
  const highlightPrimary = "#f43f5e";
  const highlightSecondary = "#f59e0b";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 260" width="400" height="260" fill="none">
  <defs>
    <radialGradient id="bgGlow" cx="50%" cy="45%" r="60%">
      <stop offset="0%" stop-color="#152238" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#0b1117" stop-opacity="1"/>
    </radialGradient>
    <radialGradient id="muscleGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ff4d6d" stop-opacity="0.95"/>
      <stop offset="55%" stop-color="#f43f5e" stop-opacity="0.7"/>
      <stop offset="100%" stop-color="#f43f5e" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="secGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#fbbf24" stop-opacity="0.7"/>
      <stop offset="100%" stop-color="#f59e0b" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#526075"/>
      <stop offset="50%" stop-color="${bodyFill}"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
    <linearGradient id="barGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#06b6d4"/>
      <stop offset="50%" stop-color="#94a3b8"/>
      <stop offset="100%" stop-color="#06b6d4"/>
    </linearGradient>
    <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="4" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Seamless Dark UI Canvas -->
  <rect width="400" height="260" fill="url(#bgGlow)"/>
  <!-- Subtle perspective studio floor -->
  <ellipse cx="200" cy="228" rx="155" ry="12" fill="#060a0f" opacity="0.85"/>
  <line x1="36" y1="226" x2="364" y2="226" stroke="#1e293b" stroke-width="1.5"/>

  <!-- Anatomical Figure & Equipment Scene -->
  ${scene({ isFemale, bodyGrad: "url(#bodyGrad)", bodyStroke, highlightPrimary, highlightSecondary })}

  <!-- Subtle Phase / Muscle Telemetry Bar -->
  <g opacity="0.9">
    <rect x="14" y="14" width="108" height="22" rx="11" fill="#0f172a" stroke="#1e293b"/>
    <circle cx="26" cy="25" r="3.5" fill="#f43f5e"/>
    <text x="35" y="29" fill="#e2e8f0" font-family="Inter, Segoe UI, sans-serif" font-size="10" font-weight="700">FASE ${phase}/${totalPhases}</text>
  </g>
</svg>`;
}

function hairPath(cx, cy, isFemale) {
  if (!isFemale) {
    return `<path d="M${cx - 11},${cy - 4} Q${cx},${cy - 17} ${cx + 11},${cy - 4} Q${cx + 4},${cy - 10} ${cx - 11},${cy - 4} Z" fill="#1e293b"/>`;
  }
  return `
    <path d="M${cx - 11},${cy - 3} Q${cx},${cy - 17} ${cx + 11},${cy - 3} Z" fill="#1e293b"/>
    <path d="M${cx - 10},${cy - 4} Q${cx - 24},${cy - 6} ${cx - 26},${cy + 8} Q${cx - 18},${cy + 4} ${cx - 10},${cy} Z" fill="#0f172a" stroke="#334155" stroke-width="1"/>
  `;
}

// =========================================================================
// 1. HIP THRUST CON BARRA (4 FASES)
// =========================================================================
function hipThrustScene(phase) {
  // phase 1: hips low, 2: mid drive, 3: peak tabletop, 4: controlled descent
  const hipY = phase === 1 ? 186 : phase === 2 ? 156 : phase === 3 ? 132 : 162;
  const glowOp = phase === 1 ? 0.45 : phase === 2 ? 0.78 : phase === 3 ? 1 : 0.68;

  return ({ isFemale, bodyGrad, bodyStroke }) => {
    const torsoW = isFemale ? 18 : 22;
    const gluteR = isFemale ? 18 : 15;
    return `
      <!-- Weight Bench -->
      <rect x="66" y="132" width="58" height="94" rx="10" fill="#111827" stroke="#334155" stroke-width="2"/>
      <rect x="74" y="140" width="42" height="12" rx="4" fill="#1e293b"/>

      <!-- Back leg (depth) -->
      <path d="M210,${hipY + 6} Q250,${hipY + 12} 266,158 L272,220 L292,222" stroke="#1e293b" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>

      <!-- Sculpted Torso (upper back on bench -> hips) -->
      <path d="M120,132 Q165,${(132 + hipY) / 2 - 4} 206,${hipY} L200,${hipY + torsoW} Q158,${(132 + hipY) / 2 + torsoW} 114,148 Z"
            fill="${bodyGrad}" stroke="${bodyStroke}" stroke-width="1.5"/>

      <!-- Head -->
      <circle cx="106" cy="116" r="13" fill="${bodyGrad}" stroke="${bodyStroke}" stroke-width="1.5"/>
      ${hairPath(106, 116, isFemale)}

      <!-- Front Thigh + Shin + Foot -->
      <path d="M204,${hipY + 4} Q246,${hipY - 4} 274,148 L280,218" stroke="${bodyGrad}" stroke-width="${isFemale ? 22 : 24}" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M276,220 L306,220" stroke="#06b6d4" stroke-width="8" stroke-linecap="round"/>

      <!-- PRIMARY MUSCLE HIGHLIGHT: Glutes & Hamstrings -->
      <ellipse cx="204" cy="${hipY + 8}" rx="${gluteR + 6}" ry="${gluteR}" fill="url(#muscleGlow)" opacity="${glowOp}" filter="url(#softGlow)"/>
      <path d="M192,${hipY + 12} Q228,${hipY + 16} 260,158" stroke="#f43f5e" stroke-width="9" stroke-linecap="round" opacity="${glowOp * 0.85}" filter="url(#softGlow)"/>

      <!-- Arm holding barbell -->
      <path d="M132,140 Q164,${hipY - 12} 196,${hipY - 10}" stroke="#475569" stroke-width="11" stroke-linecap="round"/>

      <!-- Barbell Plate over Hip -->
      <circle cx="202" cy="${hipY - 10}" r="24" fill="#0f172a" stroke="#06b6d4" stroke-width="3.5"/>
      <circle cx="202" cy="${hipY - 10}" r="8" fill="#334155" stroke="#94a3b8" stroke-width="2"/>
    `;
  };
}

// =========================================================================
// 2. SENTADILLA BÚLGARA CON MANCUERNAS (4 FASES)
// =========================================================================
function bulgarianSquatScene(phase) {
  const drop = phase === 1 ? 0 : phase === 2 ? 22 : phase === 3 ? 42 : 18;
  const glowOp = phase === 1 ? 0.4 : phase === 2 ? 0.75 : phase === 3 ? 1 : 0.65;

  return ({ isFemale, bodyGrad, bodyStroke }) => {
    const headY = 48 + drop;
    const shoulderY = 76 + drop;
    const hipY = 128 + drop;
    const kneeY = 166 + drop * 0.45;
    const backKneeY = 162 + drop * 1.15;

    return `
      <!-- Rear Bench -->
      <rect x="86" y="168" width="54" height="56" rx="8" fill="#111827" stroke="#334155" stroke-width="2"/>

      <!-- Rear Elevated Leg -->
      <path d="M188,${hipY} L160,${backKneeY} L118,166" stroke="#293548" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>
      <line x1="112" y1="166" x2="124" y2="166" stroke="#06b6d4" stroke-width="6" stroke-linecap="round"/>

      <!-- Front Working Leg -->
      <path d="M196,${hipY} L246,${kneeY} L242,220" stroke="${bodyGrad}" stroke-width="${isFemale ? 21 : 24}" stroke-linecap="round" stroke-linejoin="round"/>
      <line x1="238" y1="221" x2="266" y2="221" stroke="#06b6d4" stroke-width="7" stroke-linecap="round"/>

      <!-- PRIMARY MUSCLE HIGHLIGHT: Front Quad & Glute -->
      <path d="M198,${hipY + 2} L242,${kneeY - 4}" stroke="#f43f5e" stroke-width="12" stroke-linecap="round" opacity="${glowOp}" filter="url(#softGlow)"/>
      <ellipse cx="192" cy="${hipY + 2}" rx="17" ry="14" fill="url(#muscleGlow)" opacity="${glowOp * 0.9}" filter="url(#softGlow)"/>

      <!-- Sculpted Torso (slight athletic lean) -->
      <path d="M196,${shoulderY} L212,${shoulderY + 6} L204,${hipY + 4} L184,${hipY} Z"
            fill="${bodyGrad}" stroke="${bodyStroke}" stroke-width="1.5"/>

      <!-- Head -->
      <circle cx="206" cy="${headY}" r="13" fill="${bodyGrad}" stroke="${bodyStroke}" stroke-width="1.5"/>
      ${hairPath(206, headY, isFemale)}

      <!-- Arms + Dumbbells -->
      <path d="M202,${shoulderY + 8} L214,${hipY + 26}" stroke="#475569" stroke-width="11" stroke-linecap="round"/>
      <rect x="200" y="${hipY + 24}" width="28" height="10" rx="4" fill="#0f172a" stroke="#06b6d4" stroke-width="2.5"/>
    `;
  };
}

// =========================================================================
// 3. PESO MUERTO RUMANO (4 FASES)
// =========================================================================
function rdlScene(phase) {
  // Torso hinge angle
  const angle = phase === 1 ? 8 : phase === 2 ? 44 : phase === 3 ? 76 : 36;
  const hipShift = phase === 1 ? 0 : phase === 2 ? -18 : phase === 3 ? -30 : -14;
  const glowOp = phase === 1 ? 0.4 : phase === 2 ? 0.78 : phase === 3 ? 1 : 0.68;

  return ({ isFemale, bodyGrad, bodyStroke }) => {
    const hipX = 192 + hipShift;
    const hipY = 126;
    const rad = (angle * Math.PI) / 180;
    const shX = hipX + Math.sin(rad) * 66;
    const shY = hipY - Math.cos(rad) * 66;
    const headX = shX + Math.sin(rad) * 22;
    const headY = shY - Math.cos(rad) * 22;
    const barX = shX + 6;
    const barY = Math.min(200, shY + 68);

    return `
      <!-- Legs (slight knee bend) -->
      <path d="M${hipX},${hipY} L${hipX + 18},176 L${hipX + 12},221" stroke="${bodyGrad}" stroke-width="${isFemale ? 21 : 24}" stroke-linecap="round" stroke-linejoin="round"/>
      <line x1="${hipX + 8}" y1="221" x2="${hipX + 36}" y2="221" stroke="#06b6d4" stroke-width="7" stroke-linecap="round"/>

      <!-- PRIMARY MUSCLE HIGHLIGHT: Hamstrings & Glutes -->
      <ellipse cx="${hipX - 2}" cy="${hipY + 4}" rx="18" ry="15" fill="url(#muscleGlow)" opacity="${glowOp}" filter="url(#softGlow)"/>
      <path d="M${hipX - 4},${hipY + 12} L${hipX + 10},176" stroke="#f43f5e" stroke-width="11" stroke-linecap="round" opacity="${glowOp}" filter="url(#softGlow)"/>

      <!-- Secondary: Lower Back -->
      <ellipse cx="${(hipX + shX) / 2}" cy="${(hipY + shY) / 2}" rx="14" ry="8" fill="url(#secGlow)" opacity="${glowOp * 0.75}"/>

      <!-- Torso -->
      <line x1="${hipX}" y1="${hipY}" x2="${shX}" y2="${shY}" stroke="${bodyGrad}" stroke-width="${isFemale ? 20 : 25}" stroke-linecap="round"/>

      <!-- Head -->
      <circle cx="${headX}" cy="${headY}" r="13" fill="${bodyGrad}" stroke="${bodyStroke}" stroke-width="1.5"/>
      ${hairPath(headX, headY, isFemale)}

      <!-- Arms hanging vertical to Barbell -->
      <line x1="${shX}" y1="${shY + 4}" x2="${barX}" y2="${barY}" stroke="#475569" stroke-width="11" stroke-linecap="round"/>
      <circle cx="${barX}" cy="${barY}" r="22" fill="#0f172a" stroke="#06b6d4" stroke-width="3.5"/>
      <circle cx="${barX}" cy="${barY}" r="7" fill="#334155"/>
    `;
  };
}

// =========================================================================
// 4. PLANCHA ABDOMINAL ISOMÉTRICA (3 FASES)
// =========================================================================
function plankScene(phase) {
  const hipY = phase === 1 ? 168 : phase === 2 ? 150 : 146;
  const glowOp = phase === 1 ? 0.5 : phase === 2 ? 0.85 : 1;

  return ({ isFemale, bodyGrad, bodyStroke }) => `
    <!-- Mat -->
    <rect x="66" y="216" width="268" height="8" rx="4" fill="#111827" stroke="#1e293b"/>

    <!-- Forearms supporting -->
    <path d="M126,144 L118,212 L152,212" stroke="#475569" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>

    <!-- Torso & Legs aligned -->
    <path d="M122,140 L214,${hipY} L306,210" stroke="${bodyGrad}" stroke-width="${isFemale ? 20 : 24}" stroke-linecap="round" stroke-linejoin="round"/>
    <line x1="304" y1="212" x2="314" y2="216" stroke="#06b6d4" stroke-width="7" stroke-linecap="round"/>

    <!-- Head -->
    <circle cx="98" cy="134" r="13" fill="${bodyGrad}" stroke="${bodyStroke}" stroke-width="1.5"/>
    ${hairPath(98, 134, isFemale)}

    <!-- PRIMARY MUSCLE HIGHLIGHT: Core & Abs -->
    <ellipse cx="184" cy="${hipY + 2}" rx="34" ry="13" fill="url(#muscleGlow)" opacity="${glowOp}" filter="url(#softGlow)"/>
    <line x1="158" y1="${hipY - 2}" x2="208" y2="${hipY + 6}" stroke="#ff4d6d" stroke-width="6" stroke-linecap="round" opacity="${glowOp}"/>
  `;
}

// =========================================================================
// 5. JALÓN AL PECHO AGARRE NEUTRO (3 FASES)
// =========================================================================
function latPulldownScene(phase) {
  const barY = phase === 1 ? 42 : phase === 2 ? 78 : 108;
  const glowOp = phase === 1 ? 0.45 : phase === 2 ? 0.8 : 1;

  return ({ isFemale, bodyGrad, bodyStroke }) => {
    const shW = isFemale ? 24 : 32;
    const elbowY = phase === 1 ? 76 : phase === 2 ? 116 : 140;
    const elbowSpread = phase === 1 ? 42 : phase === 2 ? 52 : 34;

    return `
      <!-- Pulley cable -->
      <line x1="200" y1="8" x2="200" y2="${barY}" stroke="#475569" stroke-width="2.5" stroke-dasharray="4 3"/>

      <!-- Seat -->
      <rect x="164" y="182" width="72" height="12" rx="5" fill="#111827" stroke="#334155" stroke-width="2"/>
      <rect x="192" y="194" width="16" height="32" fill="#1e293b"/>

      <!-- Rear 3/4 Seated Torso -->
      <path d="M${200 - shW},106 L${200 + shW},106 L${200 + (isFemale ? 17 : 22)},180 L${200 - (isFemale ? 17 : 22)},180 Z"
            fill="${bodyGrad}" stroke="${bodyStroke}" stroke-width="1.5"/>

      <!-- PRIMARY MUSCLE HIGHLIGHT: Lats & Upper Back -->
      <ellipse cx="${200 - 15}" cy="132" rx="14" ry="24" fill="url(#muscleGlow)" opacity="${glowOp}" filter="url(#softGlow)"/>
      <ellipse cx="${200 + 15}" cy="132" rx="14" ry="24" fill="url(#muscleGlow)" opacity="${glowOp}" filter="url(#softGlow)"/>

      <!-- Head -->
      <circle cx="200" cy="84" r="14" fill="${bodyGrad}" stroke="${bodyStroke}" stroke-width="1.5"/>
      ${hairPath(200, 84, isFemale)}

      <!-- Arms pulling bar -->
      <path d="M${200 - shW},110 L${200 - elbowSpread},${elbowY} L148,${barY}" stroke="#475569" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M${200 + shW},110 L${200 + elbowSpread},${elbowY} L252,${barY}" stroke="#475569" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>

      <!-- Lat Bar -->
      <line x1="130" y1="${barY}" x2="270" y2="${barY}" stroke="url(#barGrad)" stroke-width="6" stroke-linecap="round"/>
    `;
  };
}

// =========================================================================
// 6. PRESS INCLINADO CON MANCUERNAS (3 FASES)
// =========================================================================
function inclinePressScene(phase) {
  const lift = phase === 1 ? 54 : phase === 2 ? 26 : 6;
  const glowOp = phase === 1 ? 0.55 : phase === 2 ? 0.8 : 1;

  return ({ isFemale, bodyGrad, bodyStroke }) => `
    <!-- 30° Incline Bench -->
    <path d="M108,124 L208,176 L262,176" stroke="#1e293b" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
    <line x1="132" y1="142" x2="132" y2="222" stroke="#334155" stroke-width="8"/>
    <line x1="234" y1="176" x2="234" y2="222" stroke="#334155" stroke-width="8"/>

    <!-- Athlete on Incline Bench -->
    <circle cx="122" cy="100" r="13" fill="${bodyGrad}" stroke="${bodyStroke}" stroke-width="1.5"/>
    ${hairPath(122, 100, isFemale)}
    <path d="M134,116 L204,160 L254,166 L268,218" stroke="${bodyGrad}" stroke-width="${isFemale ? 20 : 24}" stroke-linecap="round" stroke-linejoin="round"/>
    <line x1="264" y1="220" x2="290" y2="220" stroke="#06b6d4" stroke-width="7" stroke-linecap="round"/>

    <!-- PRIMARY MUSCLE HIGHLIGHT: Upper Chest -->
    <ellipse cx="164" cy="126" rx="20" ry="13" fill="url(#muscleGlow)" opacity="${glowOp}" filter="url(#softGlow)"/>

    <!-- Arms + Dumbbells -->
    <line x1="158" y1="126" x2="176" y2="${116 - lift}" stroke="#475569" stroke-width="11" stroke-linecap="round"/>
    <rect x="158" y="${108 - lift}" width="36" height="11" rx="4" fill="#0f172a" stroke="#06b6d4" stroke-width="2.5"/>
  `;
}

// =========================================================================
// 7. CURL DE BÍCEPS CON MANCUERNAS (3 FASES)
// =========================================================================
function bicepCurlScene(phase) {
  const handX = phase === 1 ? 214 : phase === 2 ? 244 : 226;
  const handY = phase === 1 ? 150 : phase === 2 ? 122 : 90;
  const glowOp = phase === 1 ? 0.4 : phase === 2 ? 0.78 : 1;

  return ({ isFemale, bodyGrad, bodyStroke }) => `
    <!-- Standing Athlete -->
    <circle cx="196" cy="48" r="13" fill="${bodyGrad}" stroke="${bodyStroke}" stroke-width="1.5"/>
    ${hairPath(196, 48, isFemale)}
    <path d="M184,66 L210,66 L206,136 L186,136 Z" fill="${bodyGrad}" stroke="${bodyStroke}" stroke-width="1.5"/>
    <line x1="190" y1="136" x2="184" y2="220" stroke="${bodyGrad}" stroke-width="${isFemale ? 18 : 21}" stroke-linecap="round"/>
    <line x1="204" y1="136" x2="210" y2="220" stroke="${bodyGrad}" stroke-width="${isFemale ? 18 : 21}" stroke-linecap="round"/>
    <line x1="180" y1="221" x2="222" y2="221" stroke="#06b6d4" stroke-width="6" stroke-linecap="round"/>

    <!-- Upper Arm + Forearm Curling -->
    <line x1="206" y1="74" x2="212" y2="116" stroke="#475569" stroke-width="12" stroke-linecap="round"/>
    <line x1="212" y1="116" x2="${handX}" y2="${handY}" stroke="#64748b" stroke-width="10" stroke-linecap="round"/>

    <!-- PRIMARY MUSCLE HIGHLIGHT: Biceps -->
    <ellipse cx="212" cy="98" rx="11" ry="15" fill="url(#muscleGlow)" opacity="${glowOp}" filter="url(#softGlow)"/>

    <!-- Dumbbell -->
    <circle cx="${handX}" cy="${handY}" r="11" fill="#0f172a" stroke="#06b6d4" stroke-width="3"/>
  `;
}

// =========================================================================
// 8. ELEVACIONES LATERALES (3 FASES)
// =========================================================================
function lateralRaiseScene(phase) {
  const armAngle = phase === 1 ? 74 : phase === 2 ? 36 : 4;
  const glowOp = phase === 1 ? 0.4 : phase === 2 ? 0.8 : 1;

  return ({ isFemale, bodyGrad, bodyStroke }) => {
    const rad = (armAngle * Math.PI) / 180;
    const dx = Math.cos(rad) * 58;
    const dy = Math.sin(rad) * 58;
    const shW = isFemale ? 20 : 26;

    return `
      <circle cx="200" cy="48" r="13" fill="${bodyGrad}" stroke="${bodyStroke}" stroke-width="1.5"/>
      ${hairPath(200, 48, isFemale)}
      <path d="M${200 - shW},66 L${200 + shW},66 L${200 + 16},138 L${200 - 16},138 Z" fill="${bodyGrad}" stroke="${bodyStroke}" stroke-width="1.5"/>
      <line x1="190" y1="138" x2="184" y2="220" stroke="${bodyGrad}" stroke-width="18" stroke-linecap="round"/>
      <line x1="210" y1="138" x2="216" y2="220" stroke="${bodyGrad}" stroke-width="18" stroke-linecap="round"/>

      <!-- Left & Right Arms Raising -->
      <line x1="${200 - shW}" y1="74" x2="${200 - shW - dx}" y2="${74 + dy}" stroke="#475569" stroke-width="10" stroke-linecap="round"/>
      <line x1="${200 + shW}" y1="74" x2="${200 + shW + dx}" y2="${74 + dy}" stroke="#475569" stroke-width="10" stroke-linecap="round"/>

      <!-- PRIMARY MUSCLE HIGHLIGHT: Lateral Deltoids -->
      <circle cx="${200 - shW}" cy="74" r="13" fill="url(#muscleGlow)" opacity="${glowOp}" filter="url(#softGlow)"/>
      <circle cx="${200 + shW}" cy="74" r="13" fill="url(#muscleGlow)" opacity="${glowOp}" filter="url(#softGlow)"/>

      <!-- Dumbbells -->
      <circle cx="${200 - shW - dx}" cy="${74 + dy}" r="8" fill="#0f172a" stroke="#06b6d4" stroke-width="2.5"/>
      <circle cx="${200 + shW + dx}" cy="${74 + dy}" r="8" fill="#0f172a" stroke="#06b6d4" stroke-width="2.5"/>
    `;
  };
}

const EXERCISES = [
  {
    slug: "hip-thrust",
    phases: ["Inicio", "Empuje", "Contracción máxima", "Retorno controlado"],
    primaryMuscle: "Glúteos / Femorales",
    fn: hipThrustScene,
  },
  {
    slug: "bulgarian-split-squat",
    phases: ["Posición inicial", "Descenso controlado", "Tensión máxima", "Retorno"],
    primaryMuscle: "Cuádriceps / Glúteo",
    fn: bulgarianSquatScene,
  },
  {
    slug: "romanian-deadlift",
    phases: ["Inicio", "Bisagra de cadera", "Estiramiento máximo", "Retorno"],
    primaryMuscle: "Isquiotibiales / Glúteo",
    fn: rdlScene,
  },
  {
    slug: "plank",
    phases: ["Preparación", "Alineación corporal", "Contracción máxima"],
    primaryMuscle: "Abdomen / Core",
    fn: plankScene,
  },
  {
    slug: "lat-pulldown",
    phases: ["Extensión superior", "Tracción media", "Contracción dorsal"],
    primaryMuscle: "Dorsal / Espalda",
    fn: latPulldownScene,
  },
  {
    slug: "incline-press",
    phases: ["Inicio arriba", "Descenso 45°", "Empuje pectoral"],
    primaryMuscle: "Pectoral Superior",
    fn: inclinePressScene,
  },
  {
    slug: "bicep-curl",
    phases: ["Extensión base", "Flexión media", "Contracción pico"],
    primaryMuscle: "Bíceps Braquial",
    fn: bicepCurlScene,
  },
  {
    slug: "lateral-raise",
    phases: ["Posición base", "Elevación media", "Contracción deltoides"],
    primaryMuscle: "Deltoides Lateral",
    fn: lateralRaiseScene,
  },
];

let count = 0;
for (const ex of EXERCISES) {
  for (const gender of ["female", "male"]) {
    const dir = path.join(ROOT, ex.slug, gender);
    ensureDir(dir);
    ex.phases.forEach((label, idx) => {
      const phase = idx + 1;
      const svg = buildFrameSvg({
        gender,
        phase,
        totalPhases: ex.phases.length,
        phaseLabel: label,
        primaryMuscleLabel: ex.primaryMuscle,
        scene: ex.fn(phase),
      });
      fs.writeFileSync(path.join(dir, `frame-${phase}.svg`), svg, "utf8");
      count++;
    });
  }
}

console.log(`Generated ${count} Dark UI anatomical exercise frames in ${ROOT}`);
