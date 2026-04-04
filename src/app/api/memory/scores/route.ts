import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET() {
  const { data, error } = await db()
    .from("memory_scores")
    .select("id, name, score, difficulty")
    .order("score", { ascending: false })
    .limit(10);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: Request) {
  const body = await req.json();
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 30) : "";
  const score = typeof body.score === "number" ? Math.floor(body.score) : null;
  const difficulty = ["easy", "medium", "hard"].includes(body.difficulty) ? body.difficulty : null;

  if (!name || score === null || score < 1 || !difficulty) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const { data, error } = await db()
    .from("memory_scores")
    .insert({ name, score, difficulty })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id });
}
