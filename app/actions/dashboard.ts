"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
export interface ActionResult {
  success: boolean;
  error?: string;
}

export interface AddressWithZone {
  id: string;
  street: string;
  unit: string | null;
  city: string;
  postal_code: string;
  is_primary: boolean;
  zone: { id: string; name: string; description: string | null } | null;
}

export interface UpcomingPickup {
  id: string;
  scheduled_date: string;
  status: string;
  address: { street: string; unit?: string | null; city: string };
  waste_category: { name: string; color_code: string | null };
}

export interface DashboardData {
  addresses: AddressWithZone[];
  upcomingPickups: UpcomingPickup[];
  allPickups: UpcomingPickup[];
  notificationPref: string;
  userId: string;
}

// ─────────────────────────────────────────────
// Fetch dashboard data (addresses + pickups)
// ─────────────────────────────────────────────
export async function getDashboardData(): Promise<DashboardData | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const supabase = await createServerSupabaseClient();

  // Fetch user's addresses with their zones
  const { data: userAddresses } = await supabase
    .from("user_addresses")
    .select(
      `
      is_primary,
      address:addresses!inner (
        id,
        street,
        unit,
        city,
        postal_code,
        deleted_at,
        zone:zones (
          id,
          name,
          description
        )
      )
    `
    )
    .eq("user_id", userId);

  const addresses: AddressWithZone[] = (userAddresses ?? [])
    .filter((ua) => !(ua.address as any)?.deleted_at) // exclude soft-deleted
    .map((ua) => {
      const addr = ua.address as any;
      return {
        id: addr?.id ?? "",
        street: addr?.street ?? "",
        unit: addr?.unit ?? null,
        city: addr?.city ?? "",
        postal_code: addr?.postal_code ?? "",
        is_primary: ua.is_primary,
        zone: addr?.zone ?? null,
      };
    });

  // Fetch upcoming pickups for user's addresses (next 30 days)
  const addressIds = addresses.map((a) => a.id);
  const today = new Date().toISOString().slice(0, 10);
  const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  let upcomingPickups: UpcomingPickup[] = [];
  let allPickups: UpcomingPickup[] = [];
  if (addressIds.length > 0) {
    const { data: pickups } = await supabase
      .from("pickups")
      .select(
        `
        id,
        scheduled_date,
        status,
        address:addresses ( street, unit, city ),
        waste_category:waste_categories ( name, color_code )
      `
      )
      .in("address_id", addressIds)
      .is("deleted_at", null)
      .order("scheduled_date", { ascending: false })
      .limit(100);

    allPickups = (pickups ?? []).map((p) => ({
      id: p.id,
      scheduled_date: p.scheduled_date,
      status: p.status,
      address: (p.address as any) ?? { street: "", unit: null, city: "" },
      waste_category: (p.waste_category as any) ?? { name: "", color_code: null },
    }));

    // upcomingPickups is just allPickups filtered for future dates and 'scheduled' status,
    // but the original code sorted ascending. Let's just re-sort the filtered upcoming ones.
    upcomingPickups = allPickups
      .filter((p) => p.scheduled_date >= today && p.scheduled_date <= future && p.status === "scheduled")
      .sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date))
      .slice(0, 20);
  }

  // Fetch notification preference
  const { data: profile } = await supabase
    .from("resident_profiles")
    .select("notification_preference")
    .eq("user_id", userId)
    .maybeSingle();

  return {
    addresses,
    upcomingPickups,
    allPickups,
    notificationPref: profile?.notification_preference ?? "email",
    userId,
  };
}

// ─────────────────────────────────────────────
// Add address action
// ─────────────────────────────────────────────
export async function addAddress(formData: FormData): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Not authenticated" };

  const street = (formData.get("street") as string)?.trim();
  const unit = (formData.get("unit") as string)?.trim() || null;
  const city = (formData.get("city") as string)?.trim();
  const postalCode = (formData.get("postal_code") as string)?.trim();
  const zoneId = (formData.get("zone_id") as string)?.trim() || null;

  if (!street || !city || !postalCode) {
    return { success: false, error: "Street, city and postal code are required." };
  }

  // Use admin client to bypass RLS for INSERT operations
  const admin = createAdminSupabaseClient();

  // Upsert address (unique on street+city+postal_code)
  const { data: address, error: addrError } = await admin
    .from("addresses")
    .upsert(
      { street, unit, city, postal_code: postalCode, zone_id: zoneId },
      { onConflict: "street,city,postal_code", ignoreDuplicates: false }
    )
    .select("id")
    .single();

  if (addrError || !address) {
    return { success: false, error: addrError?.message ?? "Failed to save address." };
  }

  // Check if user already has addresses (to set is_primary correctly)
  const { count } = await admin
    .from("user_addresses")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  const isPrimary = (count ?? 0) === 0;

  // Link address to user
  const { error: linkError } = await admin.from("user_addresses").upsert(
    { user_id: userId, address_id: address.id, is_primary: isPrimary },
    { onConflict: "user_id,address_id" }
  );

  if (linkError) {
    return { success: false, error: linkError.message };
  }

  // Ensure resident_profile exists
  await admin
    .from("resident_profiles")
    .upsert({ user_id: userId }, { onConflict: "user_id", ignoreDuplicates: true });

  revalidatePath("/dashboard");
  return { success: true };
}

// ─────────────────────────────────────────────
// Remove address action
// ─────────────────────────────────────────────
export async function removeAddress(addressId: string): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Not authenticated" };

  const admin = createAdminSupabaseClient();

  const { error } = await admin
    .from("user_addresses")
    .delete()
    .eq("user_id", userId)
    .eq("address_id", addressId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard");
  return { success: true };
}

// ─────────────────────────────────────────────
// Update notification preference
// ─────────────────────────────────────────────
export async function updateNotificationPref(
  pref: "email" | "sms" | "push" | "none"
): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Not authenticated" };

  const admin = createAdminSupabaseClient();
  const { error } = await admin
    .from("resident_profiles")
    .upsert(
      { user_id: userId, notification_preference: pref },
      { onConflict: "user_id" }
    );

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard");
  return { success: true };
}

// ─────────────────────────────────────────────
// Fetch all zones (for address form dropdown)
// ─────────────────────────────────────────────
export async function getZones() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("zones")
    .select("id, name, description")
    .is("deleted_at", null)
    .order("name");
  return data ?? [];
}
