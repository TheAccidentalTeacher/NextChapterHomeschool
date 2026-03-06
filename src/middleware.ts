import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Public routes — no auth required
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/api/webhooks(.*)",
]);

// Projector route — special access (no login, uses game code)
const isProjectorRoute = createRouteMatcher(["/projector(.*)"]);

export default clerkMiddleware(async (auth, request) => {
  // Allow public routes and projector through
  if (isPublicRoute(request) || isProjectorRoute(request)) {
    return;
  }

  // Everything else requires authentication
  await auth.protect();
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
