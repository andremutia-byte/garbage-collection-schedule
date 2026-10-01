import { auth } from "@clerk/nextjs/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../database.types";

function getSupabaseCredentials() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing Supabase environment variables: Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local"
    );
  }

  return { supabaseUrl, supabaseKey };
}

/**
 * Creates an authenticated Supabase client for Server Components,
 * Server Actions, and Route Handlers.
 * Injects Clerk's session token via the official Third-Party Auth accessToken option.
 */
export async function createServerSupabaseClient(): Promise<SupabaseClient<Database>> {
  const { supabaseUrl, supabaseKey } = getSupabaseCredentials();

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    async accessToken() {
      const { getToken } = await auth();
      // Current native Clerk ↔ Supabase Third-Party Auth integration
      // uses the raw Clerk session token directly without template
      return (await getToken()) ?? null;
    },
  });
}

/**
 * Creates an unauthenticated Supabase client for public queries on the server.
 */
export function createPublicServerSupabaseClient(): SupabaseClient<Database> {
  const { supabaseUrl, supabaseKey } = getSupabaseCredentials();

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
