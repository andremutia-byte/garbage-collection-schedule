/**
 * GET /api/integration-tests
 *
 * JSON endpoint for the integration test suite.
 * Requires a valid Clerk session (401 if not authenticated).
 * Returns the same TestReport shape as the page.
 */
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { runIntegrationTests } from "@/lib/integration-tests";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated — sign in first" }, { status: 401 });
  }

  const report = await runIntegrationTests(userId);
  return NextResponse.json(report, { status: 200 });
}
