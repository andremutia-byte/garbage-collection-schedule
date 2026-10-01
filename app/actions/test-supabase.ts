"use server";

import { auth } from "@clerk/nextjs/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface ServerAuthTestResult {
  isAuthenticated: boolean;
  userId: string | null;
  tokenAcquired: boolean;
  tokenDetails: {
    length: number;
    issuer?: string;
    hasSub: boolean;
  } | null;
  supabaseRequestStatus: "success" | "placeholder_url" | "network_error" | "unauthenticated";
  message: string;
}

export async function runServerSupabaseTest(): Promise<ServerAuthTestResult> {
  const authState = await auth();
  const userId = authState.userId;

  if (!userId) {
    return {
      isAuthenticated: false,
      userId: null,
      tokenAcquired: false,
      tokenDetails: null,
      supabaseRequestStatus: "unauthenticated",
      message: "Unauthenticated: No active Clerk server session detected.",
    };
  }

  // 1. Obtain Clerk session token
  let token: string | null = null;
  try {
    token = await authState.getToken();
  } catch (err: unknown) {
    return {
      isAuthenticated: true,
      userId,
      tokenAcquired: false,
      tokenDetails: null,
      supabaseRequestStatus: "network_error",
      message: `Failed to acquire Clerk token: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  if (!token) {
    return {
      isAuthenticated: true,
      userId,
      tokenAcquired: false,
      tokenDetails: null,
      supabaseRequestStatus: "network_error",
      message: "Clerk getToken() returned null.",
    };
  }

  // Parse claims without exposing secrets
  let tokenDetails: ServerAuthTestResult["tokenDetails"] = null;
  try {
    const parts = token.split(".");
    if (parts.length === 3) {
      const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));
      tokenDetails = {
        length: token.length,
        issuer: payload.iss,
        hasSub: Boolean(payload.sub),
      };
    }
  } catch {
    tokenDetails = { length: token.length, hasSub: true };
  }

  // 2. Make authenticated Supabase request
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const isPlaceholder =
    supabaseUrl.includes("your-project") || supabaseUrl.includes("example.com");

  try {
    const supabase = await createServerSupabaseClient();
    const { error, status } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true });

    return {
      isAuthenticated: true,
      userId,
      tokenAcquired: true,
      tokenDetails,
      supabaseRequestStatus: isPlaceholder ? "placeholder_url" : "success",
      message: isPlaceholder
        ? "Server Supabase client initialized with accessToken provider. Note: NEXT_PUBLIC_SUPABASE_URL contains placeholder."
        : `Server request completed with HTTP status ${status}${error ? ` (${error.message})` : ""}.`,
    };
  } catch (err: unknown) {
    return {
      isAuthenticated: true,
      userId,
      tokenAcquired: true,
      tokenDetails,
      supabaseRequestStatus: isPlaceholder ? "placeholder_url" : "network_error",
      message: isPlaceholder
        ? "Server Supabase client initialized with accessToken provider. (Placeholder Supabase URL detected)"
        : `Supabase request failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
