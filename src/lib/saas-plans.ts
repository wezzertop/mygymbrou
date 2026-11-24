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
      "Rutinas directas y dieta básica por alumno",
      "Evaluaciones antropométricas básicas",
      "Hasta 2 citas activas y 1 paquete de asesoría",
      "App móvil gratuita para tus alumnos",
    ],
    excludedFeatures: [
      "Incluye publicidad en la app (Plan Free)",
      "Sin plantillas reutilizables de rutinas ni dietas",
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
      "Biblioteca de rutinas y dietas",
      "Historial antropométrico ilimitado",
      "Agenda de citas y paquetes ilimitados",
      "Plantillas reutilizables de rutinas y dietas",
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
      "Todo lo incluido en Coach Base",
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
    studentLimit: null,
    studentLimitLabel: "Alumnos ilimitados",
    coachLimitLabel: "Hasta 3–5 coaches bajo una misma marca",
    description:
      "Para estudios de entrenamiento, boxes y equipos multidisciplinarios sin límites.",
    features: [
      "Alumnos ilimitados",
      "0% publicidad en toda la plataforma",
      "Todo lo incluido en Coach Pro",
      "Hasta 3–5 coaches bajo una misma marca",
      "Identidad personalizada y flujo de cobro/suscripción habilitado",
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
      hasAds: true,
    };
  }
  // Coach Base, Coach Pro y Estudio / Gym: sin publicidad y funciones desbloqueadas
  return {
    canUseReusableTemplates: true,
    canScheduleUnlimitedAppointments: true,
    maxActiveAppointments: null,
    maxSubscriptionPackages: null,
    hasAds: false,
  };
}
