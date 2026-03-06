import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isTeacher } from "@/lib/auth/roles";
import { EPOCH_STEP_ORDER, getNextStep, type EpochStep } from "@/lib/game/epoch-machine";

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

  switch (action) {
    case "next_step": {
      const currentStep = (game.current_round ?? "login") as EpochStep;
      const nextStep = getNextStep(currentStep);

      if (!nextStep) {
        // End of epoch — advance to next epoch's login
        updates = {
          current_epoch: game.current_epoch + 1,
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
      updates = {
        current_epoch: game.current_epoch + 1,
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

  return NextResponse.json(updated);
}
