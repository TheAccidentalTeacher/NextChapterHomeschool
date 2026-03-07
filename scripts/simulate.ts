#!/usr/bin/env npx tsx
// ============================================================
// ClassCiv Game Simulation Engine
// ============================================================
// Runs a complete game with 36 simulated students across 6 teams
// through 30 epochs (330 state transitions). Talks directly to
// Supabase, bypassing Clerk auth.
//
// Usage:
//   npx tsx scripts/simulate.ts                    # full 30-epoch game (6-week arc)
//   npx tsx scripts/simulate.ts --epochs 3         # just 3 epochs
//   npx tsx scripts/simulate.ts --teams 4          # 4 teams instead of 6
//   npx tsx scripts/simulate.ts --fast             # skip delays
//   npx tsx scripts/simulate.ts --cinematic        # slow cinematic mode (watch on /projector)
//   npx tsx scripts/simulate.ts --dry-run          # don't write to DB
//   npx tsx scripts/simulate.ts --cleanup GAME_ID  # delete a sim game
// ============================================================

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// ── Load env from .env.local ──────────────────────────────────
function loadEnv() {
  const envPath = path.resolve(__dirname, "..", ".env.local");
  if (!fs.existsSync(envPath)) {
    console.error("❌ .env.local not found at", envPath);
    process.exit(1);
  }
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}
loadEnv();

// ── Supabase client (service-role-style: uses anon key + no RLS for inserts) ─
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Missing SUPABASE env vars");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── CLI arg parsing ───────────────────────────────────────────
const args = process.argv.slice(2);
function getArg(flag: string, defaultVal: string): string {
  const idx = args.indexOf(flag);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : defaultVal;
}
const TOTAL_EPOCHS = parseInt(getArg("--epochs", "30"));
const TEAM_COUNT = parseInt(getArg("--teams", "6"));
const STUDENTS_PER_TEAM = parseInt(getArg("--students-per-team", "6"));
const FAST_MODE = args.includes("--fast");
const CINEMATIC_MODE = args.includes("--cinematic"); // Slow watchable mode for /projector view
const DRY_RUN = args.includes("--dry-run");
const CLEANUP_ID = args.includes("--cleanup") ? getArg("--cleanup", "") : null;

// ── Constants (mirroring src/lib/constants.ts) ────────────────
const ROLES = ["architect", "merchant", "diplomat", "lorekeeper", "warlord"] as const;
type RoleName = (typeof ROLES)[number];

const ROUNDS = ["BUILD", "EXPAND", "DEFINE", "DEFEND"] as const;
type RoundType = (typeof ROUNDS)[number];

const RESOURCES = ["production", "reach", "legacy", "resilience", "food"] as const;

const ROUND_TO_RESOURCE: Record<string, string> = {
  BUILD: "production",
  EXPAND: "reach",
  DEFINE: "legacy",
  DEFEND: "resilience",
};

const STEP_TO_ROUND: Record<string, RoundType> = {
  build: "BUILD",
  build_routing: "BUILD",
  expand: "EXPAND",
  expand_routing: "EXPAND",
  define: "DEFINE",
  define_routing: "DEFINE",
  defend: "DEFEND",
  defend_routing: "DEFEND",
};

const LEAD_ROLES: Record<string, RoleName> = {
  build: "architect",
  expand: "merchant",
  define: "diplomat",
  defend: "warlord",
};

const EPOCH_STEPS = [
  "login",
  "build",
  "build_routing",
  "expand",
  "expand_routing",
  "define",
  "define_routing",
  "defend",
  "defend_routing",
  "resolve",
  "exit",
] as const;
type EpochStep = (typeof EPOCH_STEPS)[number];

const ACTION_STEPS = ["build", "expand", "define", "defend"] as const;
const ROUTING_STEPS = ["build_routing", "expand_routing", "define_routing", "defend_routing"] as const;

// Region IDs are integers 1–12 in the DB (Decision 60)
const REGION_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
const REGION_NAMES: Record<number, string> = {
  1: "North America West", 2: "North America East", 3: "Central America",
  4: "South America", 5: "Europe West", 6: "Europe East",
  7: "Africa North", 8: "Africa South", 9: "Middle East",
  10: "Asia Central", 11: "Asia East", 12: "Pacific",
};

const TERRAIN_TYPES = ["plains", "forest", "mountain", "desert", "coastal", "river_valley", "tundra", "jungle"] as const;

// ── Student Personality Profiles ─────────────────────────────
// Each student has a personality that affects how they play.
// This creates realistic variation — some kids try hard,
// some pick randomly, some always go aggressive.

type Personality =
  | "scholar"       // Always picks optimal, writes great justifications
  | "adventurer"    // Picks bold/risky options, decent justifications
  | "cautious"      // Picks safe/defensive options
  | "random"        // Total chaos agent
  | "minimalist"    // Does bare minimum, short justifications
  | "warmonger";    // Always picks military/aggressive options

const PERSONALITY_DISTRIBUTION: Personality[] = [
  "scholar", "scholar",
  "adventurer", "adventurer", "adventurer",
  "cautious", "cautious",
  "random", "random", "random",
  "minimalist", "minimalist",
  "warmonger",
];

