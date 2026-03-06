// ============================================
// ClassCiv Role Helpers
// Decision 83: Username-only auth, minimal PII
// Decision 76: Three view roles — student, teacher, projector
// ============================================

import { auth, currentUser } from "@clerk/nextjs/server";
import type { UserRole } from "@/types/database";

/**
 * Get the role from Clerk public metadata.
 * Clerk metadata is set manually in the dashboard or via API:
 *   { role: 'teacher' | 'student' | 'projector' }
 */
export async function getUserRole(): Promise<UserRole> {
  const user = await currentUser();
  if (!user) return "student"; // default fallback
  const role = (user.publicMetadata as { role?: string })?.role;
  if (role === "teacher" || role === "student" || role === "projector") {
    return role;
  }
  return "student"; // default if no metadata set
}

/**
 * Lightweight check using auth() — no full user fetch.
 * Returns the clerk user ID or null.
 */
export async function getClerkUserId(): Promise<string | null> {
  const { userId } = await auth();
  return userId;
}

export async function isTeacher(): Promise<boolean> {
  return (await getUserRole()) === "teacher";
}

export async function isStudent(): Promise<boolean> {
  return (await getUserRole()) === "student";
}

export async function isProjector(): Promise<boolean> {
  return (await getUserRole()) === "projector";
}

/**
 * Require teacher role — throws redirect if not.
 * Use in server components / route handlers.
 */
export async function requireTeacher(): Promise<string> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  const role = await getUserRole();
  if (role !== "teacher") {
    throw new Error("Forbidden: teacher role required");
  }
  return userId;
}

/**
 * Require any authenticated user — returns userId + role.
 */
export async function requireAuth(): Promise<{ userId: string; role: UserRole }> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  const role = await getUserRole();
  return { userId, role };
}
