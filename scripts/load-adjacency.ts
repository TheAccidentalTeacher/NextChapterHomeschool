/**
 * Realms v1.5 Pass 4 — Adjacency seed loader.
 *
 * Reads supabase/seed/sub_zone_adjacencies.json and inserts sub_zone_adjacencies
 * rows for a given game. Joins the JSON's zone_number pairs against the sub_zones
 * table to resolve actual UUIDs.
 *
 * Usage:
 *   npx tsx scripts/load-adjacency.ts <game_id>
 *
 * Env required:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Idempotent: deletes existing adjacency rows for the game's sub_zones first,
 * then re-inserts. Safe to re-run.
 */

import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

interface SeedEdge {
  a: number; // zone_number
  b: number;
  edge_type: "land" | "coastal" | "naval_required" | "impassable";
}
interface SeedFile {
  edges: SeedEdge[];
}

async function main() {
  const gameId = process.argv[2];
  if (!gameId) {
    console.error("Usage: npx tsx scripts/load-adjacency.ts <game_id>");
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
    process.exit(1);
  }

  const sb = createClient(url, key);
  const seedPath = path.resolve(__dirname, "..", "supabase", "seed", "sub_zone_adjacencies.json");
  const raw = fs.readFileSync(seedPath, "utf-8");
  const seed: SeedFile = JSON.parse(raw);

  if (!Array.isArray(seed.edges) || seed.edges.length === 0) {
    console.error("No edges found in seed file — nothing to load.");
    process.exit(1);
  }

  // Resolve sub_zone UUIDs for this game
  const { data: subZones, error: subZErr } = await sb
    .from("sub_zones")
    .select("id, zone_number")
    .eq("game_id", gameId);
  if (subZErr || !subZones) {
    console.error("Failed to load sub_zones:", subZErr?.message);
    process.exit(1);
  }

  const byZone = new Map<number, string>();
  for (const sz of subZones) byZone.set(sz.zone_number, sz.id);

  const rows: { sub_zone_a_id: string; sub_zone_b_id: string; edge_type: string }[] = [];
  const missing: SeedEdge[] = [];

  for (const e of seed.edges) {
    const aId = byZone.get(e.a);
    const bId = byZone.get(e.b);
    if (!aId || !bId) {
      missing.push(e);
      continue;
    }
    // Deterministic ordering to match the (a, b) primary key constraint
    const [lo, hi] = aId < bId ? [aId, bId] : [bId, aId];
    rows.push({ sub_zone_a_id: lo, sub_zone_b_id: hi, edge_type: e.edge_type });
  }

  if (missing.length > 0) {
    console.warn(`Skipped ${missing.length} edge(s) because zone_numbers are missing for this game:`);
    for (const m of missing) console.warn(`  ${m.a} <-> ${m.b} (${m.edge_type})`);
  }

  // Clear existing adjacencies for this game's sub_zones (idempotent re-run)
  const subZoneIds = subZones.map((sz) => sz.id);
  const { error: delErr } = await sb
    .from("sub_zone_adjacencies")
    .delete()
    .in("sub_zone_a_id", subZoneIds);
  if (delErr) {
    console.error("Failed to clear existing adjacencies:", delErr.message);
    process.exit(1);
  }

  // Insert fresh
  if (rows.length > 0) {
    const { error: insErr } = await sb.from("sub_zone_adjacencies").insert(rows);
    if (insErr) {
      console.error("Failed to insert adjacencies:", insErr.message);
      process.exit(1);
    }
  }

  // Flip the strict gate on the game
  const { error: gateErr } = await sb
    .from("games")
    .update({ adjacency_strict: true })
    .eq("id", gameId);
  if (gateErr) {
    console.error("Failed to set adjacency_strict=true:", gateErr.message);
    process.exit(1);
  }

  console.log(`✅ Loaded ${rows.length} adjacency edge(s) for game ${gameId}`);
  console.log(`✅ games.adjacency_strict = true (F18 hard-live gate satisfied)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
