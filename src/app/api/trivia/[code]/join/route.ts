import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const db = adminClient();

  const { data: room } = await db
    .from("trivia_rooms")
    .select("id, status")
    .eq("code", code.toUpperCase())
    .single();

  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
  if (room.status === "finished") return NextResponse.json({ error: "Game already finished" }, { status: 400 });

  const { data: participant, error } = await db
    .from("trivia_participants")
    .insert({ room_id: room.id, name: name.trim() })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ participantId: participant.id });
}
