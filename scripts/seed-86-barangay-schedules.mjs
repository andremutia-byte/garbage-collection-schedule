import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

// Load environment variables safely without logging secrets
const envFile = readFileSync(".env.local", "utf8");
const env = Object.fromEntries(
  envFile
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => {
      const idx = l.indexOf("=");
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
    })
);

const SUPABASE_URL = env["NEXT_PUBLIC_SUPABASE_URL"];
const SERVICE_KEY = env["SUPABASE_SERVICE_ROLE_KEY"];

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing SUPABASE environment variables");
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Manila date helper
function getManilaDateString() {
  const now = new Date();
  const manilaDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  return manilaDate; // YYYY-MM-DD
}

async function seed() {
  console.log("=== Seeding Demonstration Schedules for All 86 Barangays of Butuan City ===");

  // 1. Fetch all barangays
  const { data: barangays, error: bErr } = await db
    .from("barangays")
    .select("id, name")
    .order("name", { ascending: true });

  if (bErr || !barangays || barangays.length === 0) {
    console.error("Failed to load barangays:", bErr?.message);
    process.exit(1);
  }
  console.log(`Found ${barangays.length} barangays in database.`);

  // 2. Fetch waste categories
  const { data: categories, error: cErr } = await db
    .from("waste_categories")
    .select("id, name");

  if (cErr || !categories || categories.length === 0) {
    console.error("Failed to load waste categories:", cErr?.message);
    process.exit(1);
  }

  console.log("Categories found:", categories.map((c) => ({ id: c.id, name: c.name })));

  const bioCat = categories.find((c) =>
    /green|bio/i.test(c.name)
  );
  const recCat = categories.find((c) =>
    /recycl/i.test(c.name)
  );
  const resCat = categories.find((c) =>
    /general|residual/i.test(c.name)
  );

  console.log("Matched categories:", {
    bio: bioCat?.name,
    rec: recCat?.name,
    res: resCat?.name,
  });

  if (!bioCat || !recCat || !resCat) {
    console.error("Missing standard waste categories (bio, rec, or res)");
    process.exit(1);
  }

  // 3. Fetch existing schedules
  const { data: existingSchedules } = await db
    .from("schedules")
    .select("id, barangay_id, waste_category_id, day_of_week")
    .is("deleted_at", null);

  const existingBarangayMap = new Map();
  for (const s of existingSchedules || []) {
    if (s.barangay_id) {
      if (!existingBarangayMap.has(s.barangay_id)) {
        existingBarangayMap.set(s.barangay_id, new Set());
      }
      existingBarangayMap.get(s.barangay_id).add(`${s.waste_category_id}_${s.day_of_week}`);
    }
  }

  const startDate = getManilaDateString();

  // 6 Demonstration Schedule Templates (Zones) across Butuan City
  // Days: 0 = Sun, 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat
  const templates = [
    // Template 0: Mon (Bio), Thu (Residual), Sat (Recyclables) - 06:00 AM – 09:00 AM
    [
      { catId: bioCat.id, day: 1, time: "06:00 AM – 09:00 AM" },
      { catId: resCat.id, day: 4, time: "06:00 AM – 09:00 AM" },
      { catId: recCat.id, day: 6, time: "06:00 AM – 09:00 AM" },
    ],
    // Template 1: Tue (Recyclables), Fri (Residual) - 07:00 AM – 10:00 AM
    [
      { catId: recCat.id, day: 2, time: "07:00 AM – 10:00 AM" },
      { catId: resCat.id, day: 5, time: "07:00 AM – 10:00 AM" },
    ],
    // Template 2: Wed (Bio), Sat (Residual) - 06:00 AM – 09:00 AM
    [
      { catId: bioCat.id, day: 3, time: "06:00 AM – 09:00 AM" },
      { catId: resCat.id, day: 6, time: "06:00 AM – 09:00 AM" },
    ],
    // Template 3: Mon (Recyclables), Thu (Bio) - 01:00 PM – 04:00 PM
    [
      { catId: recCat.id, day: 1, time: "01:00 PM – 04:00 PM" },
      { catId: bioCat.id, day: 4, time: "01:00 PM – 04:00 PM" },
      { catId: resCat.id, day: 0, time: "07:00 AM – 10:00 AM" },
    ],
    // Template 4: Tue (Bio), Fri (Recyclables) - 06:00 AM – 09:00 AM
    [
      { catId: bioCat.id, day: 2, time: "06:00 AM – 09:00 AM" },
      { catId: recCat.id, day: 5, time: "06:00 AM – 09:00 AM" },
      { catId: resCat.id, day: 0, time: "06:00 AM – 09:00 AM" },
    ],
    // Template 5: Wed (Recyclables), Sat (Bio) - 07:00 AM – 10:00 AM
    [
      { catId: recCat.id, day: 3, time: "07:00 AM – 10:00 AM" },
      { catId: bioCat.id, day: 6, time: "07:00 AM – 10:00 AM" },
      { catId: resCat.id, day: 2, time: "06:00 AM – 09:00 AM" },
    ],
  ];

  const newScheduleRows = [];
  let skippedCount = 0;

  barangays.forEach((b, idx) => {
    // Preserve Ampayon and Libertad existing schedules if present
    const existingRules = existingBarangayMap.get(b.id);
    if (existingRules && existingRules.size >= 2) {
      skippedCount++;
      return;
    }

    const tpl = templates[idx % templates.length];
    for (const rule of tpl) {
      const key = `${rule.catId}_${rule.day}`;
      if (existingRules && existingRules.has(key)) continue;

      newScheduleRows.push({
        barangay_id: b.id,
        waste_category_id: rule.catId,
        frequency: "weekly",
        day_of_week: rule.day,
        start_date: startDate,
        collection_time: rule.time,
        is_active: true,
      });
    }
  });

  console.log(`Preserving ${skippedCount} barangays with existing customized schedules.`);
  console.log(`Inserting ${newScheduleRows.length} demonstration schedules for remaining barangays...`);

  if (newScheduleRows.length > 0) {
    // Chunk inserts by 50 rows
    const chunkSize = 50;
    for (let i = 0; i < newScheduleRows.length; i += chunkSize) {
      const chunk = newScheduleRows.slice(i, i + chunkSize);
      const { error: insErr } = await db.from("schedules").insert(chunk);
      if (insErr) {
        console.error(`Error inserting chunk starting at ${i}:`, insErr.message);
      }
    }
  }

  // 4. Verify coverage
  const { data: finalScheds } = await db
    .from("schedules")
    .select("barangay_id")
    .is("deleted_at", null)
    .eq("is_active", true);

  const coveredBarangays = new Set(
    (finalScheds || []).map((s) => s.barangay_id).filter(Boolean)
  );

  console.log(`Coverage verification: ${coveredBarangays.size} of 86 barangays have active schedules.`);

  // 5. Auto-generate upcoming pickups for all existing registered addresses
  const { data: addresses } = await db
    .from("addresses")
    .select("id, barangay_id")
    .is("deleted_at", null);

  if (addresses && addresses.length > 0) {
    console.log(`Generating upcoming demonstration pickups for ${addresses.length} registered addresses...`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 28); // 4 weeks ahead

    const { data: allActiveScheds } = await db
      .from("schedules")
      .select("id, barangay_id, waste_category_id, day_of_week, collection_time")
      .is("deleted_at", null)
      .eq("is_active", true);

    const pickupRows = [];
    for (const addr of addresses) {
      if (!addr.barangay_id) continue;
      const bScheds = (allActiveScheds || []).filter((s) => s.barangay_id === addr.barangay_id);

      for (const sched of bScheds) {
        if (sched.day_of_week === null) continue;
        const cursor = new Date(today);
        while (cursor.getDay() !== sched.day_of_week) {
          cursor.setDate(cursor.getDate() + 1);
        }

        while (cursor <= endDate) {
          pickupRows.push({
            address_id: addr.id,
            waste_category_id: sched.waste_category_id,
            scheduled_date: cursor.toISOString().slice(0, 10),
            status: "scheduled",
          });
          cursor.setDate(cursor.getDate() + 7);
        }
      }
    }

    if (pickupRows.length > 0) {
      const { error: pErr } = await db
        .from("pickups")
        .upsert(pickupRows, {
          onConflict: "address_id,scheduled_date,waste_category_id",
          ignoreDuplicates: true,
        });
      if (pErr) {
        console.error("Non-fatal pickup upsert error:", pErr.message);
      } else {
        console.log(`Generated ${pickupRows.length} demonstration pickups.`);
      }
    }
  }

  console.log("=== Seed Completed Successfully! ===");
}

seed().catch((err) => {
  console.error("Seed script failed:", err);
  process.exit(1);
});
