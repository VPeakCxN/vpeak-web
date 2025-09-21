import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";

const ALLOWED_TABLES = new Set([
  "students",
  "chatroom_messages",
  "chatrooms",
  "posts",
  "classes",
  "clubs",
  "direct_chats",
  "direct_messages",
  "events",
  "faculty",
  "classes",
  "post_engagements",
  "post_files",
  "announcements",
]);

function guard(table: string) {
  if (!ALLOWED_TABLES.has(table)) {
    return NextResponse.json({ error: "Table not allowed" }, { status: 400 });
  }
  return null;
}

// DELETE /api/db/:table/:uid -> delete by uid
export async function DELETE(
  _req: Request,
  { params }: { params: { table: string; uid: string } }
) {
  const blocked = guard(params.table);
  if (blocked) return blocked;

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from(params.table)
    .delete()
    .eq("uid", params.uid)
    .select("uid")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ deleted: data.uid });
}
