// =============================================================
// POST /api/dm/[id]/simulate/step
// DM-only endpoint: simulates ONE epoch step using 7th-grader-
// quality AI responses for all teams, then advances the game.
//
// Designed for teacher "preview" runs — lets the teacher watch
// the game flow in real-time across open student windows without
// needing real students to submit.
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import { createDirectClient } from "@/lib/supabase/admin";
import { requireTeacher } from "@/lib/auth/roles";
import { EPOCH_STEP_ORDER, getNextStep, STEP_TO_ROUND, STEP_TO_RESOURCE } from "@/lib/game/epoch-machine";
import type { EpochStep } from "@/lib/game/epoch-machine";

// ── Roles per action step ────────────────────────────────────
const STEP_TO_ROLE: Record<string, string> = {
  build:  "architect",
  expand: "merchant",
  define: "lorekeeper",
  defend: "warlord",
};

// ── Score → multiplier (mirrors solo submit logic) ───────────
const SCORE_MULTIPLIER: Record<number, number> = {
  1: 0.5,
  2: 0.75,
  3: 1.0,
  4: 1.5,
  5: 2.0,
};

function earnedFromScore(score: number): number {
  return Math.max(2, Math.round(score * 5 * (SCORE_MULTIPLIER[score] ?? 1.0)));
}

// ── 7th-grader justification pool ───────────────────────────
// 3 quality levels (scores 2, 3, 4) × 4 round types × variety
// Each array entry: { score, justification }

type JustEntry = { score: number; text: string; option: string };

