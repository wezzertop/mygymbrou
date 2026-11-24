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
      "Ideal para probar la plataforma o iniciar tu práctica digital sin costo fijo.",
    features: [
      "Hasta 5 alumnos activos",
      "Rutinas y dieta básica",
      "Evaluaciones antropométricas y agenda",
      "App móvil gratuita para tus alumnos",
    ],
    featured: false,
    ctaLabel: "Empezar Gratis",
  },
  {
    id: "base",
    name: "Coach Base",
    priceMxn: 309,
    maxPriceMxn: 369,
    priceLabel: "$309",
    period: "MXN / mes",
    studentLimit: 15,
    studentLimitLabel: "Hasta 15 alumnos activos",
    description:
      "Para entrenadores independientes que buscan una experiencia profesional todos los días.",
    features: [
      "Hasta 15 alumnos activos",
      "Biblioteca de rutinas y dietas",
      "Historial antropométrico ilimitado",
      "Agenda de citas y app móvil para alumnos",
    ],
    featured: false,
    ctaLabel: "Elegir Coach Base",
  },
  {
    id: "pro",
    name: "Coach Pro",
    badge: "Más Popular",
    priceMxn: 679,
    maxPriceMxn: 799,
    priceLabel: "$679",
    period: "MXN / mes",
    studentLimit: 50,
    studentLimitLabel: "Hasta 50 alumnos activos",
    description:
      "Diseñado para coaches con cartera en crecimiento que necesitan velocidad y control.",
    features: [
      "Hasta 50 alumnos activos",
      "Plantillas reutilizables de rutinas y dietas",
      "Comparativas visuales y galería de progreso",
      "Gestión de cortes y membresías",
      "Soporte prioritario",
    ],
    featured: true,
    ctaLabel: "Elegir Coach Pro",
  },
  {
    id: "studio",
    name: "Estudio / Gym",
    priceMxn: 1469,
    maxPriceMxn: 1839,
    priceLabel: "$1,469",
    period: "MXN / mes",
    studentLimit: null,
    studentLimitLabel: "Alumnos ilimitados",
    coachLimitLabel: "Hasta 3–5 coaches bajo misma marca",
    description:
      "Para estudios de entrenamiento, boxes y equipos multidisciplinarios.",
    features: [
      "Alumnos ilimitados",
      "Hasta 3–5 coaches bajo una misma marca",
      "Identidad personalizada para el estudio",
      "Herramientas de gestión de equipo",
      "Listo para conectar Stripe / Mercado Pago",
    ],
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

