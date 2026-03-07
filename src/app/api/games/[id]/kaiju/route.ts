import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ============================================
// Kaiju API — broadcasts kaiju attacks
// Decision 34: Teacher-triggered, 100% cosmetic
// ============================================

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: gameId } = await params;
  const supabase = await createClient();
  const body = await req.json();
  const { kaijuId, targetTeamIds } = body as {
    kaijuId: string;
    targetTeamIds: string[];
  };

  if (!kaijuId || !targetTeamIds?.length) {
    return NextResponse.json(
      { error: "kaijuId and targetTeamIds required" },
      { status: 400 }
    );
  }

  // Log the kaiju event (purely for fun/records)
  await supabase.from("game_events").insert({
    game_id: gameId,
    event_type: "kaiju_attack",
    payload: { kaijuId, targetTeamIds },
  });

  // Broadcast via Supabase Realtime channel
  // Clients subscribed to `game:${gameId}` will receive this
  const channel = supabase.channel(`game:${gameId}`);
  await channel.send({
    type: "broadcast",
    event: "kaiju_attack",
    payload: { kaijuId, targetTeamIds },
  });
  supabase.removeChannel(channel);

  return NextResponse.json({ success: true, kaijuId, targetTeamIds });
}
