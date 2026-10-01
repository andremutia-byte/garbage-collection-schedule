import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/**
 * Public routes — accessible without a Clerk session.
 *
 * /api/webhooks/(.*) MUST be public: Svix calls this endpoint using its own
 * signing key, not a Clerk user session. Blocking it would reject all webhooks.
 *
 * All routes not listed here are protected by auth.protect() below.
 * Future authenticated routes (/dashboard, /admin, etc.) are automatically
 * protected without any further changes to this file.
 */
const isPublicRoute = createRouteMatcher([
  "/",                        // Landing page
  "/sign-in(.*)",             // Clerk-hosted sign-in flow
  "/sign-up(.*)",             // Clerk-hosted sign-up flow
  "/api/webhooks(.*)",        // Clerk/Svix webhook delivery — must be public
  "/integration-test(.*)",    // Dev integration smoke-test page
  "/api/verify-integration",  // Dev integration smoke-test API
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    // Redirects unauthenticated users to the sign-in page.
    // Any route added to the application that is not listed above
    // will be automatically protected.
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
