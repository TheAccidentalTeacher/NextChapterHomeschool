import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getClerkUserId, isTeacher } from "@/lib/auth/roles";

/**
 * POST /api/games/[id]/resources/route
 * Leading role routes earned resources: Spend / Contribute / Bank.
 *
 * Body: { team_id, round_type, spend: number, contribute: number, bank: number }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: gameId } = await params;
  const userId = await getClerkUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { team_id, round_type, spend, contribute, bank, total_earned } = body;

  if (!team_id || !round_type) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  // Validate totals add up
  const allocatedTotal = (spend ?? 0) + (contribute ?? 0) + (bank ?? 0);
  if (total_earned && allocatedTotal !== total_earned) {
    return NextResponse.json(
      { error: `Allocation (${allocatedTotal}) must equal earned (${total_earned})` },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // Map round to resource type
  const ROUND_TO_RESOURCE: Record<string, string> = {
    BUILD: "production",
    EXPAND: "reach",
    DEFINE: "legacy",
    DEFEND: "resilience",
  };
  const resourceType = ROUND_TO_RESOURCE[round_type];
  if (!resourceType) {
    return NextResponse.json({ error: "Invalid round_type" }, { status: 400 });
  }

  // Get current resource
  const { data: currentResource } = await supabase
    .from("team_resources")
    .select("*")
    .eq("team_id", team_id)
    .eq("resource_type", resourceType)
    .single();

  const currentAmount = currentResource?.amount ?? 0;

  // Update: add bank amount to existing resource bank
  const newAmount = currentAmount + (bank ?? 0);

  // Upsert resource
  const { error: resErr } = await supabase
    .from("team_resources")
    .upsert(
      {
        team_id,
        resource_type: resourceType,
        amount: newAmount,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "team_id,resource_type" }
    );

  if (resErr) {
    return NextResponse.json({ error: resErr.message }, { status: 500 });
  }

  // TODO: If contribute > 0, add to wonder_progress
  // TODO: If spend > 0, unlock purchase menu

  return NextResponse.json({
    resourceType,
    spent: spend ?? 0,
    contributed: contribute ?? 0,
    banked: bank ?? 0,
    newBankTotal: newAmount,
  });
}
