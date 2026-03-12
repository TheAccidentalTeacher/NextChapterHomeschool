// ============================================
// GET /api/games/[id]/sub-zones
// Returns sub-zone geographic data enriched with per-game state.
//
// Data sources:
//   - public/data/sub-zones.json: static geographic base (72 zones, 6 per region)
//   - teams table: ownership (teams own all sub-zones in their region_id)
//   - sub_zones table: per-game depletion/founding state (lazily created on first load)
//   - team_assets table: buildings placed in each sub-zone
//
// Optional query params:
//   - ?region_id=N  — filter to a single region (used by student dashboard)
//
// zone_number mapping (used as stable integer key in sub_zones DB table):
//   zone_number = (region_id - 1) * 6 + zone_index
//   e.g. "1-1" → 1, "1-6" → 6, "2-1" → 7, "12-6" → 72
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
  db_id: string | null;         // UUID from sub_zones table (null = not yet in DB)
  zone_number: number;          // integer key: (region_id-1)*6 + zone_index
  soil_fertility: number;
  wildlife_stock: number;
  settlement_name: string | null;
  controlled_by_team_id: string | null;
  founding_claim: string | null;
  founding_bonus_active: boolean;
  buildings: string[];
}

/** Converts static "region-zone" string ID to integer zone_number */
function toZoneNumber(staticId: string): number {
  const [regionStr, zoneStr] = staticId.split("-");
  const region = parseInt(regionStr, 10);
  const zone = parseInt(zoneStr, 10);
  return (region - 1) * 6 + zone;
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

    const supabase = createDirectClient();

    // 3. Fetch teams to establish ownership (a team owns all zones in their region)
    const { data: teams } = await supabase
      .from("teams")
      .select("id, region_id")
      .eq("game_id", id);

    const teamByRegion: Record<number, string> = {};
    if (teams) {
      for (const t of teams) {
        teamByRegion[t.region_id] = t.id;
      }
    }

    // 4. Compute zone_numbers for filtered zones
    const zoneNumbers = zones.map((z) => toZoneNumber(z.id));

    // 5. Fetch existing DB records for these zones
    type DbZoneRow = {
      id: string;
      zone_number: number;
      soil_fertility: number;
      wildlife_stock: number;
      settlement_name: string | null;
      controlled_by_team_id: string | null;
      founding_claim: string | null;
      founding_bonus_active: boolean;
    };

    const { data: dbZonesRaw } = await supabase
      .from("sub_zones")
      .select(
        "id, zone_number, soil_fertility, wildlife_stock, settlement_name, " +
        "controlled_by_team_id, founding_claim, founding_bonus_active"
      )
      .eq("game_id", id)
      .in("zone_number", zoneNumbers);
    const dbZones = (dbZonesRaw ?? []) as unknown as DbZoneRow[];

    // Map zone_number → DB row
    const dbByZoneNumber: Record<number, DbZoneRow> = {};
    for (const z of dbZones) {
      dbByZoneNumber[z.zone_number] = z;
    }

    // 6. Lazily upsert any zones that don't have a DB record yet
    //    This creates the sub_zones row so team_assets can reference it.
    const missingZones = zones.filter(
      (z) => !dbByZoneNumber[toZoneNumber(z.id)]
    );
    if (missingZones.length > 0) {
      const toInsert = missingZones.map((z) => ({
        game_id: id,
        zone_number: toZoneNumber(z.id),
        terrain_type: z.terrain_type,
        geojson: z.geojson,
        yield_modifier: z.yield_modifier,
        soil_fertility: 100,
        wildlife_stock: 100,
        fertility_cap: 100,
        controlled_by_team_id: teamByRegion[z.region_id] ?? null,
      }));

      const { data: insertedRaw } = await supabase
        .from("sub_zones")
        .insert(toInsert)
        .select("id, zone_number");
      const inserted = (insertedRaw ?? []) as unknown as { id: string; zone_number: number }[];

      if (inserted) {
        for (const row of inserted) {
          const zoneRegionId =
            zones.find((z) => toZoneNumber(z.id) === row.zone_number)?.region_id ?? 0;
          dbByZoneNumber[row.zone_number] = {
            id: row.id,
            zone_number: row.zone_number,
            soil_fertility: 100,
            wildlife_stock: 100,
            settlement_name: null,
            controlled_by_team_id: teamByRegion[zoneRegionId] ?? null,
            founding_claim: null,
            founding_bonus_active: false,
          };
        }
      }
    }

    // 7. Fetch buildings from team_assets for all DB sub-zone UUIDs
    const dbUUIDs = Object.values(dbByZoneNumber).map((r) => r.id).filter(Boolean);
    const buildingsByZoneId: Record<string, string[]> = {};
    if (dbUUIDs.length > 0) {
      const { data: assetsRaw } = await supabase
        .from("team_assets")
        .select("sub_zone_id, asset_key")
        .in("sub_zone_id", dbUUIDs)
        .eq("is_active", true);
      const assets = (assetsRaw ?? []) as unknown as { sub_zone_id: string; asset_key: string }[];

      if (assets) {
        for (const a of assets) {
          if (!buildingsByZoneId[a.sub_zone_id]) {
            buildingsByZoneId[a.sub_zone_id] = [];
          }
          buildingsByZoneId[a.sub_zone_id].push(a.asset_key);
        }
      }
    }

    // 8. Merge and return enriched zones
    const result: EnrichedSubZone[] = zones.map((z) => {
      const zoneNum = toZoneNumber(z.id);
      const dbRow = dbByZoneNumber[zoneNum];
      const ownerId = teamByRegion[z.region_id] ?? null;
      return {
        ...z,
        db_id: dbRow?.id ?? null,
        zone_number: zoneNum,
        soil_fertility: dbRow?.soil_fertility ?? 100,
        wildlife_stock: dbRow?.wildlife_stock ?? 100,
        settlement_name: dbRow?.settlement_name ?? null,
        controlled_by_team_id: dbRow?.controlled_by_team_id ?? ownerId,
        founding_claim: dbRow?.founding_claim ?? null,
        founding_bonus_active: dbRow?.founding_bonus_active ?? false,
        buildings: dbRow ? (buildingsByZoneId[dbRow.id] ?? []) : [],
      };
    });

    return NextResponse.json({ subZones: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
