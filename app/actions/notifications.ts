"use server";

/**
 * app/actions/notifications.ts
 *
 * Server actions for the resident notification system.
 *
 * Architecture:
 *  - generatePickupReminders()  — called by admin after generating pickups.
 *                                  Creates "reminder" notifications for each
 *                                  upcoming pickup, addressed to every resident
 *                                  linked to that pickup's address.
 *  - getMyNotifications()       — fetches the signed-in resident's notifications
 *                                  (ordered newest first, unread first within groups).
 *  - markNotificationRead()     — marks a single notification as read.
 *  - markAllNotificationsRead() — bulk-marks all unread notifications as read.
 *
 * Security:
 *  - generatePickupReminders()  uses createAdminSupabaseClient() (service-role)
 *    because the "notifications" INSERT policy grants only service_role.
 *    It also calls requireAdmin() so only admins can trigger it.
 *  - getMyNotifications() uses createServerSupabaseClient() (Clerk JWT).
 *    RLS policy "Users read own notifications" scopes results to the caller.
 *  - markNotificationRead() uses createServerSupabaseClient().
 *    RLS policy "Users update own notifications" scopes writes to the caller.
 */

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ResidentNotification {
  id: string;
  message: string;
  type: string;
  status: string;
  read_at: string | null;
  created_at: string;
  pickup_id: string | null;
  pickup?: {
    scheduled_date: string;
    waste_category: { name: string; color_code: string | null } | null;
  } | null;
}

