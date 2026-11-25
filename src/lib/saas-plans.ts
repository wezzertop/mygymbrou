export type SaasPlanTier = "free" | "base" | "pro" | "studio";

export interface SaasPlanConfig {
  id: SaasPlanTier;
  name: string;
  badge?: string;
  priceMxn: number;
  priceLabel: string;
  period: string;
  maxPriceMxn?: number;
  studentLimit: number | null; // null = ilimitado
  studentLimitLabel: string;
  coachLimitLabel?: string;
  description: string;
  features: string[];
  excludedFeatures: string[];
  featured: boolean;
  ctaLabel: string;
}

export const SAAS_PLANS_MXN: SaasPlanConfig[] = [
  {
    id: "free",
    name: "Inicio / Free",
    priceMxn: 0,
    priceLabel: "$0",
    period: "MXN / mes",
    studentLimit: 5,
    studentLimitLabel: "Hasta 5 alumnos activos",
    description:
      "Trabaja cómodo con tus primeros 5 alumnos y prueba la plataforma sin costo fijo.",
    features: [
      "Hasta 5 alumnos activos",
      "1 paquete de asesoría configurable",
      "Hasta 2 plantillas de dieta (con imagen)",
      "1 evaluación antropométrica por alumno al mes",
      "Hasta 2 citas activas · App móvil gratuita para alumnos",
    ],
    excludedFeatures: [
      "Incluye publicidad en la app (Plan Free)",
      "Máx. 1 paquete y 2 citas (sin paquetes ni citas ilimitadas)",
      "Sin plantillas reutilizables de rutinas ni soporte prioritario",
    ],
    featured: false,
    ctaLabel: "Empezar Gratis",
  },
  {
    id: "base",
    name: "Coach Base",
    priceMxn: 449,
    priceLabel: "$449",
    period: "MXN / mes",
    studentLimit: 15,
    studentLimitLabel: "Hasta 15 alumnos activos",
    description:
      "Para entrenadores independientes que buscan una experiencia limpia, sin anuncios y con plantillas.",
    features: [
      "Hasta 15 alumnos activos",
      "0% publicidad para ti y tus alumnos",
      "Paquetes de asesoría y citas ilimitadas",
      "Hasta 10 plantillas de dieta (con imagen)",
      "Hasta 2 evaluaciones antropométricas/alumno al mes",
      "Plantillas reutilizables de rutinas · App móvil gratuita",
    ],
    excludedFeatures: [
      "Sin comparativas visuales 360° ni soporte prioritario",
      "Solo 1 entrenador (sin equipo multi-coach)",
    ],
    featured: false,
    ctaLabel: "Elegir Coach Base",
  },
  {
    id: "pro",
    name: "Coach Pro",
    badge: "Más Popular",
    priceMxn: 969,
    priceLabel: "$969",
    period: "MXN / mes",
    studentLimit: 50,
    studentLimitLabel: "Hasta 50 alumnos activos",
    description:
      "Para coaches con cartera en crecimiento que necesitan velocidad, control y presentación profesional.",
    features: [
      "Hasta 50 alumnos activos",
      "0% publicidad en toda la experiencia",
      "Hasta 30 plantillas de dieta (con imagen)",
      "Hasta 4 evaluaciones antropométricas/alumno al mes",
      "Todo lo esencial de Coach Base con mayores límites",
      "Comparativas visuales 360°, renovaciones y soporte prioritario",
    ],
    excludedFeatures: [
      "Solo 1 entrenador (sin equipo multi-coach)",
    ],
    featured: true,
    ctaLabel: "Elegir Coach Pro",
  },
  {
    id: "studio",
    name: "Estudio / Gym",
    priceMxn: 2199,
    priceLabel: "$2,199",
    period: "MXN / mes",
    studentLimit: 150,
    studentLimitLabel: "Hasta 150 alumnos activos",
    coachLimitLabel: "Hasta 5 coaches base bajo una misma marca",
    description:
      "Para estudios de entrenamiento, boxes y equipos multidisciplinarios bien estructurados.",
    features: [
      "Hasta 150 alumnos activos",
      "Hasta 5 coaches base bajo una misma marca",
      "0% publicidad en toda la plataforma",
      "Plantillas de dieta (con imagen) y evaluaciones ilimitadas",
      "Todo lo esencial de Coach Pro + identidad de estudio",
    ],
    excludedFeatures: [],
    featured: false,
    ctaLabel: "Elegir Estudio / Gym",
  },
];

