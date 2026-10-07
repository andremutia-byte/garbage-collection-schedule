"use server";

import { revalidatePath } from "next/cache";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";

// ─────────────────────────────────────────────
// Shared result type
// ─────────────────────────────────────────────
export interface ActionResult<T = undefined> {
  success: boolean;
  error?: string;
  data?: T;
}

// ─────────────────────────────────────────────
// Dashboard stats
// ─────────────────────────────────────────────
export interface StatusSummary {
  status: "scheduled" | "completed" | "missed" | "skipped";
  label: string;
  count: number;
  percentage: number;
  color: string;
}

export interface CategorySummary {
  id: string;
  name: string;
  color_code: string | null;
  count: number;
  percentage: number;
}

export interface CollectionActivityItem {
  id: string;
  scheduled_date: string;
  status: "scheduled" | "completed" | "missed" | "skipped";
  notes: string | null;
  completion_time: string | null;
  waste_category: {
    id: string;
    name: string;
    color_code: string | null;
  };
  address: {
    id: string;
    street: string;
    unit: string | null;
    city: string;
    postal_code: string;
  };
  zone_name: string | null;
  resident_email: string | null;
}

export interface AdminStats {
  totalResidents: number;
  totalAddresses: number;
  totalZones: number;
  upcomingPickups: number;
  completedPickups: number;
  missedPickups: number;
  skippedPickups: number;
  missedSkippedPickups: number;
  totalPickups: number;
  byStatus: StatusSummary[];
  byCategory: CategorySummary[];
  recentPickups: CollectionActivityItem[];
}

export async function getAdminStats(): Promise<AdminStats> {
  await requireAdmin();
  const db = createAdminSupabaseClient();
  const today = new Date().toISOString().slice(0, 10);

  const [residents, addresses, zones, categories, pickups, activity] = await Promise.all([
    db.from("users").select("*", { count: "exact", head: true }).is("deleted_at", null),
    db.from("addresses").select("*", { count: "exact", head: true }).is("deleted_at", null),
    db.from("zones").select("*", { count: "exact", head: true }).is("deleted_at", null),
    db.from("waste_categories").select("id, name, color_code").order("name"),
    db.from("pickups").select("id, status, scheduled_date, waste_category_id").is("deleted_at", null),
    db.from("pickups").select(`
      id,
      scheduled_date,
      status,
      notes,
      completion_time,
      addresses (
        id, street, unit, city, postal_code,
        zones ( id, name ),
        user_addresses (
          user_id,
          users ( id, email )
        )
      ),
      waste_categories ( id, name, color_code )
    `).is("deleted_at", null).order("scheduled_date", { ascending: false }).limit(25),
  ]);

  const allPickups = pickups.data ?? [];
  const totalPickups = allPickups.length;

  const upcomingCount = allPickups.filter(
    (p) => p.status === "scheduled" && p.scheduled_date >= today
  ).length;
  const completedCount = allPickups.filter((p) => p.status === "completed").length;
  const missedCount = allPickups.filter((p) => p.status === "missed").length;
  const skippedCount = allPickups.filter((p) => p.status === "skipped").length;
  const missedSkippedCount = missedCount + skippedCount;

  // Breakdown by Status
  const statusMeta: Array<{
    status: "scheduled" | "completed" | "missed" | "skipped";
    label: string;
    color: string;
  }> = [
    { status: "scheduled", label: "Scheduled / Upcoming", color: "amber" },
    { status: "completed", label: "Completed", color: "emerald" },
    { status: "missed", label: "Missed", color: "rose" },
    { status: "skipped", label: "Skipped", color: "slate" },
  ];

  const byStatus: StatusSummary[] = statusMeta.map((sm) => {
    const count = allPickups.filter((p) => p.status === sm.status).length;
    return {
      status: sm.status,
      label: sm.label,
      count,
      percentage: totalPickups > 0 ? Math.round((count / totalPickups) * 100) : 0,
      color: sm.color,
    };
  });

  // Breakdown by Category
  const byCategory: CategorySummary[] = (categories.data ?? []).map((cat) => {
    const count = allPickups.filter((p) => p.waste_category_id === cat.id).length;
    return {
      id: cat.id,
      name: cat.name,
      color_code: cat.color_code,
      count,
      percentage: totalPickups > 0 ? Math.round((count / totalPickups) * 100) : 0,
    };
  });

  // Recent activity list
  const recentPickups: CollectionActivityItem[] = (activity.data ?? []).map((p) => {
    const addr = p.addresses as any;
    const userAddrs = addr?.user_addresses ?? [];
    const emails: string[] = userAddrs
      .map((ua: any) => ua?.users?.email)
      .filter((e: any): e is string => Boolean(e));
    const residentEmail = emails.length > 0 ? emails.join(", ") : null;

    return {
      id: p.id,
      scheduled_date: p.scheduled_date,
      status: p.status,
      notes: p.notes,
      completion_time: p.completion_time,
      waste_category: {
        id: (p.waste_categories as any)?.id ?? "",
        name: (p.waste_categories as any)?.name ?? "General Waste",
        color_code: (p.waste_categories as any)?.color_code ?? null,
      },
      address: {
        id: addr?.id ?? "",
        street: addr?.street ?? "",
        unit: addr?.unit ?? null,
        city: addr?.city ?? "",
        postal_code: addr?.postal_code ?? "",
      },
      zone_name: addr?.zones?.name ?? null,
      resident_email: residentEmail,
    };
  });

  return {
    totalResidents: residents.count ?? 0,
    totalAddresses: addresses.count ?? 0,
    totalZones: zones.count ?? 0,
    upcomingPickups: upcomingCount,
    completedPickups: completedCount,
    missedPickups: missedCount,
    skippedPickups: skippedCount,
    missedSkippedPickups: missedSkippedCount,
    totalPickups,
    byStatus,
    byCategory,
    recentPickups,
  };
}