const STUDENT_NAMES = [
  "Aiden", "Bella", "Carter", "Daisy", "Ethan", "Fiona",
  "Gavin", "Harper", "Isaiah", "Jade", "Kai", "Luna",
  "Mason", "Nora", "Oliver", "Piper", "Quinn", "Riley",
  "Sofia", "Theo", "Uma", "Victor", "Willow", "Xander",
  "Yara", "Zane", "Aria", "Blake", "Cora", "Derek",
  "Elena", "Felix", "Gemma", "Henry", "Ivy", "Jack",
];

const CIV_NAMES = [
  "The Ember Dominion", "Stormhold Republic", "Ironveil Confederacy",
  "Tidecrest Alliance", "Shadowpeak Kingdom", "Sunforge Empire",
  "Frostmarch Collective", "Thornwood Federation", "Starfall Sovereignty",
  "Dustwind Territories", "Moonhaven Commonwealth", "Blazecrest Union",
];

interface SimStudent {
  id: string;            // Fake clerk user ID
  name: string;
  personality: Personality;
  teamIndex: number;
  assignedRole: RoleName;
}

interface SimTeam {
  id: string;            // DB UUID after creation
  name: string;
  civName: string;
  region: string;
  students: SimStudent[];
  resources: Record<string, number>;
  farmCount: number;     // tracked buildings of type farm
  population: number;
  warExhaustion: number;
  isInDarkAge: boolean;
}

// ── Justification Generator ──────────────────────────────────
// Generates justifications based on personality + round

const JUSTIFICATION_TEMPLATES: Record<Personality, (round: RoundType, option: string) => string> = {
  scholar: (round, option) => {
    const facts: Record<RoundType, string> = {
      BUILD: `The construction of ${option} mirrors the infrastructure priorities of ancient Mesopotamia. Historically, civilizations that invested early in ${option.toLowerCase()} saw compound returns over multiple generations.`,
      EXPAND: `Territorial expansion through ${option} follows the pattern set by the Roman Republic. Our merchants need trade routes to sustain long-term economic growth.`,
      DEFINE: `${option} establishes cultural identity similar to the Greek city-states. A strong cultural foundation prevents internal fractures during times of crisis.`,
      DEFEND: `${option} is the strategically sound defensive choice. Sun Tzu wrote that preparation before conflict begins determines its outcome.`,
    };
    return facts[round];
  },
  adventurer: (round, option) => {
    const lines: Record<RoundType, string> = {
      BUILD: `Let's go BIG with ${option}! Fortune favors the bold. If we don't take risks now, we'll fall behind the other civilizations.`,
      EXPAND: `We NEED to push our borders out with ${option}. The more territory we hold, the more resources we control. Let's move fast!`,
      DEFINE: `${option} will make our civilization legendary. We should be the ones setting the trends, not following them.`,
      DEFEND: `${option} sends a message — we're not to be messed with. Best defense is knowing you CAN attack if you have to.`,
    };
    return lines[round];
  },
  cautious: (round, option) => {
    const lines: Record<RoundType, string> = {
      BUILD: `I think ${option} is the safest choice right now. We should build a solid foundation before trying anything risky.`,
      EXPAND: `${option} lets us grow without overextending. We need to make sure we can defend what we already have first.`,
      DEFINE: `${option} is a stable choice for our culture. We shouldn't rock the boat when things are going okay.`,
      DEFEND: `Definitely ${option}. We need to protect our people first. Everything else can wait until we're secure.`,
    };
    return lines[round];
  },
  random: (round, option) => {
    const chaos = [
      `${option} seems cool I guess. My friend said her civilization picked this and it worked out. So yeah let's do that.`,
      `I picked ${option} because the name sounded cool. Also I think it matches what we need right now maybe.`,
      `${option}! I don't know exactly why but my gut says this is the move. Trust the vibes on this one.`,
      `Going with ${option} because why not. Sometimes you just gotta pick something and see what happens. YOLO civilization.`,
    ];
    return chaos[Math.floor(Math.random() * chaos.length)];
  },
  minimalist: (round, option) => {
    return `I pick ${option}. It seems good for our civilization. We should do this because it will help us grow and get stronger.`;
  },
  warmonger: (round, option) => {
    const lines: Record<RoundType, string> = {
      BUILD: `${option} but only because we need it to build our army up. Every building should serve our military goals first.`,
      EXPAND: `${option} gives us more territory to recruit soldiers from. The more land we control, the bigger our army gets.`,
      DEFINE: `${option} because a warrior culture is the strongest culture. Our people need to know that strength is what matters.`,
      DEFEND: `DEFINITELY ${option}. Military power is everything. The other civilizations need to fear us or they'll attack first.`,
    };
    return lines[round];
  },
};

// ── Option Selection Logic ───────────────────────────────────
// Different personalities pick differently

function pickOption(personality: Personality, options: string[], round: RoundType): string {
  switch (personality) {
    case "scholar":
      // Always picks first option (assumed optimal in question bank design)
      return options[0];
    case "adventurer":
      // Picks second option (risky/bold) if available
      return options.length > 1 ? options[1] : options[0];
    case "cautious":
      // Picks first option (safe)
      return options[0];
    case "random":
      return options[Math.floor(Math.random() * options.length)];
    case "minimalist":
      // Picks first option (least effort to justify)
      return options[0];
    case "warmonger":
      // Picks last option (often the aggressive one)
      return options[options.length - 1];
  }
}

