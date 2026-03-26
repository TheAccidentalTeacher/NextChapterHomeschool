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

/**
 * Admin Supabase client using the service role key.
 * Bypasses RLS entirely. Use ONLY in server-side API routes that
 * have already verified auth (e.g., teacher-only endpoints).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY env var");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