// ─────────────────────────────────────────────
// Residents
// ─────────────────────────────────────────────
export interface AdminResident {
  id: string;
  email: string;
  created_at: string;
  roles: string[];
  address_count: number;
  notification_preference: string | null;
}

export async function getAdminResidents(): Promise<AdminResident[]> {
  await requireAdmin();
  const db = createAdminSupabaseClient();

  const { data: users } = await db
    .from("users")
    .select("id, email, created_at")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (!users || users.length === 0) return [];

  const userIds = users.map((u) => u.id);

  const [rolesRes, addrCountRes, profilesRes] = await Promise.all([
    db.from("user_roles").select("user_id, role").in("user_id", userIds),
    db.from("user_addresses").select("user_id").in("user_id", userIds),
    db.from("resident_profiles").select("user_id, notification_preference").in("user_id", userIds),
  ]);

  const rolesByUser: Record<string, string[]> = {};
  for (const r of rolesRes.data ?? []) {
    if (!rolesByUser[r.user_id]) rolesByUser[r.user_id] = [];
    rolesByUser[r.user_id].push(r.role);
  }

  const addrCountByUser: Record<string, number> = {};
  for (const a of addrCountRes.data ?? []) {
    addrCountByUser[a.user_id] = (addrCountByUser[a.user_id] ?? 0) + 1;
  }

  const profileByUser: Record<string, string | null> = {};
  for (const p of profilesRes.data ?? []) {
    profileByUser[p.user_id] = p.notification_preference;
  }

  return users.map((u) => ({
    id: u.id,
    email: u.email,
    created_at: u.created_at,
    roles: rolesByUser[u.id] ?? [],
    address_count: addrCountByUser[u.id] ?? 0,
    notification_preference: profileByUser[u.id] ?? null,
  }));
}

export async function updateUserRole(
  targetUserId: string,
  role: "admin" | "dispatcher" | "collector" | "resident",
  action: "add" | "remove"
): Promise<ActionResult> {
  await requireAdmin();
  const db = createAdminSupabaseClient();

  if (action === "add") {
    const { error } = await db
      .from("user_roles")
      .upsert({ user_id: targetUserId, role }, { onConflict: "user_id,role" });
    if (error) return { success: false, error: error.message };
  } else {
    const { error } = await db
      .from("user_roles")
      .delete()
      .eq("user_id", targetUserId)
      .eq("role", role);
    if (error) return { success: false, error: error.message };
  }

  revalidatePath("/admin/residents");
  return { success: true };
}

