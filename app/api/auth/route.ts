// frontend: app/auth/callback/route.ts (assuming this is the GET handler file)
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cookies } from "next/headers"; // For setting cookies

export async function GET(request: NextRequest) {
  const supabase = createSupabaseServerClient();
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/auth/auth-code-error", request.url)); // Handle missing code
  }

  const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError || !exchangeData.session) {
    return NextResponse.redirect(new URL("/auth/auth-code-error", request.url));
  }

  const token = exchangeData.session.access_token;

  // Verify token via backend and get custom JWT
  const backendUrl = process.env.API || "http://localhost:3000/api";
  const verifyResponse = await fetch(`${backendUrl}/auth/verify-token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token }),
  });

  if (!verifyResponse.ok) {
    return NextResponse.redirect(new URL("/auth/auth-code-error", request.url));
  }

  const { access_token: jwt } = await verifyResponse.json();

  // Set custom JWT in an HttpOnly cookie for security
  const cookieStore = await cookies();
  cookieStore.set("jwt", jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    path: "/",
    maxAge: 60 * 60, // 1 hour, adjust as needed
  });

  return NextResponse.redirect(new URL("/home", request.url));
}