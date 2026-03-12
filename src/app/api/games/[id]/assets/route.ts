import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getClerkUserId } from "@/lib/auth/roles";
import { getPurchaseItem, getAdjustedCost } from "@/lib/game/purchase-catalog";
import { FOUNDING, MATH_GATE } from "@/lib/constants";

/**
 * GET /api/games/[id]/assets — Fetch all team assets for a game
 * Query params: ?team_id=xxx
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: gameId } = await params;
  const userId = await getClerkUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const teamId = req.nextUrl.searchParams.get("team_id");
  const supabase = await createClient();

  let query = supabase
    .from("team_assets")
    .select("*")
    .eq("game_id", gameId);

  if (teamId) {
    query = query.eq("team_id", teamId);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ assets: data });
}

/**
 * POST /api/games/[id]/assets — Purchase an asset
 * Body: {
 *   team_id: string,
 *   item_key: string,        // from purchase catalog
 *   sub_zone_id: string,     // where to place it
 *   has_builder: boolean,     // whether team has active builder for discount
 * }
 *
 * Optionally triggers founding modal data:
 * Body can include: {
 *   settlement_name: string,     // for founding
 *   founding_claim: string,      // 'first_settler' | 'resource_hub' | 'natural_landmark'
 * }
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
  const {
    team_id,
    item_key,
    sub_zone_id,
    has_builder = false,
    settlement_name,
    founding_claim,
    math_penalty = false,
  } = body;

  if (!team_id || !item_key) {
    return NextResponse.json(
      { error: "Missing team_id or item_key" },
      { status: 400 }
    );
  }

  // Validate item exists
  const item = getPurchaseItem(item_key);
  if (!item) {
    return NextResponse.json(
      { error: `Unknown item: ${item_key}` },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // Check team belongs to this game
  const { data: team } = await supabase
    .from("teams")
    .select("id, game_id")
    .eq("id", team_id)
    .eq("game_id", gameId)
    .single();

  if (!team) {
    return NextResponse.json(
      { error: "Team not found in this game" },
      { status: 404 }
    );
  }

  // Calculate cost
  const cost = getAdjustedCost(item, has_builder);

  // Check resource availability
  const { data: resource } = await supabase
    .from("team_resources")
    .select("amount")
    .eq("team_id", team_id)
    .eq("resource_type", item.costResource)
    .single();

  const currentAmount = resource?.amount ?? 0;
  if (currentAmount < cost) {
    return NextResponse.json(
      {
        error: `Insufficient ${item.costResource}: need ${cost}, have ${currentAmount}`,
      },
      { status: 400 }
    );
  }

  // For non-stackable items, check if already owned
  if (!item.isStackable) {
    const { data: existing } = await supabase
      .from("team_assets")
      .select("id")
      .eq("team_id", team_id)
      .eq("asset_key", item_key)
      .eq("is_active", true)
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: `Already own ${item.name} — not stackable` },
        { status: 400 }
      );
    }
  }

  // Get current epoch
  const { data: game } = await supabase
    .from("games")
    .select("current_epoch")
    .eq("id", gameId)
    .single();

  const currentEpoch = game?.current_epoch ?? 1;

  // Deduct resource
  const { error: deductErr } = await supabase
    .from("team_resources")
    .update({
      amount: currentAmount - cost,
      updated_at: new Date().toISOString(),
    })
    .eq("team_id", team_id)
    .eq("resource_type", item.costResource);

  if (deductErr) {
    return NextResponse.json({ error: deductErr.message }, { status: 500 });
  }

  // Create asset record
  const assetRecord: Record<string, unknown> = {
    team_id,
    game_id: gameId,
    asset_key: item_key,
    sub_zone_id: sub_zone_id || null,
    built_epoch: currentEpoch,
    is_active: true,
  };

  const { data: newAsset, error: assetErr } = await supabase
    .from("team_assets")
    .insert(assetRecord)
    .select()
    .single();

  if (assetErr) {
    // Refund on failure
    await supabase
      .from("team_resources")
      .update({
        amount: currentAmount,
        updated_at: new Date().toISOString(),
      })
      .eq("team_id", team_id)
      .eq("resource_type", item.costResource);

    return NextResponse.json({ error: assetErr.message }, { status: 500 });
  }

  // Check if this is the first building in this sub-zone (founding trigger)
  let isFoundingEvent = false;
  if (item.category === "building" && sub_zone_id) {
    const { data: existingInZone } = await supabase
      .from("team_assets")
      .select("id")
      .eq("team_id", team_id)
      .eq("sub_zone_id", sub_zone_id)
      .neq("id", newAsset.id)
      .limit(1);

    isFoundingEvent = !existingInZone || existingInZone.length === 0;

    // If founding data provided, apply it + founding bonuses
    if (isFoundingEvent && settlement_name && founding_claim) {
      // Read current yield_modifier before modifying
      const { data: szRow } = await supabase
        .from("sub_zones")
        .select("yield_modifier")
        .eq("id", sub_zone_id)
        .single();

      const currentYield = (szRow as unknown as { yield_modifier: number })?.yield_modifier ?? 1.0;
      let newYield = currentYield;
      if (founding_claim === "resource_hub") {
        newYield += FOUNDING.RESOURCE_HUB_BONUS; // +15%
      } else if (founding_claim === "first_settler") {
        newYield += 0.10; // +10%
      }
      // natural_landmark: no yield change — grants Legacy instead

      const decayEpochs =
        founding_claim === "first_settler"
          ? Math.floor(Math.random() * 4) + 1 // 1–4 epochs, hidden from student
          : 0;

      await supabase
        .from("sub_zones")
        .update({
          settlement_name,
          founding_claim,
          founding_epoch: currentEpoch,
          first_settler_decay_epochs: decayEpochs,
          founding_bonus_active: true,
          yield_modifier: Number(newYield.toFixed(2)),
        })
        .eq("id", sub_zone_id);

      // Natural Landmark: grant immediate Legacy bonus
      if (founding_claim === "natural_landmark") {
        const { data: legacyRow } = await supabase
          .from("team_resources")
          .select("amount")
          .eq("team_id", team_id)
          .eq("resource_type", "legacy")
          .single();

        const currentLegacy = (legacyRow as unknown as { amount: number })?.amount ?? 0;
        await supabase
          .from("team_resources")
          .upsert(
            {
              team_id,
              game_id: gameId,
              resource_type: "legacy",
              amount: currentLegacy + FOUNDING.NATURAL_LANDMARK_CI,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "team_id,resource_type" }
          );
      }
    }
  }

  // Decision 88: Math gate wrong-answer penalty — reduce sub_zone yield_modifier
  if (math_penalty && item.category === "building" && sub_zone_id) {
    const { data: szRow } = await supabase
      .from("sub_zones")
      .select("yield_modifier")
      .eq("id", sub_zone_id)
      .single();

    const curYield = (szRow as unknown as { yield_modifier: number })?.yield_modifier ?? 1.0;
    const penalized = Math.max(0.5, Number((curYield - MATH_GATE.WRONG_ANSWER_YIELD_PENALTY).toFixed(2)));
    await supabase
      .from("sub_zones")
      .update({ yield_modifier: penalized })
      .eq("id", sub_zone_id);
  }

  return NextResponse.json({
    asset: newAsset,
    cost,
    resourceType: item.costResource,
    remainingAmount: currentAmount - cost,
    isFoundingEvent,
    mathPenaltyApplied: math_penalty && item.category === "building" && !!sub_zone_id,
    item: {
      key: item.key,
      name: item.name,
      category: item.category,
      emoji: item.emoji,
    },
  });
}

/**
 * PATCH /api/games/[id]/assets — Repair or deactivate an asset
 * Body: {
 *   asset_id: string,
 *   action: 'repair' | 'deactivate'
 *   team_id: string (for repair — to consume repair tools)
 * }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: gameId } = await params;
  const userId = await getClerkUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { asset_id, action, team_id } = body;

  if (!asset_id || !action) {
    return NextResponse.json(
      { error: "Missing asset_id or action" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  if (action === "deactivate") {
    const { error } = await supabase
      .from("team_assets")
      .update({ is_active: false })
      .eq("id", asset_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, action: "deactivated" });
  }

  if (action === "repair") {
    if (!team_id) {
      return NextResponse.json(
        { error: "team_id required for repair" },
        { status: 400 }
      );
    }

    // Check for repair tools
    const { data: repairTools } = await supabase
      .from("team_assets")
      .select("id")
      .eq("team_id", team_id)
      .eq("asset_key", "repair_tools")
      .eq("is_active", true)
      .limit(1);

    if (!repairTools || repairTools.length === 0) {
      return NextResponse.json(
        { error: "No repair tools available" },
        { status: 400 }
      );
    }

    // Consume one repair tool
    await supabase
      .from("team_assets")
      .update({ is_active: false })
      .eq("id", repairTools[0].id);

    // Reactivate the damaged asset
    const { error } = await supabase
      .from("team_assets")
      .update({ is_active: true })
      .eq("id", asset_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      action: "repaired",
      repairToolConsumed: repairTools[0].id,
    });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
