// app/api/students/upsert/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function toDateOnly(input: string | Date | undefined): string | null {
  if (!input) return null;
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient();

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const payload = {
    uid: userData.user.id,
    name: body.name,
    regno: body.regno,
    dob: toDateOnly(body.dob),
    dept: body.dept,
    personal_email: body.personal_email,
    phone: body.phone,
  };

  const { data, error } = await supabase
    .from("students")
    .upsert(payload, { onConflict: "uid" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, student: data }, { status: 200 });
}
