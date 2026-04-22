/**
 * Dev utility: delete all games and their related data.
 * Usage: npx tsx scripts/dev-nuke-games.ts
 *
 * Requires env vars:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY  (bypasses RLS; do NOT commit this key)
 *
 * Refuses to run in production unless ALLOW_NUKE_IN_PROD=true explicitly set.
 * Asks for typed confirmation before proceeding ("CONFIRM NUKE").
 * Safe to run in dev; do NOT run in production without understanding the blast radius.
 *
 * Renamed from scripts/nuke-all-games.ts in v1.5 Pass 6 (Iteration 1 cleanup):
 *   - Removed hardcoded Supabase URL + publishable key
 *   - Switched to service-role env var
 *   - Added loud confirmation gate
 */
import { createClient } from "@supabase/supabase-js";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

async function confirm(): Promise<boolean> {
  const rl = readline.createInterface({ input, output });
  const answer = await rl.question(
    "⚠️  This will DELETE every game, team, submission, and event row from the database.\n" +
      "   Type exactly 'CONFIRM NUKE' (case-sensitive) to proceed: "
  );
  rl.close();
  return answer.trim() === "CONFIRM NUKE";
}

async function deleteGame(sb: ReturnType<typeof createClient>, gameId: string, gameName: string) {
  console.log(`\n🗑️  ${gameName} (${gameId})`);

  const { data: teams } = await sb.from("teams").select("id").eq("game_id", gameId);
  const teamIds = (teams ?? []).map((t: { id: string }) => t.id);

  if (teamIds.length > 0) {
    for (const table of ["team_resources", "team_members", "civilization_names"]) {
      const { error } = await sb.from(table).delete().in("team_id", teamIds);
      console.log(`   ${error ? "⚠️  " + error.message : "✅"} ${table}`);
    }
  }

  for (const table of ["game_events", "epoch_submissions", "alliances", "casus_belli_grants", "teams", "games"]) {
    const col = table === "games" ? "id" : "game_id";
    const { error } = await sb.from(table).delete().eq(col, gameId);
    console.log(`   ${error ? "⚠️  " + error.message : "✅"} ${table}`);
  }
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.");
    console.error("   Set them in .env.local or export them into your shell.");
    process.exit(1);
  }

  // Production guardrail
  const env = process.env.NODE_ENV ?? "development";
  if (env === "production" && process.env.ALLOW_NUKE_IN_PROD !== "true") {
    console.error("❌ Refusing to nuke in production. Set ALLOW_NUKE_IN_PROD=true to override.");
    process.exit(1);
  }

  const sb = createClient(url, key);

  // Summarize before prompting
  const { data: games, error } = await sb
    .from("games")
    .select("id, name, created_at")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Failed to list games:", error.message);
    process.exit(1);
  }
  if (!games?.length) {
    console.log("No games found. Nothing to delete.");
    return;
  }

  console.log(`Found ${games.length} game(s):\n`);
  games.forEach((g) => console.log(`  • ${g.id} | ${g.name}`));

  const ok = await confirm();
  if (!ok) {
    console.log("Aborted — no changes made.");
    return;
  }

  for (const game of games) {
    await deleteGame(sb, game.id, game.name);
  }

  console.log("\n✅ Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
