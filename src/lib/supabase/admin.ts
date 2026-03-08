import { createClient } from "@supabase/supabase-js";

/**
 * Direct Supabase client (no cookie-based session).
 * Uses the public anon key — all RLS policies are open (with check true).
 * Use this in API routes that handle their own auth logic (e.g., solo mode AI DM).
 */
export function createDirectClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars");
  return createClient(url, key);
}
