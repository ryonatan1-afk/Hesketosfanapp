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
  const { participantId, questionIndex, selectedIndex } = await req.json();

  const db = adminClient();

  const { data: room } = await db
    .from("trivia_rooms")
    .select("id, status, questions")
    .eq("code", code.toUpperCase())
    .single();

  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  const question = (room.questions as Array<{ correctIndex: number }>)[questionIndex];
  if (!question) return NextResponse.json({ error: "Invalid question index" }, { status: 400 });

  const isCorrect = question.correctIndex === selectedIndex;

  // Insert answer — unique constraint (participant_id, question_index) prevents re-answering
  const { error: answerErr } = await db.from("trivia_answers").insert({
    room_id: room.id,
    participant_id: participantId,
    question_index: questionIndex,
    selected_index: selectedIndex,
    is_correct: isCorrect,
  });

  if (answerErr) return NextResponse.json({ error: answerErr.message }, { status: 500 });

  // Update participant score; set finished_at on last question
  const { data: participant } = await db
    .from("trivia_participants")
    .select("score")
    .eq("id", participantId)
    .single();

  await db
    .from("trivia_participants")
    .update({
      score: (participant?.score ?? 0) + (isCorrect ? 1 : 0),
      ...(questionIndex === 9 ? { finished_at: new Date().toISOString() } : {}),
    })
    .eq("id", participantId);

  // If this is the first answer ever, start the game
  if (room.status === "lobby") {
    await db
      .from("trivia_rooms")
      .update({ status: "active", started_at: new Date().toISOString() })
      .eq("id", room.id);
  }

  return NextResponse.json({ isCorrect });
}
