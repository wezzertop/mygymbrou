import { createBrowserClient } from "@supabase/ssr";

function getPublicKey(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

const PLACEHOLDER_MARKERS = [
  "tu-proyecto",
  "your-project-ref",
  "placeholder",
  "tu-publishable-key",
  "your_publishable_key",
  "tu-anon-key",
  "your_anon_key",
];

function isPlaceholder(val?: string): boolean {
  if (!val) return true;
  const lower = val.toLowerCase();
  return PLACEHOLDER_MARKERS.some((marker) => lower.includes(marker));
}

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = getPublicKey();
  return Boolean(url && key && !isPlaceholder(url) && !isPlaceholder(key));
}

export function getAppUrl(): string {
  const configured = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    ""
  )
    .trim()
    .replace(/\/+$/, "");
  const isLocal = (u?: string) =>
    !u ||
    u.includes("localhost") ||
    u.includes("127.0.0.1") ||
    u.includes("0.0.0.0");

  if (typeof window !== "undefined" && window.location?.origin) {
    const browserOrigin = window.location.origin.replace(/\/+$/, "");
    if (!isLocal(browserOrigin)) {
      return browserOrigin;
    }
    if (configured && configured.startsWith("http") && !isLocal(configured)) {
      return configured;
    }
    return browserOrigin;
  }

  if (configured && configured.startsWith("http") && !isLocal(configured)) {
    return configured;
  }
  return "https://mygymbrou.nocodepy.com";
}

export function createClient() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const key = getPublicKey() || "placeholder-key";
  return createBrowserClient(url, key);
}
