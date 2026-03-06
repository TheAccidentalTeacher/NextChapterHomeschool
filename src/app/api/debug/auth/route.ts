// ============================================
// GET /api/debug/auth — Returns current auth state
// for the F12 console debug toolkit. Shows Clerk
// user info, role, metadata, and middleware context.
// ============================================

import { NextResponse } from "next/server";
import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";

export async function GET() {
  try {
    const { userId, sessionId } = await auth();

    if (!userId) {
      return NextResponse.json({
        authenticated: false,
        userId: null,
        sessionId: null,
        role: null,
        message: "No active Clerk session found",
        help: [
          "1. Go to /sign-in and log in with username + password",
          "2. Ensure CLERK_SECRET_KEY is set in .env.local",
          "3. Check that ClerkProvider wraps the app in layout.tsx",
        ],
      });
    }

    // Fetch full user to get publicMetadata
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const clerkUser = await currentUser();

    const role = (user.publicMetadata as { role?: string })?.role ?? "none";

    // Determine where middleware would send this user
    let middlewareWouldRedirect = "/dashboard (student stays)";
    if (role === "teacher") middlewareWouldRedirect = "/dm";
    if (role === "projector") middlewareWouldRedirect = "/projector";

    return NextResponse.json({
      authenticated: true,
      userId,
      sessionId,
      username: clerkUser?.username ?? user.username ?? null,
      firstName: clerkUser?.firstName ?? null,
      role,
      publicMetadata: user.publicMetadata,
      privateMetadata: "hidden",
      middlewareRedirect: middlewareWouldRedirect,
      createdAt: user.createdAt,
      lastSignInAt: user.lastSignInAt,
      imageUrl: user.imageUrl,
      message: `Authenticated as "${user.username}" with role "${role}"`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        authenticated: false,
        error: error instanceof Error ? error.message : "Unknown error",
        help: [
          "This error usually means Clerk keys are misconfigured",
          "Check CLERK_SECRET_KEY and NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY in .env.local",
        ],
      },
      { status: 500 }
    );
  }
}