// ── Justification Quality → Multiplier ──────────────────────
// Maps personality to how good their justification is (0.5–2.0)

function getJustificationMultiplier(personality: Personality): number {
  const map: Record<Personality, number> = {
    scholar: 1.8,      // Excellent — cites history
    adventurer: 1.3,   // Good energy, decent reasoning
    cautious: 1.2,     // Solid but unimaginative
    random: 0.8,       // Low quality, vague
    minimalist: 0.6,   // Bare minimum
    warmonger: 1.0,    // Average — focused but one-note
  };
  return map[personality];
}

// ── D20 Roll ─────────────────────────────────────────────────

function rollD20(): number {
  return Math.floor(Math.random() * 20) + 1;
}

function d20Modifier(roll: number): number {
  if (roll <= 8) return 1.25;      // Positive outcome
  if (roll <= 10) return 1.5;      // Extremely positive
  if (roll <= 18) return 0.75;     // Moderate negative
  return 0.5;                       // Extremely negative (19-20)
}

// ── Yield Calculator (mirrors src/lib/game/yield-calculator.ts) ─

function calculateBaseYield(epoch: number): number {
  if (epoch <= 3) return 8;
  if (epoch <= 7) return 10;
  if (epoch <= 11) return 12;
  return 15;
}

function calculateYield(opts: {
  epoch: number;
  justificationMult: number;
  d20Roll: number;
  population: number;
  isInDarkAge: boolean;
  warExhaustionLevel: number;
}): number {
  const base = calculateBaseYield(opts.epoch);
  const d20Mod = d20Modifier(opts.d20Roll);
  const popMod = opts.population >= 10 ? 1.15 : opts.population <= 3 ? 0.75 : 1.0;
  const darkAgeMod = opts.isInDarkAge ? 0.5 : 1.0;
  const warMod = opts.warExhaustionLevel === 0 ? 1.0
    : opts.warExhaustionLevel === 1 ? 0.85 : 0.7;

  const raw = base * opts.justificationMult * d20Mod * popMod * darkAgeMod * warMod;
  return Math.max(1, Math.floor(raw));
}

// ── Population Engine (mirrors src/lib/game/population-engine.ts) ─

const FOOD_PER_FARM_SIM = 5; // Must match population-engine.ts FOOD_PER_FARM (30-epoch calibration)

function tickPopulation(pop: number, food: number, farmCount: number = 0): { newPop: number; newFood: number; event: string } {
  // Farm food generation (passive each epoch if farm exists)
  const farmYield = farmCount * FOOD_PER_FARM_SIM;
  const foodAfterFarms = food + farmYield;

  const consumption = pop; // 1 food per person
  let remainingFood = foodAfterFarms - consumption;
  let newPop = pop;
  let event = "";

  if (remainingFood < 0) {
    // Famine
    newPop = Math.max(1, pop - 1);
    remainingFood = 0;
    event = "⚠️ FAMINE — population lost 1 (food ran out)";
  } else if (remainingFood > pop * 1.5) {
    // Growth
    newPop = pop + 1;
    event = "📈 GROWTH — food surplus triggered +1 population";
  }

  // Spoilage: 10% of stored food
  const spoilage = Math.floor(remainingFood * 0.1);
  remainingFood = Math.max(0, remainingFood - spoilage);
  if (spoilage > 0) {
    event += (event ? " | " : "") + `🪱 Spoilage: lost ${spoilage} food`;
  }

  return { newPop, newFood: remainingFood, event };
}

// ── Bank Decay (mirrors src/lib/game/bank-decay.ts) ──────────

function applyBankDecay(resources: Record<string, number>): { decayed: Record<string, number>; events: string[] } {
  const events: string[] = [];
  const decayed = { ...resources };

  for (const key of ["production", "reach", "legacy", "resilience"]) {
    const before = decayed[key] ?? 0;
    if (before > 0) {
      decayed[key] = Math.floor(before * 0.95); // 5% decay (calibrated for 30-epoch arc)
      const lost = before - decayed[key];
      if (lost > 0) events.push(`💸 Bank decay: ${key} lost ${lost} (${before} → ${decayed[key]})`);
    }
  }

  return { decayed, events };
}

// ── Dark Age Check (mirrors src/lib/game/dark-ages.ts) ────────

function checkDarkAge(pop: number, resilience: number, warExhaustion: number, currentlyInDarkAge: boolean) {
  if (currentlyInDarkAge) {
    // Recovery check
    if (pop >= 5 && resilience >= 10) {
      return { isInDarkAge: false, event: "🌅 DARK AGE ENDED — population and resilience recovered!" };
    }
    return { isInDarkAge: true, event: "" };
  }

  // Trigger check: pop ≤ 3 AND resilience ≤ 0 AND war exhaustion ≥ 75
  if (pop <= 3 && resilience <= 0 && warExhaustion >= 75) {
    return { isInDarkAge: true, event: "🌑 DARK AGE TRIGGERED — civilization in crisis!" };
  }
  return { isInDarkAge: false, event: "" };
}

// ── Logging Utilities ────────────────────────────────────────

const COLORS = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  bgBlue: "\x1b[44m",
  bgMagenta: "\x1b[45m",
  bgCyan: "\x1b[46m",
};

