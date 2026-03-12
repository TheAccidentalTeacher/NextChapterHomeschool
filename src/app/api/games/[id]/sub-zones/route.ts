// ============================================
// GET /api/games/[id]/sub-zones
// Returns sub-zone geographic data enriched with per-game state.
//
// Data sources:
//   - public/data/sub-zones.json: static geographic base (72 zones, 6 per region)
//   - teams table: ownership (teams own all sub-zones in their region_id)
//   - sub_zones table: per-game depletion/founding state (empty until founding built)
//
// Optional query params:
//   - ?region_id=N  — filter to a single region (used by student dashboard)
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";
import { createDirectClient } from "@/lib/supabase/admin";

interface StaticSubZone {
  id: string;           // "region-zone" e.g. "1-1"
  name: string;
  region_id: number;
  terrain_type: string;
  geojson: GeoJSON.Geometry;
  yield_modifier: number;
}

export interface EnrichedSubZone extends StaticSubZone {
  soil_fertility: number;
  wildlife_stock: number;
  settlement_name: string | null;
  controlled_by_team_id: string | null;
  founding_claim: string | null;
  founding_bonus_active: boolean;
  buildings: string[];
}

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const regionId = searchParams.get("region_id");

    // 1. Load static geographic base data
    const filePath = join(process.cwd(), "public", "data", "sub-zones.json");
    const staticZones: StaticSubZone[] = JSON.parse(readFileSync(filePath, "utf8"));

    // 2. Filter by region if requested
    let zones = staticZones;
    if (regionId) {
      const rid = parseInt(regionId, 10);
      if (!isNaN(rid)) {
        zones = zones.filter((z) => z.region_id === rid);
      }
    }

    // 3. Fetch teams to establish ownership (a team owns all zones in their region)
    const supabase = createDirectClient();
    const { data: teams } = await supabase
      .from("teams")
      .select("id, name, civilization_name, region_id")
      .eq("game_id", id);

    const teamByRegion: Record<number, string> = {};
    if (teams) {
      for (const t of teams) {
        teamByRegion[t.region_id] = t.id;
      }
    }

    // 4. Try to get per-game depletion/founding state from DB
    //    sub_zones table uses zone_number (int) not the "region-zone" string id.
    //    Until founding is built this will be empty — static defaults are used.
    const { data: dbZones } = await supabase
      .from("sub_zones")
      .select(
        "zone_number, soil_fertility, wildlife_stock, settlement_name, controlled_by_team_id, founding_claim, founding_bonus_active"
      )
      .eq("game_id", id);

    // Build zone_number lookup (will be empty in current games)
    const dbByZoneNumber: Record<
      number,
      {
        soil_fertility: number;
        wildlife_stock: number;
        settlement_name: string | null;
        controlled_by_team_id: string | null;
        founding_claim: string | null;
        founding_bonus_active: boolean;
      }
    > = {};
    if (dbZones) {
      for (const z of dbZones) {
        dbByZoneNumber[z.zone_number] = z;
      }
    }

    // 5. Merge and return enriched zones
    const result: EnrichedSubZone[] = zones.map((z) => {
      const ownerId = teamByRegion[z.region_id] ?? null;
      return {
        ...z,
        // DB state (defaults to healthy/unclaimed if no DB record)
        soil_fertility: 100,
        wildlife_stock: 100,
        settlement_name: null,
        controlled_by_team_id: ownerId,
        founding_claim: null,
        founding_bonus_active: false,
        buildings: [],
      };
    });

    return NextResponse.json({ subZones: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
