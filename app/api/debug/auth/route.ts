// app/api/debug/auth/route.ts
import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";

// Force dynamic to avoid static caching of debug responses
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  const store = await cookies();
  const all = store.getAll();

  // Known auth cookies
  const authCookie = store.get("auth_token");
  const refreshCookie = store.get("refresh_token");
  const userDataCookie = store.get("user_data");

  const body = {
    cookies: {
      count: all.length,
      names: all.map((c) => c.name),
      hasAuthToken: Boolean(authCookie?.value),
      hasRefreshToken: Boolean(refreshCookie?.value),
      hasUserData: Boolean(userDataCookie?.value),
    },
    environment: {
      appUrl: process.env.NEXT_PUBLIC_APP_URL ?? null,
      backendUrl: process.env.NEXT_PUBLIC_API_KEY ?? null,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? null,
      // Only expose presence flags for keys; do not echo secrets
      hasAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      nodeEnv: process.env.NODE_ENV ?? null,
    },
  };

  const res = NextResponse.json(body);
  // Prevent any intermediate caching
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  res.headers.set("Pragma", "no-cache");
  res.headers.set("Expires", "0");
  return res;
}
