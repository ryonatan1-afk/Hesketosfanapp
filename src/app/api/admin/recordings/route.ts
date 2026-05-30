import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function isAuthorized(req: NextRequest) {
  return req.headers.get("x-admin-password") === process.env.ADMIN_PASSWORD;
}

// GET — all recordings (pending first), each with a 24-hour signed playback URL
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("voice_recordings")
    .select("id, name, audio_url, approved, created_at")
    .order("approved",    { ascending: true  })
    .order("created_at",  { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const withSignedUrls = await Promise.all(
    (data ?? []).map(async (row) => {
      const { data: signed } = await supabase.storage
        .from("voice-recordings")
        .createSignedUrl(row.audio_url, 86400); // 24h
      return { ...row, signed_url: signed?.signedUrl ?? null };
    })
  );

  return NextResponse.json(withSignedUrls);
}

// PATCH — approve a recording
export async function PATCH(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  const { error } = await getAdminClient()
    .from("voice_recordings")
    .update({ approved: true })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// DELETE — remove from DB and storage
export async function DELETE(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  const supabase = getAdminClient();

  const { data: row } = await supabase
    .from("voice_recordings")
    .select("audio_url")
    .eq("id", id)
    .single();

  if (row?.audio_url) {
    await supabase.storage.from("voice-recordings").remove([row.audio_url]);
  }

  const { error } = await supabase.from("voice_recordings").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
