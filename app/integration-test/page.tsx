"use client";

import { useState } from "react";
import {
  Show,
  SignInButton,
  SignOutButton,
  UserButton,
  useSession,
  useUser,
} from "@clerk/nextjs";
import { createClerkSupabaseClient } from "@/lib/supabase/client";
import { runServerSupabaseTest, type ServerAuthTestResult } from "@/app/actions/test-supabase";

interface ClientTestResult {
  tokenAcquired: boolean;
  tokenLength: number;
  claims: {
    iss?: string;
    sub?: string;
    exp?: number;
  } | null;
  supabaseStatus: string;
  isPlaceholderUrl: boolean;
  rawError?: string;
}

export default function IntegrationTestPage() {
  const { user } = useUser();
  const { session, isLoaded: sessionLoaded } = useSession();

  const [clientTesting, setClientTesting] = useState(false);
  const [clientResult, setClientResult] = useState<ClientTestResult | null>(null);

  const [serverTesting, setServerTesting] = useState(false);
  const [serverResult, setServerResult] = useState<ServerAuthTestResult | null>(null);

  // Client-side test runner
  const handleRunClientTest = async () => {
    if (!session) return;
    setClientTesting(true);
    setClientResult(null);

    try {
      // 1. Obtain session token using native Third-Party Auth pattern
      const token = await session.getToken();
      if (!token) {
        throw new Error("Clerk session.getToken() returned null");
      }

      // Parse non-sensitive claims for verification display
      let claims: ClientTestResult["claims"] = null;
      try {
        const parts = token.split(".");
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          claims = {
            iss: payload.iss,
            sub: payload.sub,
            exp: payload.exp,
          };
        }
      } catch {
        // payload parsing non-critical
      }

      // 2. Instantiate authenticated client
      const supabase = createClerkSupabaseClient(session);

      // Check if URL is placeholder
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
      const isPlaceholderUrl =
        supabaseUrl.includes("your-project") || supabaseUrl.includes("example.com");

      let supabaseStatus = "";
      try {
        const { error, status } = await supabase
          .from("_auth_test_ping")
          .select("*", { count: "exact", head: true });

        if (isPlaceholderUrl) {
          supabaseStatus =
            "Client initialized and token provider registered. Using placeholder NEXT_PUBLIC_SUPABASE_URL.";
        } else {
          supabaseStatus = `Request dispatched. HTTP Status: ${status}${error ? ` (${error.message})` : ""}`;
        }
      } catch (reqErr: unknown) {
        supabaseStatus = isPlaceholderUrl
          ? "Client initialized with token provider. (Placeholder Supabase URL)"
          : `Request error: ${reqErr instanceof Error ? reqErr.message : String(reqErr)}`;
      }

      setClientResult({
        tokenAcquired: true,
        tokenLength: token.length,
        claims,
        supabaseStatus,
        isPlaceholderUrl,
      });
    } catch (err: unknown) {
      setClientResult({
        tokenAcquired: false,
        tokenLength: 0,
        claims: null,
        supabaseStatus: "Failed",
        isPlaceholderUrl: false,
        rawError: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setClientTesting(false);
    }
  };

  // Server-side test runner
  const handleRunServerTest = async () => {
    setServerTesting(true);
    setServerResult(null);
    try {
      const res = await runServerSupabaseTest();
      setServerResult(res);
    } catch (err: unknown) {
      setServerResult({
        isAuthenticated: false,
        userId: null,
        tokenAcquired: false,
        tokenDetails: null,
        supabaseRequestStatus: "network_error",
        message: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setServerTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="border-b border-slate-800 pb-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Clerk ↔ Supabase Integration Audit
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Validating Native Third-Party Auth (accessToken injection, no deprecated templates)
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Show when="signed-in">
              <UserButton />
            </Show>
          </div>
        </div>

        {/* Section 1: Unauthenticated State Handling */}
        <Show when="signed-out">
          <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-6 space-y-4">
            <div className="flex items-start gap-3">
              <span className="text-amber-400 text-xl font-bold">1.</span>
              <div>
                <h2 className="text-lg font-semibold text-amber-200">
                  Unauthenticated State Handled
                </h2>
                <p className="text-sm text-slate-300 mt-1">
                  No active Clerk session detected. The application correctly handles this state:
                  Supabase client executes in public anonymous mode without injecting session credentials.
                </p>
              </div>
            </div>

            <div className="bg-slate-900/80 rounded-lg p-4 text-xs font-mono text-slate-400 space-y-1">
              <div>Session status: <span className="text-amber-300">Signed Out (Unauthenticated)</span></div>
              <div>Token emission: <span className="text-slate-500">Blocked (Requires authenticated user)</span></div>
            </div>

            <div className="pt-2">
              <SignInButton mode="modal">
                <button
                  type="button"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-sm transition-colors shadow-sm"
                >
                  Sign In with Clerk to Test Authenticated State
                </button>
              </SignInButton>
            </div>
          </div>
        </Show>

        {/* Section 2 & 3: Authenticated State & Test Suite */}
        <Show when="signed-in">
          <div className="space-y-6">
            {/* User Session Info Card */}
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-6 space-y-4">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />
                  <div>
                    <h2 className="text-lg font-semibold text-emerald-200">
                      Active Clerk Session Verified
                    </h2>
                    <p className="text-xs text-slate-400">
                      User ID: <code className="text-slate-300 font-mono">{user?.id}</code>
                    </p>
                  </div>
                </div>
                <SignOutButton>
                  <button
                    type="button"
                    className="text-xs px-3 py-1.5 border border-slate-700 hover:bg-slate-800 rounded-md text-slate-300 transition-colors"
                  >
                    Sign Out
                  </button>
                </SignOutButton>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono bg-slate-900/80 rounded-lg p-4">
                <div>
                  <span className="text-slate-500">Email: </span>
                  <span className="text-slate-200">{user?.primaryEmailAddress?.emailAddress ?? "N/A"}</span>
                </div>
                <div>
                  <span className="text-slate-500">Session ID: </span>
                  <span className="text-slate-200">{session?.id ?? "N/A"}</span>
                </div>
              </div>
            </div>

            {/* Test 2: Client Component Supabase Client Test */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-4">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <h3 className="text-base font-semibold text-white">
                    Test A: Browser Client Auth Handshake
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Validates <code>session.getToken()</code> emission and Supabase client token attachment.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRunClientTest}
                  disabled={clientTesting || !sessionLoaded}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium rounded-lg text-xs transition-colors"
                >
                  {clientTesting ? "Testing..." : "Run Client Test"}
                </button>
              </div>

              {clientResult && (
                <div className="bg-slate-950 rounded-lg p-4 border border-slate-800 text-xs font-mono space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Token Acquired:</span>
                    <span className={clientResult.tokenAcquired ? "text-emerald-400" : "text-rose-400"}>
                      {clientResult.tokenAcquired ? `YES (${clientResult.tokenLength} chars)` : "FAILED"}
                    </span>
                  </div>

                  {clientResult.claims && (
                    <>
                      <div>
                        <span className="text-slate-500">Issuer (iss): </span>
                        <span className="text-indigo-300">{clientResult.claims.iss}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Subject (sub): </span>
                        <span className="text-indigo-300">{clientResult.claims.sub}</span>
                      </div>
                    </>
                  )}

                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-slate-500">Supabase Dispatch: </span>
                    <span className="text-slate-300">{clientResult.supabaseStatus}</span>
                  </div>

                  {clientResult.rawError && (
                    <div className="text-rose-400">Error: {clientResult.rawError}</div>
                  )}
                </div>
              )}
            </div>

            {/* Test 3: Server Action / SSR Supabase Client Test */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-4">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <h3 className="text-base font-semibold text-white">
                    Test B: Server Action Auth Handshake
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Validates <code>(await auth()).getToken()</code> in Server Actions and Route Handlers.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRunServerTest}
                  disabled={serverTesting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium rounded-lg text-xs transition-colors"
                >
                  {serverTesting ? "Testing..." : "Run Server Test"}
                </button>
              </div>

              {serverResult && (
                <div className="bg-slate-950 rounded-lg p-4 border border-slate-800 text-xs font-mono space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Server Auth:</span>
                    <span className={serverResult.isAuthenticated ? "text-emerald-400" : "text-rose-400"}>
                      {serverResult.isAuthenticated ? `VERIFIED (User: ${serverResult.userId})` : "UNAUTHENTICATED"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Token Emitted:</span>
                    <span className={serverResult.tokenAcquired ? "text-emerald-400" : "text-rose-400"}>
                      {serverResult.tokenAcquired
                        ? `YES (${serverResult.tokenDetails?.length ?? 0} chars)`
                        : "NO"}
                    </span>
                  </div>

                  {serverResult.tokenDetails?.issuer && (
                    <div>
                      <span className="text-slate-500">Token Issuer: </span>
                      <span className="text-indigo-300">{serverResult.tokenDetails.issuer}</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-slate-500">Server Message: </span>
                    <span className="text-slate-300">{serverResult.message}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Show>

        {/* Integration Architecture Overview */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-6 space-y-3 text-xs text-slate-400">
          <h4 className="font-semibold text-slate-200 uppercase tracking-wider text-[11px]">
            Architecture & Compliance Details
          </h4>
          <ul className="list-disc pl-5 space-y-1 text-slate-400">
            <li>
              <strong className="text-slate-300">Third-Party Auth:</strong> Supabase natively verifies Clerk session JWTs directly using your Clerk domain JWKS.
            </li>
            <li>
              <strong className="text-slate-300">No JWT Templates:</strong> No legacy <code>template: &quot;supabase&quot;</code> required; standard session token is trusted directly.
            </li>
            <li>
              <strong className="text-slate-300">Separation of Concerns:</strong> <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> is browser-safe, while <code>SUPABASE_SERVICE_ROLE_KEY</code> remains server-only.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
