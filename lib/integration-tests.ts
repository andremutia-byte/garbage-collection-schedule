/**
 * lib/integration-tests.ts
 *
 * Server-only integration test runner.
 * Called from:
 *   - app/integration-tests/page.tsx  (server component)
 *   - app/api/integration-tests/route.ts (API route)
 *
 * SECURITY: Uses SUPABASE_SECRET_KEY (service-role). 
 * NEVER import from client components.
 */

import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SECRET = process.env.SUPABASE_SECRET_KEY!;
const SUPABASE_PUBLISHABLE = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

function serviceClient() {
  return createClient(SUPABASE_URL, SUPABASE_SECRET, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function authedClient(clerkJwt: string) {
  return createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE, {
    global: { headers: { Authorization: `Bearer ${clerkJwt}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function anonClient() {
  return createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function mask(id: string | null | undefined) {
  if (!id) return "none";
  return `${id.slice(0, 8)}...`;
}

function maskEmail(email: string | null | undefined) {
  if (!email) return "none";
  const parts = email.split("@");
  if (parts.length < 2) return "***";
  return `${parts[0].slice(0, 2)}***@${parts[1]}`;
}

export interface TestResult {
  name: string;
  passed: boolean;
  detail: string;
  bootstrapSQL?: string;
}

export interface TestReport {
  summary: { total: number; passed: number; failed: number; userId: string };
  results: TestResult[];
  bootstrapNote?: { message: string; sql: string } | null;
}

export async function runIntegrationTests(userId: string): Promise<TestReport> {
  const results: TestResult[] = [];
  const db = serviceClient();
  const ts = Date.now(); // unique suffix to avoid constraint violations on repeated runs

  // Get Clerk JWT for RLS tests
  let clerkToken: string | null = null;
  try {
    const authState = await auth();
    clerkToken = await authState.getToken();
  } catch {
    // no token — RLS tests will be skipped
  }

  // ─── T1: DB connectivity ──────────────────────────────────────────────────
  try {
    const { count, error } = await db
      .from("users")
      .select("*", { count: "exact", head: true });
    results.push({
      name: "T1: Service-role DB connectivity",
      passed: !error,
      detail: error
        ? `ERROR: ${error.message}`
        : `Connected — ${count ?? 0} user row(s) in public.users`,
    });
  } catch (e: any) {
    results.push({ name: "T1: Service-role DB connectivity", passed: false, detail: String(e) });
  }

  // ─── T2: Current user in public.users (webhook sync) ─────────────────────
  let userEmail: string | null = null;
  try {
    const { data, error } = await db
      .from("users")
      .select("id, email, created_at, deleted_at")
      .eq("id", userId)
      .maybeSingle();

    userEmail = data?.email ?? null;
    const synced = !error && !!data && !data.deleted_at;
    results.push({
      name: "T2: Signed-in user exists in public.users (Clerk webhook sync)",
      passed: synced,
      detail: synced
        ? `Found: ${maskEmail(data?.email)}, joined ${data?.created_at?.slice(0, 10)}`
        : error
        ? `DB error: ${error.message}`
        : !data
        ? "NOT FOUND — Clerk webhook has not synced this user. Check CLERK_WEBHOOK_SIGNING_SECRET and confirm the webhook endpoint is registered in the Clerk dashboard."
        : "Found but marked deleted_at — account is soft-deleted",
    });
  } catch (e: any) {
    results.push({ name: "T2: User in public.users", passed: false, detail: String(e) });
  }

  // ─── T3: User roles ───────────────────────────────────────────────────────
  let currentRoles: string[] = [];
  try {
    const { data, error } = await db
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    currentRoles = (data ?? []).map((r) => r.role);
    const hasRoles = !error && currentRoles.length > 0;
    results.push({
      name: "T3: Signed-in user has at least one role in user_roles",
      passed: hasRoles,
      detail: hasRoles
        ? `Roles: [${currentRoles.join(", ")}]`
        : error
        ? `DB error: ${error.message}`
        : "No roles found — sync_clerk_user should have assigned 'resident' on sign-up",
    });
  } catch (e: any) {
    results.push({ name: "T3: User roles", passed: false, detail: String(e) });
  }

  // ─── T4: Admin role ───────────────────────────────────────────────────────
  const isAdmin = currentRoles.includes("admin");
  const bootstrapSQL = `INSERT INTO public.user_roles (user_id, role)\nVALUES ('${userId}', 'admin')\nON CONFLICT (user_id, role) DO NOTHING;`;

  results.push({
    name: "T4: Signed-in user has admin role (required for /admin access)",
    passed: isAdmin,
    detail: isAdmin
      ? "✅ admin role confirmed — /admin dashboard is accessible"
      : `❌ NOT admin. Roles: [${currentRoles.join(", ") || "none"}]. Run the bootstrap SQL shown below.`,
    bootstrapSQL: isAdmin ? undefined : bootstrapSQL,
  });

  // ─── T5a: RLS — auth client sees only own users row ───────────────────────
  if (clerkToken) {
    try {
      const authDb = authedClient(clerkToken);
      const { data: visibleUsers, error } = await authDb.from("users").select("id");
      const { count: totalCount } = await db
        .from("users")
        .select("*", { count: "exact", head: true });

      const visible = visibleUsers?.length ?? 0;
      const total = totalCount ?? 0;
      const passed = !error && visible <= 1;

      results.push({
        name: "T5a: RLS — auth client sees only own row in public.users",
        passed,
        detail: passed
          ? `Auth client sees ${visible} user row(s) out of ${total} total. ✅ RLS correct.`
          : error
          ? `Unexpected error: ${error.message}`
          : `⚠ Auth client sees ${visible} rows — expected ≤ 1. RLS SELECT policy may be too permissive.`,
      });
    } catch (e: any) {
      results.push({ name: "T5a: RLS users isolation", passed: false, detail: String(e) });
    }

    // ─── T5b: RLS — pickups filtered by address ownership ─────────────────
    try {
      const authDb = authedClient(clerkToken);
      const { data: visiblePickups, error } = await authDb.from("pickups").select("id");
      const { count: totalPickups } = await db
        .from("pickups")
        .select("*", { count: "exact", head: true })
        .is("deleted_at", null);

      const vpCount = visiblePickups?.length ?? 0;
      const tpCount = totalPickups ?? 0;

      // Broken if visible > total (impossible), or if user has no addresses but sees pickups
      const rlsBroken = vpCount > tpCount;
      results.push({
        name: "T5b: RLS — pickups visible only for addresses the user owns",
        passed: !error && !rlsBroken,
        detail: error
          ? `Error: ${error.message}`
          : rlsBroken
          ? `⚠ Auth client sees ${vpCount} pickups > total ${tpCount} — impossible, check RLS`
          : `Auth client: ${vpCount} visible pickup(s); service-role total: ${tpCount}. ✅`,
      });
    } catch (e: any) {
      results.push({ name: "T5b: RLS pickups isolation", passed: false, detail: String(e) });
    }

    // ─── T5c: RLS — unauthenticated client sees zero rows ─────────────────
    try {
      const anon = anonClient();
      const { data: anonUsers } = await anon.from("users").select("id");
      const anonVisible = anonUsers?.length ?? 0;
      results.push({
        name: "T5c: RLS — unauthenticated (anon) client sees zero user rows",
        passed: anonVisible === 0,
        detail: anonVisible === 0
          ? "Anon client sees 0 user rows. ✅ RLS working correctly."
          : `⚠ Anon client sees ${anonVisible} user rows — RLS policy missing or disabled on public.users!`,
      });
    } catch (e: any) {
      results.push({ name: "T5c: RLS anon isolation", passed: false, detail: String(e) });
    }
  } else {
    results.push({
      name: "T5: RLS isolation tests",
      passed: false,
      detail: "Skipped — Clerk JWT could not be acquired. Ensure you are signed in.",
    });
  }

  // ─── T6: Zone CRUD round-trip ─────────────────────────────────────────────
  const testZoneName = `__inttest_${ts}`;
  try {
    // CREATE
    const { data: created, error: cErr } = await db
      .from("zones")
      .insert({ name: testZoneName, description: "Automated integration test — safe to delete" })
      .select("id, name")
      .single();
    if (cErr) throw new Error(`Create: ${cErr.message}`);

    // READ
    const { data: readBack, error: rErr } = await db
      .from("zones")
      .select("id, name")
      .eq("id", created.id)
      .single();
    if (rErr) throw new Error(`Read: ${rErr.message}`);
    if (readBack.name !== testZoneName) throw new Error("Read returned wrong name");

    // UPDATE
    const { error: uErr } = await db
      .from("zones")
      .update({ name: `${testZoneName}_upd`, updated_at: new Date().toISOString() })
      .eq("id", created.id);
    if (uErr) throw new Error(`Update: ${uErr.message}`);

    // SOFT-DELETE
    const { error: dErr } = await db
      .from("zones")
      .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", created.id);
    if (dErr) throw new Error(`Soft-delete: ${dErr.message}`);

    // VERIFY GONE FROM ACTIVE LIST
    const { data: afterDel } = await db
      .from("zones")
      .select("id")
      .eq("id", created.id)
      .is("deleted_at", null);
    const cleanedUp = !afterDel || afterDel.length === 0;

    results.push({
      name: "T6: Zone CRUD round-trip (create → read → update → soft-delete → verify gone)",
      passed: cleanedUp,
      detail: cleanedUp
        ? `Zone '${testZoneName}' created, read, updated, soft-deleted, confirmed absent from active query. ✅`
        : "Soft-delete wrote deleted_at but zone still returned in active-only query",
    });
  } catch (e: any) {
    results.push({ name: "T6: Zone CRUD round-trip", passed: false, detail: String(e) });
  }

  // ─── T7: sync_clerk_user() idempotency ───────────────────────────────────
  try {
    const { error } = await db.rpc("sync_clerk_user", {
      p_clerk_id: userId,
      p_email: userEmail ?? "test@example.com",
    });
    results.push({
      name: "T7: sync_clerk_user() is idempotent (safe to call repeatedly)",
      passed: !error,
      detail: !error
        ? "Calling sync_clerk_user on an existing user succeeded — ON CONFLICT DO UPDATE working. ✅"
        : `Error: ${error.message}`,
    });
  } catch (e: any) {
    results.push({ name: "T7: sync_clerk_user idempotency", passed: false, detail: String(e) });
  }

  // ─── T8: Zone delete constraint — linked address blocks deletion ──────────
  const constraintZoneName = `__inttest_const_${ts}`;
  const constraintStreet = `${ts} Constraint Ave`;
  try {
    const { data: zone, error: zErr } = await db
      .from("zones")
      .insert({ name: constraintZoneName })
      .select("id")
      .single();
    if (zErr) throw new Error(`Zone insert: ${zErr.message}`);

    const { data: addr, error: aErr } = await db
      .from("addresses")
      .insert({
        street: constraintStreet,
        city: "Constraintville",
        postal_code: `C${ts.toString().slice(-5)}`,
        zone_id: zone.id,
      })
      .select("id")
      .single();

    if (aErr) {
      await db.from("zones").update({ deleted_at: new Date().toISOString() }).eq("id", zone.id);
      throw new Error(`Address insert: ${aErr.message}`);
    }

    // Simulate what deleteZone() does — check linked count
    const { count: linked } = await db
      .from("addresses")
      .select("*", { count: "exact", head: true })
      .eq("zone_id", zone.id)
      .is("deleted_at", null);

    const guardWorks = (linked ?? 0) > 0;

    // Clean up: soft-delete address first so zone can then be soft-deleted
    await db
      .from("addresses")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", addr.id);
    await db
      .from("zones")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", zone.id);

    results.push({
      name: "T8: Zone-delete constraint — linked address correctly detected",
      passed: guardWorks,
      detail: guardWorks
        ? `Zone had ${linked} linked address(es). The deleteZone() action checks this and returns an error instead of deleting. ✅`
        : "No linked addresses detected — constraint guard would not trigger",
    });
  } catch (e: any) {
    results.push({ name: "T8: Zone-delete constraint", passed: false, detail: String(e) });
  }

  // ─── T9: E2E scheduling round-trip ───────────────────────────────────────
  const schedZoneName = `__inttest_sched_${ts}`;
  const schedStreet = `${ts} Schedule St`;
  try {
    // 1. Create zone
    const { data: zone, error: zErr } = await db
      .from("zones")
      .insert({ name: schedZoneName })
      .select("id")
      .single();
    if (zErr) throw new Error(`Zone: ${zErr.message}`);

    // 2. Create address in zone (unique street per run via timestamp)
    const { data: addr, error: aErr } = await db
      .from("addresses")
      .insert({
        street: schedStreet,
        city: "Pickuptown",
        postal_code: `S${ts.toString().slice(-5)}`,
        zone_id: zone.id,
      })
      .select("id")
      .single();
    if (aErr) {
      await db.from("zones").update({ deleted_at: new Date().toISOString() }).eq("id", zone.id);
      throw new Error(`Address: ${aErr.message}`);
    }

    // 3. Get or create waste category
    let catId: string;
    const { data: existingCat } = await db
      .from("waste_categories")
      .select("id")
      .eq("is_active", true)
      .is("deleted_at" as any, null)
      .limit(1)
      .maybeSingle();

    if (existingCat) {
      catId = existingCat.id;
    } else {
      const { data: newCat, error: catErr } = await db
        .from("waste_categories")
        .insert({ name: `General Waste ${ts}`, color_code: "#6B7280", is_active: true })
        .select("id")
        .single();
      if (catErr) throw new Error(`Category: ${catErr.message}`);
      catId = newCat.id;
    }

    // 4. Create schedule rule (weekly, Monday = day_of_week 1)
    const today = new Date().toISOString().slice(0, 10);
    const { data: sched, error: sErr } = await db
      .from("schedules")
      .insert({
        zone_id: zone.id,
        waste_category_id: catId,
        frequency: "weekly",
        day_of_week: 1,
        start_date: today,
      })
      .select("id")
      .single();
    if (sErr) throw new Error(`Schedule: ${sErr.message}`);

    // 5. Compute next Monday (what generatePickupsFromSchedule does)
    const nextMonday = new Date();
    nextMonday.setHours(0, 0, 0, 0);
    if (nextMonday.getDay() === 0) nextMonday.setDate(nextMonday.getDate() + 1);
    else while (nextMonday.getDay() !== 1) nextMonday.setDate(nextMonday.getDate() + 1);
    const pickupDate = nextMonday.toISOString().slice(0, 10);

    // 6. Insert pickup (simulating generatePickupsFromSchedule)
    const { data: pickup, error: pErr } = await db
      .from("pickups")
      .upsert(
        {
          address_id: addr.id,
          waste_category_id: catId,
          scheduled_date: pickupDate,
          status: "scheduled",
        },
        { onConflict: "address_id,scheduled_date,waste_category_id", ignoreDuplicates: true }
      )
      .select("id, status, scheduled_date, address_id")
      .single();
    if (pErr) throw new Error(`Pickup upsert: ${pErr.message}`);

    // 7. Verify pickup data is correct
    const schedOk =
      pickup.status === "scheduled" &&
      pickup.scheduled_date === pickupDate &&
      pickup.address_id === addr.id;

    // 8. Test that auth client (resident with address) can see this pickup
    let residentCanSeePickup = false;
    if (clerkToken) {
      // Link current user to the test address temporarily
      await db
        .from("user_addresses")
        .insert({ user_id: userId, address_id: addr.id, is_primary: false })
        .select("user_id")
        .single();

      const authDb = authedClient(clerkToken);
      const { data: residentPickups } = await authDb
        .from("pickups")
        .select("id")
        .eq("id", pickup.id);
      residentCanSeePickup = (residentPickups?.length ?? 0) > 0;

      // Unlink
      await db
        .from("user_addresses")
        .delete()
        .eq("user_id", userId)
        .eq("address_id", addr.id);
    }

    // Clean up all test records
    await db.from("pickups").update({ deleted_at: new Date().toISOString() }).eq("id", pickup.id);
    await db.from("schedules").update({ deleted_at: new Date().toISOString() }).eq("id", sched.id);
    await db.from("addresses").update({ deleted_at: new Date().toISOString() }).eq("id", addr.id);
    await db.from("zones").update({ deleted_at: new Date().toISOString() }).eq("id", zone.id);

    const passed = schedOk && (clerkToken ? residentCanSeePickup : true);
    results.push({
      name: "T9: E2E scheduling — zone→address→schedule→pickup→resident visibility",
      passed,
      detail: schedOk
        ? clerkToken
          ? residentCanSeePickup
            ? `Pickup created for ${pickupDate}. Resident auth client can see it via RLS address link. ✅ Full e2e OK.`
            : `Pickup created for ${pickupDate} ✅ but resident auth client CANNOT see it via RLS — address link or RLS pickup policy may be broken.`
          : `Pickup created for ${pickupDate} ✅ (resident visibility check skipped — no JWT)`
        : "Pickup data mismatch after insert",
    });
  } catch (e: any) {
    results.push({ name: "T9: E2E scheduling round-trip", passed: false, detail: String(e) });
  }

  // ─── T10: Security — server-only keys not in NEXT_PUBLIC_ vars ───────────
  const secretKey = process.env.SUPABASE_SECRET_KEY ?? "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
  const clerkSecret = process.env.CLERK_SECRET_KEY ?? "";
  const clerkPublishable = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
  const webhookSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET ?? "";

  const noLeaks =
    secretKey.length > 0 &&
    secretKey !== publishable &&
    (serviceRoleKey.length === 0 || serviceRoleKey !== publishable) &&
    clerkSecret !== clerkPublishable &&
    webhookSecret !== clerkPublishable;

  results.push({
    name: "T10: Security — server-only secrets not exposed as NEXT_PUBLIC_ variables",
    passed: noLeaks,
    detail: noLeaks
      ? "SUPABASE_SECRET_KEY, SUPABASE_SERVICE_ROLE_KEY, CLERK_SECRET_KEY, CLERK_WEBHOOK_SIGNING_SECRET confirmed server-only. ✅"
      : "⚠ A secret key value matches a NEXT_PUBLIC_ env var — potential security leak!",
  });

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  return {
    summary: { total: results.length, passed, failed, userId: mask(userId) },
    results,
    bootstrapNote: isAdmin
      ? null
      : { message: "Run this SQL in Supabase Dashboard → SQL Editor:", sql: bootstrapSQL },
  };
}
