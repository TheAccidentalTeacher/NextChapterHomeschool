// ============================================
// GET /api/games/[id]/units
// Returns all active unit markers for a game, shaped for MapMarker[].
//
// Units live in team_assets with asset_key in the unit set:
//   scout, soldier, merchant_unit, builder
// Each is associated with a sub_zone_id (where it was deployed).
//
// Returns MapMarker[] — one entry per sub-zone per team per unit type,
// with count (for stacked markers) and the static sub-zone string ID
// for centroid lookup in MarkerLayer.
//
// Query params:
//   ?team_id=xxx  — optional filter to one team
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";
import { createDirectClient } from "@/lib/supabase/admin";

const UNIT_KEYS = new Set(["scout", "soldier", "merchant_unit", "builder"]);

// MarkerLayer uses these type literals
const UNIT_TYPE_MAP: Record<string, "scout" | "soldier" | "merchant" | "builder"> = {
  scout: "scout",
  soldier: "soldier",
  merchant_unit: "merchant",
  builder: "builder",
};

interface StaticSubZone {
  id: string;      // "region-zone"
  region_id: number;
}

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: gameId } = await params;
    const { searchParams } = new URL(request.url);
    const teamIdFilter = searchParams.get("team_id");

    const supabase = createDirectClient();

    // 1. Fetch all active unit assets for this game
    let query = supabase
      .from("team_assets")
      .select("id, team_id, asset_key, sub_zone_id")
      .eq("is_active", true);

    if (teamIdFilter) {
      query = query.eq("team_id", teamIdFilter);
    }

    const { data: assetsRaw, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const assets = (assetsRaw ?? []) as unknown as {
      id: string;
      team_id: string;
      asset_key: string;
      sub_zone_id: string | null;
    }[];

    // 2. Filter to unit types only
    const unitAssets = assets.filter((a) => UNIT_KEYS.has(a.asset_key) && a.sub_zone_id);

    if (unitAssets.length === 0) {
      return NextResponse.json({ markers: [] });
    }

    // 3. Load static sub-zones to get the "region-zone" string ID from DB UUID
    //    sub_zones DB rows have a zone_number we can reverse-map to static ID.
    const subZoneUUIDs = [...new Set(unitAssets.map((a) => a.sub_zone_id!))]
    const { data: dbZonesRaw } = await supabase
      .from("sub_zones")
      .select("id, zone_number")
      .in("id", subZoneUUIDs);

    const dbZones = (dbZonesRaw ?? []) as unknown as {
      id: string;
      zone_number: number;
    }[];

    // Build UUID → zone_number lookup
    const zoneNumByUUID: Record<string, number> = {};
    for (const z of dbZones) {
      zoneNumByUUID[z.id] = z.zone_number;
    }

    // Load static JSON to map zone_number → static "region-zone" string ID
    const filePath = join(process.cwd(), "public", "data", "sub-zones.json");
    const staticZones: StaticSubZone[] = JSON.parse(readFileSync(filePath, "utf8"));

    // Build zone_number → static id lookup
    // zone_number = (region_id - 1) * 6 + zone_index
    const staticIdByZoneNum: Record<number, string> = {};
    for (const z of staticZones) {
      const [regionStr, zoneStr] = z.id.split("-");
      const zoneNum = (parseInt(regionStr, 10) - 1) * 6 + parseInt(zoneStr, 10);
      staticIdByZoneNum[zoneNum] = z.id;
    }

    // 4. Group by (sub_zone_uuid, team_id, unit_type) → count
    type GroupKey = string;
    const grouped = new Map<
      GroupKey,
      { teamId: string; assetKey: string; subZoneUUID: string; count: number }
    >();

    for (const a of unitAssets) {
      const key = `${a.sub_zone_id}|${a.team_id}|${a.asset_key}`;
      const existing = grouped.get(key);
      if (existing) {
        existing.count++;
      } else {
        grouped.set(key, {
          teamId: a.team_id,
          assetKey: a.asset_key,
          subZoneUUID: a.sub_zone_id!,
          count: 1,
        });
      }
    }

    // 5. Resolve static sub-zone IDs and build MapMarker[]
    const markers = [];
    for (const [key, g] of grouped) {
      const zoneNum = zoneNumByUUID[g.subZoneUUID];
      const staticId = zoneNum != null ? staticIdByZoneNum[zoneNum] : null;
      if (!staticId) continue; // can't place without a known position

      const markerType = UNIT_TYPE_MAP[g.assetKey];
      if (!markerType) continue;

      markers.push({
        id: key,
        type: markerType,
        subZoneId: staticId,
        teamId: g.teamId,
        count: g.count,
      });
    }

    return NextResponse.json({ markers });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