const JUSTIFICATIONS: Record<string, JustEntry[]> = {
  BUILD: [
    {
      score: 2,
      option: "a",
      text: "I think we should build a farm because we need food. Without food our people will be hungry and we can't grow.",
    },
    {
      score: 3,
      option: "a",
      text: "I propose building a farm because early civilizations like Ancient Egypt depended on agriculture along the Nile. Food surplus allowed specialization. Without a stable food supply our civilization cannot grow its population or fund other projects.",
    },
    {
      score: 4,
      option: "c",
      text: "I recommend building walls to protect our settlement because the earliest cities like Jericho (built around 8000 BC) were walled for a reason. Mesopotamian city-states like Uruk built massive mud-brick walls because raids were constant. Without defense, any food or production we create can be taken. History shows that undefended settlements were destroyed while fortified ones like Jerusalem survived thousands of years of conflict.",
    },
    {
      score: 2,
      option: "b",
      text: "We should build a granary so our food doesn't spoil. This keeps the food safe for hard times.",
    },
    {
      score: 3,
      option: "b",
      text: "Building a granary makes sense because the Egyptians stored grain in state granaries managed by scribes. Joseph in Egypt famously stored seven years of grain before famine. A granary protects us from drought and lets us trade food surpluses for other resources.",
    },
    {
      score: 4,
      option: "a",
      text: "I propose building irrigation channels because Mesopotamian civilizations in the Tigris-Euphrates valley survived in a dry land only because of massive irrigation projects. The Sumerians built canals as early as 6000 BC which turned desert into farmland. Without reliable water access, our food production depends completely on rainfall — making us vulnerable to any dry season. History shows that water infrastructure was the single biggest factor separating thriving early cities from failed ones.",
    },
  ],
  EXPAND: [
    {
      score: 2,
      option: "a",
      text: "We should expand through trade so we can get more stuff. Other civilizations have things we don't have and trading helps.",
    },
    {
      score: 3,
      option: "b",
      text: "I propose sending merchants along trade routes because the Silk Road connected China to Rome and made both empires incredibly wealthy. The Phoenicians became the most powerful traders in the ancient Mediterranean by establishing port cities as far as Carthage. More reach means accessing resources our home region doesn't have.",
    },
    {
      score: 4,
      option: "a",
      text: "Our expansion should focus on establishing maritime trade routes because the historical record is clear: civilizations with sea access consistently out-competed landlocked rivals. Athens funded its golden age (democracy, the Parthenon, philosophy) almost entirely through port taxes at Piraeus. Portugal's investment in navigation in the 1400s under Prince Henry returned 10x in gold and spices within 50 years. Reach points are the multiplier for everything else — without them we trade with our neighbors only while other civilizations trade with the whole world.",
    },
    {
      score: 2,
      option: "c",
      text: "We should explore new lands to grow bigger. More land means more resources and more power.",
    },
    {
      score: 3,
      option: "a",
      text: "Establishing trade networks first makes strategic sense because the Mesopotamian city of Ur had merchants traveling to the Indus Valley 4,500 years ago. The resources they brought back — copper, lapis lazuli, wood — couldn't be found locally. Building reach now means we can import what we lack rather than going without.",
    },
    {
      score: 4,
      option: "b",
      text: "I argue for building a merchant navy because the Venetian Republic between 1000-1500 AD demonstrated that commercial maritime power creates compounding wealth. Venice started as a small city on a lagoon with no farmland and no natural resources — yet it became the richest city in Europe purely through trading reach. Each investment in ships returned 3-5x in goods from Constantinople, Egypt, and the Black Sea. Our civilization needs this multiplication effect now while others are still building locally.",
    },
  ],
  DEFINE: [
    {
      score: 2,
      option: "a",
      text: "We should create art and culture because it makes our civilization special. People will remember us for our culture.",
    },
    {
      score: 3,
      option: "b",
      text: "I propose investing in writing and record-keeping because the Sumerian invention of cuneiform script around 3200 BC was the foundation of civilization itself. Without records, there's no law, no trade agreements, no history. The Egyptians used hieroglyphics to coordinate the entire pyramid construction workforce. Written legacy makes our civilization permanent.",
    },
    {
      score: 4,
      option: "a",
      text: "Developing a strong cultural identity through mythology and art is strategically important because it creates social cohesion that holds civilizations together under stress. The Greeks used their shared mythology (Homer's Iliad and Odyssey) to maintain cultural identity even when politically fragmented. Rome adopted and adapted Greek culture, then used that shared Greco-Roman identity to hold together an empire of 50 million people speaking dozens of languages. Culture is the glue — without it, growth creates fragmentation. Our legacy investment now is the foundation of long-term unity.",
    },
    {
      score: 2,
      option: "c",
      text: "We should create laws because laws keep people organized. Without laws things get chaotic.",
    },
    {
      score: 3,
      option: "a",
      text: "Establishing a code of laws makes sense because Hammurabi's Code (about 1754 BC) was revolutionary — it created consistent rules for trade, property, and justice across the Babylonian empire. Before written law, disputes were settled by whoever had more power. A legal system lets our civilization scale up without breaking down into chaos as population grows.",
    },
    {
      score: 4,
      option: "b",
      text: "I recommend investing in an oral tradition and historical records because civilizations that lose their history lose their identity. The oral traditions of West African kingdoms like Mali preserved hundreds of years of history through the griot storytelling class. When the Mali Empire declined, the griots kept the culture alive until it could be written down. Unlike buildings which can be burned or statues which can be toppled, cultural memory distributed through a trained class of performers and teachers is nearly indestructible. Legacy points represent this kind of cultural resilience.",
    },
  ],
  DEFEND: [
    {
      score: 2,
      option: "a",
      text: "We should build walls to defend ourselves because enemies could attack us and walls would stop them.",
    },
    {
      score: 3,
      option: "b",
      text: "I propose training a standing army because the Roman Republic's military success came from a professional, disciplined force that trained year-round. Unlike the Greeks who used citizen-soldiers only in summer, Rome's legions were available year-round and could respond to threats anywhere in the empire. Without a trained force, we're vulnerable whenever another civilization decides to expand at our expense.",
    },
    {
      score: 4,
      option: "a",
      text: "The best defensive strategy is a layered one: walls plus a mobile force, because history shows that walls alone always eventually fall but walls plus a mobile response force (like the Byzantine Empire's dual defense system) lasted centuries longer than pure defense. Constantinople held out for 1,000 years after Rome fell because it combined massive triple walls with a naval fleet that could respond to threats on three sides. Pure static defense always loses eventually — the question is how to fail gracefully and buy enough time. Our resilience investment should go toward this layered approach.",
    },
    {
      score: 2,
      option: "c",
      text: "Diplomacy is the best defense because if we make friends, no one will attack us and we save resources.",
    },
    {
      score: 3,
      option: "a",
      text: "I recommend fortifying our borders because the Great Wall of China, while it didn't stop every invasion, fundamentally changed how enemies had to attack — requiring massive coordinated armies rather than quick raids. This deterrence worked for centuries. A civilization that looks expensive to conquer gets left alone.",
    },
    {
      score: 4,
      option: "b",
      text: "Strategic alliances are undervalued as a defense mechanism because the Persian Empire fell not to a superior army but to a long string of enemies it had failed to manage diplomatically. Alexander the Great succeeded in part because the Persians had alienated Egypt, Babylon, and their own provincial governors — who welcomed the Macedonians as liberators. Meanwhile Sparta survived for centuries not through pure military strength but through a network of defensive alliances (the Peloponnesian League). Our resilience points should be split between physical defense AND the diplomatic relationships that prevent conflicts from starting.",
    },
  ],
};

