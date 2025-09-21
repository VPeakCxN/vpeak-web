// app/api/auth/callback/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const REQUIRED_FIELDS = ["name", "regno", "dob", "dept", "personal_email", "phone"] as const;

export async function GET(request: NextRequest) {
  const supabase = createSupabaseServerClient();
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const err = url.searchParams.get("error");

  if (err) {
    return NextResponse.redirect(new URL(`/auth/error?error=${encodeURIComponent(err)}`, request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/auth/error?error=missing_code", request.url));
  }

  // 1) Exchange auth code for a session
  const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError || !sessionData?.session) {
    return NextResponse.redirect(new URL("/auth/error?error=exchange_failed", request.url));
  }

  // 2) Verify with local API to mint custom JWT
  const baseUrl = new URL(request.url).origin;
  const supabaseToken = sessionData.session.access_token;
  const refreshToken = sessionData.session.refresh_token;

  const verifyResp = await fetch(`${baseUrl}/api/auth/verify-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": "NextJS-OAuth-Client/1.0" },
    body: JSON.stringify({ token: supabaseToken, refresh_token: refreshToken }),
  });
  if (!verifyResp.ok) {
    return NextResponse.redirect(new URL("/auth/error?error=api_verification_failed", request.url));
  }
  const { access_token: customJWT, user: backendUser } = await verifyResp.json();

  // 3) Fetch current Supabase user id
  const { data: userData } = await supabase.auth.getUser();
  const supabaseUserId = userData?.user?.id;

  // 4) Check students row completeness
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

  // 5) Build redirect response and set cookies
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
