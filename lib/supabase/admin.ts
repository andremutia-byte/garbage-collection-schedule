import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../database.types";

/**
 * Creates an administrative Supabase client using the secret key.
 *
 * SECURITY WARNING:
 * - This client bypasses Row Level Security (RLS).
 * - MUST ONLY be used on the server (e.g. webhooks, internal background jobs).
 * - NEVER import or execute in client components.
 * - NEVER prefix SUPABASE_SECRET_KEY with NEXT_PUBLIC_.
 */
export function createAdminSupabaseClient(): SupabaseClient<Database> {
  if (typeof window !== "undefined") {
    throw new Error(
      "CRITICAL SECURITY ERROR: createAdminSupabaseClient cannot be run on the client side!"
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !secretKey) {
    throw new Error(
      "Missing Supabase admin credentials: SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY) and NEXT_PUBLIC_SUPABASE_URL must be defined."
    );
  }

  return createClient(supabaseUrl, secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
