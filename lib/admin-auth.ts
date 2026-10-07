/**
 * Server-only admin authentication helpers.
 * Uses the service-role client to bypass RLS so the check cannot be
 * circumvented by a malicious Clerk JWT with a fabricated role claim.
 */
import { auth } from "@clerk/nextjs/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export interface AdminAuthResult {
  userId: string | null;
  isAdmin: boolean;
}

/**
 * Returns the current userId and whether they hold the 'admin' role
 * in public.user_roles.  Must be called from a Server Component, Server
 * Action, or Route Handler — never from a Client Component.
 */
export async function getAdminAuth(): Promise<AdminAuthResult> {
  const { userId } = await auth();
  if (!userId) return { userId: null, isAdmin: false };

  const admin = createAdminSupabaseClient();
  const { data } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .in("role", ["admin"])
    .maybeSingle();

  return { userId, isAdmin: !!data };
}

/**
 * Asserts admin role. Throws a Response-like error object so callers
 * can return it directly from a Server Action or Route Handler.
 * For pages, redirect() should be called instead.
 */
export async function requireAdmin(): Promise<string> {
  const { userId, isAdmin } = await getAdminAuth();
  if (!userId || !isAdmin) {
    throw new Error("UNAUTHORIZED");
  }
  return userId;
}
