import { NextRequest, NextResponse } from "next/server";
import { createDirectClient } from "@/lib/supabase/admin";

/**
 * POST /api/solo/[gameId]/route-resources
 * Player routes earned resources after a round.
 */

const STEP_TO_PRIMARY: Record<string, string> = {
  build: "production",
  expand: "reach",
  define: "legacy",
  defend: "resilience",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function incrementResource(supabase: any, teamId: string, resourceType: string, delta: number) {
  if (delta <= 0) return;
  const { data } = await supabase
    .from("team_resources")
    .select("amount")
    .eq("team_id", teamId)
    .eq("resource_type", resourceType)
    .single();
  const current = (data as { amount: number } | null)?.amount ?? 0;
  await supabase
    .from("team_resources")
    .update({ amount: current + delta })
    .eq("team_id", teamId)
    .eq("resource_type", resourceType);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  await params; // gameId not needed for the route itself

  const body = await req.json();
  const {
    teamId,
    step,
    earned,
    storePercent,
    populationPercent,
    defensePercent,
  } = body;

  if (!teamId || !step || earned == null) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Normalize to 100%
  const total = (storePercent || 0) + (populationPercent || 0) + (defensePercent || 0);
  const normalizer = total > 0 ? 100 / total : 1;
  const storeAmt = Math.round(earned * (storePercent || 0) * normalizer / 100);
  const foodAmt = Math.round(earned * (populationPercent || 0) * normalizer / 100);
  // defense gets the remainder so we don't lose points to rounding
  const defenseAmt = earned - storeAmt - foodAmt;

  const primaryResource = STEP_TO_PRIMARY[step];
  if (!primaryResource) {
    return NextResponse.json({ error: `Unknown step: ${step}` }, { status: 400 });
  }

  const supabase = createDirectClient();

  // Apply increments
  await incrementResource(supabase, teamId, primaryResource, storeAmt);
  await incrementResource(supabase, teamId, "food", foodAmt);

  // Defense goes to resilience (only if this isn't already the defend step)
  if (defenseAmt > 0) {
    await incrementResource(
      supabase,
      teamId,
      step === "defend" ? "resilience" : "resilience",
      defenseAmt
    );
  }

  // Fetch updated resources
  const { data: resources } = await supabase
    .from("team_resources")
    .select("resource_type, amount")
    .eq("team_id", teamId);

  const updatedResources: Record<string, number> = {};
  for (const r of resources ?? []) {
    updatedResources[r.resource_type] = r.amount;
  }

  return NextResponse.json({
    updatedResources,
    applied: { primary: storeAmt, food: foodAmt, defense: defenseAmt },
  });
}
