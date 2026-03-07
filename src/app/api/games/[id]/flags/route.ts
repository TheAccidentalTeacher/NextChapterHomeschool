import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ============================================
// Flags API — civilization flag upload & approval
// Decision 89: Physical upload + SVG builder
// ============================================

const BUCKET = "civilization-flags";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: gameId } = await params;
  const supabase = await createClient();
  const url = new URL(req.url);
  const teamId = url.searchParams.get("team_id");

  let query = supabase
    .from("civilization_flags")
    .select("*")
    .eq("game_id", gameId);

  if (teamId) {
    query = query.eq("team_id", teamId);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ flags: data });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: gameId } = await params;
  const supabase = await createClient();
  const contentType = req.headers.get("content-type") ?? "";

  let teamId: string;
  let flagType: string;
  let fileUrl: string;

  if (contentType.includes("multipart/form-data")) {
    // File upload path
    const formData = await req.formData();
    teamId = formData.get("teamId") as string;
    flagType = formData.get("flagType") as string ?? "upload";
    const file = formData.get("file") as File;

    if (!file || !teamId) {
      return NextResponse.json(
        { error: "File and teamId required" },
        { status: 400 }
      );
    }

    // Upload to Supabase Storage
    const ext = file.name.split(".").pop() ?? "png";
    const filePath = `${gameId}/${teamId}/flag.${ext}`;
    const arrayBuffer = await file.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, arrayBuffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: uploadError.message },
        { status: 500 }
      );
    }

    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(filePath);

    fileUrl = urlData.publicUrl;
  } else {
    // JSON path (SVG builder)
    const body = await req.json();
    teamId = body.teamId;
    flagType = body.flagType ?? "svg";
    const svgContent = body.svgContent as string;

    if (!svgContent || !teamId) {
      return NextResponse.json(
        { error: "svgContent and teamId required" },
        { status: 400 }
      );
    }

    // Upload SVG to storage
    const filePath = `${gameId}/${teamId}/flag.svg`;
    const svgBuffer = new TextEncoder().encode(svgContent);

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, svgBuffer, {
        contentType: "image/svg+xml",
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: uploadError.message },
        { status: 500 }
      );
    }

    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(filePath);

    fileUrl = urlData.publicUrl;
  }

  // Upsert flag record
  const { data, error } = await supabase
    .from("civilization_flags")
    .upsert(
      {
        game_id: gameId,
        team_id: teamId,
        file_url: fileUrl,
        flag_type: flagType,
        dm_approved: false,
      },
      { onConflict: "game_id,team_id" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, fileUrl, flag: data });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: gameId } = await params;
  const supabase = await createClient();
  const body = await req.json();
  const { teamId, approved } = body as { teamId: string; approved: boolean };

  const { error } = await supabase
    .from("civilization_flags")
    .update({
      dm_approved: approved,
      approved_at: approved ? new Date().toISOString() : null,
    })
    .eq("game_id", gameId)
    .eq("team_id", teamId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