export const PRICING_FOOTNOTE_MXN =
  "Precios en Pesos Mexicanos (MXN) con IVA incluido. Tus alumnos acceden completamente gratis mediante tu invitación directa.";

export function getSaasPlanById(tier?: SaasPlanTier | string | null): SaasPlanConfig {
  const found = SAAS_PLANS_MXN.find((p) => p.id === tier);
  return found || SAAS_PLANS_MXN[0];
}

export function getCoachStudentLimit(
  tier?: SaasPlanTier | string | null,
  customLimit?: number | null
): number | null {
  if (typeof customLimit === "number" && customLimit > 0) {
    return customLimit;
  }
  return getSaasPlanById(tier).studentLimit;
}

export function canInviteMoreStudents(
  currentCount: number,
  tier?: SaasPlanTier | string | null,
  customLimit?: number | null
): { allowed: boolean; limit: number | null; remaining: number | null } {
  const limit = getCoachStudentLimit(tier, customLimit);
  if (limit === null) {
    return { allowed: true, limit: null, remaining: null };
  }
  const remaining = Math.max(0, limit - currentCount);
  return {
    allowed: currentCount < limit,
    limit,
    remaining,
  };
}

export function formatMxn(amount: number): string {
  return `$${amount.toLocaleString("es-MX")} MXN`;
}

export interface PlanCapabilities {
  canUseReusableTemplates: boolean;
  canScheduleUnlimitedAppointments: boolean;
  canUseVisualComparisons: boolean;
  hasPrioritySupport: boolean;
  maxCoaches: number;
  maxActiveAppointments: number | null;
  maxSubscriptionPackages: number | null;
  maxDietTemplates: number | null;
  maxAssessmentsPerStudentPerMonth: number | null;
  hasAds: boolean;
}

export function getPlanCapabilities(
  tier?: SaasPlanTier | string | null
): PlanCapabilities {
  const normalized = (tier || "free") as SaasPlanTier;
  if (normalized === "free") {
    return {
      canUseReusableTemplates: false,
      canScheduleUnlimitedAppointments: false,
      canUseVisualComparisons: false,
      hasPrioritySupport: false,
      maxCoaches: 1,
      maxActiveAppointments: 2,
      maxSubscriptionPackages: 1,
      maxDietTemplates: 2,
      maxAssessmentsPerStudentPerMonth: 1,
      hasAds: true,
    };
  }
  if (normalized === "base") {
    return {
      canUseReusableTemplates: true,
      canScheduleUnlimitedAppointments: true,
      canUseVisualComparisons: false,
      hasPrioritySupport: false,
      maxCoaches: 1,
      maxActiveAppointments: null,
      maxSubscriptionPackages: null,
      maxDietTemplates: 10,
      maxAssessmentsPerStudentPerMonth: 2,
      hasAds: false,
    };
  }
  if (normalized === "pro") {
    return {
      canUseReusableTemplates: true,
      canScheduleUnlimitedAppointments: true,
      canUseVisualComparisons: true,
      hasPrioritySupport: true,
      maxCoaches: 1,
      maxActiveAppointments: null,
      maxSubscriptionPackages: null,
      maxDietTemplates: 30,
      maxAssessmentsPerStudentPerMonth: 4,
      hasAds: false,
    };
  }
  if (normalized === "studio") {
    // Estudio / Gym: hasta 150 alumnos, 5 coaches base, plantillas y evaluaciones ilimitadas
    return {
      canUseReusableTemplates: true,
      canScheduleUnlimitedAppointments: true,
      canUseVisualComparisons: true,
      hasPrioritySupport: true,
      maxCoaches: 5,
      maxActiveAppointments: null,
      maxSubscriptionPackages: null,
      maxDietTemplates: null,
      maxAssessmentsPerStudentPerMonth: null,
      hasAds: false,
    };
  }
  // Fallback seguro: cualquier tier desconocido recibe límites Free
  return {
    canUseReusableTemplates: false,
    canScheduleUnlimitedAppointments: false,
    canUseVisualComparisons: false,
    hasPrioritySupport: false,
    maxCoaches: 1,
    maxActiveAppointments: 2,
    maxSubscriptionPackages: 1,
    maxDietTemplates: 2,
    maxAssessmentsPerStudentPerMonth: 1,
    hasAds: true,
  };
}