// ─────────────────────────────────────────────
// Addresses
// ─────────────────────────────────────────────
export interface AdminAddress {
  id: string;
  street: string;
  unit: string | null;
  city: string;
  postal_code: string;
  zone_id: string | null;
  zone_name: string | null;
  created_at: string;
  resident_count: number;
}

export async function getAdminAddresses(): Promise<AdminAddress[]> {
  await requireAdmin();
  const db = createAdminSupabaseClient();

  const { data: addresses } = await db
    .from("addresses")
    .select("id, street, unit, city, postal_code, zone_id, created_at, zones(name)")
    .is("deleted_at", null)
    .order("city")
    .order("street");

  if (!addresses || addresses.length === 0) return [];

  const addrIds = addresses.map((a) => a.id);
  const { data: links } = await db
    .from("user_addresses")
    .select("address_id")
    .in("address_id", addrIds);

  const residentCountByAddr: Record<string, number> = {};
  for (const l of links ?? []) {
    residentCountByAddr[l.address_id] = (residentCountByAddr[l.address_id] ?? 0) + 1;
  }

  return addresses.map((a) => ({
    id: a.id,
    street: a.street,
    unit: a.unit,
    city: a.city,
    postal_code: a.postal_code,
    zone_id: a.zone_id,
    zone_name: (a.zones as any)?.name ?? null,
    created_at: a.created_at,
    resident_count: residentCountByAddr[a.id] ?? 0,
  }));
}

export async function updateAddressZone(
  addressId: string,
  zoneId: string | null
): Promise<ActionResult> {
  await requireAdmin();
  const db = createAdminSupabaseClient();
  const { error } = await db
    .from("addresses")
    .update({ zone_id: zoneId, updated_at: new Date().toISOString() })
    .eq("id", addressId);
  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/addresses");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function adminDeleteAddress(addressId: string): Promise<ActionResult> {
  await requireAdmin();
  const db = createAdminSupabaseClient();
  const { error } = await db
    .from("addresses")
    .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", addressId);
  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/addresses");
  return { success: true };
}

// ─────────────────────────────────────────────
// Zones
// ─────────────────────────────────────────────
export interface AdminZone {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  address_count: number;
  schedule_count: number;
}

export async function getAdminZones(): Promise<AdminZone[]> {
  await requireAdmin();
  const db = createAdminSupabaseClient();

  const { data: zones } = await db
    .from("zones")
    .select("id, name, description, created_at")
    .is("deleted_at", null)
    .order("name");

  if (!zones || zones.length === 0) return [];

  const zoneIds = zones.map((z) => z.id);
  const [addrRes, schedRes] = await Promise.all([
    db.from("addresses").select("zone_id").in("zone_id", zoneIds).is("deleted_at", null),
    db.from("schedules").select("zone_id").in("zone_id", zoneIds).is("deleted_at", null),
  ]);

  const addrCount: Record<string, number> = {};
  for (const a of addrRes.data ?? []) {
    if (a.zone_id) addrCount[a.zone_id] = (addrCount[a.zone_id] ?? 0) + 1;
  }
  const schedCount: Record<string, number> = {};
  for (const s of schedRes.data ?? []) {
    schedCount[s.zone_id] = (schedCount[s.zone_id] ?? 0) + 1;
  }

  return zones.map((z) => ({
    id: z.id,
    name: z.name,
    description: z.description,
    created_at: z.created_at,
    address_count: addrCount[z.id] ?? 0,
    schedule_count: schedCount[z.id] ?? 0,
  }));
}

export async function createZone(formData: FormData): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();
  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;

  if (!name) return { success: false, error: "Zone name is required." };

  const db = createAdminSupabaseClient();
  const { data, error } = await db
    .from("zones")
    .insert({ name, description })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/zones");
  revalidatePath("/dashboard");
  return { success: true, data: { id: data.id } };
}

