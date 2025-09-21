// app/api/auth/session/verify/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { Database } from "@/lib/database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET() {
  try {
    console.log("🔍 Session verify called");

    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session_id")?.value;
    const sessionKey = cookieStore.get("session_key")?.value;
    const uid = cookieStore.get("uid")?.value;

    console.log("🔍 Extracted session data:", {
      session_id: sessionId ? "present" : "missing",
      session_key: sessionKey ? "present" : "missing",
      uid: uid ? "present" : "missing",
    });

    if (!sessionId || !sessionKey || !uid) {
      console.log("❌ Missing required session data", {
        session_id: !!sessionId,
        session_key: !!sessionKey,
        uid: !!uid,
      });
      return NextResponse.json(
        {
          valid: false,
          reason: "Missing session data",
          found: {
            session_id: !!sessionId,
            session_key: !!sessionKey,
            uid: !!uid,
          },
        },
        { status: 401 }
      );
    }

    const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch (error) {
            console.error("Failed to set cookies:", error);
          }
        },
      },
    });

    const { data: { session: supabaseSession }, error: supabaseError } = await supabase.auth.getSession();

    if (supabaseError || !supabaseSession) {
      console.log("❌ No active Supabase session:", {
        error: supabaseError?.message,
        sessionExists: !!supabaseSession,
      });
      return NextResponse.json(
        { valid: false, reason: "No active Supabase session", error: supabaseError?.message },
        { status: 401 }
      );
    }

    if (!supabaseSession.user) {
      console.log("❌ No user in Supabase session");
      return NextResponse.json(
        { valid: false, reason: "No user in session" },
        { status: 401 }
      );
    }

    if (supabaseSession.user.id !== uid) {
      console.log("❌ UID mismatch:", {
        supabaseUid: supabaseSession.user.id,
        cookieUid: uid,
      });
      return NextResponse.json(
        { valid: false, reason: "Session UID mismatch" },
        { status: 401 }
      );
    }

    console.log("✅ Supabase session valid for user:", uid);

    const { data: dbSession, error: dbSessionError } = await supabase
      .from("sessions")
      .select("session_id, session_key, uid, expires_at, created_at")
      .eq("session_id", sessionId)
      .eq("session_key", sessionKey)
      .eq("uid", uid)
      .single();

    if (dbSessionError || !dbSession) {
      console.log("❌ Invalid database session record:", {
        error: dbSessionError?.message,
        sessionId,
      });
      return NextResponse.json(
        { valid: false, reason: "Invalid session record", error: dbSessionError?.message },
        { status: 401 }
      );
    }

    console.log("✅ Database session record found:", dbSession.session_id.slice(0, 8));

    const now = new Date();
    const expiresAt = new Date(dbSession.expires_at);

    if (now > expiresAt) {
      console.log("❌ Session expired at:", expiresAt.toISOString());
      await supabase.from("sessions").delete().eq("session_id", sessionId);
      ["session_id", "session_key", "uid", "name", "email", "regno", "user_data"].forEach(name => {
        cookieStore.delete(name);
      });
      return NextResponse.json(
        {
          valid: false,
          reason: "Session expired",
          expiredAt: expiresAt.toISOString(),
        },
        { status: 401 }
      );
    }

    console.log("✅ Session valid until:", expiresAt.toLocaleDateString());

    return NextResponse.json({
      valid: true,
      session: {
        session_id: dbSession.session_id,
        uid: dbSession.uid,
        created_at: dbSession.created_at,
        expires_at: dbSession.expires_at,
      },
      supabaseUser: {
        id: supabaseSession.user.id,
        email: supabaseSession.user.email,
        user_metadata: supabaseSession.user.user_metadata,
      },
    });
  } catch (error) {
    console.error("💥 Session verification error:", error);
    return NextResponse.json(
      { valid: false, reason: "Internal server error", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}