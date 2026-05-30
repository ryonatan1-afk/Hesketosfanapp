import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB — well above any 30-second recording
const RATE_LIMIT = 3;              // submissions per IP per hour

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audio = formData.get("audio") as File | null;
    const name  = (formData.get("name") as string | null)?.trim().slice(0, 40);

    if (!audio || !name) {
      return NextResponse.json({ error: "missing_fields" }, { status: 400 });
    }
    if (audio.size > MAX_BYTES) {
      return NextResponse.json({ error: "file_too_large" }, { status: 400 });
    }

    // Rate limit by hashed IP (salt with service key so hash isn't reversible)
    const rawIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      ?? req.headers.get("x-real-ip")
      ?? "unknown";
    const ipHash = createHash("sha256")
      .update(rawIp + process.env.SUPABASE_SERVICE_ROLE_KEY)
      .digest("hex")
      .slice(0, 16);

    const supabase = getAdminClient();
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { count } = await supabase
      .from("voice_recordings")
      .select("id", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .gte("created_at", oneHourAgo);

    if ((count ?? 0) >= RATE_LIMIT) {
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }

    // Upload to private storage bucket
    const ext = audio.type.includes("mp4") || audio.type.includes("mpeg") ? "m4a" : "webm";
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const buffer = await audio.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from("voice-recordings")
      .upload(filename, buffer, { contentType: audio.type || "audio/webm", upsert: false });

    if (uploadError) {
      return NextResponse.json({ error: "upload_failed" }, { status: 500 });
    }

    // Insert DB row
    const { error: insertError } = await supabase
      .from("voice_recordings")
      .insert({ name, audio_url: filename, ip_hash: ipHash });

    if (insertError) {
      await supabase.storage.from("voice-recordings").remove([filename]);
      return NextResponse.json({ error: "db_error" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
