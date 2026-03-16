#!/usr/bin/env npx tsx
// ============================================================
// ClassCiv — Create Student Clerk Accounts
// Creates all 35 student accounts in Clerk, then exits.
// Run this BEFORE setup-classes.ts.
//
// Usage: npx tsx scripts/create-student-accounts.ts
//        npx tsx scripts/create-student-accounts.ts --dry-run
// ============================================================

import * as fs from "fs";
import * as path from "path";

function loadEnv() {
  const envPath = path.resolve(__dirname, "..", ".env.local");
  if (!fs.existsSync(envPath)) { console.error("❌ .env.local not found"); process.exit(1); }
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    const v = t.slice(eq + 1).trim();
    if (!process.env[k]) process.env[k] = v;
  }
}
loadEnv();

const CLERK_SECRET = process.env.CLERK_SECRET_KEY!;
if (!CLERK_SECRET) { console.error("❌ CLERK_SECRET_KEY not found in .env.local"); process.exit(1); }

const DRY_RUN = process.argv.includes("--dry-run");

// ── Roster with passwords ────────────────────────────────────
// ⚠️  Fill in the Password column before running.
// Username must match exactly what students were given.
// ─────────────────────────────────────────────────────────────
const STUDENTS: { first: string; username: string; password: string }[] = [
  // ── Grade 6 ──  username = first name (lowercase), password = same
  { first: "Kalaya",   username: "kalaya",    password: "kalaya"    },
  { first: "Kisu",     username: "kisu",      password: "kisu"      },
  { first: "Sayna",    username: "sayna",     password: "sayna"     },
  { first: "Helena",   username: "helena",    password: "helena"    },
  { first: "Jack",     username: "jack",      password: "jack"      },
  { first: "Norma",    username: "norma",     password: "norma"     },
  { first: "Ashton",   username: "ashton",    password: "ashton"    },
  { first: "Gabriel",  username: "gabriel",   password: "gabriel"   },
  { first: "Grace",    username: "grace",     password: "grace"     },
  { first: "Easton",   username: "easton",    password: "easton"    },
  { first: "Alayna",   username: "alayna",    password: "alayna"    },
  { first: "Leslie",   username: "leslie",    password: "leslie"    },
  { first: "Sawyer",   username: "sawyer",    password: "sawyer"    },
  { first: "Skyler",   username: "skyler",    password: "skyler"    },
  { first: "Oscar",    username: "oscar",     password: "oscar"     },
  // ── Grade 7 ──
  { first: "Alvaro",   username: "alvaro",    password: "alvaro"    },
  { first: "John",     username: "john",      password: "john"      },
  { first: "Joslynn",  username: "joslynn",   password: "joslynn"   },
  { first: "Casey",    username: "casey",     password: "casey"     },
  { first: "Adam",     username: "adam",      password: "adam"      },
  { first: "Tianna",   username: "tianna",    password: "tianna"    },
  { first: "Brooke",   username: "brooke",    password: "brooke"    },
  { first: "Tovey",    username: "tovey",     password: "tovey"     },
  { first: "Wyatt",    username: "wyatt",     password: "wyatt"     },
  { first: "Abigail",  username: "abigail",   password: "abigail"   },
  { first: "Maison",   username: "maison",    password: "maison"    },
  { first: "E. Jay",   username: "ejay",      password: "ejay"      },
  { first: "Lucius",   username: "lucius",    password: "lucius"    },
  { first: "Alayah",   username: "alayah",    password: "alayah"    },
  // ── Grade 8 ──
  { first: "Hadassah", username: "hadassah",  password: "hadassah"  },
  { first: "Naomi",    username: "naomi",     password: "naomi"     },
  { first: "Autumn",   username: "autumn",    password: "autumn"    },
  { first: "Raylee",   username: "raylee",    password: "raylee"    },
  { first: "Hunter",   username: "hunter",    password: "hunter"    },
  { first: "Floyd",    username: "floyd",     password: "floyd"     },
];

// ── Check for unfilled passwords ────────────────────────────
const unfilled = STUDENTS.filter((s) => s.password === "TODO");
if (unfilled.length > 0 && !DRY_RUN) {
  console.error(`\n❌  ${unfilled.length} student(s) still have "TODO" passwords.`);
  console.error("   Fill in the password column in this file, then re-run.\n");
  console.error("   Affected students:");
  unfilled.forEach((s) => console.error(`     ${s.first.padEnd(10)} (${s.username})`));
  process.exit(1);
}

// ── Create a single Clerk user ───────────────────────────────
async function createClerkUser(first: string, username: string, password: string): Promise<boolean> {
  if (DRY_RUN) {
    const status = password !== "TODO" ? "✓ ready" : "⚠️  no password";
    console.log(`     ${first.padEnd(12)} ${username.padEnd(14)} ${status}`);
    return true;
  }

  const body = {
    first_name: first,
    username,
    password,
    skip_password_checks: true,
    skip_password_requirement: true,
  };

  const res = await fetch("https://api.clerk.com/v1/users", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${CLERK_SECRET}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json() as { id?: string; errors?: Array<{ message: string; long_message: string }> };

  if (!res.ok) {
    const msg = data.errors?.[0]?.long_message ?? JSON.stringify(data);
    if (msg.includes("already")) {
      console.log(`     ⟳ ${first.padEnd(12)} ${username.padEnd(14)} already exists — skipped`);
    } else {
      console.log(`     ❌ ${first.padEnd(12)} ${username.padEnd(14)} FAILED: ${msg}`);
    }
    return false;
  }

  console.log(`     ✅ ${first.padEnd(12)} ${username.padEnd(14)} created (${(data.id ?? "").slice(0, 10)}…)`);
  return true;
}

// ── Main ─────────────────────────────────────────────────────
async function main() {
  console.log("\n👥  Create Student Clerk Accounts\n" + "─".repeat(50));
  if (DRY_RUN) console.log("🔍  DRY RUN — showing what would be created\n");

  let ok = 0;
  for (const s of STUDENTS) {
    const created = await createClerkUser(s.first, s.username, s.password);
    if (created) ok++;
  }

  console.log("\n" + "─".repeat(50));
  console.log(`Done: ${ok} / ${STUDENTS.length} accounts processed\n`);
  if (!DRY_RUN) console.log("Next: run  npx tsx scripts/setup-classes.ts --dry-run");
}

main().catch((e) => { console.error("❌ Fatal:", e); process.exit(1); });
