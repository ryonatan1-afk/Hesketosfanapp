import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const db = adminClient();

  const { data: room, error } = await db
    .from("trivia_rooms")
    .select("*, trivia_participants(*)")
    .eq("code", code.toUpperCase())
    .single();

  if (error || !room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  const questions = room.questions;

  return NextResponse.json({
    ...room,
    questions,
    participants: room.trivia_participants,
  });
}
