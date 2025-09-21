// app/api/privacy/options/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserFromCookie } from "@/lib/auth/server";

export async function GET() {
  const user = await getUserFromCookie();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseServerClient();

  const { data: privacyLists, error: listsError } = await supabase
    .from("privacy_list")
    .select("uid, name")
    .eq("creator", user.uid);

  if (listsError) {
    return NextResponse.json({ error: listsError.message }, { status: 500 });
  }

  const { data: clubs, error: clubsError } = await supabase
    .from("clubs")
    .select("uid, description (name)")
    .contains("members", [user.uid]);

  if (clubsError) {
    return NextResponse.json({ error: clubsError.message }, { status: 500 });
  }

  const { data: classes, error: classesError } = await supabase
    .from("classes")
    .select("uid, class_id (name)")
    .contains("students", [user.uid]);

  if (classesError) {
    return NextResponse.json({ error: classesError.message }, { status: 500 });
  }

  return NextResponse.json({
    privacyLists,
    clubs,
    classes,
  });
}