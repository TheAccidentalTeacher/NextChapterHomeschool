// GET /api/dm/users/search?q=<query>
// Teacher-only: searches Clerk users by email or username.
// Returns id, display name, and email for use in RosterManager.

import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { requireTeacher } from "@/lib/auth/roles";

export async function GET(req: NextRequest) {
  try {
    await requireTeacher();
  } catch {
    return NextResponse.json({ error: "Teacher only" }, { status: 403 });
  }

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ users: [] });
  }

  const client = await clerkClient();

  // Search by email address prefix and by username
  const [byEmail, byUsername] = await Promise.all([
    client.users.getUserList({ emailAddress: [q], limit: 10 }).catch(() => ({ data: [] })),
    client.users.getUserList({ query: q, limit: 10 }).catch(() => ({ data: [] })),
  ]);

  // Merge + deduplicate
  const seen = new Set<string>();
  const merged = [...(byEmail.data ?? []), ...(byUsername.data ?? [])].filter((u) => {
    if (seen.has(u.id)) return false;
    seen.add(u.id);
    return true;
  });

  const users = merged.map((u) => ({
    id: u.id,
    displayName: [u.firstName, u.lastName].filter(Boolean).join(" ") || u.username || "Unknown",
    email: u.emailAddresses?.[0]?.emailAddress ?? "",
    username: u.username ?? "",
  }));

  return NextResponse.json({ users });
}
