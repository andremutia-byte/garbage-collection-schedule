"use server";

import { createPublicServerSupabaseClient } from "@/lib/supabase/server";

export interface BarangayItem {
  id: string;
  name: string;
}

export interface ScheduleItem {
  id: string;
  frequency: "weekly" | "biweekly" | "monthly" | "custom";
  day_of_week: number | null;
  start_date: string;
  end_date: string | null;
  barangay_id: string | null;
  barangay_name: string;
  category: {
    id: string;
    name: string;
    color_code: string | null;
    instructions: string | null;
  };
}

/**
 * Fetch all official Butuan City barangays from public.barangays table.
 * Readable by anyone via public RLS.
 */
export async function getBarangays(): Promise<BarangayItem[]> {
  const db = createPublicServerSupabaseClient();
  const { data, error } = await db
    .from("barangays")
    .select("id, name")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching barangays:", error.message);
    return [];
  }

  return data ?? [];
}

/**
 * Fetch real schedules that apply to a specific barangay (or city-wide rules where barangay_id is null).
 */
export async function getSchedulesByBarangay(
  barangayName: string
): Promise<{ barangay: BarangayItem | null; schedules: ScheduleItem[] }> {
  const db = createPublicServerSupabaseClient();

  // 1. Resolve barangay
  let targetBarangay: BarangayItem | null = null;
  if (barangayName.trim()) {
    const { data: bData } = await db
      .from("barangays")
      .select("id, name")
      .ilike("name", barangayName.trim())
      .limit(1)
      .maybeSingle();

    if (bData) {
      targetBarangay = bData;
    }
  }

  // 2. Query schedules
  let query = db
    .from("schedules")
    .select(`
      id,
      frequency,
      day_of_week,
      start_date,
      end_date,
      barangay_id,
      waste_categories ( id, name, color_code, instructions ),
      barangays ( id, name )
    `)
    .is("deleted_at", null);

  if (targetBarangay) {
    query = query.or(`barangay_id.eq.${targetBarangay.id},barangay_id.is.null`);
  } else {
    // If no barangay specified, return city-wide rules
    query = query.is("barangay_id", null);
  }

  const { data: rawSchedules, error } = await query.order("day_of_week", {
    ascending: true,
    nullsFirst: false,
  });

  if (error) {
    console.error("Error fetching schedules by barangay:", error.message);
    return { barangay: targetBarangay, schedules: [] };
  }

  const schedules: ScheduleItem[] = (rawSchedules ?? []).map((s) => {
    const cat = s.waste_categories as {
      id?: string;
      name?: string;
      color_code?: string | null;
      instructions?: string | null;
    } | null;
    const bar = s.barangays as { id?: string; name?: string } | null;
    return {
      id: s.id,
      frequency: s.frequency,
      day_of_week: s.day_of_week,
      start_date: s.start_date,
      end_date: s.end_date,
      barangay_id: s.barangay_id,
      barangay_name: bar?.name ?? "All Barangays",
      category: {
        id: cat?.id ?? "",
        name: cat?.name ?? "General Waste",
        color_code: cat?.color_code ?? null,
        instructions: cat?.instructions ?? null,
      },
    };
  });

  return {
    barangay: targetBarangay,
    schedules,
  };
}
