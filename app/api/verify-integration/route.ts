import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  const result: Record<string, unknown> = {};

  // 1. Check env vars (without leaking values)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

  result.env = {
    supabaseUrlPresent: supabaseUrl.length > 0,
    supabaseUrlIsPlaceholder: supabaseUrl.includes("your-project"),
    supabaseUrlFormat: supabaseUrl.startsWith("https://") && supabaseUrl.includes(".supabase.co"),
    supabaseKeyPresent: supabaseKey.length > 0,
    supabaseKeyIsPlaceholder: supabaseKey.startsWith("your"),
    supabaseKeyLooksLikeJwt: supabaseKey.length > 100 && supabaseKey.startsWith("ey"),
  };

  // 2. Check Clerk server auth
  let token: string | null = null;
  let clerkUserId: string | null = null;

  try {
    const authState = await auth();
    clerkUserId = authState.userId;
    if (clerkUserId) {
      token = await authState.getToken();
    }
    result.clerk = {
      authenticated: Boolean(clerkUserId),
      userId: clerkUserId ? `${clerkUserId.substring(0, 8)}...` : null,
      tokenAcquired: Boolean(token),
      tokenLength: token?.length ?? 0,
    };
  } catch (err: unknown) {
    result.clerk = {
      authenticated: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }

  // 3. Test Supabase connectivity (unauthenticated ping)
  if (!supabaseUrl.includes("your-project") && supabaseKey.length > 30) {
    try {
      // Hit the health endpoint — this works without any tables
      const res = await fetch(`${supabaseUrl}/rest/v1/`, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      });

      result.supabaseAnon = {
        httpStatus: res.status,
        reachable: res.status < 500,
        ok: res.ok,
      };
    } catch (err: unknown) {
      result.supabaseAnon = {
        reachable: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  } else {
    result.supabaseAnon = { skipped: "Placeholder URL/key detected" };
  }

  // 4. Test Supabase with Clerk token (authenticated ping)
  if (token && !supabaseUrl.includes("your-project") && supabaseKey.length > 30) {
    try {
      const capturedToken = token;

      // Request to a non-existent table — we expect a 404/400, NOT a 401/403
      // A 401/403 means auth is rejected; a 404/400 means auth passed, table just doesn't exist
      const res = await fetch(`${supabaseUrl}/rest/v1/nonexistent_table_ping`, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${capturedToken}`,
          "Content-Type": "application/json",
        },
      });

      result.supabaseAuthed = {
        httpStatus: res.status,
        // 404 or 400 = auth accepted (table doesn't exist, which is expected)
        // 401 or 403 = auth REJECTED (Clerk token not trusted by Supabase)
        authAccepted: res.status !== 401 && res.status !== 403,
        interpretation:
          res.status === 401
            ? "FAIL: Supabase rejected token (401 Unauthorized) — Third-Party Auth not configured"
            : res.status === 403
            ? "FAIL: Supabase rejected token (403 Forbidden) — RLS or auth issue"
            : "PASS: Auth accepted (table not found is expected at this stage)",
      };
    } catch (err: unknown) {
      result.supabaseAuthed = {
        authAccepted: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  } else {
    result.supabaseAuthed = {
      skipped: token
        ? "Placeholder URL/key"
        : "No Clerk session — sign in first, then call this endpoint",
    };
  }

  return NextResponse.json(result, { status: 200 });
}
