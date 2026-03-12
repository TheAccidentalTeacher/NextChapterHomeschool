import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isTeacher } from "@/lib/auth/roles";
import { EPOCH_STEP_ORDER, getNextStep, type EpochStep } from "@/lib/game/epoch-machine";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Decays expired First Settler founding bonuses when the epoch increments.
 * Decision 90: yield_modifier reverts by 0.10 after first_settler_decay_epochs.
 */
async function applyFirstSettlerDecay(
  supabase: SupabaseClient,
  gameId: string,
  newEpoch: number,
) {
  const { data: zones } = await supabase
    .from("sub_zones")
    .select("id, founding_epoch, first_settler_decay_epochs, yield_modifier")
    .eq("game_id", gameId)
    .eq("founding_claim", "first_settler")
    .eq("founding_bonus_active", true);

  if (!zones?.length) return;

  for (const zone of zones as Array<{
    id: string;
    founding_epoch: number;
    first_settler_decay_epochs: number;
    yield_modifier: number;
  }>) {
    if (newEpoch >= (zone.founding_epoch ?? 0) + zone.first_settler_decay_epochs) {
      const reverted = Math.max(1.0, Number((zone.yield_modifier - 0.10).toFixed(2)));
      await supabase
        .from("sub_zones")
        .update({ founding_bonus_active: false, yield_modifier: reverted })
        .eq("id", zone.id);
    }
  }
}

/**
 * PUT /api/games/[id]/epoch/advance
 * DM advances the epoch/round state machine.
 * Body: { action: 'next_step' | 'next_epoch' | 'set_step', step?: EpochStep }
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: gameId } = await params;

  if (!(await isTeacher())) {
    return NextResponse.json({ error: "Teacher only" }, { status: 403 });
  }

  const body = await req.json();
  const action: string = body.action ?? "next_step";
  const supabase = await createClient();

  // Get current game state
  const { data: game, error: gameErr } = await supabase
    .from("games")
    .select("*")
    .eq("id", gameId)
    .single();

  if (gameErr || !game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  let updates: Record<string, unknown> = {};
  let epochIncremented = false;
  let newEpoch = game.current_epoch;

  switch (action) {
    case "next_step": {
      const currentStep = (game.current_round ?? "login") as EpochStep;
      const nextStep = getNextStep(currentStep);

      if (!nextStep) {
        // End of epoch — advance to next epoch's login
        newEpoch = game.current_epoch + 1;
        epochIncremented = true;
        updates = {
          current_epoch: newEpoch,
          current_round: "login",
          epoch_phase: "active",
        };
      } else {
        updates = {
          current_round: nextStep,
          epoch_phase: "active",
        };
      }
      break;
    }

    case "next_epoch": {
      newEpoch = game.current_epoch + 1;
      epochIncremented = true;
      updates = {
        current_epoch: newEpoch,
        current_round: "login",
        epoch_phase: "active",
      };
      break;
    }

    case "set_step": {
      const step = body.step as EpochStep;
      if (!EPOCH_STEP_ORDER.includes(step)) {
        return NextResponse.json({ error: "Invalid step" }, { status: 400 });
      }
      updates = { current_round: step };
      break;
    }

    case "pause": {
      updates = { epoch_phase: "resolving" };
      break;
    }

    case "unpause": {
      updates = { epoch_phase: "active" };
      break;
    }

    case "resolve": {
      updates = {
        current_round: "resolve",
        epoch_phase: "resolving",
      };
      break;
    }

    default:
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const { data: updated, error: updateErr } = await supabase
    .from("games")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", gameId)
    .select()
    .single();

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  // After epoch increments, expire any First Settler founding bonuses (Decision 90)
  if (epochIncremented) {
    await applyFirstSettlerDecay(supabase, gameId, newEpoch);
  }

  return NextResponse.json(updated);
}
