import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const db = adminClient();

  // neq guard ensures only the first caller actually updates (idempotent)
  await db
    .from("trivia_rooms")
    .update({ status: "finished" })
    .eq("code", code.toUpperCase())
    .neq("status", "finished");

  return NextResponse.json({ ok: true });
}
