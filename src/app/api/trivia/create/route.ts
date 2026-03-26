import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { quizzes } from "@/data/quizzes";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function randomCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function pickQuestions() {
  const all = quizzes.flatMap((q) => q.questions);
  return [...all].sort(() => Math.random() - 0.5).slice(0, 10);
}

export async function POST(req: Request) {
  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const db = adminClient();
  const code = randomCode();
  const questions = pickQuestions();

  const { data: room, error: roomErr } = await db
    .from("trivia_rooms")
    .insert({ code, questions, status: "lobby" })
    .select()
    .single();

  if (roomErr) return NextResponse.json({ error: roomErr.message }, { status: 500 });

  const { data: participant, error: partErr } = await db
    .from("trivia_participants")
    .insert({ room_id: room.id, name: name.trim() })
    .select()
    .single();

  if (partErr) return NextResponse.json({ error: partErr.message }, { status: 500 });

  return NextResponse.json({ code, participantId: participant.id });
}