export const PLAN_RANK: Record<SaasPlanTier, number> = {
  free: 0,
  base: 1,
  pro: 2,
  studio: 3,
};

export interface PlanChangeQuote {
  fromPlan: SaasPlanConfig;
  toPlan: SaasPlanConfig;
  mode: "upgrade" | "downgrade" | "same";
  remainingDays: number;
  dailyRateCurrentMxn: number;
  creditMxn: number;
  netPayableTodayMxn: number;
  effectiveAtIso: string;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Motor transparente de cambio de plan (ciclo base de 30 días):
 * - Upgrade: calcula valor diario del plan actual (precio / 30) * días restantes
 *   y descuenta ese crédito del nuevo plan.
 * - Downgrade: sin devolución en efectivo; se programa para el cierre del corte actual.
 */
export function calculatePlanChangeQuote(params: {
  currentTier?: SaasPlanTier | string | null;
  targetTier: SaasPlanTier;
  periodEndIso?: string | null;
  now?: Date;
}): PlanChangeQuote {
  const now = params.now || new Date();
  const fromPlan = getSaasPlanById(params.currentTier);
  const toPlan = getSaasPlanById(params.targetTier);

  const fromRank = PLAN_RANK[fromPlan.id];
  const toRank = PLAN_RANK[toPlan.id];
  const mode: PlanChangeQuote["mode"] =
    toRank > fromRank ? "upgrade" : toRank < fromRank ? "downgrade" : "same";

  // Si tiene fecha de corte registrada, calculamos días exactos restantes (0..30).
  // Si es un plan de pago sin fecha de corte cargada aún, usamos 15 días de referencia.
  let remainingDays = 0;
  let effectiveCutoffDate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);

  if (fromPlan.priceMxn > 0) {
    if (params.periodEndIso) {
      const end = new Date(params.periodEndIso);
      if (!Number.isNaN(end.getTime())) {
        effectiveCutoffDate = end;
        const diffMs = end.getTime() - now.getTime();
        remainingDays = Math.max(
          0,
          Math.min(30, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
        );
      } else {
        remainingDays = 15;
      }
    } else {
      remainingDays = 15;
    }
  }

  const dailyRateCurrentMxn = fromPlan.priceMxn / 30;

  if (mode === "upgrade") {
    const creditMxn =
      fromPlan.priceMxn > 0 ? round2(dailyRateCurrentMxn * remainingDays) : 0;
    const netPayableTodayMxn = Math.max(0, round2(toPlan.priceMxn - creditMxn));
    return {
      fromPlan,
      toPlan,
      mode,
      remainingDays,
      dailyRateCurrentMxn,
      creditMxn,
      netPayableTodayMxn,
      effectiveAtIso: now.toISOString(),
    };
  }

  if (mode === "downgrade") {
    return {
      fromPlan,
      toPlan,
      mode,
      remainingDays,
      dailyRateCurrentMxn,
      creditMxn: 0,
      netPayableTodayMxn: 0,
      effectiveAtIso: effectiveCutoffDate.toISOString(),
    };
  }

  return {
    fromPlan,
    toPlan,
    mode: "same",
    remainingDays,
    dailyRateCurrentMxn,
    creditMxn: 0,
    netPayableTodayMxn: 0,
    effectiveAtIso: now.toISOString(),
  };
}
