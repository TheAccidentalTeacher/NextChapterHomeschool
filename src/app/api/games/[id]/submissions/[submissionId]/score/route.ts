import { NextRequest, NextResponse } from "next/server";
import { getUserRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

/** PUT — DM scores a submission (sets dm_score + dm_feedback) */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; submissionId: string }> }
) {
  const role = await getUserRole();
  if (role !== "teacher") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { submissionId } = await params;
  const body = await request.json();
  const { dm_score, dm_feedback } = body;

  if (typeof dm_score !== "number" || dm_score < 1 || dm_score > 5) {
    return NextResponse.json(
      { error: "dm_score must be 1-5" },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("epoch_submissions")
    .update({
      dm_score,
      dm_feedback: dm_feedback ?? null,
      scored_at: new Date().toISOString(),
    })
    .eq("id", submissionId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
