import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  const { image_url, created_by } = await req.json();

  if (!image_url || typeof image_url !== "string") {
    return NextResponse.json({ error: "Missing image_url" }, { status: 400 });
  }

  // Only allow URLs from our own Supabase storage
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  if (!image_url.startsWith(supabaseUrl)) {
    return NextResponse.json({ error: "Invalid image URL" }, { status: 400 });
  }

  const { error } = await getAdminClient()
    .from("artworks")
    .insert({
      image_url,
      created_by: typeof created_by === "string" ? created_by.trim() || null : null,
      approved: false,
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
