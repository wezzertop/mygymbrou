import { getSaasPlanById, SaasPlanTier } from "@/lib/saas-plans";
import { Profile } from "@/types/database";

export const REFERRAL_RULES = {
  sponsorDiscountPercent: 25,
  inviteeDefaultDiscountPercent: 25,
  minRewardCap: 12,
  defaultRewardCap: 18,
  maxRewardCap: 24,
  verificationGraceDays: 15,
};

export interface PromoCodeRecord {
  id: string;
  code: string;
  description?: string | null;
  discount_type: "percent" | "fixed_mxn";
  discount_value: number;
  target_plan_tier?: "base" | "pro" | "studio" | null;
  max_uses?: number | null;
  used_count: number;
  expires_at?: string | null;
  is_active: boolean;
  created_at?: string;
}

export interface ReferralRewardItem {
  id: string;
  sponsor_coach_id: string;
  invited_coach_email?: string | null;
  discount_percent: number;
  plan_at_grant: SaasPlanTier;
  locked_plan_price_mxn: number;
  queue_position: number;
  status: "pending" | "queued" | "queued_in_stripe" | "applied" | "expired" | "cancelled";
  stripe_coupon_id?: string | null;
  stripe_invoice_id?: string | null;
  applied_month?: string | null;
  applied_amount_mxn?: number | null;
  created_at: string;
}

export const DEFAULT_PROMO_CODES: PromoCodeRecord[] = [
  {
    id: "promo-bienvenido25",
    code: "BIENVENIDO25",
    description: "25% de descuento en tu primer mes de plan Coach",
    discount_type: "percent",
    discount_value: 25,
    target_plan_tier: null,
    max_uses: 200,
    used_count: 14,
    expires_at: null,
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "promo-lanzamiento35",
    code: "LANZAMIENTO35",
    description: "35% de descuento de lanzamiento (solo primer mes)",
    discount_type: "percent",
    discount_value: 35,
    target_plan_tier: null,
    max_uses: 100,
    used_count: 9,
    expires_at: null,
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
  },
];

export function generateCoachReferralCode(fullName?: string, id?: string): string {
  const cleanName = (fullName || "COACH")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z]/g, "")
    .toUpperCase()
    .slice(0, 5) || "COACH";
  const suffix = (id || "MG26")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
    .slice(-4)
    .padStart(4, "7");
  return `${cleanName}-${suffix}`;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Reglas exactas de aplicación de 1 recompensa mensual en cola del Coach padrino:
 * - Solo 1 descuento por mes (cola consecutiva, nunca apilados).
 * - Si subió de plan (upgrade): se calcula sobre el valor del plan en el que estaba al generarse (`locked_plan_price_mxn`).
 * - Si bajó de plan (downgrade): sin devolución en efectivo; se ajusta al precio del plan actual vigente.
 * - Nunca genera saldo negativo ni reembolso en efectivo.
 */
export function calculateQueuedRewardForPlan(
  reward: Pick<ReferralRewardItem, "discount_percent" | "locked_plan_price_mxn" | "plan_at_grant">,
  currentPlanTier?: SaasPlanTier | string | null
): {
  currentPlanPriceMxn: number;
  referenceBasePriceMxn: number;
  discountAmountMxn: number;
  netMonthlyDueMxn: number;
  ruleApplied: "upgrade_locked_base" | "downgrade_current_plan" | "standard";
} {
  const currentPlan = getSaasPlanById(currentPlanTier);
  const currentPrice = currentPlan.priceMxn;

  if (currentPrice <= 0) {
    return {
      currentPlanPriceMxn: 0,
      referenceBasePriceMxn: 0,
      discountAmountMxn: 0,
      netMonthlyDueMxn: 0,
      ruleApplied: "downgrade_current_plan",
    };
  }

  let referenceBase = currentPrice;
  let ruleApplied: "upgrade_locked_base" | "downgrade_current_plan" | "standard" =
    "standard";

  if (currentPrice > reward.locked_plan_price_mxn && reward.locked_plan_price_mxn > 0) {
    // Upgrade: se respeta el valor del plan donde fue generada la recompensa (no se infla)
    referenceBase = reward.locked_plan_price_mxn;
    ruleApplied = "upgrade_locked_base";
  } else if (currentPrice < reward.locked_plan_price_mxn) {
    // Downgrade: sin reembolso, se ajusta al plan actual vigente
    referenceBase = currentPrice;
    ruleApplied = "downgrade_current_plan";
  }

  const rawDiscount = round2(referenceBase * (reward.discount_percent / 100));
  const discountAmountMxn = Math.min(currentPrice, Math.max(0, rawDiscount));
  const netMonthlyDueMxn = Math.max(0, round2(currentPrice - discountAmountMxn));

  return {
    currentPlanPriceMxn: currentPrice,
    referenceBasePriceMxn: referenceBase,
    discountAmountMxn,
    netMonthlyDueMxn,
    ruleApplied,
  };
}

export interface VerificationGraceStatus {
  state: "verified" | "pending_review" | "grace_active" | "expired_locked";
  daysRemaining: number;
  daysElapsed: number;
  deadlineIso: string;
}

/**
 * Regla de los 15 días naturales para verificación obligatoria de Coach (ID oficial + rostro).
 */
export function getCoachVerificationGraceStatus(
  profile: Pick<
    Profile,
    "is_verified_identity" | "verification_status" | "created_at" | "verification_deadline_at"
  >,
  now = new Date()
): VerificationGraceStatus {
  const created = new Date(profile.created_at || now.toISOString());
  const validCreated = Number.isNaN(created.getTime()) ? now : created;
  const deadline = profile.verification_deadline_at
    ? new Date(profile.verification_deadline_at)
    : new Date(
        validCreated.getTime() +
          REFERRAL_RULES.verificationGraceDays * 24 * 60 * 60 * 1000
      );

  const diffDaysRemaining = Math.ceil(
    (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  const daysRemaining = Math.max(0, diffDaysRemaining);
  const daysElapsed = Math.max(
    0,
    REFERRAL_RULES.verificationGraceDays - daysRemaining
  );

  if (profile.is_verified_identity || profile.verification_status === "verified") {
    return {
      state: "verified",
      daysRemaining: REFERRAL_RULES.verificationGraceDays,
      daysElapsed: 0,
      deadlineIso: deadline.toISOString(),
    };
  }

  if (profile.verification_status === "pending") {
    return {
      state: "pending_review",
      daysRemaining,
      daysElapsed,
      deadlineIso: deadline.toISOString(),
    };
  }

  if (diffDaysRemaining <= 0) {
    return {
      state: "expired_locked",
      daysRemaining: 0,
      daysElapsed: REFERRAL_RULES.verificationGraceDays,
      deadlineIso: deadline.toISOString(),
    };
  }

  return {
    state: "grace_active",
    daysRemaining,
    daysElapsed,
    deadlineIso: deadline.toISOString(),
  };
}
