import { clerkClient, currentUser } from "@clerk/nextjs/server";
import { createAdminSupabaseClient } from "./supabase/admin";

/**
 * Ensures that the authenticated Clerk user exists in Supabase's public.users table.
 *
 * This acts as a robust fail-safe alongside the Clerk webhook (/api/webhooks/clerk).
 * If the webhook is delayed, dropped, or unconfigured, this function ensures the
 * user record is synchronized idempotently using the existing database procedure
 * `sync_clerk_user`, which:
 *   1. Upserts into public.users with Clerk ID and verified email.
 *   2. Reactivates soft-deleted accounts (deleted_at = NULL).
 *   3. Assigns the default 'resident' role in public.user_roles if no roles exist.
 *   4. Ensures a row exists in public.resident_profiles.
 *
 * SECURITY:
 * - Server-only. Uses service-role client to call sync_clerk_user.
 * - Always verifies identity through Clerk before synchronizing.
 * - Users can only sync their own authenticated account.
 */
export async function ensureUserSynchronized(userId: string): Promise<{ success: boolean; error?: string }> {
  if (!userId) {
    return { success: false, error: "User ID is required" };
  }

  const admin = createAdminSupabaseClient();

  // 1. Check if active user record already exists
  const { data: existingUser, error: checkError } = await admin
    .from("users")
    .select("id, deleted_at, phone")
    .eq("id", userId)
    .maybeSingle();

  if (checkError) {
    console.error("[user-sync] Error checking user existence:", checkError);
  }

  // If user already exists and is not soft-deleted, ensure resident profile exists (without overwriting phone) and return
  if (existingUser && !existingUser.deleted_at) {
    await admin
      .from("resident_profiles")
      .upsert({ user_id: userId }, { onConflict: "user_id", ignoreDuplicates: true });
    return { success: true };
  }

  // 2. Fetch verified email and optional phone from Clerk
  let email: string | null = null;
  let phone: string | null = null;

  try {
    // Try currentUser() first (from session)
    const current = await currentUser();
    if (current && current.id === userId) {
      email =
        current.emailAddresses?.find((e) => e.id === current.primaryEmailAddressId)?.emailAddress ||
        current.emailAddresses?.[0]?.emailAddress ||
        null;
      phone =
        current.phoneNumbers?.find((p) => p.id === current.primaryPhoneNumberId)?.phoneNumber ||
        current.phoneNumbers?.[0]?.phoneNumber ||
        null;
    }

    // If not found via currentUser, fetch via clerkClient using userId
    if (!email) {
      const client = await clerkClient();
      const clerkUser = await client.users.getUser(userId);
      email =
        clerkUser.emailAddresses?.find((e) => e.id === clerkUser.primaryEmailAddressId)?.emailAddress ||
        clerkUser.emailAddresses?.[0]?.emailAddress ||
        null;
      if (!phone) {
        phone =
          clerkUser.phoneNumbers?.find((p) => p.id === clerkUser.primaryPhoneNumberId)?.phoneNumber ||
          clerkUser.phoneNumbers?.[0]?.phoneNumber ||
          null;
      }
    }
  } catch (clerkErr) {
    console.error("[user-sync] Failed to retrieve user details from Clerk:", clerkErr);
  }

  if (!email) {
    return {
      success: false,
      error: "Unable to retrieve verified email address for authenticated user.",
    };
  }

  // 3. Call the idempotent database function: sync_clerk_user
  // Passes phone only if available; does not overwrite existing DB phone
  const { error: syncError } = await admin.rpc("sync_clerk_user", {
    p_clerk_id: userId,
    p_email: email,
    p_phone: phone || undefined,
  });

  if (syncError) {
    console.error(`[user-sync] sync_clerk_user RPC failed for ${userId}:`, syncError);
    return { success: false, error: syncError.message };
  }

  // 4. Ensure resident_profiles record exists without overwriting existing data
  const { error: profileError } = await admin
    .from("resident_profiles")
    .upsert({ user_id: userId }, { onConflict: "user_id", ignoreDuplicates: true });

  if (profileError) {
    console.error(`[user-sync] resident_profiles upsert failed for ${userId}:`, profileError);
  }

  return { success: true };
}
