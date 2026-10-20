"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { ensureUserSynchronized } from "@/lib/user-sync";
import { validatePhilippinePhone } from "@/lib/phone";

import type { BarangayItem, ScheduleItem } from "@/app/actions/barangays";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
export interface ActionResult {
  success: boolean;
  error?: string;
}

export interface AddressItem {
  id: string;
  street: string;
  unit: string | null;
  city: string;
  postal_code: string;
  is_primary: boolean;
  barangay_id: string | null;
  barangay_name: string | null;
}

export type AddressWithZone = AddressItem;

export interface UpcomingPickup {
  id: string;
  scheduled_date: string;
  status: string;
  notes?: string | null;
  address: {
    id?: string;
    street: string;
    unit?: string | null;
    city: string;
    postal_code?: string;
    barangay_name?: string | null;
  };
  waste_category: {
    id?: string;
    name: string;
    color_code: string | null;
    instructions?: string | null;
  };
  collection_time?: string;
}

export interface DashboardData {
  addresses: AddressItem[];
  upcomingPickups: UpcomingPickup[];
  allPickups: UpcomingPickup[];
  barangaySchedules: ScheduleItem[];
  availableBarangays: BarangayItem[];
  notificationPref: string;
  phone: string | null;
  userId: string;
  error?: string | null;
}

// ─────────────────────────────────────────────
// Helper: Auto-generate pickups for an address from active schedules
// ─────────────────────────────────────────────
async function autoGeneratePickupsForAddress(
  addressId: string,
  barangayId: string | null,
  weeksAhead: number = 4
) {
  try {
    const admin = createAdminSupabaseClient();
    let schedQuery = admin
      .from("schedules")
      .select("id, waste_category_id, frequency, day_of_week, start_date, end_date, barangay_id, is_active")
      .is("deleted_at", null)
      .eq("is_active", true);

    if (barangayId) {
      schedQuery = schedQuery.eq("barangay_id", barangayId);
    } else {
      schedQuery = schedQuery.is("barangay_id", null);
    }

    const { data: activeScheds } = await schedQuery;
    if (!activeScheds || activeScheds.length === 0) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + weeksAhead * 7);

    const rows: Array<{
      address_id: string;
      waste_category_id: string;
      scheduled_date: string;
      status: "scheduled";
    }> = [];

    for (const sched of activeScheds) {
      if (sched.day_of_week === null) continue;
      const schedEnd = sched.end_date ? new Date(sched.end_date) : null;
      const schedStart = new Date(sched.start_date);

      const cursor = new Date(Math.max(today.getTime(), schedStart.getTime()));
      const targetDay = sched.day_of_week as number;
      while (cursor.getDay() !== targetDay) {
        cursor.setDate(cursor.getDate() + 1);
      }

      const intervalDays = sched.frequency === "biweekly" ? 14 : sched.frequency === "monthly" ? 28 : 7;
      while (cursor <= endDate) {
        if (schedEnd && cursor > schedEnd) break;
        const y = cursor.getFullYear();
        const m = String(cursor.getMonth() + 1).padStart(2, "0");
        const d = String(cursor.getDate()).padStart(2, "0");
        const dateStr = `${y}-${m}-${d}`;

        rows.push({
          address_id: addressId,
          waste_category_id: sched.waste_category_id,
          scheduled_date: dateStr,
          status: "scheduled",
        });
        cursor.setDate(cursor.getDate() + intervalDays);
      }
    }

    if (rows.length > 0) {
      await admin
        .from("pickups")
        .upsert(rows, { onConflict: "address_id,scheduled_date,waste_category_id", ignoreDuplicates: true });
    }
  } catch (err) {
    console.error("autoGeneratePickupsForAddress non-fatal error:", err);
  }
}

