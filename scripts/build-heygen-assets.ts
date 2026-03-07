#!/usr/bin/env npx tsx
// ============================================
// build-heygen-assets.ts
// Decision 55: Pre-render HeyGen historian clips
// and upload to Supabase Storage
//
// Usage: npx tsx scripts/build-heygen-assets.ts
// Requires: HEYGEN_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// ============================================

import { createClient } from "@supabase/supabase-js";
import { getAllAssetTypes, getAssetMetadata } from "../src/lib/heygen/asset-lookup";

// ---- Config ----
const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY ?? "";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const AVATAR_ID = process.env.HEYGEN_AVATAR_ID ?? "default_avatar";
const VOICE_ID = process.env.HEYGEN_VOICE_ID ?? "historian_default";
const BUCKET = "heygen-assets";
const POLL_INTERVAL_MS = 5_000;
const MAX_POLL_ATTEMPTS = 120; // 10 minutes max per clip

if (!HEYGEN_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error(
    "Missing required env vars: HEYGEN_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ---- Script text per event type ----
const SCRIPTS: Record<string, string> = {
  // Wonder completions
  wonder_trans_alaska_pipeline:
    "The Trans-Alaska Pipeline stands complete. Eight hundred miles of steel, cutting through the wildest terrain on Earth. Your people mastered the land itself. Energy flows. Commerce follows. The frozen north bows to human will.",
  wonder_brooklyn_bridge:
    "The Brooklyn Bridge connects your people to the wider world. Stone towers and steel cables span the impossible divide. Two communities that once lived apart now walk freely between worlds. Trade routes multiply. Diplomacy thrives. No civilization is an island — not anymore.",
  wonder_grand_coulee_dam:
    "The Grand Coulee Dam harnesses nature's fury into civilization's power. Rivers bend to your command. Fields that once lay barren now bloom with irrigation. Your engineers have tamed the wild waters — and your people will never thirst again.",
  wonder_el_castillo:
    "El Castillo rises from the jungle — a temple to knowledge itself. On the equinox, the shadow of the serpent descends the staircase, and your people remember: architecture IS astronomy. Science IS art. The ancients knew this. Now, so do you.",
  wonder_machu_picchu:
    "Hidden in the clouds, Machu Picchu watches over your realm like a silent guardian. Built where eagles nest and rivers are born, this city proves that civilization can flourish anywhere — if the people are determined enough.",
  wonder_the_colosseum:
    "The Colosseum's roar echoes across the land. Fifty thousand voices united in spectacle. Your civilization has mastered the art of public life — entertainment, politics, and culture fused into one magnificent arena.",
  wonder_stonehenge:
    "Stonehenge aligns with the cosmos. Your people look upward and see patterns — the turning of the year, the dance of the sun, the promise of seasons. This is not just a monument. It is a calendar. A clock. A prayer in stone.",
  wonder_great_pyramid:
    "The Great Pyramid pierces the heavens. Millions of stones, each placed with impossible precision. Your workers — your engineers — your visionaries — have built something that will outlast every empire, every war, every century to come.",
  wonder_great_zimbabwe:
    "Great Zimbabwe — a city of stone that commands trade routes stretching across the continent. Gold, ivory, and knowledge flow through its walls. Your merchants and builders have proven: wealth comes not from conquest, but from connection.",
  wonder_trans_siberian_railway:
    "The Trans-Siberian Railway stretches across the continent — six thousand miles of rail connecting east to west. What once took months now takes days. Your civilization has compressed distance itself.",
  wonder_taj_mahal:
    "The Taj Mahal stands on the riverbank — so beautiful that even war dare not touch it. Built from grief, made eternal by art. Twenty thousand workers. Twenty-two years. One monument to prove that love outlasts empires.",
  wonder_floating_torii_gate:
    "The Floating Torii Gate appears to hover above the water at high tide — a doorway between the human world and the sacred. Your people understand: boundaries are gateways, and gateways change everything. The world map opens before you.",

  // Contact event
  contact_event:
    "A ship appears on the horizon. Your scouts report unfamiliar banners, strange languages, foreign goods. For the first time, your people realize they are not alone on this Earth. What comes next — trade, diplomacy, or conflict — depends entirely on the choices you make right now.",

  // Global events
  event_famine:
    "Famine spreads across the land. Granaries empty. Fields wither. Your people look to their leaders for answers — but nature offers none. This is the test that separates civilizations that survive from those that crumble.",
  event_plague:
    "A great plague descends upon the people. The sick fill every home. Markets empty. Workers vanish. History teaches us that plagues reshape civilizations — the question is whether yours will be reshaped or destroyed.",
  event_golden_age:
    "A golden age dawns upon your civilization. Art flourishes. Trade expands. New ideas spark in every workshop and academy. Savor this moment — golden ages do not last forever, but what you build during them endures.",
  event_trade_wind:
    "Favorable winds fill the sails of merchants and explorers alike. Trade routes that were once perilous now flow freely. Resources move faster. Wealth accumulates. The wind is at your back — for now.",
  event_raiders:
    "Raiders emerge from the frontier. Swift, merciless, and hungry. They strike at the weakest and vanish before your soldiers can respond. Will you build walls? Send patrols? Or make terms with the shadows?",
  event_earthquake:
    "The earth trembles beneath your cities. Buildings crack. Roads split. In moments, generations of work can be undone. But history shows us — civilizations that rebuild stronger earn their permanence.",
  event_discovery:
    "Your explorers have made an incredible discovery. New lands. New resources. New possibilities. The map expands, and with it, the ambitions of your people. Fortune favors the bold.",
  event_harvest:
    "The harvest this season exceeds all expectations. Granaries overflow. Markets hum with surplus. Your people celebrate — and your leaders must decide: store for winter, or invest for growth?",

  // Epilogue
  epilogue_closing:
    "Empires are not built by the sword alone. They are built by the farmer who made the fields produce, by the merchant who opened the road between strangers, by the artist who made the people remember who they were. Six civilizations rose in this room. You drafted your teams. You named your nations. You answered history's questions and wrote your justifications into the record. The map is full. The record is permanent. History has been made — and you made it.",
};

// ---- HeyGen API helpers ----

interface VideoCreateResponse {
  data: { video_id: string };
  error: unknown;
}

interface VideoStatusResponse {
  data: {
    status: string;
    video_url?: string;
  };
  error: unknown;
}

async function createVideo(text: string): Promise<string> {
  const res = await fetch("https://api.heygen.com/v2/video/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": HEYGEN_API_KEY,
    },
    body: JSON.stringify({
      video_inputs: [
        {
          character: {
            type: "avatar",
            avatar_id: AVATAR_ID,
            avatar_style: "normal",
          },
          voice: {
            type: "text",
            input_text: text,
            voice_id: VOICE_ID,
            speed: 0.95,
            pitch: -2,
          },
        },
      ],
      dimension: { width: 1920, height: 1080 },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`HeyGen create failed: ${res.status} ${errText}`);
  }

  const json = (await res.json()) as VideoCreateResponse;
  return json.data.video_id;
}

async function pollVideoStatus(videoId: string): Promise<string> {
  for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
    const res = await fetch(
      `https://api.heygen.com/v1/video_status.get?video_id=${videoId}`,
      {
        headers: { "X-Api-Key": HEYGEN_API_KEY },
      }
    );
    const json = (await res.json()) as VideoStatusResponse;

    if (json.data.status === "completed" && json.data.video_url) {
      return json.data.video_url;
    }
    if (json.data.status === "failed") {
      throw new Error(`HeyGen video ${videoId} failed`);
    }

    // Wait before next poll
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  throw new Error(`HeyGen video ${videoId} timed out after ${MAX_POLL_ATTEMPTS * POLL_INTERVAL_MS / 1000}s`);
}

async function downloadVideo(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  const arrayBuf = await res.arrayBuffer();
  return Buffer.from(arrayBuf);
}

async function uploadToSupabase(
  eventType: string,
  videoBuffer: Buffer
): Promise<string> {
  const filePath = `clips/${eventType}.mp4`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, videoBuffer, {
      contentType: "video/mp4",
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Supabase upload failed: ${uploadError.message}`);
  }

  const { data: urlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

async function recordInDB(eventType: string, videoUrl: string, durationSeconds: number) {
  const { error } = await supabase.from("heygen_assets").upsert(
    {
      event_type: eventType,
      video_url: videoUrl,
      duration_seconds: durationSeconds,
      created_at: new Date().toISOString(),
    },
    { onConflict: "event_type" }
  );

  if (error) {
    console.warn(`DB record warning for ${eventType}: ${error.message}`);
  }
}

// ---- Main ----

async function main() {
  console.log("=== HeyGen Asset Builder ===\n");

  // Ensure bucket exists
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.some((b) => b.name === BUCKET);
  if (!bucketExists) {
    const { error } = await supabase.storage.createBucket(BUCKET, {
      public: true,
    });
    if (error) {
      console.warn(`Bucket creation warning: ${error.message}`);
    } else {
      console.log(`Created bucket: ${BUCKET}`);
    }
  }

  const eventTypes = getAllAssetTypes();
  console.log(`Found ${eventTypes.length} event types to process\n`);

  let successCount = 0;
  let errorCount = 0;
  let totalCost = 0;

  for (const eventType of eventTypes) {
    const script = SCRIPTS[eventType];
    if (!script) {
      console.log(`⚠️  No script for ${eventType} — skipping`);
      continue;
    }

    const meta = getAssetMetadata(eventType);
    const durationSec = meta?.durationSeconds ?? 30;

    console.log(`\n--- Processing: ${eventType} ---`);
    console.log(`  Script: "${script.substring(0, 60)}..."`);
    console.log(`  Est. duration: ${durationSec}s`);

    try {
      // 1. Create video
      console.log("  → Creating HeyGen video...");
      const videoId = await createVideo(script);
      console.log(`  → Video ID: ${videoId}`);

      // 2. Poll for completion
      console.log("  → Polling for completion...");
      const heygenUrl = await pollVideoStatus(videoId);
      console.log(`  → HeyGen URL: ${heygenUrl.substring(0, 60)}...`);

      // 3. Download
      console.log("  → Downloading video...");
      const videoBuffer = await downloadVideo(heygenUrl);
      console.log(`  → Downloaded: ${(videoBuffer.length / 1024 / 1024).toFixed(1)} MB`);

      // 4. Upload to Supabase
      console.log("  → Uploading to Supabase Storage...");
      const publicUrl = await uploadToSupabase(eventType, videoBuffer);
      console.log(`  → Public URL: ${publicUrl.substring(0, 60)}...`);

      // 5. Record in DB
      await recordInDB(eventType, publicUrl, durationSec);
      console.log("  ✅ Done!");

      successCount++;
      totalCost += durationSec * 0.0167; // Avatar III rate
    } catch (err) {
      console.error(`  ❌ Failed: ${err instanceof Error ? err.message : err}`);
      errorCount++;
    }
  }

  console.log("\n=== Summary ===");
  console.log(`  Success: ${successCount}`);
  console.log(`  Errors:  ${errorCount}`);
  console.log(`  Est. cost: $${totalCost.toFixed(2)}`);
  console.log("=== Done ===\n");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
