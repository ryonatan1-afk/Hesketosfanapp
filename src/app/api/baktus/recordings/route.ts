import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Public endpoint — returns approved recordings with short-lived signed playback URLs
export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from("voice_recordings")
    .select("id, name, audio_url, created_at")
    .eq("approved", true)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const recordings = await Promise.all(
    (data ?? []).map(async (row) => {
      const { data: signed } = await supabase.storage
        .from("voice-recordings")
        .createSignedUrl(row.audio_url, 3600); // 1 hour
      return {
        id:         row.id,
        name:       row.name,
        created_at: row.created_at,
        audio_url:  signed?.signedUrl ?? null,
      };
    })
  );

  return NextResponse.json(recordings);
}
