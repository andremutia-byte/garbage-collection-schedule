/**
 * One-time migration script.
 * Run with: node scripts/apply-migration.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

// Load env
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
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const MIGRATION_SQL = `
ALTER TABLE public.notifications
    ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_notifications_user_read
    ON public.notifications (user_id, read_at)
    WHERE read_at IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'notifications'
    AND policyname = 'Users update own notifications (mark read)'
  ) THEN
    EXECUTE $pol$CREATE POLICY "Users update own notifications (mark read)"
      ON public.notifications FOR UPDATE
      USING  ((auth.jwt() ->> 'sub') = user_id)
      WITH CHECK ((auth.jwt() ->> 'sub') = user_id)$pol$;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'notifications'
    AND policyname = 'Admins and Dispatchers update any notification'
  ) THEN
    EXECUTE $pol$CREATE POLICY "Admins and Dispatchers update any notification"
      ON public.notifications FOR UPDATE
      USING  (public.auth_is_admin_or_dispatcher())
      WITH CHECK (public.auth_is_admin_or_dispatcher())$pol$;
  END IF;
END$$;
`;

async function main() {
  console.log("=== Notifications Migration Script ===\n");

  // Check if read_at already exists
  console.log("Checking if read_at column exists...");
  const checkResult = await fetch(
    `${SUPABASE_URL}/rest/v1/notifications?select=id,read_at&limit=0`,
    {
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
    }
  );

  if (checkResult.ok) {
    console.log("✅ read_at column already exists — migration already applied!");
    console.log("\nVerifying existing notifications...");
    const notifs = await fetch(
      `${SUPABASE_URL}/rest/v1/notifications?select=id,user_id,message,read_at&limit=10`,
      {
        headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
      }
    );
    const data = await notifs.json();
    console.log(`Found ${data.length} notification(s)`);
    data.forEach((n) => {
      console.log(`  ${n.id?.substring(0, 8)}... read_at=${n.read_at ?? "null (unread)"}`);
    });
    return;
  }

  const body = await checkResult.text();
  const needsMigration = body.includes("read_at");
  
  if (needsMigration) {
    console.log("❌ read_at column does not exist yet.\n");
    console.log("Please run the following SQL in Supabase Dashboard → SQL Editor:");
    console.log("Supabase Dashboard: https://supabase.com/dashboard/project/<your-project-ref>/sql\n");
    console.log("=".repeat(60));
    console.log(MIGRATION_SQL.trim());
    console.log("=".repeat(60));
    console.log("\nAfter running, re-run this script to verify.");
  } else {
    console.log(`Unexpected response (${checkResult.status}): ${body.substring(0, 200)}`);
  }
}

main().catch(console.error);
