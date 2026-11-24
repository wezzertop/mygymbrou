import { createBrowserClient } from "@supabase/ssr";

function getPublicKey(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = getPublicKey();
  return Boolean(
    url &&
      key &&
      !url.includes("tu-proyecto") &&
      !key.includes("tu-publishable-key") &&
      !key.includes("tu-anon-key")
  );
}

export function createClient() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const key = getPublicKey() || "placeholder-key";
  return createBrowserClient(url, key);
}