export async function updateZone(
  zoneId: string,
  formData: FormData
): Promise<ActionResult> {
  await requireAdmin();
  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;

  if (!name) return { success: false, error: "Zone name is required." };

  const db = createAdminSupabaseClient();
  const { error } = await db
    .from("zones")
    .update({ name, description, updated_at: new Date().toISOString() })
    .eq("id", zoneId);

  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/zones");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteZone(zoneId: string): Promise<ActionResult> {
  await requireAdmin();
  const db = createAdminSupabaseClient();

  // Check if any addresses or schedules are tied to this zone
  const [addrRes, schedRes] = await Promise.all([
    db.from("addresses").select("id", { count: "exact", head: true }).eq("zone_id", zoneId).is("deleted_at", null),
    db.from("schedules").select("id", { count: "exact", head: true }).eq("zone_id", zoneId).is("deleted_at", null),
  ]);
  if ((addrRes.count ?? 0) > 0) {
    return { success: false, error: `Cannot delete: ${addrRes.count} address(es) are assigned to this zone.` };
  }
  if ((schedRes.count ?? 0) > 0) {
    return { success: false, error: `Cannot delete: ${schedRes.count} schedule(s) reference this zone.` };
  }

  const { error } = await db
    .from("zones")
    .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", zoneId);

  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/zones");
  return { success: true };
}

// ─────────────────────────────────────────────
// Waste Categories
// ─────────────────────────────────────────────
export interface AdminCategory {
  id: string;
  name: string;
  color_code: string | null;
  instructions: string | null;
  is_active: boolean;
}

export async function getAdminCategories(): Promise<AdminCategory[]> {
  await requireAdmin();
  const db = createAdminSupabaseClient();
  const { data } = await db
    .from("waste_categories")
    .select("id, name, color_code, instructions, is_active")
    .order("name");
  return data ?? [];
}

export async function createCategory(formData: FormData): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();
  const name = (formData.get("name") as string)?.trim();
  const color_code = (formData.get("color_code") as string)?.trim() || null;
  const instructions = (formData.get("instructions") as string)?.trim() || null;

  if (!name) return { success: false, error: "Category name is required." };

  const db = createAdminSupabaseClient();
  const { data, error } = await db
    .from("waste_categories")
    .insert({ name, color_code, instructions })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/schedules");
  return { success: true, data: { id: data.id } };
}

export async function updateCategory(
  categoryId: string,
  formData: FormData
): Promise<ActionResult> {
  await requireAdmin();
  const name = (formData.get("name") as string)?.trim();
  const color_code = (formData.get("color_code") as string)?.trim() || null;
  const instructions = (formData.get("instructions") as string)?.trim() || null;

  if (!name) return { success: false, error: "Category name is required." };

  const db = createAdminSupabaseClient();
  const { error } = await db
    .from("waste_categories")
    .update({ name, color_code, instructions, updated_at: new Date().toISOString() })
    .eq("id", categoryId);

  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/schedules");
  return { success: true };
}

// ─────────────────────────────────────────────
// Schedules (recurring rules)
// ─────────────────────────────────────────────
export interface AdminSchedule {
  id: string;
  zone_id: string;
  zone_name: string;
  waste_category_id: string;
  category_name: string;
  category_color: string | null;
  frequency: string;
  day_of_week: number | null;
  start_date: string;
  end_date: string | null;
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export async function getAdminSchedules(): Promise<AdminSchedule[]> {
  await requireAdmin();
  const db = createAdminSupabaseClient();

  const { data } = await db
    .from("schedules")
    .select(`
      id, zone_id, waste_category_id, frequency, day_of_week, start_date, end_date,
      zones ( name ),
      waste_categories ( name, color_code )
    `)
    .is("deleted_at", null)
    .order("start_date", { ascending: false });

  return (data ?? []).map((s) => ({
    id: s.id,
    zone_id: s.zone_id,
    zone_name: (s.zones as any)?.name ?? "—",
    waste_category_id: s.waste_category_id,
    category_name: (s.waste_categories as any)?.name ?? "—",
    category_color: (s.waste_categories as any)?.color_code ?? null,
    frequency: s.frequency,
    day_of_week: s.day_of_week,
    start_date: s.start_date,
    end_date: s.end_date,
  }));
}

export async function createSchedule(formData: FormData): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();
  const zone_id = (formData.get("zone_id") as string)?.trim();
  const waste_category_id = (formData.get("waste_category_id") as string)?.trim();
  const frequency = (formData.get("frequency") as string)?.trim() as "weekly" | "biweekly" | "monthly" | "custom";
  const day_of_week_str = (formData.get("day_of_week") as string)?.trim();
  const start_date = (formData.get("start_date") as string)?.trim();
  const end_date = (formData.get("end_date") as string)?.trim() || null;