export interface ActionResult {
  success: boolean;
  error?: string;
  count?: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function daysFromNow(isoDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(isoDate + "T00:00:00");
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

function buildReminderMessage(
  categoryName: string,
  scheduledDate: string
): string {
  const days = daysFromNow(scheduledDate);
  const dateStr = new Date(scheduledDate + "T00:00:00").toLocaleDateString(
    "en-US",
    { weekday: "long", month: "long", day: "numeric" }
  );

  if (days === 0) return `Your ${categoryName} collection is today!`;
  if (days === 1) return `Reminder: Your ${categoryName} collection is tomorrow.`;
  if (days <= 3) return `Upcoming: Your ${categoryName} collection is in ${days} days (${dateStr}).`;
  return `Scheduled: Your ${categoryName} collection is on ${dateStr}.`;
}

// ─── generatePickupReminders ──────────────────────────────────────────────────

/**
 * Creates reminder notifications for all upcoming pickups in a zone (or all zones).
 * Only generates notifications for pickups that don't already have one.
 * Admin-only — uses service-role client to bypass RLS on notifications.
 */
export async function generatePickupReminders(
  zoneId?: string
): Promise<ActionResult> {
  await requireAdmin();
  const db = createAdminSupabaseClient();

  const today = new Date().toISOString().slice(0, 10);
  const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  // Fetch upcoming pickups (optionally scoped to a zone via zone→addresses)
  let pickupQuery = db
    .from("pickups")
    .select(
      `
      id,
      scheduled_date,
      address_id,
      waste_category:waste_categories ( name ),
      address:addresses ( zone_id )
    `
    )
    .eq("status", "scheduled")
    .is("deleted_at", null)
    .gte("scheduled_date", today)
    .lte("scheduled_date", future);

  const { data: pickups, error: pickupErr } = await pickupQuery;
  if (pickupErr) return { success: false, error: pickupErr.message };
  if (!pickups || pickups.length === 0)
    return { success: true, count: 0 };

  // Filter by zone if requested
  const filtered = zoneId
    ? pickups.filter((p) => (p.address as any)?.zone_id === zoneId)
    : pickups;

  // Find existing notifications to avoid duplicates
  const pickupIds = filtered.map((p) => p.id);
  const { data: existing } = await db
    .from("notifications")
    .select("pickup_id")
    .in("pickup_id", pickupIds)
    .eq("type", "reminder");

  const alreadyNotified = new Set((existing ?? []).map((n) => n.pickup_id));

  // For each pickup without a notification, find linked residents and insert
  let totalCreated = 0;
  for (const pickup of filtered) {
    if (alreadyNotified.has(pickup.id)) continue;

    const catName = (pickup.waste_category as any)?.name ?? "Waste";
    const message = buildReminderMessage(catName, pickup.scheduled_date);

    // Find all residents linked to this address
    const { data: links } = await db
      .from("user_addresses")
      .select("user_id")
      .eq("address_id", pickup.address_id);

    if (!links || links.length === 0) continue;

    const rows = links.map((l) => ({
      user_id: l.user_id,
      pickup_id: pickup.id,
      type: "reminder" as const,
      status: "pending" as const,
      message,
    }));

    const { error: insertErr } = await db
      .from("notifications")
      .insert(rows);

    if (!insertErr) totalCreated += rows.length;
  }

  revalidatePath("/dashboard");
  revalidatePath("/admin");
  return { success: true, count: totalCreated };
}

// ─── getMyNotifications ───────────────────────────────────────────────────────

/**
 * Fetches the signed-in resident's notifications.
 * RLS ensures only their own rows are returned.
 * Returns up to 20, newest first (unread sorted before read).
 */
export async function getMyNotifications(): Promise<ResidentNotification[]> {
  const { userId } = await auth();
  if (!userId) return [];

  const supabase = await createServerSupabaseClient();

  // NOTE: read_at column was added in migration 20261003000000.
  // We cast the select result to `any` to handle both pre- and post-migration
  // schemas gracefully without breaking the build.
  const { data, error } = await (supabase
    .from("notifications")
    .select(
      `
      id,
      message,
      type,
      status,
      created_at,
      pickup_id,
      pickup:pickups (
        scheduled_date,
        waste_category:waste_categories ( name, color_code )
      )
    `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20) as any);

  if (error || !data) return [];

  // Sort: unread first, then by created_at desc
  const rows = (data as any[]).sort((a, b) => {
    const aUnread = !a.read_at ? 0 : 1;
    const bUnread = !b.read_at ? 0 : 1;
    if (aUnread !== bUnread) return aUnread - bUnread;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return rows.map((n: any) => ({
    id: n.id,
    message: n.message,
    type: n.type,
    status: n.status,
    read_at: n.read_at ?? null,
    created_at: n.created_at,
    pickup_id: n.pickup_id ?? null,
    pickup: n.pickup
      ? {
          scheduled_date: n.pickup.scheduled_date,
          waste_category: n.pickup.waste_category ?? null,
        }
      : null,
  }));
}

// ─── getUnreadCount ───────────────────────────────────────────────────────────

export async function getUnreadCount(): Promise<number> {
  const { userId } = await auth();
  if (!userId) return 0;

  const supabase = await createServerSupabaseClient();
  const { count } = await (supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at" as any, null) as any);

  return count ?? 0;
}

// ─── markNotificationRead ─────────────────────────────────────────────────────

export async function markNotificationRead(
  notificationId: string
): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Not authenticated" };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() } as any)
    .eq("id", notificationId)
    .eq("user_id", userId); // belt-and-suspenders on top of RLS

  if (error) return { success: false, error: error.message };
  revalidatePath("/dashboard");
  return { success: true };
}

// ─── markAllNotificationsRead ─────────────────────────────────────────────────

export async function markAllNotificationsRead(): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Not authenticated" };

  const supabase = await createServerSupabaseClient();
  const { error } = await (supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() } as any)
    .eq("user_id", userId)
    .is("read_at" as any, null) as any);

  if (error) return { success: false, error: error.message };
  revalidatePath("/dashboard");
  return { success: true };
}

// ─── Admin: get notification summary ─────────────────────────────────────────

export interface NotificationSummary {
  total: number;
  unread: number;
  pending: number;
  byType: { type: string; count: number }[];
}

export async function getAdminNotificationSummary(): Promise<NotificationSummary> {
  await requireAdmin();
  const db = createAdminSupabaseClient();

  const [totalRes, unreadRes, pendingRes, byTypeRes] = await Promise.all([
    db.from("notifications").select("*", { count: "exact", head: true }),
    (db.from("notifications").select("*", { count: "exact", head: true }).is("read_at" as any, null) as any),
    db.from("notifications").select("*", { count: "exact", head: true }).eq("status", "pending"),
    db.from("notifications").select("type"),
  ]);

  const typeCounts: Record<string, number> = {};
  for (const row of byTypeRes.data ?? []) {
    typeCounts[row.type] = (typeCounts[row.type] ?? 0) + 1;
  }

  return {
    total: totalRes.count ?? 0,
    unread: unreadRes.count ?? 0,
    pending: pendingRes.count ?? 0,
    byType: Object.entries(typeCounts).map(([type, count]) => ({ type, count })),
  };
}
