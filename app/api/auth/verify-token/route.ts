// app/api/auth/verify-token/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { z } from "zod";

const VerifyTokenSchema = z.object({
  token: z.string().min(1).max(4096),
  refresh_token: z.string().min(1).max(4096).optional(),
});

interface SupabaseIdentity {
  provider: string;
  provider_id?: string;
  identity_data?: Record<string, any>;
}

interface SupabaseUser {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, any>;
  identities?: SupabaseIdentity[];
}

interface Profile {
  supabase_user_id: string;
  google_id?: string;
  email?: string | null;       // may be overridden by students.personal_email
  name?: string | null;        // overridden by students.name
  username?: string | null;
  avatar_url?: string | null;
  roles?: string[];
  permissions?: string[];
}

interface JwtPayload {
  sub: string;
  email?: string;
  username?: string;
  jti: string;
  user: Profile;
}

interface VerifyTokenResponse {
  user: Profile;
  access_token: string;
  expires_at: number;
  token_type: string;
}

// basic in-memory rate limit
const RATE_LIMIT = { limit: 20, windowMs: 60 * 1000 };
const rateLimitStore: Map<string, { count: number; resetTime: number }> = new Map();

function rateLimit(ip: string): { success: boolean; resetTime: number } {
  const now = Date.now();
  const key = `rate-limit:${ip}`;
  const record = rateLimitStore.get(key);
  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT.windowMs });
    return { success: true, resetTime: RATE_LIMIT.windowMs };
  }
  if (record.count >= RATE_LIMIT.limit) {
    return { success: false, resetTime: record.resetTime };
  }
  rateLimitStore.set(key, { count: record.count + 1, resetTime: record.resetTime });
  return { success: true, resetTime: record.resetTime };
}

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const first = forwardedFor?.split(",")[0]?.trim();
  return first || request.headers.get("x-real-ip") || "unknown";
}

function mapSupabaseUserToProfile(user: SupabaseUser): Profile {
  const identities = Array.isArray(user.identities) ? user.identities : [];
  const google = identities.find((i) => i.provider === "google");

  let providerId: string | undefined;
  if (google) {
    if (typeof google.provider_id === "string") {
      providerId = google.provider_id;
    } else if (google.identity_data && typeof google.identity_data === "object") {
      const idVal = (google.identity_data as Record<string, any>).id;
      if (typeof idVal === "string") providerId = idVal;
    }
  }

  const md = (user.user_metadata ?? {}) as Record<string, any>;
  const getStr = (v: unknown) => (typeof v === "string" ? v : undefined);

  return {
    supabase_user_id: user.id,
    google_id: providerId,
    email: user.email ?? null,
    name: getStr(md.full_name) ?? getStr(md.name) ?? null,
    username: getStr(md.user_name) ?? getStr(md.preferred_username) ?? null,
    avatar_url: getStr(md.avatar_url) ?? null,
    roles: ["user"],
    permissions: ["read:profile", "update:profile"],
  };
}

function generateJwt(profile: Profile): { access_token: string; expires_at: number } {
  const payload: JwtPayload = {
    sub: profile.supabase_user_id,
    email: profile.email || undefined,
    username: profile.username || profile.name || undefined,
    jti: crypto.randomUUID(),
    user: profile,
  };

  const secret = process.env.JWT_SECRET || "fallback-secret-for-dev";
  const access_token = jwt.sign(payload, secret, {
    expiresIn: "1h",
    issuer: "vpeak-api",
    audience: "vpeak-app",
  });

  const now = Math.floor(Date.now() / 1000);
  const expires_at = now + 60 * 60;
  return { access_token, expires_at };
}

export async function POST(request: NextRequest) {
  // rate limit
  const ip = getClientIp(request);
  const { success, resetTime } = rateLimit(ip);
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": Math.ceil((resetTime - Date.now()) / 1000).toString() } }
    );
  }

  // parse
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = VerifyTokenSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Missing or invalid token" }, { status: 400 });
  }
  const { token } = parsed.data;

  // Supabase client bound to cookies
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async getAll() {
          return cookieStore.getAll();
        },
        async setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch { /* ignore */ }
        },
      },
      auth: {
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
      },
    }
  );

  // validate token with Supabase
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }

  // base profile from auth
  const profile = mapSupabaseUserToProfile(data.user);

  // overlay with students row
  const { data: studentRow } = await supabase
    .from("students")
    .select("uid, name, regno, dob, dept, personal_email, phone")
    .eq("uid", data.user.id)
    .maybeSingle();

  if (studentRow) {
    profile.name = studentRow.name ?? profile.name;
    profile.email = studentRow.personal_email ?? profile.email;
  }

  // sign custom JWT
  const { access_token, expires_at } = generateJwt(profile);
  const response: VerifyTokenResponse = {
    user: profile,
    access_token,
    expires_at,
    token_type: "Bearer",
  };

  return NextResponse.json(response, { status: 200 });
}