  if (!zone_id || !waste_category_id || !frequency || !start_date) {
    return { success: false, error: "Zone, category, frequency, and start date are required." };
  }

  const day_of_week = day_of_week_str !== "" && day_of_week_str !== null ? parseInt(day_of_week_str, 10) : null;

  const db = createAdminSupabaseClient();
  const { data, error } = await db
    .from("schedules")
    .insert({ zone_id, waste_category_id, frequency, day_of_week, start_date, end_date })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/schedules");
  return { success: true, data: { id: data.id } };
}

export async function updateSchedule(
  scheduleId: string,
  formData: FormData
): Promise<ActionResult> {
  await requireAdmin();
  const zone_id = (formData.get("zone_id") as string)?.trim();
  const waste_category_id = (formData.get("waste_category_id") as string)?.trim();
  const frequency = (formData.get("frequency") as string)?.trim() as "weekly" | "biweekly" | "monthly" | "custom";
  const day_of_week_str = (formData.get("day_of_week") as string)?.trim();
  const start_date = (formData.get("start_date") as string)?.trim();
  const end_date = (formData.get("end_date") as string)?.trim() || null;

  if (!zone_id || !waste_category_id || !frequency || !start_date) {
    return { success: false, error: "Zone, category, frequency, and start date are required." };
  }

  const day_of_week = day_of_week_str !== "" && day_of_week_str !== null ? parseInt(day_of_week_str, 10) : null;

  const db = createAdminSupabaseClient();
  const { error } = await db
    .from("schedules")
    .update({ zone_id, waste_category_id, frequency, day_of_week, start_date, end_date, updated_at: new Date().toISOString() })
    .eq("id", scheduleId);

  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/schedules");
  return { success: true };
}

export async function deleteSchedule(scheduleId: string): Promise<ActionResult> {
  await requireAdmin();
  const db = createAdminSupabaseClient();
  const { error } = await db
    .from("schedules")
    .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", scheduleId);
  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/schedules");
  return { success: true };
}

// ─────────────────────────────────────────────
// Pickups (materialized schedule events)
// ─────────────────────────────────────────────
export interface AdminPickup {
  id: string;
  address: { street: string; city: string; postal_code: string };
  zone_name: string | null;
  waste_category: { name: string; color_code: string | null };
  scheduled_date: string;
  status: string;
  notes: string | null;
}

export async function getAdminPickups(limit = 50): Promise<AdminPickup[]> {
  await requireAdmin();
  const db = createAdminSupabaseClient();

  const { data } = await db
    .from("pickups")
    .select(`
      id, scheduled_date, status, notes,
      addresses ( street, city, postal_code, zone_id, zones(name) ),
      waste_categories ( name, color_code )
    `)
    .is("deleted_at", null)
    .order("scheduled_date", { ascending: true })
    .limit(limit);

  return (data ?? []).map((p) => {
    const addr = p.addresses as any;
    return {
      id: p.id,
      address: { street: addr?.street ?? "", city: addr?.city ?? "", postal_code: addr?.postal_code ?? "" },
      zone_name: addr?.zones?.name ?? null,
      waste_category: { name: (p.waste_categories as any)?.name ?? "", color_code: (p.waste_categories as any)?.color_code ?? null },
      scheduled_date: p.scheduled_date,
      status: p.status,
      notes: p.notes,
    };
  });
}

export async function createPickup(formData: FormData): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();
  const address_id = (formData.get("address_id") as string)?.trim();
  const waste_category_id = (formData.get("waste_category_id") as string)?.trim();
  const scheduled_date = (formData.get("scheduled_date") as string)?.trim();
  const status = ((formData.get("status") as string)?.trim() || "scheduled") as "scheduled" | "completed" | "missed" | "skipped";
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!address_id || !waste_category_id || !scheduled_date) {
    return { success: false, error: "Address, category, and date are required." };
  }

  const db = createAdminSupabaseClient();
  const { data, error } = await db
    .from("pickups")
    .insert({ address_id, waste_category_id, scheduled_date, status, notes })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/schedules");
  revalidatePath("/dashboard");
  return { success: true, data: { id: data.id } };
}

