"use client";

import { useSession } from "@clerk/nextjs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { useMemo } from "react";

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
 * Creates an unauthenticated Supabase client for public queries in browser components.
 */
export function createBrowserSupabaseClient(): SupabaseClient {
  const { supabaseUrl, supabaseKey } = getSupabaseCredentials();
  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Creates an authenticated Supabase client for browser components using a Clerk session.
 * Uses the current official Third-Party Auth accessToken pattern.
 */
export function createClerkSupabaseClient(
  session: ReturnType<typeof useSession>["session"]
): SupabaseClient {
  const { supabaseUrl, supabaseKey } = getSupabaseCredentials();

  return createClient(supabaseUrl, supabaseKey, {
    async accessToken() {
      return (await session?.getToken()) ?? null;
    },
  });
}

/**
 * React hook that returns an authenticated Supabase client in Client Components.
 * Automatically stays in sync with the active Clerk session.
 */
export function useClerkSupabaseClient(): SupabaseClient {
  const { session } = useSession();

  return useMemo(() => {
    return createClerkSupabaseClient(session);
  }, [session]);
}
