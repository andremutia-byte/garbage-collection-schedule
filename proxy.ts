import { clerkMiddleware } from "@clerk/nextjs/server";

/**
 * Clerk middleware — authentication is handled per-resource.
 *
 * Instead of path-based route matching (which can diverge from how Next.js
 * routes requests), auth checks are performed in individual pages, layouts,
 * Server Actions, and Route Handlers that access protected data.
 *
 * Public resources:
 *   /                       — Landing page (no auth needed)
 *   /sign-in, /sign-up      — Clerk-hosted auth flows
 *   /api/webhooks/*         — Svix webhook delivery (must be public)
 *   /integration-test       — Dev smoke-test page
 *
 * Protected resources:
 *   /dashboard              — Calls auth() + redirect in page.tsx
 *   /admin                  — (future) calls auth() in layout.tsx
 *
 * This approach is recommended by Clerk to avoid path-matching divergence.
 * See: https://clerk.com/docs/guides/development/upgrading/upgrade-guides/migrate-from-create-route-matcher
 */
export default clerkMiddleware();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
