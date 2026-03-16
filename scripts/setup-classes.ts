#!/usr/bin/env npx tsx
// ============================================================
// ClassCiv — Class Setup Script
// Creates one game per grade level, builds teams, and
// pre-enrolls all students using their Clerk usernames.
//
// Usage:
//   npx tsx scripts/setup-classes.ts              # run all grades
//   npx tsx scripts/setup-classes.ts --dry-run    # preview only, no DB writes
//   npx tsx scripts/setup-classes.ts --grade 6    # only the 6th grade game
// ============================================================

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// ── Load .env.local ─────────────────────────────────────────
function loadEnv() {
  const envPath = path.resolve(__dirname, "..", ".env.local");
  if (!fs.existsSync(envPath)) { console.error("❌ .env.local not found"); process.exit(1); }
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    const v = t.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[k]) process.env[k] = v;
  }
}
loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const CLERK_SECRET = process.env.CLERK_SECRET_KEY!;

if (!SUPABASE_URL || !SUPABASE_KEY || !CLERK_SECRET) {
  console.error("❌ Missing env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (or ANON_KEY), CLERK_SECRET_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── CLI args ────────────────────────────────────────────────
const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const GRADE_FILTER = args.includes("--grade") ? args[args.indexOf("--grade") + 1] : null;

// ── Helpers ─────────────────────────────────────────────────
const ROLES = ["architect", "merchant", "diplomat", "lorekeeper", "warlord"] as const;
type RoleName = (typeof ROLES)[number];

function log(icon: string, msg: string) { console.log(`${icon}  ${msg}`); }
function dimLog(msg: string) { console.log(`     ${msg}`); }

// Distributes 5 roles across N students. Students 0..(5-N-1) get a secondary role
// so that all 5 role slots are always covered, regardless of team size.
// 3-student team: [arch+merch, dipl+lore, war]  → 2 dual, 1 solo
// 4-student team: [arch+merch, dipl, lore, war]  → 1 dual, 3 solo
// 5-student team: [arch, merch, dipl, lore, war] → all solo
function computeTeamRoles(studentCount: number): Array<{ assigned: RoleName; secondary: RoleName | null }> {
  const numRoles = ROLES.length; // always 5
  const dualCount = Math.max(0, numRoles - studentCount);
  const result: Array<{ assigned: RoleName; secondary: RoleName | null }> = [];
  let slot = 0;
  for (let i = 0; i < studentCount; i++) {
    const isDual = i < dualCount;
    result.push({
      assigned: ROLES[slot % numRoles],
      secondary: isDual ? ROLES[(slot + 1) % numRoles] : null,
    });
    slot += isDual ? 2 : 1;
  }
  return result;
}

// Look up a Clerk user by exact username. Returns { id, displayName } or null.
async function lookupClerkUser(username: string): Promise<{ id: string; displayName: string } | null> {
  const url = `https://api.clerk.com/v1/users?username=${encodeURIComponent(username)}&limit=1`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${CLERK_SECRET}` },
  });
  if (!res.ok) {
    log("⚠️", `Clerk API error for "${username}": ${res.status}`);
    return null;
  }
  const data = await res.json() as Array<{
    id: string;
    first_name: string | null;
    last_name: string | null;
    username: string | null;
  }>;
  const user = data[0];
  if (!user) return null;
  const displayName = user.first_name ?? user.username ?? username;
  return { id: user.id, displayName };
}

// ── Roster ──────────────────────────────────────────────────
// Each class maps to one game. Teams are pre-grouped.
// Roles cycle through architect → warlord automatically.

interface StudentDef {
  first: string;
  username: string;
}

interface TeamDef {
  regionId: number;
  students: StudentDef[];
}

interface ClassDef {
  grade: string;          // "6", "7", or "8"
  classPeriod: string;    // "6th" or "7_8th" (drives RoundSubmissionCard scaffolding)
  gameName: string;
  teacherId: string;      // Clerk ID of the teacher (scott's account)
  roundTimerMinutes: number;
  teams: TeamDef[];
}

// ── TEACHER CLERK ID — run once to find it:
// npx tsx -e "const r=await fetch('https://api.clerk.com/v1/users?query=scott',{headers:{Authorization:'Bearer CLERK_SECRET_KEY'}});console.log(await r.json())"
// OR paste scott's Clerk user_id from the Clerk dashboard below:
const TEACHER_CLERK_ID = process.env.TEACHER_CLERK_ID ?? "user_3AZrclOVGSEZVBxczHdpiqxQHIx"; // scott

const CLASSES: ClassDef[] = [
  // ─────────────────────────────────────────────────────────────
  // 6th Grade  (15 students — 5 teams × 3)
  // Decision 95 + 96: teams of 3, full global Risk-style spread
  // Class period: 12:25 – 1:25
  // Regions: 1, 3, 4, 8, 10  (all 5 continents represented)
  // ─────────────────────────────────────────────────────────────
  {
    grade: "6",
    classPeriod: "6th",
    gameName: "Classroom Civ — 6th Grade 2025-26",
    teacherId: TEACHER_CLERK_ID,
    roundTimerMinutes: 8,
    teams: [
      {
        regionId: 1, // Alaska + Western Canada — 🌊 Coastal/Frontier (+Reach)
        students: [
          { first: "Kalaya",  username: "kalaya"  },
          { first: "Kisu",    username: "kisu"    },
          { first: "Sayna",   username: "sayna"   },
        ],
      },
      {
        regionId: 3, // Mexico + Central America + Caribbean — 🌾 River Valley (+Food)
        students: [
          { first: "Helena",  username: "helena"  },
          { first: "Jack",    username: "jack"    },
          { first: "Norma",   username: "norma"   },
        ],
      },
      {
        regionId: 4, // South America — ⛰️ Mountain (+Resilience)
        students: [
          { first: "Ashton",  username: "ashton"  },
          { first: "Gabriel", username: "gabriel" },
          { first: "Grace",   username: "grace"   },
        ],
      },
      {
        regionId: 8, // Sub-Saharan Africa — 🌾 Mineral Rich (+Production)
        students: [
          { first: "Easton",  username: "easton"  },
          { first: "Alayna",  username: "alayna"  },
          { first: "Leslie",  username: "leslie"  },
        ],
      },
      {
        regionId: 10, // East Asia (China, Mongolia) — 🌾 River Valley (+Food)
        students: [
          { first: "Sawyer",  username: "sawyer"  },
          { first: "Skyler",  username: "skyler"  },
          { first: "Oscar",   username: "oscar"   },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 7th & 8th Grade combined  (20 students — 6 teams: 4×3 + 2×4 = 20)
  // Decision 95 + 96: teams of 3-4, full global Risk-style spread
  // Class period: 2:20 – 3:05
  // Regions: 2, 5, 6, 7, 9, 12  (all continents, Old World heavy)
  // NOTE: Scott should adjust student placements as needed before re-running.
  // ─────────────────────────────────────────────────────────────────────────
  {
    grade: "7_8",
    classPeriod: "7_8th",
    gameName: "Classroom Civ — 7th & 8th Grade 2025-26",
    teacherId: TEACHER_CLERK_ID,
    roundTimerMinutes: 6,
    teams: [
      {
        regionId: 2, // Eastern Canada + Eastern US — 🌲 Forest (+Production)
        students: [
          { first: "Alvaro",   username: "alvaro"   },
          { first: "John",     username: "john"     },
          { first: "Joslynn",  username: "joslynn"  },
          { first: "Casey",    username: "casey"    }, // team of 4
        ],
      },
      {
        regionId: 5, // Western Europe + North Africa — 🏛️ Crossroads (+Legacy)
        students: [
          { first: "Adam",     username: "adam"     },
          { first: "Hadassah", username: "hadassah" },
          { first: "Naomi",    username: "naomi"    },
        ],
      },
      {
        regionId: 6, // Eastern Europe + Russia — 🧭 Steppe (+Reach)
        students: [
          { first: "Tianna",   username: "tianna"   },
          { first: "Brooke",   username: "brooke"   },
          { first: "Tovey",    username: "tovey"    },
        ],
      },
      {
        regionId: 7, // Middle East + Central Asia — 🌾 River Valley (+Food)
        students: [
          { first: "Wyatt",    username: "wyatt"    },
          { first: "Abigail",  username: "abigail"  },
          { first: "Autumn",   username: "autumn"   },
          { first: "Raylee",   username: "raylee"   }, // team of 4
        ],
      },
      {
        regionId: 9, // South Asia (India subcontinent) — 🌾 River Valley (+Food)
        students: [
          { first: "Maison",   username: "maison"   },
          { first: "E. Jay",   username: "ejay"     },
          { first: "Lucius",   username: "lucius"   },
        ],
      },
      {
        regionId: 12, // Pacific + Japan + Korea + Australia — 🌊 Island/Fog (+Reach)
        students: [
          { first: "Alayah",   username: "alayah"   },
          { first: "Hunter",   username: "hunter"   },
          { first: "Floyd",    username: "floyd"    },
        ],
      },
    ],
  },
];

// ── Main ────────────────────────────────────────────────────
async function main() {
  console.log("\n🏛️  ClassCiv Class Setup\n" + "─".repeat(50));
  if (DRY_RUN) log("🔍", "DRY RUN — no changes will be written\n");

  const classes = GRADE_FILTER
    ? CLASSES.filter((c) => c.grade === GRADE_FILTER)
    : CLASSES;

  if (classes.length === 0) {
    console.error(`❌ No class found for grade "${GRADE_FILTER}"`);
    process.exit(1);
  }

  for (const cls of classes) {
    console.log(`\n${"═".repeat(50)}`);
    console.log(`📚  Grade ${cls.grade}: ${cls.gameName}`);
    console.log(`${"═".repeat(50)}`);

    // Step 1: Create game
    let gameId = "";
    if (!DRY_RUN) {
      const { data: game, error } = await supabase
        .from("games")
        .insert({
          name: cls.gameName,
          teacher_id: cls.teacherId,
          current_epoch: 1,
          current_round: "login",
          epoch_phase: "active",
          math_gate_enabled: false,
          math_gate_difficulty: "multiply",
          class_period: cls.classPeriod,
          round_timer_minutes: cls.roundTimerMinutes,
        })
        .select("id")
        .single();

      if (error || !game) {
        log("❌", `Failed to create game: ${error?.message}`);
        continue;
      }
      gameId = game.id;
      log("✅", `Created game  ${gameId}`);
    } else {
      gameId = "dry-run-game-id";
      log("🔍", `Would create game: ${cls.gameName}`);
    }

    // Step 2: Create teams + enroll students
    for (let ti = 0; ti < cls.teams.length; ti++) {
      const teamDef = cls.teams[ti];
      const teamName = `Team ${ti + 1}`;
      console.log(`\n  🏰  ${teamName} (Region ${teamDef.regionId})`);

      // Create team row
      let teamId = "";
      if (!DRY_RUN) {
        const { data: team, error } = await supabase
          .from("teams")
          .insert({
            game_id: gameId,
            name: teamName,
            region_id: teamDef.regionId,
            population: 5,
            government_type: "chiefdom",
            is_in_dark_age: false,
            war_exhaustion_level: 0,
          })
          .select("id")
          .single();

        if (error || !team) {
          log("❌", `Failed to create team: ${error?.message}`);
          continue;
        }
        teamId = team.id;

        // Starting resources
        const resourceInserts = ["production", "reach", "legacy", "resilience", "food"].map((rt) => ({
          team_id: teamId,
          resource_type: rt,
          amount: rt === "food" ? 10 : 0,
        }));
        await supabase.from("team_resources").insert(resourceInserts);
        dimLog(`created team ${teamId.slice(0, 8)}… + starting resources`);
      } else {
        teamId = `dry-run-team-${ti}`;
      }

      // Enroll students
      const teamRoles = computeTeamRoles(teamDef.students.length);
      for (let si = 0; si < teamDef.students.length; si++) {
        const student = teamDef.students[si];
        const { assigned: role, secondary: secondaryRole } = teamRoles[si];

        const clerkUser = await lookupClerkUser(student.username);

        if (!clerkUser) {
          log("⚠️", `  ${student.first} (${student.username}) — Clerk account NOT FOUND, skipping`);
          continue;
        }

        if (!DRY_RUN) {
          const { error } = await supabase.from("team_members").insert({
            team_id: teamId,
            clerk_user_id: clerkUser.id,
            display_name: student.first,
            assigned_role: role,
            secondary_role: secondaryRole,
            is_absent: false,
          });

          if (error) {
            if (error.code === "23505") {
              dimLog(`${student.first} already enrolled — skipped`);
            } else {
              log("❌", `Failed to enroll ${student.first}: ${error.message}`);
            }
          } else {
            dimLog(`✓ ${student.first.padEnd(10)} → ${(secondaryRole ? role + "+" + secondaryRole : role).padEnd(22)} (${clerkUser.id.slice(0, 10)}…)`);
          }
        } else {
          const found = clerkUser ? `✓ found ${clerkUser.id.slice(0, 10)}…` : "❌ NOT FOUND";
          const roleLabel = secondaryRole ? `${role} + ${secondaryRole}` : role;
          dimLog(`${student.first.padEnd(10)} → ${roleLabel.padEnd(20)} | ${student.username.padEnd(12)} ${found}`);
        }
      }
    }

    console.log(`\n  ✅  Grade ${cls.grade} setup complete`);
  }

  console.log("\n" + "═".repeat(50));
  console.log("🎉  All done!");
  if (DRY_RUN) console.log("    Re-run without --dry-run to write to the database.");
  console.log("═".repeat(50) + "\n");
}

main().catch((err) => {
  console.error("❌ Fatal:", err);
  process.exit(1);
});
