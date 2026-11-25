import Stripe from "stripe";
import { SaasPlanTier } from "@/lib/saas-plans";

let stripeInstance: Stripe | null = null;

export function isStripeConfigured(): boolean {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  return Boolean(key && key.startsWith("sk_") && !key.includes("your_"));
}

export function getStripeClient(): Stripe | null {
  if (!isStripeConfigured()) return null;
  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY!.trim(), {
      typescript: true,
    });
  }
  return stripeInstance;
}

export function getStripePriceIdForTier(
  tier: SaasPlanTier | string
): string | null {
  if (tier === "base") return process.env.NEXT_PUBLIC_STRIPE_PRICE_BASE?.trim() || null;
  if (tier === "pro") return process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO?.trim() || null;
  if (tier === "studio") return process.env.NEXT_PUBLIC_STRIPE_PRICE_STUDIO?.trim() || null;
  return null;
}

export function getTierFromStripePriceId(priceId?: string | null): SaasPlanTier | null {
  if (!priceId) return null;
  if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_BASE?.trim()) return "base";
  if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO?.trim()) return "pro";
  if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_STUDIO?.trim()) return "studio";
  return null;
}

export function getServerAppUrl(request?: Request): string {
  const envUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    ""
  )
    .trim()
    .replace(/\/+$/, "");

  const isLocal = (u?: string | null) =>
    !u ||
    u.includes("localhost") ||
    u.includes("127.0.0.1") ||
    u.includes("0.0.0.0");

  if (request) {
    const forwardedHost = request.headers
      .get("x-forwarded-host")
      ?.split(",")[0]
      ?.trim();
    const forwardedProto =
      request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || "https";
    if (forwardedHost && !isLocal(forwardedHost)) {
      return `${forwardedProto}://${forwardedHost}`;
    }
    const reqOrigin = new URL(request.url).origin;
    if (!isLocal(reqOrigin)) return reqOrigin;
  }

  if (envUrl && !isLocal(envUrl)) return envUrl;
  return "https://migymbrou.com";
}
