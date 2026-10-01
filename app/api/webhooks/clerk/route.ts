/**
 * Clerk → Supabase user synchronization webhook.
 *
 * This route receives lifecycle events from Clerk (via Svix) and mirrors
 * identity data into the public.users table so that Supabase RLS policies
 * can function correctly.
 *
 * SECURITY REQUIREMENTS:
 * - Every incoming request MUST be verified with verifyWebhook() before
 *   any evt.data is trusted. Unverified requests are rejected with 400.
 * - Database operations use createAdminSupabaseClient() (service-role key),
 *   which bypasses RLS. This client MUST NOT be used in browser code.
 * - This route is declared public in proxy.ts so Clerk middleware does not
 *   block it. Svix calls this endpoint without a Clerk session token.
 * - CLERK_WEBHOOK_SIGNING_SECRET is per-endpoint and is read automatically
 *   by verifyWebhook(). It is distinct from CLERK_SECRET_KEY.
 */

import { verifyWebhook } from "@clerk/nextjs/webhooks";
import type { WebhookEvent } from "@clerk/nextjs/webhooks";
import { NextRequest } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

// ---------------------------------------------------------------------------
// Helper: resolve primary email from Clerk user event payload.
//
// Uses primary_email_address_id to find the correct entry in email_addresses.
// Do NOT assume index 0 is primary — Clerk does not guarantee ordering.
// Returns null if the id is absent, no matching entry exists, or the address
// string is empty; the caller returns 422 in that case.
// ---------------------------------------------------------------------------
function resolvePrimaryEmail(
  primaryEmailId: string | null | undefined,
  emailAddresses: Array<{ id: string; email_address: string }> | undefined | null
): string | null {
  if (!primaryEmailId || !Array.isArray(emailAddresses)) {
    return null;
  }
  const match = emailAddresses.find((e) => e.id === primaryEmailId);
  const address = match?.email_address;
  return typeof address === "string" && address.length > 0 ? address : null;
}

// ---------------------------------------------------------------------------
// POST handler — called by Clerk/Svix for every subscribed event
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  // ------------------------------------------------------------------
  // Step 1: Verify the webhook signature.
  // verifyWebhook() reads CLERK_WEBHOOK_SIGNING_SECRET from the
  // environment automatically and throws if the signature is invalid.
  // NEVER skip this step — spoofed events could corrupt public.users.
  // ------------------------------------------------------------------
  let evt: WebhookEvent;
  try {
    evt = await verifyWebhook(req);
  } catch (err) {
    console.error("[clerk-webhook] Signature verification failed:", err);
    return new Response("Webhook verification failed", { status: 400 });
  }

  // ------------------------------------------------------------------
  // Step 2: Route by event type.
  // Only handle the three user lifecycle events we subscribed to.
  // All other event types are acknowledged (200) without side-effects.
  // ------------------------------------------------------------------
  const { type: eventType } = evt;

  // --- user.created and user.updated -----------------------------------
  if (eventType === "user.created" || eventType === "user.updated") {
    const { id: clerkId, primary_email_address_id, email_addresses } = evt.data;

    // Resolve the primary email by matching primary_email_address_id against
    // the email_addresses array. This is the correct approach — Clerk does not
    // guarantee that email_addresses[0] is the primary address.
    // Returns 422 if no match can be found so the event is flagged in the
    // Clerk dashboard rather than inserting a malformed public.users row.
    const email = resolvePrimaryEmail(primary_email_address_id, email_addresses);

    if (!email) {
      console.error(
        `[clerk-webhook] ${eventType} for user ${clerkId} has no usable email address.`
      );
      return new Response(
        "No primary email address found in webhook payload",
        { status: 422 }
      );
    }

    // Call sync_clerk_user() via the service-role client.
    // This function handles both INSERT (new user) and UPDATE (email change)
    // via ON CONFLICT DO UPDATE — it is fully idempotent.
    // It also assigns the default 'resident' role if no roles exist yet.
    try {
      const adminClient = createAdminSupabaseClient();
      const { error } = await adminClient.rpc("sync_clerk_user", {
        p_clerk_id: clerkId,
        p_email: email,
      });

      if (error) {
        console.error(
          `[clerk-webhook] sync_clerk_user failed for ${clerkId}:`,
          error
        );
        // Return 500 so Svix retries — do not return 200 on DB failure.
        return new Response("Database sync failed", { status: 500 });
      }

      console.log(
        `[clerk-webhook] ${eventType}: synced user ${clerkId.substring(0, 12)}...`
      );
      return new Response("OK", { status: 200 });
    } catch (err) {
      console.error(
        `[clerk-webhook] Unexpected error during ${eventType}:`,
        err
      );
      return new Response("Internal server error", { status: 500 });
    }
  }

  // --- user.deleted ----------------------------------------------------
  if (eventType === "user.deleted") {
    const { id: clerkId } = evt.data;

    if (!clerkId) {
      console.error("[clerk-webhook] user.deleted event missing user id.");
      return new Response("Missing user id in payload", { status: 400 });
    }

    // Soft-delete: set deleted_at = NOW().
    // We never hard-delete because ON DELETE RESTRICT protects historical
    // pickups/notifications that reference this user_id.
    // The update is idempotent — repeated calls only refresh the timestamp.
    try {
      const adminClient = createAdminSupabaseClient();
      const { error } = await adminClient
        .from("users")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", clerkId);

      if (error) {
        console.error(
          `[clerk-webhook] Soft-delete failed for ${clerkId}:`,
          error
        );
        return new Response("Database soft-delete failed", { status: 500 });
      }

      console.log(
        `[clerk-webhook] user.deleted: soft-deleted user ${clerkId.substring(0, 12)}...`
      );
      return new Response("OK", { status: 200 });
    } catch (err) {
      console.error("[clerk-webhook] Unexpected error during user.deleted:", err);
      return new Response("Internal server error", { status: 500 });
    }
  }

  // --- All other event types -------------------------------------------
  // Acknowledge receipt without side-effects.
  // Svix expects a 2xx response to consider delivery successful.
  return new Response("Event type not handled", { status: 200 });
}
