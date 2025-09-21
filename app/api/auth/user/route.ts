// app/api/auth/user/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AppUser, VerifiedUser, Student } from "@/lib/auths/types";

export async function GET() {
  try {
    const supabase = createSupabaseServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ data: null }, { status: 200 });
    }

    // Fetch student profile for this user
    const { data: studentRow } = await supabase
      .from("students")
      .select("uid, name, regno, dob, dept, personal_email, phone")
      .eq("uid", user.id)
      .maybeSingle();

    const verified: VerifiedUser = {
      uid: user.id,
      supabase_user_id: user.id,
      email: user.email ?? null,
      username: user.user_metadata?.preferred_username ?? user.user_metadata?.username ?? null,
      avatar_url: user.user_metadata?.avatar_url ?? null,
      roles: Array.isArray(user.user_metadata?.roles) ? user.user_metadata?.roles : [],
      permissions: Array.isArray(user.user_metadata?.permissions) ? user.user_metadata?.permissions : [],
    };

    const appUser: AppUser = {
      ...verified,
      student: (studentRow as Student | null) ?? null,
    };

    return NextResponse.json({ data: appUser }, { status: 200 });
  } catch (err) {
    console.error("Error in /api/auth/user:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
