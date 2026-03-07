/**
 * Dev utility: delete all games and their related data.
 * Usage: npx tsx scripts/nuke-all-games.ts
 *
 * Requires DELETE RLS policies to be active (migration 004).
 * Safe to run in dev; do NOT run in production.
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://dyifhrodlkqjdlzbwckg.supabase.co";
const SUPABASE_KEY = "sb_publishable_LT2j1dH9KLGE91qRSaE3bg_zdlFTv9f";

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

async function deleteGame(gameId: string, gameName: string) {
  console.log(`\n🗑️  ${gameName} (${gameId})`);

  const { data: teams } = await sb.from("teams").select("id").eq("game_id", gameId);
  const teamIds = (teams ?? []).map((t: { id: string }) => t.id);

  if (teamIds.length > 0) {
    for (const table of ["team_resources", "team_members", "civilization_names"]) {
      const { error } = await sb.from(table).delete().in("team_id", teamIds);
      console.log(`   ${error ? "⚠️  " + error.message : "✅"} ${table}`);
    }
  }

  for (const table of ["game_events", "epoch_submissions", "teams", "games"]) {
    const col = table === "games" ? "id" : "game_id";
    const { error } = await sb.from(table).delete().eq(col, gameId);
    console.log(`   ${error ? "⚠️  " + error.message : "✅"} ${table}`);
  }
}

async function main() {
  const { data: games, error } = await sb
    .from("games")
    .select("id, name, created_at")
    .order("created_at", { ascending: false });

  if (error) { console.error("Failed to list games:", error.message); process.exit(1); }
  if (!games?.length) { console.log("No games found."); return; }

  console.log(`Found ${games.length} game(s):\n`);
  games.forEach((g) => console.log(`  • ${g.id} | ${g.name}`));

  for (const game of games) {
    await deleteGame(game.id, game.name);
  }

  console.log("\n✅ Done.");
}

main();