export async function updatePickupStatus(
  pickupId: string,
  status: "scheduled" | "completed" | "missed" | "skipped"
): Promise<ActionResult> {
  await requireAdmin();
  const db = createAdminSupabaseClient();
  const { error } = await db
    .from("pickups")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", pickupId);
  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/schedules");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deletePickup(pickupId: string): Promise<ActionResult> {
  await requireAdmin();
  const db = createAdminSupabaseClient();
  const { error } = await db
    .from("pickups")
    .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", pickupId);
  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/schedules");
  revalidatePath("/dashboard");
  return { success: true };
}

// ─────────────────────────────────────────────
// Bulk generate pickups from a schedule rule
// ─────────────────────────────────────────────
export async function generatePickupsFromSchedule(
  scheduleId: string,
  weeksAhead: number = 4
): Promise<ActionResult<{ created: number }>> {
  await requireAdmin();
  const db = createAdminSupabaseClient();

  // Fetch the schedule rule
  const { data: sched, error: schedErr } = await db
    .from("schedules")
    .select("zone_id, waste_category_id, frequency, day_of_week, start_date, end_date")
    .eq("id", scheduleId)
    .is("deleted_at", null)
    .single();

  if (schedErr || !sched) return { success: false, error: "Schedule not found." };
  if (sched.day_of_week === null) return { success: false, error: "Schedule has no day_of_week set." };

  // Fetch all addresses in the zone
  const { data: addrs } = await db
    .from("addresses")
    .select("id")
    .eq("zone_id", sched.zone_id)
    .is("deleted_at", null);

  if (!addrs || addrs.length === 0) {
    return { success: false, error: "No addresses found in this zone." };
  }

  // Generate date list
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + weeksAhead * 7);

  const schedEnd = sched.end_date ? new Date(sched.end_date) : null;
  const schedStart = new Date(sched.start_date);

  const dates: Date[] = [];
  const cursor = new Date(Math.max(today.getTime(), schedStart.getTime()));

  // Find first occurrence of target day_of_week
  const targetDay = sched.day_of_week as number;
  while (cursor.getDay() !== targetDay) {
    cursor.setDate(cursor.getDate() + 1);
  }

  const intervalDays = sched.frequency === "biweekly" ? 14 : sched.frequency === "monthly" ? 28 : 7;

  while (cursor <= endDate) {
    if (schedEnd && cursor > schedEnd) break;
    dates.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + intervalDays);
  }

  if (dates.length === 0) return { success: true, data: { created: 0 } };

  // Build insert rows (upsert to skip duplicates)
  const rows = dates.flatMap((d) =>
    addrs.map((a) => ({
      address_id: a.id,
      waste_category_id: sched.waste_category_id,
      scheduled_date: d.toISOString().slice(0, 10),
      status: "scheduled" as const,
    }))
  );

  const { data: inserted, error: insertErr } = await db
    .from("pickups")
    .upsert(rows, { onConflict: "address_id,scheduled_date,waste_category_id", ignoreDuplicates: true })
    .select("id");

  if (insertErr) return { success: false, error: insertErr.message };

  revalidatePath("/admin/schedules");
  revalidatePath("/dashboard");
  return { success: true, data: { created: inserted?.length ?? 0 } };
}

// Helper: get all addresses (for pickup create form)
export async function getAdminAddressList() {
  await requireAdmin();
  const db = createAdminSupabaseClient();
  const { data } = await db
    .from("addresses")
    .select("id, street, unit, city, postal_code, zone_id, zones(name)")
    .is("deleted_at", null)
    .order("city")
    .order("street")
    .limit(500);
  return (data ?? []).map((a) => ({
    id: a.id,
    label: `${a.street}${a.unit ? ` ${a.unit}` : ""}, ${a.city} ${a.postal_code}`,
    zone_name: (a.zones as any)?.name ?? null,
  }));
}
