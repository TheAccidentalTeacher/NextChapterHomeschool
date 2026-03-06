// ============================================
// ClassCiv Middleware — Route Protection & Role Redirects
// Decision 83: Clerk username-only auth
// Decision 76: Three view roles — student, teacher, projector
//
// Flow:
//   1. Public routes (/, /sign-in) → pass through
//   2. Projector routes → pass through (no login required)
//   3. All other routes → require authentication
//   4. /dashboard → redirect teacher→/dm, projector→/projector
//
// Note: publicMetadata must be fetched via clerkClient() because
// Clerk does not include it in the JWT session claims by default.
// ============================================

import {
  clerkMiddleware,
  clerkClient,
  createRouteMatcher,
} from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

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
  const session = await auth.protect();

  // Role-based redirect after sign-in (only on /dashboard root)
  const url = request.nextUrl;
  if (url.pathname === "/dashboard") {
    // Fetch the full user to read publicMetadata (not in JWT by default)
    const client = await clerkClient();
    const user = await client.users.getUser(session.userId);
    const role = (user.publicMetadata as { role?: string })?.role;

    if (role === "teacher") {
      return NextResponse.redirect(new URL("/dm", request.url));
    }
    if (role === "projector") {
      return NextResponse.redirect(new URL("/projector", request.url));
    }
    // students stay on /dashboard
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
