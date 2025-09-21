// app/api/auth/email/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const REQUIRED_FIELDS = ["name", "regno", "dob", "dept", "personal_email", "phone"] as const;

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return NextResponse.redirect(new URL("/login/email?error=missing_credentials", request.url));
  }

  const supabase = createSupabaseServerClient();

  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError || !signInData.session) {
    return NextResponse.redirect(new URL(`/login/email?error=${encodeURIComponent(signInError?.message || "Sign-in failed")}`, request.url));
  }

  const supabaseToken = signInData.session.access_token;
  const refreshToken = signInData.session.refresh_token;

  const baseUrl = request.nextUrl.origin;
  const verifyResp = await fetch(`${baseUrl}/api/auth/verify-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": "NextJS-OAuth-Client/1.0" },
    body: JSON.stringify({ token: supabaseToken, refresh_token: refreshToken }),
  });

  if (!verifyResp.ok) {
    return NextResponse.redirect(new URL("/login/email?error=api_verification_failed", request.url));
  }

  const { access_token: customJWT, user: backendUser } = await verifyResp.json();

  const { data: userData } = await supabase.auth.getUser();
  const supabaseUserId = userData?.user?.id;

  let dest = "/setup";
  if (supabaseUserId) {
    const { data: student } = await supabase
      .from("students")
      .select("uid, name, regno, dob, dept, personal_email, phone")
      .eq("uid", supabaseUserId)
      .maybeSingle();

    const missing = REQUIRED_FIELDS.filter((k) => !student?.[k as keyof typeof student]);
    if (student && missing.length === 0) {
      dest = "/home";
    }
  }

  const res = NextResponse.redirect(new URL(dest, request.url));
  const baseCookie = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };
  res.cookies.set("auth_token", customJWT, { ...baseCookie, maxAge: 60 * 60 });
  if (refreshToken) {
    res.cookies.set("refresh_token", refreshToken, { ...baseCookie, maxAge: 60 * 60 * 24 * 7 });
  }
  res.cookies.set("user_data", JSON.stringify(backendUser ?? {}), { ...baseCookie, maxAge: 60 * 60 });
  return res;
}