function banner(text: string) {
  const line = "═".repeat(60);
  console.log(`\n${COLORS.bgBlue}${COLORS.white}${COLORS.bright} ${line} ${COLORS.reset}`);
  console.log(`${COLORS.bgBlue}${COLORS.white}${COLORS.bright}  ${text.padEnd(59)}${COLORS.reset}`);
  console.log(`${COLORS.bgBlue}${COLORS.white}${COLORS.bright} ${line} ${COLORS.reset}\n`);
}

function subBanner(text: string) {
  console.log(`\n${COLORS.cyan}${COLORS.bright}  ┌─ ${text} ${"─".repeat(Math.max(0, 50 - text.length))}┐${COLORS.reset}`);
}

function log(icon: string, msg: string) {
  console.log(`  ${icon}  ${msg}`);
}

function logTeamState(team: SimTeam) {
  const res = Object.entries(team.resources)
    .map(([k, v]) => `${k}=${v}`)
    .join(", ");
  console.log(
    `  ${COLORS.dim}    ${team.civName}: pop=${team.population} war=${team.warExhaustion} darkAge=${team.isInDarkAge} | ${res}${COLORS.reset}`
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Routing Decision ─────────────────────────────────────────
// Each team's lead role decides how to split earned resources

function routeResources(
  personality: Personality,
  earned: number
): { spend: number; contribute: number; bank: number } {
  switch (personality) {
    case "scholar":
      // Balanced
      return {
        spend: Math.floor(earned * 0.3),
        contribute: Math.floor(earned * 0.3),
        bank: earned - Math.floor(earned * 0.3) - Math.floor(earned * 0.3),
      };
    case "adventurer":
      // Spend heavy
      return {
        spend: Math.floor(earned * 0.6),
        contribute: Math.floor(earned * 0.2),
        bank: earned - Math.floor(earned * 0.6) - Math.floor(earned * 0.2),
      };
    case "cautious":
      // Bank heavy
      return {
        spend: Math.floor(earned * 0.1),
        contribute: Math.floor(earned * 0.2),
        bank: earned - Math.floor(earned * 0.1) - Math.floor(earned * 0.2),
      };
    case "random":
      // Chaotic split
      const s = Math.floor(Math.random() * earned);
      const c = Math.floor(Math.random() * (earned - s));
      return { spend: s, contribute: c, bank: earned - s - c };
    case "minimalist":
      // Bank everything
      return { spend: 0, contribute: 0, bank: earned };
    case "warmonger":
      // ALL spend (military)
      return {
        spend: Math.floor(earned * 0.8),
        contribute: 0,
        bank: earned - Math.floor(earned * 0.8),
      };
  }
}

// ═══════════════════════════════════════════════════════════════
// MAIN SIMULATION
// ═══════════════════════════════════════════════════════════════

async function cleanup(gameId: string) {
  banner("CLEANUP MODE");
  log("🗑️", `Deleting game ${gameId} and all related data...`);

  // Get all team IDs for this game first
  const { data: teams } = await supabase
    .from("teams")
    .select("id")
    .eq("game_id", gameId);
  const teamIds = (teams ?? []).map((t: { id: string }) => t.id);
  log("📋", `Found ${teamIds.length} teams to clean up`);

  // Delete team-linked data (uses team_id, not game_id)
  if (teamIds.length > 0) {
    for (const table of ["team_resources", "team_members", "civilization_names"]) {
      const col = table === "civilization_names" ? "team_id" : "team_id";
      const { error } = await supabase.from(table).delete().in(col, teamIds);
      log(error ? "⚠️" : "✅", `  ${table}: ${error?.message ?? "cleaned"}`);
    }
  }

  // Delete game-linked data
  for (const table of ["epoch_submissions", "teams", "games"]) {
    const column = table === "games" ? "id" : "game_id";
    const { error } = await supabase.from(table).delete().eq(column, gameId);
    log(error ? "⚠️" : "✅", `  ${table}: ${error?.message ?? "cleaned"}`);
  }

  log("🏁", "Cleanup complete!");
}

async function main() {
  // ── Handle cleanup mode ──
  if (CLEANUP_ID) {
    await cleanup(CLEANUP_ID);
    return;
  }

  const startTime = Date.now();

  banner("ClassCiv Simulation Engine");
  log("⚙️", `Epochs: ${TOTAL_EPOCHS} | Teams: ${TEAM_COUNT} | Students/team: ${STUDENTS_PER_TEAM}`);
  log("⚙️", `Total students: ${TEAM_COUNT * STUDENTS_PER_TEAM}`);
  log("⚙️", `Dry run: ${DRY_RUN} | Fast mode: ${FAST_MODE} | Cinematic: ${CINEMATIC_MODE}`);
  log("⚙️", `Supabase: ${SUPABASE_URL.substring(0, 40)}...`);
  console.log();

  if (CINEMATIC_MODE) {
    console.log(`${COLORS.bright}╔══════════════════════════════════════════════════════════╗${COLORS.reset}`);
    console.log(`${COLORS.bright}║  🎬  CINEMATIC MODE — Open the projector NOW:            ║${COLORS.reset}`);
    console.log(`${COLORS.bright}║                                                          ║${COLORS.reset}`);
    console.log(`${COLORS.bright}║  http://localhost:3000/projector                         ║${COLORS.reset}`);
    console.log(`${COLORS.bright}║  https://YOUR-VERCEL-URL.vercel.app/projector            ║${COLORS.reset}`);
    console.log(`${COLORS.bright}║                                                          ║${COLORS.reset}`);
    console.log(`${COLORS.bright}║  Game starts in 15 seconds...                            ║${COLORS.reset}`);
    console.log(`${COLORS.bright}╚══════════════════════════════════════════════════════════╝${COLORS.reset}`);
    console.log();
    await sleep(15000); // 15 second head start to open the browser
  }

  // ── Step 1: Generate students ──────────────────────────────
  subBanner("Step 1: Generating Students");

  const allStudents: SimStudent[] = [];
  for (let t = 0; t < TEAM_COUNT; t++) {
    for (let s = 0; s < STUDENTS_PER_TEAM; s++) {
      const idx = t * STUDENTS_PER_TEAM + s;
      const personalityIdx = idx % PERSONALITY_DISTRIBUTION.length;
      const student: SimStudent = {
        id: `sim_student_${idx + 1}`,
        name: STUDENT_NAMES[idx % STUDENT_NAMES.length],
        personality: PERSONALITY_DISTRIBUTION[personalityIdx],
        teamIndex: t,
        assignedRole: ROLES[s % ROLES.length],
      };
      allStudents.push(student);
    }
  }

  for (let t = 0; t < TEAM_COUNT; t++) {
    const teamStudents = allStudents.filter((s) => s.teamIndex === t);
    log("👥", `Team ${t + 1} (${CIV_NAMES[t]}): ${teamStudents.map((s) => `${s.name}[${s.personality}/${s.assignedRole}]`).join(", ")}`);
  }

  // ── Step 2: Create game in DB ──────────────────────────────
  subBanner("Step 2: Creating Game");

  let gameId: string;

  if (DRY_RUN) {
    gameId = "dry-run-game-id";
    log("🎮", `[DRY RUN] Would create game "Simulation Test"`);
  } else {
    const { data: game, error } = await supabase
      .from("games")
      .insert({
        name: `Simulation ${new Date().toISOString().slice(0, 16)}`,
        teacher_id: "sim_teacher",
        current_epoch: 1,
        current_round: "login",
        epoch_phase: "active",
        math_gate_enabled: false,
        math_gate_difficulty: "multiply",
      })
      .select()
      .single();

    if (error) {
      log("❌", `Failed to create game: ${error.message}`);
      process.exit(1);
    }
    gameId = game.id;
    log("🎮", `Created game: ${game.name} (${gameId})`);
    if (CINEMATIC_MODE) {
      log("🎬", `PROJECTOR URL: http://localhost:3000/projector`);
      log("📺", `REPLAY URL:    http://localhost:3000/replay?game_id=${gameId}`);
    }
  }

  // ── Step 3: Create teams and assign students ───────────────
  subBanner("Step 3: Creating Teams & Assigning Students");

  const simTeams: SimTeam[] = [];

  for (let t = 0; t < TEAM_COUNT; t++) {
    const regionId = REGION_IDS[t % REGION_IDS.length];
    const regionName = REGION_NAMES[regionId];
    const civName = CIV_NAMES[t];
    const teamStudents = allStudents.filter((s) => s.teamIndex === t);

    if (DRY_RUN) {
      simTeams.push({
        id: `dry-run-team-${t}`,
        name: `Team ${t + 1}`,
        civName,
        region: regionName,
        students: teamStudents,
        resources: { production: 0, reach: 0, legacy: 0, resilience: 0, food: 10 },
        farmCount: 1,
        population: 5,
        warExhaustion: 0,
        isInDarkAge: false,
      });
      log("🏰", `[DRY RUN] Would create Team ${t + 1} (${civName}) in ${regionName}`);
      continue;
    }

    // Create team
    const { data: team, error: teamErr } = await supabase
      .from("teams")
      .insert({
        game_id: gameId,
        name: `Team ${t + 1}`,
        region_id: regionId,
        population: 5,
        government_type: "chiefdom",
        is_in_dark_age: false,
        war_exhaustion_level: 0,
      })
      .select()
      .single();

    if (teamErr) {
      log("❌", `Failed to create team: ${teamErr.message}`);
      continue;
    }

    // Create starting resources
    const resourceInserts = RESOURCES.map((rt) => ({
      team_id: team.id,
      resource_type: rt,
      amount: rt === "food" ? 10 : 0,
    }));
    await supabase.from("team_resources").insert(resourceInserts);

    // Create team members
    for (const student of teamStudents) {
      await supabase.from("team_members").insert({
        team_id: team.id,
        clerk_user_id: student.id,
        display_name: student.name,
        assigned_role: student.assignedRole,
      });
    }

    // Create civilization name (auto-approved for simulation)
    await supabase.from("civilization_names").insert({
      game_id: gameId,
      team_id: team.id,
      proposed_name: civName,
      proposed_by: teamStudents[0].id,
      status: "approved",
    });

    // Update team with approved civ name
    await supabase.from("teams").update({ name: civName }).eq("id", team.id);

    simTeams.push({
      id: team.id,
      name: civName,
      civName,
      region: regionName,
      students: teamStudents,
      resources: { production: 0, reach: 0, legacy: 0, resilience: 0, food: 10 },
      farmCount: 1,
      population: 5,
      warExhaustion: 0,
      isInDarkAge: false,
    });

    log("🏰", `Created ${civName} (${team.id.slice(0, 8)}...) in ${regionName} with ${teamStudents.length} students`);
  }

  // ── Step 4: Load question bank ─────────────────────────────
  subBanner("Step 4: Loading Question Bank");

  const qbPath = path.resolve(__dirname, "..", "public", "data", "question-bank.json");
  let questionBank: Array<{
    id: string;
    round: string;
    leadRole: string;
    epochMin: number;
    epochMax: number;
    promptText: string;
    options: Array<{ id: string; label: string; description: string }>;
    civStateTags?: string[];
    terrainConditions?: string[];
  }> = [];

  if (fs.existsSync(qbPath)) {
    questionBank = JSON.parse(fs.readFileSync(qbPath, "utf-8"));
    log("📚", `Loaded ${questionBank.length} questions from question bank`);
  } else {
    log("⚠️", "Question bank not found — using synthetic questions");
  }

  // Helper: find a question for a given round/role/epoch
  function findQuestion(round: RoundType, role: RoleName, epoch: number) {
    const candidates = questionBank.filter(
      (q) =>
        q.round === round &&
        q.leadRole === role &&
        epoch >= q.epochMin &&
        epoch <= q.epochMax
    );
    if (candidates.length > 0) {
      return candidates[Math.floor(Math.random() * candidates.length)];
    }
    // Fallback: any question for this round
    const fallback = questionBank.filter(
      (q) => q.round === round && epoch >= q.epochMin && epoch <= q.epochMax
    );
    if (fallback.length > 0) {
      return fallback[Math.floor(Math.random() * fallback.length)];
    }
    // Synthetic question
    return {
      id: `syn-${round}-${epoch}`,
      round,
      leadRole: role,
      promptText: `[Epoch ${epoch}] As the ${role}, what is your ${round.toLowerCase()} strategy?`,
      options: [
        { id: "a", label: "Invest in growth", description: "Build for the future" },
        { id: "b", label: "Expand aggressively", description: "Take what you can" },
        { id: "c", label: "Defend and consolidate", description: "Protect what you have" },
      ],
      epochMin: 1,
      epochMax: 15,
    };
  }

  // ═══════════════════════════════════════════════════════════
  // EPOCH LOOP
  // ═══════════════════════════════════════════════════════════

  const gameLog: string[] = [];

  for (let epoch = 1; epoch <= TOTAL_EPOCHS; epoch++) {
    banner(`EPOCH ${epoch} of ${TOTAL_EPOCHS}`);
    gameLog.push(`\n=== EPOCH ${epoch} ===`);

    // ── Advance game to this epoch's login step ──
    if (!DRY_RUN) {
      await supabase
        .from("games")
        .update({
          current_epoch: epoch,
          current_round: "login",
          epoch_phase: "active",
          updated_at: new Date().toISOString(),
        })
        .eq("id", gameId);
    }

    // ── Process each step in the epoch ──
    for (const step of EPOCH_STEPS) {
      const isAction = ACTION_STEPS.includes(step as typeof ACTION_STEPS[number]);
      const isRouting = ROUTING_STEPS.includes(step as typeof ROUTING_STEPS[number]);

      // ── Update game step ──
      if (!DRY_RUN) {
        await supabase
          .from("games")
          .update({
            current_round: step,
            updated_at: new Date().toISOString(),
          })
          .eq("id", gameId);
      }

      if (step === "login") {
        log("🔑", `Step: LOGIN — Students check in`);
        gameLog.push(`  [login] All ${TEAM_COUNT * STUDENTS_PER_TEAM} students logged in`);
        if (CINEMATIC_MODE) await sleep(6000);
        else if (!FAST_MODE) await sleep(200);
        continue;
      }

      if (step === "exit") {
        log("🚪", `Step: EXIT — Epoch ${epoch} complete`);
        gameLog.push(`  [exit] Epoch ${epoch} complete`);
        continue;
      }

      if (step === "resolve") {
        // ── RESOLVE STEP: Apply end-of-epoch effects ──
        subBanner(`RESOLVE — End of Epoch ${epoch}`);
        gameLog.push(`  [resolve] Processing end-of-epoch effects`);

        // Collect per-team resolve results (for snapshot + replay)
        const resolveResults: Array<{
          teamId: string;
          teamName: string;
          resources: Record<string, number>;
          resourcesBefore: Record<string, number>;
          population: number;
          populationChange: number;
          isDarkAge: boolean;
          events: string[];
        }> = [];

        for (const team of simTeams) {
          const events: string[] = [];
          const resourcesBefore = { ...team.resources };
          const popBefore = team.population;

          // 1) Bank decay
          const { decayed, events: decayEvents } = applyBankDecay(team.resources);
          team.resources = decayed;
          events.push(...decayEvents);

          // 2) Population tick
          const { newPop, newFood, event: popEvent } = tickPopulation(
            team.population,
            team.resources.food,
            team.farmCount
          );
          team.population = newPop;
          team.resources.food = newFood;
          if (popEvent) events.push(popEvent);

          // 3) War exhaustion passive decay
          if (team.warExhaustion > 0) {
            const oldWar = team.warExhaustion;
            team.warExhaustion = Math.max(0, team.warExhaustion - 10);
            events.push(`⚔️ War exhaustion decay: ${oldWar} → ${team.warExhaustion}`);
          }

          // 4) Dark age check
          const darkResult = checkDarkAge(
            team.population,
            team.resources.resilience,
            team.warExhaustion,
            team.isInDarkAge
          );
          team.isInDarkAge = darkResult.isInDarkAge;
          if (darkResult.event) events.push(darkResult.event);

          resolveResults.push({
            teamId: team.id,
            teamName: team.civName,
            resources: { ...team.resources },
            resourcesBefore,
            population: team.population,
            populationChange: team.population - popBefore,
            isDarkAge: team.isInDarkAge,
            events,
          });

          // 5) Update DB
          if (!DRY_RUN) {
            await supabase
              .from("teams")
              .update({
                population: team.population,
                is_in_dark_age: team.isInDarkAge,
                war_exhaustion_level:
                  team.warExhaustion < 50 ? 0 : team.warExhaustion < 75 ? 1 : 2,
              })
              .eq("id", team.id);

            // Update resources
            for (const [rt, amount] of Object.entries(team.resources)) {
              await supabase
                .from("team_resources")
                .upsert(
                  { team_id: team.id, resource_type: rt, amount },
                  { onConflict: "team_id,resource_type" }
                );
            }
          }

          // Log
          log("🏛️", `${COLORS.bright}${team.civName}${COLORS.reset}:`);
          if (events.length === 0) {
            log("  ", "No notable events");
          } else {
            for (const e of events) {
              log("  ", e);
              gameLog.push(`    ${team.civName}: ${e}`);
            }
          }
          logTeamState(team);
        }

        // ── Write epoch snapshot to game_events (powers /replay page) ──
        if (!DRY_RUN) {
          await supabase.from("game_events").insert({
            game_id: gameId,
            epoch,
            event_type: "epoch_resolve_snapshot",
            description: `Epoch ${epoch} resolve snapshot`,
            metadata: { epoch, teams: resolveResults },
          });
        }

        // ── Cinematic mode: set DB to "resolve" step so live projector fires animation ──
        if (CINEMATIC_MODE && !DRY_RUN) {
          await supabase
            .from("games")
            .update({ current_round: "resolve" })
            .eq("id", gameId);
          log("🎬", `[CINEMATIC] Projector resolve animation running — waiting 22s...`);
          await sleep(22000); // Time for full ResolveSequence animation
        } else if (!FAST_MODE) {
          await sleep(300);
        }
        continue;
      }

      // ── ACTION STEPS (build, expand, define, defend) ──
      if (isAction) {
        const round = STEP_TO_ROUND[step];
        const leadRole = LEAD_ROLES[step];

        subBanner(`${round} ROUND — Lead: ${leadRole}`);

        for (const team of simTeams) {
          // Find the lead student for this round
          const lead = team.students.find((s) => s.assignedRole === leadRole);
          if (!lead) {
            log("⚠️", `${team.civName}: No ${leadRole} found, skipping`);
            continue;
          }

          // Select question
          const question = findQuestion(round, leadRole, epoch);

          // Pick option based on personality
          const optionLabels = question.options.map((o) => o.label);
          const chosen = pickOption(lead.personality, optionLabels, round);
          const chosenOption = question.options.find((o) => o.label === chosen) ?? question.options[0];

          // Generate justification
          const justification = JUSTIFICATION_TEMPLATES[lead.personality](round, chosen);

          // Roll d20
          const d20 = rollD20();
          const justMult = getJustificationMultiplier(lead.personality);

          // Calculate yield
          const yieldAmount = calculateYield({
            epoch,
            justificationMult: justMult,
            d20Roll: d20,
            population: team.population,
            isInDarkAge: team.isInDarkAge,
            warExhaustionLevel: team.warExhaustion < 50 ? 0 : team.warExhaustion < 75 ? 1 : 2,
          });

          // Log the decision
          const d20Color = d20 <= 10 ? COLORS.green : d20 <= 18 ? COLORS.yellow : COLORS.red;
          log(
            "📝",
            `${COLORS.bright}${team.civName}${COLORS.reset} — ${lead.name} [${lead.personality}/${leadRole}]`
          );
          log("  ", `Q: "${question.promptText.substring(0, 70)}..."`);
          log("  ", `A: ${chosenOption.label} (${chosenOption.id})`);
          log("  ", `📜 "${justification.substring(0, 80)}..."`);
          log(
            "  ",
            `🎲 d20=${d20Color}${d20}${COLORS.reset} × just=${justMult} → ${COLORS.bright}yield=${yieldAmount}${COLORS.reset}`
          );

          gameLog.push(
            `    ${team.civName} [${round}]: ${lead.name} picked "${chosenOption.label}" | d20=${d20} just=${justMult} → yield=${yieldAmount}`
          );

          // Submit to DB
          if (!DRY_RUN) {
            const content = JSON.stringify({
              option_selected: chosenOption.id,
              justification_text: justification,
              free_text_action: null,
            });

            const { error: subErr } = await supabase.from("epoch_submissions").insert({
              game_id: gameId,
              team_id: team.id,
              epoch,
              round_type: round,
              role: leadRole,
              submitted_by: lead.id,
              content,
            });

            if (subErr) {
              log("⚠️", `  Submission error: ${subErr.message}`);
            }
          }

          // Also let non-lead students submit (they all see the same question, may agree or disagree)
          const nonLeads = team.students.filter((s) => s.assignedRole !== leadRole);
          for (const student of nonLeads) {
            const studentChoice = pickOption(student.personality, optionLabels, round);
            const studentJust = JUSTIFICATION_TEMPLATES[student.personality](round, studentChoice);

            if (!DRY_RUN) {
              const content = JSON.stringify({
                option_selected: question.options.find((o) => o.label === studentChoice)?.id ?? "a",
                justification_text: studentJust,
                free_text_action: null,
              });

              // Non-lead submissions go in with their role
              await supabase.from("epoch_submissions").insert({
                game_id: gameId,
                team_id: team.id,
                epoch,
                round_type: round,
                role: student.assignedRole,
                submitted_by: student.id,
                content,
              });
            }
          }

          // Store yield in team state for routing step
          (team as { lastYield?: number }).lastYield = yieldAmount;
        }

        if (CINEMATIC_MODE) await sleep(8000); // Students see round active on their devices
        else if (!FAST_MODE) await sleep(500);
        continue;
      }

      // ── ROUTING STEPS (build_routing, expand_routing, etc.) ──
      if (isRouting) {
        const round = STEP_TO_ROUND[step];
        const leadRole = LEAD_ROLES[step.replace("_routing", "")];
        const resourceType = ROUND_TO_RESOURCE[round];

        subBanner(`${round} ROUTING — ${leadRole} allocates resources`);

        for (const team of simTeams) {
          const lead = team.students.find((s) => s.assignedRole === leadRole);
          if (!lead) continue;

          const earned = (team as { lastYield?: number }).lastYield ?? 0;
          const { spend, contribute, bank } = routeResources(lead.personality, earned);

          // Update local state
          team.resources[resourceType] = (team.resources[resourceType] ?? 0) + bank;

          log(
            "📊",
            `${team.civName} — ${lead.name} routes ${earned} ${resourceType}: ` +
              `spend=${COLORS.green}${spend}${COLORS.reset} contribute=${COLORS.cyan}${contribute}${COLORS.reset} bank=${COLORS.yellow}${bank}${COLORS.reset}`
          );

          gameLog.push(
            `    ${team.civName} [${round} routing]: ${earned} → spend=${spend} contribute=${contribute} bank=${bank}`
          );

          // Update DB
          if (!DRY_RUN) {
            await supabase.from("team_resources").upsert(
              {
                team_id: team.id,
                resource_type: resourceType,
                amount: team.resources[resourceType],
                updated_at: new Date().toISOString(),
              },
              { onConflict: "team_id,resource_type" }
            );
          }
        }

        if (CINEMATIC_MODE) await sleep(4000); // Brief pause to show routing results
        else if (!FAST_MODE) await sleep(300);
        continue;
      }
    }

    // ── End of epoch summary ──
    console.log();
    subBanner(`Epoch ${epoch} Summary`);
    for (const team of simTeams) {
      logTeamState(team);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // FINAL REPORT
  // ═══════════════════════════════════════════════════════════

  banner("SIMULATION COMPLETE");

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  log("⏱️", `Elapsed: ${elapsed}s`);
  log("🎮", `Game ID: ${gameId}`);
  log("📊", `Epochs played: ${TOTAL_EPOCHS}`);
  log("📝", `Total submissions: ${TOTAL_EPOCHS * TEAM_COUNT * STUDENTS_PER_TEAM * 4} (estimated)`);
  console.log();

  // Final standings
  subBanner("Final Standings");

  const sorted = [...simTeams].sort((a, b) => {
    const scoreA = Object.values(a.resources).reduce((s, v) => s + v, 0) + a.population * 5;
    const scoreB = Object.values(b.resources).reduce((s, v) => s + v, 0) + b.population * 5;
    return scoreB - scoreA;
  });

  for (let i = 0; i < sorted.length; i++) {
    const team = sorted[i];
    const totalRes = Object.values(team.resources).reduce((s, v) => s + v, 0);
    const score = totalRes + team.population * 5;
    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "  ";
    console.log(
      `  ${medal} #${i + 1} ${COLORS.bright}${team.civName}${COLORS.reset} — ` +
        `Score: ${COLORS.bright}${score}${COLORS.reset} ` +
        `(resources=${totalRes}, pop=${team.population}, darkAge=${team.isInDarkAge})`
    );
    const res = Object.entries(team.resources)
      .map(([k, v]) => `${k}=${v}`)
      .join(", ");
    console.log(`       ${COLORS.dim}${res}${COLORS.reset}`);
  }

  // Write game log to file
  const logPath = path.resolve(__dirname, "..", `simulation-log-${gameId.slice(0, 8)}.txt`);
  if (!DRY_RUN) {
    fs.writeFileSync(logPath, gameLog.join("\n"), "utf-8");
    console.log();
    log("📄", `Full log written to: ${logPath}`);
  }

  console.log();
  log("💡", `To clean up this simulation: npx tsx scripts/simulate.ts --cleanup ${gameId}`);
  if (!DRY_RUN) {
    log("📺", `To replay this simulation: http://localhost:3000/replay?game_id=${gameId}`);
  }
  console.log();
}

// ── Run ──
main().catch((err) => {
  console.error("❌ Simulation crashed:", err);
  process.exit(1);
});