// ─────────────────────────────────────────────
// Fetch dashboard data (addresses + pickups + schedules)
// ─────────────────────────────────────────────
export async function getDashboardData(): Promise<DashboardData | null> {
  const { userId } = await auth();
  if (!userId) return null;

  try {
    // Ensure authenticated user is synced to public.users
    await ensureUserSynchronized(userId);

    const supabase = await createServerSupabaseClient();

    // 1. Fetch user's addresses with barangay join
    const { data: userAddresses, error: addrError } = await supabase
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
          barangay_id,
          deleted_at,
          barangays ( id, name )
        )
      `
      )
      .eq("user_id", userId);

    if (addrError) {
      console.error("Error fetching user addresses:", addrError);
    }

    const addresses: AddressItem[] = (userAddresses ?? [])
      .filter((ua) => !(ua.address as any)?.deleted_at) // exclude soft-deleted
      .map((ua) => {
        const addr = ua.address as any;
        const bar = addr?.barangays as { id?: string; name?: string } | null;
        return {
          id: addr?.id ?? "",
          street: addr?.street ?? "",
          unit: addr?.unit ?? null,
          city: addr?.city ?? "",
          postal_code: addr?.postal_code ?? "",
          is_primary: ua.is_primary,
          barangay_id: addr?.barangay_id ?? null,
          barangay_name: bar?.name ?? null,
        };
      });

    // 2. Fetch all available Butuan City barangays for address forms
    const { data: allBarangays } = await supabase
      .from("barangays")
      .select("id, name")
      .order("name", { ascending: true });

    const availableBarangays: BarangayItem[] = allBarangays ?? [];

    // 3. Fetch active schedules that apply to the resident's registered barangay(s) or city-wide
    const residentBarangayIds = Array.from(
      new Set(addresses.map((a) => a.barangay_id).filter((id): id is string => Boolean(id)))
    );

    let schedQuery = supabase
      .from("schedules")
      .select(`
        id,
        frequency,
        day_of_week,
        start_date,
        end_date,
        barangay_id,
        collection_time,
        is_active,
        waste_categories ( id, name, color_code, instructions ),
        barangays ( id, name )
      `)
      .is("deleted_at", null)
      .eq("is_active", true);

    if (residentBarangayIds.length > 0) {
      const orFilters = residentBarangayIds.map((bId) => `barangay_id.eq.${bId}`).join(",");
      schedQuery = schedQuery.or(orFilters);
    } else {
      schedQuery = schedQuery.is("barangay_id", null);
    }

    const { data: rawSchedules, error: schedError } = await schedQuery.order("day_of_week", {
      ascending: true,
      nullsFirst: false,
    });

    if (schedError) {
      console.error("Error fetching resident barangay schedules:", schedError);
    }

    const barangaySchedules: ScheduleItem[] = (rawSchedules ?? []).map((s) => {
      const cat = s.waste_categories as any;
      const bar = s.barangays as any;
      return {
        id: s.id,
        frequency: s.frequency,
        day_of_week: s.day_of_week,
        start_date: s.start_date,
        end_date: s.end_date,
        barangay_id: s.barangay_id,
        barangay_name: bar?.name ?? "All Barangays",
        collection_time: s.collection_time || "06:00 AM – 09:00 AM",
        is_active: s.is_active ?? true,
        category: {
          id: cat?.id ?? "",
          name: cat?.name ?? "General Waste",
          color_code: cat?.color_code ?? null,
          instructions: cat?.instructions ?? null,
        },
      };
    });

    // 4. Fetch upcoming and historical pickups for user's addresses
    const addressIds = addresses.map((a) => a.id);
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const future = `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, "0")}-${String(futureDate.getDate()).padStart(2, "0")}`;

    let upcomingPickups: UpcomingPickup[] = [];
    let allPickups: UpcomingPickup[] = [];
    if (addressIds.length > 0) {
      // Auto-generate upcoming pickups for user addresses from active schedules to ensure all categories exist
      await Promise.all(
        addresses.map((a) => autoGeneratePickupsForAddress(a.id, a.barangay_id, 4))
      );

      const { data: pickups, error: pickupsError } = await supabase
        .from("pickups")
        .select(
          `
          id,
          scheduled_date,
          status,
          notes,
          address:addresses ( id, street, unit, city, postal_code, barangay_id, barangays ( id, name ) ),
          waste_category:waste_categories ( id, name, color_code, instructions )
        `
        )
        .in("address_id", addressIds)
        .is("deleted_at", null)
        .order("scheduled_date", { ascending: false })
        .limit(100);

      if (pickupsError) {
        console.error("Error fetching pickups:", pickupsError);
      }

      allPickups = (pickups ?? []).map((p) => {
        const addr = p.address as any;
        const bar = addr?.barangays as any;
        const cat = p.waste_category as any;

        // Find configured collection_time from schedules
        const matchingSched = barangaySchedules.find(
          (s) => s.category.id === cat?.id
        );
        const collection_time = matchingSched?.collection_time || "06:00 AM – 09:00 AM";

        return {
          id: p.id,
          scheduled_date: p.scheduled_date,
          status: p.status,
          notes: p.notes,
          collection_time,
          address: {
            id: addr?.id,
            street: addr?.street ?? "",
            unit: addr?.unit ?? null,
            city: addr?.city ?? "",
            postal_code: addr?.postal_code ?? "",
            barangay_name: bar?.name ?? null,
          },
          waste_category: {
            id: cat?.id ?? "",
            name: cat?.name ?? "General Waste",
            color_code: cat?.color_code ?? null,
            instructions: cat?.instructions ?? null,
          },
        };
      });

      upcomingPickups = allPickups
        .filter((p) => p.scheduled_date >= today && p.scheduled_date <= future && p.status === "scheduled")
        .sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date));
    }

    // 5. Fetch notification preference and contact number
    const [profileRes, userRes] = await Promise.all([
      supabase
        .from("resident_profiles")
        .select("notification_preference, phone")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("users")
        .select("phone")
        .eq("id", userId)
        .maybeSingle(),
    ]);

    const phone = profileRes.data?.phone || userRes.data?.phone || null;

    return {
      addresses,
      upcomingPickups,
      allPickups,
      barangaySchedules,
      availableBarangays,
      notificationPref: profileRes.data?.notification_preference ?? "email",
      phone,
      userId,
    };
  } catch (err: unknown) {
    console.error("getDashboardData fatal error:", err);
    return {
      addresses: [],
      upcomingPickups: [],
      allPickups: [],
      barangaySchedules: [],
      availableBarangays: [],
      notificationPref: "email",
      phone: null,
      userId,
      error: "Unable to reach database for latest collection schedules. Please refresh in a moment.",
    };
  }
}

// ─────────────────────────────────────────────
// Add address action
// ─────────────────────────────────────────────
export async function addAddress(formData: FormData): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Not authenticated" };

  const street = (formData.get("street") as string)?.trim();
  const unit = (formData.get("unit") as string)?.trim() || null;
  const city = (formData.get("city") as string)?.trim() || "Butuan City";
  const postalCode = (formData.get("postal_code") as string)?.trim() || "8600";
  const barangayId = (formData.get("barangay_id") as string)?.trim() || null;

  if (!street || !city || !postalCode) {
    return { success: false, error: "Street, city and postal code are required." };
  }

  // Ensure authenticated Clerk user exists in public.users before linking addresses
  const syncResult = await ensureUserSynchronized(userId);
  if (!syncResult.success) {
    return { success: false, error: syncResult.error ?? "Failed to synchronize user account." };
  }

  // Use admin client to bypass RLS for INSERT operations
  const admin = createAdminSupabaseClient();

  // Find existing address matching (street, unit, city, postal_code)
  let addrQuery = admin
    .from("addresses")
    .select("id, deleted_at, barangay_id")
    .eq("street", street)
    .eq("city", city)
    .eq("postal_code", postalCode);

  if (unit) {
    addrQuery = addrQuery.eq("unit", unit);
  } else {
    addrQuery = addrQuery.is("unit", null);
  }

  const { data: existingAddress, error: queryError } = await addrQuery.maybeSingle();
  if (queryError) {
    return { success: false, error: queryError.message };
  }

  let addressId: string;

  if (existingAddress) {
    addressId = existingAddress.id;

    // Reactivate soft-deleted address or update barangay_id if changed
    const updatePayload: {
      updated_at: string;
      deleted_at?: string | null;
      barangay_id?: string | null;
    } = {
      updated_at: new Date().toISOString(),
    };
    if (existingAddress.deleted_at) {
      updatePayload.deleted_at = null;
    }
    if (barangayId && existingAddress.barangay_id !== barangayId) {
      updatePayload.barangay_id = barangayId;
    }

    await admin
      .from("addresses")
      .update(updatePayload)
      .eq("id", addressId);
  } else {
    // Safe insert new address
    const { data: newAddress, error: insertError } = await admin
      .from("addresses")
      .insert({
        street,
        unit,
        city,
        postal_code: postalCode,
        barangay_id: barangayId,
      })
      .select("id")
      .single();

    if (insertError) {
      // In case of concurrent race condition (code 23505), fetch the existing record
      if (insertError.code === "23505") {
        let retryQuery = admin
          .from("addresses")
          .select("id")
          .eq("street", street)
          .eq("city", city)
          .eq("postal_code", postalCode);

        if (unit) {
          retryQuery = retryQuery.eq("unit", unit);
        } else {
          retryQuery = retryQuery.is("unit", null);
        }

        const { data: retryAddr, error: retryError } = await retryQuery.maybeSingle();
        if (retryError || !retryAddr) {
          return { success: false, error: retryError?.message ?? "Failed to save address." };
        }
        addressId = retryAddr.id;
      } else {
        return { success: false, error: insertError.message };
      }
    } else {
      addressId = newAddress.id;
    }
  }

  // Check if user already has this address linked (duplicate submission check)
  const { data: existingLink } = await admin
    .from("user_addresses")
    .select("is_primary")
    .eq("user_id", userId)
    .eq("address_id", addressId)
    .maybeSingle();

  if (!existingLink) {
    // Check if user already has addresses (to set is_primary correctly)
    const { count } = await admin
      .from("user_addresses")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    const isPrimary = (count ?? 0) === 0;

    // Link address to user
    const { error: linkError } = await admin.from("user_addresses").insert({
      user_id: userId,
      address_id: addressId,
      is_primary: isPrimary,
    });

    if (linkError) {
      return { success: false, error: linkError.message };
    }
  }

  // Ensure resident_profile exists
  await admin
    .from("resident_profiles")
    .upsert({ user_id: userId }, { onConflict: "user_id", ignoreDuplicates: true });

  // Auto-generate upcoming pickups for this address based on its barangay schedules
  await autoGeneratePickupsForAddress(addressId, barangayId, 4);

  revalidatePath("/dashboard");
  revalidatePath("/admin/addresses");
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

  await ensureUserSynchronized(userId);

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
// Update resident contact number
// ─────────────────────────────────────────────
export async function updateResidentPhone(phone: string): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Not authenticated" };

  const trimmed = phone?.trim();
  if (!trimmed) {
    return {
      success: false,
      error: "Please enter a contact number in Philippine format (e.g., 09XXXXXXXXX or +639XXXXXXXXX).",
    };
  }

  const validation = validatePhilippinePhone(trimmed);
  if (!validation.valid || !validation.normalized) {
    return {
      success: false,
      error: validation.error || "Invalid Philippine mobile number format.",
    };
  }

  await ensureUserSynchronized(userId);

  const admin = createAdminSupabaseClient();
  const now = new Date().toISOString();

  // Update in public.users
  const { error: userError } = await admin
    .from("users")
    .update({ phone: validation.normalized, updated_at: now })
    .eq("id", userId);

  if (userError) {
    return { success: false, error: userError.message };
  }

  // Keep public.resident_profiles in sync
  const { error: profileError } = await admin
    .from("resident_profiles")
    .upsert(
      { user_id: userId, phone: validation.normalized, updated_at: now },
      { onConflict: "user_id" }
    );

  if (profileError) {
    return { success: false, error: profileError.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/admin/residents");
  return { success: true };
}
