import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for use in browser / client components.
 * Uses the public anon key — never the service role key.
 */
export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Supabase public env vars are not configured.");
  }

  return createBrowserClient(url, anonKey);
}