// Pick a justification pseudo-randomly (varies per team + epoch)
function pickJustification(roundType: string, teamIdx: number, epoch: number): JustEntry {
  const pool = JUSTIFICATIONS[roundType] ?? JUSTIFICATIONS.BUILD;
  const idx = (teamIdx * 7 + epoch * 3) % pool.length;
  return pool[idx];
}

// ── Main handler ─────────────────────────────────────────────
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: gameId } = await params;

  // Teacher-only
  try {
    await requireTeacher();
  } catch {
    return NextResponse.json({ error: "Teacher only" }, { status: 403 });
  }

  const supabase = createDirectClient();

  // 1. Get current game state
  const { data: game, error: gameErr } = await supabase
    .from("games")
    .select("current_epoch, current_round, epoch_phase")
    .eq("id", gameId)
    .single();

  if (gameErr || !game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  const currentStep = game.current_round as EpochStep;
  const epoch = game.current_epoch as number;

  // 2. Get all teams
  const { data: teams } = await supabase
    .from("teams")
    .select("id, name, civilization_name")
    .eq("game_id", gameId)
    .order("created_at", { ascending: true });

  if (!teams || teams.length === 0) {
    return NextResponse.json({ error: "No teams found" }, { status: 404 });
  }

  // 3. Work out what to do
  const isActionStep = ["build", "expand", "define", "defend"].includes(currentStep);
  const isRoutingStep = ["build_routing", "expand_routing", "define_routing", "defend_routing"].includes(currentStep);
  const log: Array<{ team: string; action: string; score?: number; earned?: number }> = [];

  if (isActionStep) {
    const roundType = STEP_TO_ROUND[currentStep] as string;
    const role = STEP_TO_ROLE[currentStep];
    const resourceType = STEP_TO_RESOURCE[currentStep] as string;

    for (let i = 0; i < teams.length; i++) {
      const team = teams[i];
      const just = pickJustification(roundType, i, epoch);

      // Check for existing submission (idempotent)
      const { data: existing } = await supabase
        .from("epoch_submissions")
        .select("id")
        .eq("game_id", gameId)
        .eq("team_id", team.id)
        .eq("epoch", epoch)
        .eq("round_type", roundType)
        .eq("role", role)
        .maybeSingle();

      if (!existing) {
        const earned = earnedFromScore(just.score);

        // Insert submission with score pre-applied
        await supabase.from("epoch_submissions").insert({
          game_id: gameId,
          team_id: team.id,
          epoch,
          round_type: roundType,
          role,
          submitted_by: "dm_simulate",
          content: JSON.stringify({
            option_selected: just.option,
            justification_text: just.text,
            simulated: true,
          }),
          dm_score: just.score,
          dm_feedback: `[Simulated 7th-grader | Score ${just.score}/5]`,
          scored_at: new Date().toISOString(),
        });

        // Apply resource bonus directly
        const { data: existing_res } = await supabase
          .from("team_resources")
          .select("amount")
          .eq("team_id", team.id)
          .eq("resource_type", resourceType)
          .maybeSingle();

        const currentAmt = existing_res?.amount ?? 0;
        await supabase
          .from("team_resources")
          .upsert(
            { team_id: team.id, resource_type: resourceType, amount: currentAmt + earned },
            { onConflict: "team_id,resource_type" }
          );

        log.push({
          team: team.civilization_name ?? team.name,
          action: `${roundType} submitted`,
          score: just.score,
          earned,
        });
      } else {
        log.push({ team: team.civilization_name ?? team.name, action: "already submitted — skipped" });
      }
    }
  } else if (isRoutingStep) {
    // Routing steps: auto-allocate resources (skip actual routing mechanics,
    // just let the game advance — resources were already applied in the action step)
    log.push({ team: "all teams", action: `routing phase skipped (resources already applied)` });
  } else {
    // login / resolve / exit — nothing to submit, just advance
    log.push({ team: "game", action: `${currentStep} — advancing` });
  }

  // 4. Advance the step
  const nextStep = getNextStep(currentStep);
  let newEpoch = epoch;

  if (nextStep === null || currentStep === "exit") {
    // End of epoch — go to next epoch login
    newEpoch = epoch + 1;
    await supabase
      .from("games")
      .update({ current_epoch: newEpoch, current_round: "login", epoch_phase: "active" })
      .eq("id", gameId);
  } else {
    await supabase
      .from("games")
      .update({ current_round: nextStep, epoch_phase: "active" })
      .eq("id", gameId);
  }

  return NextResponse.json({
    prevStep: currentStep,
    nextStep: nextStep ?? "login",
    epoch,
    newEpoch,
    log,
  });
}
