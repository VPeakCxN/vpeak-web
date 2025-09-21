import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const user_uuid = searchParams.get("user_uuid");

  if (!user_uuid) {
    return NextResponse.json(
      { error: "user_uuid is required" },
      { status: 400 }
    );
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("classes")
    .select("uid, class_id")
    .contains("students", [user_uuid]);  // ← filter array contains

  if (error) {
    return NextResponse.json(
      { error: `Database error: ${error.message}` },
      { status: 500 }
    );
  }

  const formatted = data.map((c) => ({ uid: c.uid, name: c.class_id }));
  return NextResponse.json({ data: formatted });
}
