// app/api/user/clubs/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const user_uuid = searchParams.get("user_uuid");

  if (!user_uuid) {
    return NextResponse.json({ error: "user_uuid is required" }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("clubs")
    .select("uid, name")
    .or(`members.cs.{${user_uuid}},board.cs.{${user_uuid}}`);

  if (error) {
    return NextResponse.json({ error: `Database error: ${error.message}` }, { status: 500 });
  }

  // Rename description to name for consistency
  const formattedData = data.map(item => ({ uid: item.uid, name: item.name }));

  return NextResponse.json({ data: formattedData });
}