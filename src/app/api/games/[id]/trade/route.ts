import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getClerkUserId } from "@/lib/auth/roles";

// ============================================
// Trade API — Spot board, agreements, embargo
// Decision 69: Two-tier trade system
// ============================================

/**
 * GET /api/games/[id]/trade
 * Query: ?team_id=xxx&type=spot|agreements|embargo
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
  const type = req.nextUrl.searchParams.get("type") ?? "all";
  const supabase = await createClient();

  const result: Record<string, unknown> = {};

  // Spot offers
  if (type === "all" || type === "spot") {
    const { data: spotOffers, error: spotErr } = await supabase
      .from("trade_offers")
      .select("*")
      .eq("game_id", gameId)
      .eq("is_open", true);

    if (spotErr) {
      return NextResponse.json({ error: spotErr.message }, { status: 500 });
    }

    // Filter offers based on embargo
    let filteredOffers = spotOffers ?? [];
    if (teamId) {
      const { data: embargoes } = await supabase
        .from("embargoes")
        .select("target_team_id, filer_team_id")
        .eq("game_id", gameId)
        .eq("is_active", true);

      const embargoedTeams = new Set<string>();
      for (const e of (embargoes ?? []) as { target_team_id: string; filer_team_id: string }[]) {
        if (e.filer_team_id === teamId) embargoedTeams.add(e.target_team_id);
        if (e.target_team_id === teamId) embargoedTeams.add(e.filer_team_id);
      }

      filteredOffers = filteredOffers.filter(
        (o: Record<string, unknown>) => !embargoedTeams.has(o.offering_team_id as string)
      );
    }

    result.spotOffers = filteredOffers;
  }

  // Trade agreements
  if (type === "all" || type === "agreements") {
    let query = supabase
      .from("trade_agreements")
      .select("*")
      .eq("game_id", gameId);

    if (teamId) {
      query = query.or(`team_a_id.eq.${teamId},team_b_id.eq.${teamId}`);
    }

    const { data: agreements, error: agrErr } = await query;
    if (agrErr) {
      return NextResponse.json({ error: agrErr.message }, { status: 500 });
    }
    result.agreements = agreements ?? [];
  }

  // Embargoes
  if (type === "all" || type === "embargo") {
    const { data: embargoes, error: embErr } = await supabase
      .from("embargoes")
      .select("*")
      .eq("game_id", gameId)
      .eq("is_active", true);

    if (embErr) {
      return NextResponse.json({ error: embErr.message }, { status: 500 });
    }
    result.embargoes = embargoes ?? [];
  }

  return NextResponse.json(result);
}

/**
 * POST /api/games/[id]/trade
 * Body: { action, team_id, ...params }
 * Actions:
 *   - "post_spot"      — post a spot trade offer
 *   - "accept_spot"    — accept a spot trade offer
 *   - "cancel_spot"    — cancel own spot offer
 *   - "propose_agreement" — propose a trade agreement
 *   - "respond_agreement" — accept/decline agreement
 *   - "cancel_agreement"  — cancel agreement (−10 Rep penalty)
 *   - "file_embargo"   — file trade embargo
 *   - "lift_embargo"   — lift trade embargo
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
  const { action, team_id } = body as { action: string; team_id: string };

  if (!team_id) {
    return NextResponse.json({ error: "team_id required" }, { status: 400 });
  }

  const supabase = await createClient();

  // Get current epoch
  const { data: gameData } = await supabase
    .from("games")
    .select("current_epoch")
    .eq("id", gameId)
    .single();
  const currentEpoch = (gameData as { current_epoch?: number } | null)?.current_epoch ?? 1;

  // ---- POST SPOT OFFER ----
  if (action === "post_spot") {
    const { offering_resource, offering_amount, requesting_resource, requesting_amount } = body as {
      offering_resource: string;
      offering_amount: number;
      requesting_resource: string;
      requesting_amount: number;
    };

    if (!offering_resource || !requesting_resource || !offering_amount || !requesting_amount) {
      return NextResponse.json({ error: "Missing offer parameters" }, { status: 400 });
    }

    // Insert offer
    const { data: offer, error: insertErr } = await supabase
      .from("trade_offers")
      .insert({
        game_id: gameId,
        offering_team_id: team_id,
        offering_resource,
        offering_amount,
        requesting_resource,
        requesting_amount,
        is_open: true,
        created_epoch: currentEpoch,
      })
      .select("id")
      .single();

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, offerId: (offer as { id: string })?.id });
  }

  // ---- ACCEPT SPOT OFFER ----
  if (action === "accept_spot") {
    const { offer_id } = body as { offer_id: string };
    if (!offer_id) {
      return NextResponse.json({ error: "offer_id required" }, { status: 400 });
    }

    // Get offer
    const { data: offerRow, error: fetchErr } = await supabase
      .from("trade_offers")
      .select("*")
      .eq("id", offer_id)
      .eq("is_open", true)
      .single();

    if (fetchErr || !offerRow) {
      return NextResponse.json({ error: "Offer not found or already closed" }, { status: 400 });
    }

    const offer = offerRow as Record<string, unknown>;

    // Can't accept own offer
    if (offer.offering_team_id === team_id) {
      return NextResponse.json({ error: "Cannot accept your own offer" }, { status: 400 });
    }

    // Close offer
    await supabase
      .from("trade_offers")
      .update({
        is_open: false,
        trade_type: "spot",
      })
      .eq("id", offer_id);

    // Log trade event
    await supabase.from("game_events").insert({
      game_id: gameId,
      epoch: currentEpoch,
      event_type: "spot_trade_accepted",
      payload: {
        offer_id,
        offering_team_id: offer.offering_team_id,
        accepting_team_id: team_id,
        offering_resource: offer.offering_resource,
        offering_amount: offer.offering_amount,
        requesting_resource: offer.requesting_resource,
        requesting_amount: offer.requesting_amount,
      },
    });

    return NextResponse.json({ success: true, message: "Trade accepted — executes at next RESOLVE" });
  }

  // ---- CANCEL SPOT OFFER ----
  if (action === "cancel_spot") {
    const { offer_id } = body as { offer_id: string };
    await supabase
      .from("trade_offers")
      .update({ is_open: false })
      .eq("id", offer_id)
      .eq("offering_team_id", team_id);

    return NextResponse.json({ success: true });
  }

  // ---- PROPOSE AGREEMENT ----
  if (action === "propose_agreement") {
    const {
      partner_team_id,
      giving_resource,
      giving_amount,
      receiving_resource,
      receiving_amount,
      duration,
      auto_renew,
    } = body as {
      partner_team_id: string;
      giving_resource: string;
      giving_amount: number;
      receiving_resource: string;
      receiving_amount: number;
      duration: number;
      auto_renew: boolean;
    };

    const { error: insertErr } = await supabase
      .from("trade_agreements")
      .insert({
        game_id: gameId,
        team_a_id: team_id,
        team_b_id: partner_team_id,
        resource_a: giving_resource,
        amount_a: giving_amount,
        resource_b: receiving_resource,
        amount_b: receiving_amount,
        duration_epochs: duration,
        epochs_remaining: duration,
        auto_renew,
        status: "pending",
        created_epoch: currentEpoch,
      });

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  // ---- RESPOND TO AGREEMENT ----
  if (action === "respond_agreement") {
    const { agreement_id, response } = body as {
      agreement_id: string;
      response: "accept" | "decline";
    };

    const newStatus = response === "accept" ? "awaiting_approval" : "declined";
    await supabase
      .from("trade_agreements")
      .update({ status: newStatus })
      .eq("id", agreement_id);

    return NextResponse.json({ success: true, status: newStatus });
  }

  // ---- DM APPROVE AGREEMENT ----
  if (action === "approve_agreement") {
    const { agreement_id } = body as { agreement_id: string };
    await supabase
      .from("trade_agreements")
      .update({ status: "active" })
      .eq("id", agreement_id);

    return NextResponse.json({ success: true });
  }

  // ---- CANCEL AGREEMENT ----
  if (action === "cancel_agreement") {
    const { agreement_id } = body as { agreement_id: string };
    await supabase
      .from("trade_agreements")
      .update({ status: "cancelled" })
      .eq("id", agreement_id);

    // Reputation penalty logged
    await supabase.from("game_events").insert({
      game_id: gameId,
      epoch: currentEpoch,
      event_type: "agreement_cancelled",
      payload: { agreement_id, canceller_team_id: team_id, reputation_penalty: -10 },
    });

    return NextResponse.json({ success: true, reputationPenalty: -10 });
  }

  // ---- FILE EMBARGO ----
  if (action === "file_embargo") {
    const { target_team_id } = body as { target_team_id: string };
    if (!target_team_id) {
      return NextResponse.json({ error: "target_team_id required" }, { status: 400 });
    }

    const { error: insertErr } = await supabase.from("embargoes").insert({
      game_id: gameId,
      filer_team_id: team_id,
      target_team_id,
      filed_epoch: currentEpoch,
      is_active: true,
    });

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    await supabase.from("game_events").insert({
      game_id: gameId,
      epoch: currentEpoch,
      event_type: "embargo_filed",
      payload: { filer_team_id: team_id, target_team_id },
    });

    return NextResponse.json({ success: true });
  }

  // ---- LIFT EMBARGO ----
  if (action === "lift_embargo") {
    const { target_team_id } = body as { target_team_id: string };
    await supabase
      .from("embargoes")
      .update({ is_active: false })
      .eq("game_id", gameId)
      .eq("filer_team_id", team_id)
      .eq("target_team_id", target_team_id);

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
}
