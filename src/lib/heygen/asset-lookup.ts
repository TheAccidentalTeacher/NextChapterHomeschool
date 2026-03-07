// ============================================
// HeyGen Asset Lookup
// Decision 55: Pre-rendered video clips stored in
// Supabase Storage, mapped by event_type
// ============================================

export interface HeyGenAsset {
  id: string;
  eventType: string;
  videoUrl: string;
  durationSeconds: number;
  description: string;
}

/**
 * Event type → video asset mapping.
 * Actual URLs populated after build-heygen-assets script runs.
 */
const ASSET_MAP: Record<string, { description: string; durationSeconds: number }> = {
  // Wonder completions (12)
  "wonder_trans_alaska_pipeline": { description: "The Trans-Alaska Pipeline stands complete...", durationSeconds: 30 },
  "wonder_brooklyn_bridge": { description: "The Brooklyn Bridge connects your people to the world...", durationSeconds: 30 },
  "wonder_grand_coulee_dam": { description: "The Grand Coulee Dam harnesses nature's fury...", durationSeconds: 30 },
  "wonder_el_castillo": { description: "El Castillo rises — a temple to knowledge itself...", durationSeconds: 30 },
  "wonder_machu_picchu": { description: "Hidden in the clouds, Machu Picchu watches over your realm...", durationSeconds: 30 },
  "wonder_the_colosseum": { description: "The Colosseum's roar echoes across the land...", durationSeconds: 30 },
  "wonder_stonehenge": { description: "Stonehenge aligns with the cosmos...", durationSeconds: 30 },
  "wonder_great_pyramid": { description: "The Great Pyramid pierces the heavens...", durationSeconds: 30 },
  "wonder_great_zimbabwe": { description: "Great Zimbabwe — a city of stone that commands trade routes...", durationSeconds: 30 },
  "wonder_trans_siberian_railway": { description: "The Trans-Siberian Railway stretches across the continent...", durationSeconds: 30 },
  "wonder_taj_mahal": { description: "The Taj Mahal — so beautiful that even war dare not touch it...", durationSeconds: 30 },
  "wonder_floating_torii_gate": { description: "The Floating Torii Gate opens the world map...", durationSeconds: 30 },

  // Contact event (1)
  "contact_event": { description: "A ship appears on the horizon...", durationSeconds: 40 },

  // Global events (8)
  "event_famine": { description: "Famine spreads across the land...", durationSeconds: 20 },
  "event_plague": { description: "A great plague descends upon the people...", durationSeconds: 20 },
  "event_golden_age": { description: "A golden age dawns upon your civilization...", durationSeconds: 20 },
  "event_trade_wind": { description: "Favorable winds fill the sails of merchants...", durationSeconds: 20 },
  "event_raiders": { description: "Raiders emerge from the frontier...", durationSeconds: 20 },
  "event_earthquake": { description: "The earth trembles beneath your cities...", durationSeconds: 20 },
  "event_discovery": { description: "Your explorers have made an incredible discovery...", durationSeconds: 20 },
  "event_harvest": { description: "The harvest this season exceeds all expectations...", durationSeconds: 20 },

  // Epilogue closing (1)
  "epilogue_closing": { description: "Empires are not built by the sword alone...", durationSeconds: 55 },
};

/**
 * Look up the video URL for a given event type.
 * In production, this queries the `heygen_assets` table.
 * For now, returns the asset metadata without a URL (to be populated by build script).
 */
export function getAssetMetadata(
  eventType: string
): { description: string; durationSeconds: number } | null {
  return ASSET_MAP[eventType] ?? null;
}

/**
 * Get the Supabase Storage URL for a HeyGen asset.
 * Called at runtime to fetch the actual video URL from the DB.
 */
export async function getAssetUrl(
  supabase: { from: (table: string) => { select: (cols: string) => { eq: (col: string, val: string) => { single: () => Promise<{ data: Record<string, unknown> | null; error: unknown }> } } } },
  eventType: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("heygen_assets")
    .select("video_url")
    .eq("event_type", eventType)
    .single();

  if (error || !data) return null;
  return (data as { video_url: string }).video_url;
}

/**
 * All event types that need pre-rendered clips.
 */
export function getAllAssetTypes(): string[] {
  return Object.keys(ASSET_MAP);
}
