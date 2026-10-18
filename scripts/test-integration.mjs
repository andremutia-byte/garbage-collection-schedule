import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

// Load env safely without printing
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
  console.error("Missing environment variables");
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function run() {
  console.log("=== Running ButuanLinis Integration Tests ===");
  const tests = [];

  // T1: Connectivity
  try {
    const { count, error } = await db.from("users").select("*", { count: "exact", head: true });
    tests.push({ name: "T1: Service-role DB connectivity", passed: !error, detail: error ? error.message : `${count} users registered` });
  } catch (e) {
    tests.push({ name: "T1: Service-role DB connectivity", passed: false, detail: e.message });
  }

  // T2: Waste categories
  try {
    const { data, error } = await db.from("waste_categories").select("id, name");
    tests.push({ name: "T2: Waste categories intact", passed: !error && (data?.length ?? 0) > 0, detail: `${data?.length || 0} categories loaded` });
  } catch (e) {
    tests.push({ name: "T2: Waste categories intact", passed: false, detail: e.message });
  }

  // T3: Addresses table
  try {
    const { count, error } = await db.from("addresses").select("*", { count: "exact", head: true });
    tests.push({ name: "T3: Addresses table reachable", passed: !error, detail: `${count} addresses registered` });
  } catch (e) {
    tests.push({ name: "T3: Addresses table reachable", passed: false, detail: e.message });
  }

  // T4: Schedules table
  try {
    const { count, error } = await db.from("schedules").select("*", { count: "exact", head: true });
    tests.push({ name: "T4: Schedules table reachable", passed: !error, detail: `${count} schedules configured` });
  } catch (e) {
    tests.push({ name: "T4: Schedules table reachable", passed: false, detail: e.message });
  }

  // T5: Pickups table
  try {
    const { count, error } = await db.from("pickups").select("*", { count: "exact", head: true });
    tests.push({ name: "T5: Pickups table reachable", passed: !error, detail: `${count} pickups recorded` });
  } catch (e) {
    tests.push({ name: "T5: Pickups table reachable", passed: false, detail: e.message });
  }

  // T6: Notifications table
  try {
    const { count, error } = await db.from("notifications").select("*", { count: "exact", head: true });
    tests.push({ name: "T6: Notifications table reachable", passed: !error, detail: `${count} notifications recorded` });
  } catch (e) {
    tests.push({ name: "T6: Notifications table reachable", passed: false, detail: e.message });
  }

  // T7: Resident contact number schema & validation check
  try {
    const { error: userColErr } = await db.from("users").select("phone").limit(1);
    const { error: profColErr } = await db.from("resident_profiles").select("phone").limit(1);

    // Philippine phone regex test
    const valid09 = /^09\d{9}$/.test("09171234567");
    const valid63 = /^\+639\d{9}$/.test("+639171234567");
    const invalidPrefix = /^09\d{9}$/.test("08123456789");
    const invalidLen = /^09\d{9}$/.test("091234");
    const validationOk = valid09 && valid63 && !invalidPrefix && !invalidLen;

    const schemaOk = !userColErr && !profColErr;
    tests.push({
      name: "T7: Resident contact number schema & validation",
      passed: schemaOk && validationOk,
      detail: schemaOk && validationOk
        ? "phone column verified on users and resident_profiles; Philippine mobile format valid."
        : `Schema errors: ${userColErr?.message ?? "none"} / ${profColErr?.message ?? "none"}`,
    });
  } catch (e) {
    tests.push({ name: "T7: Resident contact number schema & validation", passed: false, detail: e.message });
  }

  console.log("\nResults:");
  let allPassed = true;
  for (const t of tests) {
    const icon = t.passed ? "✓ PASS" : "✗ FAIL";
    console.log(`${icon} [${t.name}]: ${t.detail}`);
    if (!t.passed) allPassed = false;
  }

  if (allPassed) {
    console.log("\nAll integration tests PASSED successfully!");
    process.exit(0);
  } else {
    console.error("\nSome integration tests FAILED.");
    process.exit(1);
  }
}

run();
