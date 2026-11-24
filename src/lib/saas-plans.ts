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
      "Máximo 2 plantillas de dieta (con imagen)",
      "1 evaluación antropométrica por alumno al mes",
      "Hasta 2 citas activas y 1 paquete de asesoría",
      "App móvil gratuita para tus alumnos",
    ],
    excludedFeatures: [
      "Incluye publicidad en la app (Plan Free)",
      "Sin plantillas reutilizables de rutinas",
      "Sin citas ni paquetes ilimitados",
      "Sin soporte prioritario ni multi-coach",
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
      "Hasta 10 plantillas de dieta (con imagen)",
      "Hasta 2 evaluaciones antropométricas/alumno al mes",
      "Agenda de citas y paquetes ilimitados",
      "Plantillas reutilizables de rutinas",
      "App móvil gratuita para tus alumnos",
    ],
    excludedFeatures: [
      "Sin galería comparativa avanzada 360°",
      "Sin soporte prioritario",
      "Solo 1 entrenador (sin multi-coach)",
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
      "Para coaches con cartera en crecimiento que necesitan velocidad, control y presentación.",
    features: [
      "Hasta 50 alumnos activos",
      "0% publicidad en toda la experiencia",
      "Hasta 30 plantillas de dieta (con imagen)",
      "Hasta 4 evaluaciones antropométricas/alumno al mes",
      "Comparativas visuales y galería de progreso",
      "Gestión de cortes, renovaciones y soporte prioritario",
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
      "Plantillas de dieta (con imagen) y evaluaciones ilimitadas",
      "0% publicidad en toda la plataforma",
      "Todo lo incluido en Coach Pro + identidad personalizada",
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
      maxActiveAppointments: null,
      maxSubscriptionPackages: null,
      maxDietTemplates: 30,
      maxAssessmentsPerStudentPerMonth: 4,
      hasAds: false,
    };
  }
  // Estudio / Gym: sin límites en plantillas ni evaluaciones
  return {
    canUseReusableTemplates: true,
    canScheduleUnlimitedAppointments: true,
    maxActiveAppointments: null,
    maxSubscriptionPackages: null,
    maxDietTemplates: null,
    maxAssessmentsPerStudentPerMonth: null,
    hasAds: false,
  };
}
