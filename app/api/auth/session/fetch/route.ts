import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { Database } from "@/lib/database.types";
import { AuthSession, AuthCookieData } from "@/lib/cookies.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET() {
  try {
    const cookieStore = await cookies();
    
    // ✅ FIXED: No auth_token - only session cookies
    const sessionId = cookieStore.get("session_id")?.value;
    const sessionKey = cookieStore.get("session_key")?.value;
    const uid = cookieStore.get("uid")?.value;

    console.log("🔍 Session fetch - Cookie check:", { 
      session_id: !!sessionId, 
      session_key: !!sessionKey, 
      uid: !!uid 
    });

    if (!sessionId || !sessionKey || !uid) {
      return NextResponse.json(
        { 
          valid: false, 
          reason: "Missing session cookies",
          cookies: {
            session_id: !!sessionId,
            session_key: !!sessionKey,
            uid: !!uid,
          }
        },
        { status: 401 }
      );
    }

    // 1. Get Supabase user from local session
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
          } catch {
            // Ignore
          }
        },
      },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log("❌ No valid Supabase session");
      return NextResponse.json(
        { 
          valid: false, 
          reason: "No active Supabase session",
          user: null 
        },
        { status: 401 }
      );
    }

    if (user.id !== uid) {
      console.log("❌ UID mismatch");
      return NextResponse.json(
        { valid: false, reason: "Session UID mismatch" },
        { status: 401 }
      );
    }

    // 2. VALIDATE SESSION AGAINST DATABASE
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select("session_id, session_key, uid, expires_at, created_at")
      .eq("session_id", sessionId)
      .eq("session_key", sessionKey)
      .single();

    if (sessionError || !session) {
      console.log("❌ Invalid session record");
      return NextResponse.json(
        { 
          valid: false, 
          reason: "Invalid session record",
          session: null 
        },
        { status: 401 }
      );
    }

    // 3. CHECK EXPIRY
    const now = new Date();
    const expiresAt = new Date(session.expires_at);
    
    if (now > expiresAt) {
      console.log("❌ Session expired");
      await supabase.from("sessions").delete().eq("session_id", sessionId);
      
      // Clear cookies
      cookieStore.delete("session_id");
      cookieStore.delete("session_key");
      cookieStore.delete("uid");
      cookieStore.delete("name");
      cookieStore.delete("email");
      cookieStore.delete("regno");
      cookieStore.delete("user_data");
      
      return NextResponse.json(
        { 
          valid: false, 
          reason: "Session expired",
          expires_at: session.expires_at 
        },
        { status: 401 }
      );
    }

    // 4. GET USER DATA
    const userDataCookie = cookieStore.get("user_data")?.value;
    let userData: AuthCookieData | null = null;
    
    if (userDataCookie) {
      try {
        userData = JSON.parse(userDataCookie);
        console.log("✅ User data from cookie:", userData.!uid);
      } catch {
        console.error("❌ Failed to parse user_data cookie");
        userData = null;
      }
    }

    // Fallback: query students table
    if (!userData) {
      console.log("🔍 Fetching user data from database...");
      const { data: student, error: studentError } = await supabase
        .from("students")
        .select("uid, name, regno, email")
        .eq("uid", user.id)
        .single();

      if (studentError || !student) {
        console.error("❌ Student not found:", studentError?.message);
        return NextResponse.json(
          { valid: false, reason: "User profile not found" },
          { status: 401 }
        );
      }

      userData = {
        uid: student.uid,
        name: student.name,
        email: student.email,
        regno: student.regno,
      };

      // Update cookie for future requests
      cookieStore.set(
        "user_data",
        JSON.stringify(userData),
        {
          path: "/",
          httpOnly: false,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7,
        }
      );
    }

    // ✅ FIXED: Null check
    if (!userData) {
      console.error("❌ User data is null after all attempts");
      return NextResponse.json(
        { valid: false, reason: "Failed to load user data" },
        { status: 401 }
      );
    }

    const authSession: AuthSession = {
      session_id: session.session_id,
      session_key: session.session_key,
      uid: session.uid,
      created_at: session.created_at,
      expires_at: session.expires_at,
      user: userData,
    };

    console.log("✅ Session fetch successful:", {
      session_id: session.session_id.slice(0, 8),
      user_uid: userData.uid,
      expires_in: Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) + " days"
    });

    return NextResponse.json({
      valid: true,
      session: authSession,
      user: userData,
      expires_at: session.expires_at,
      expires_in_days: Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    });

  } catch (error) {
    console.error("💥 Session fetch error:", error);
    return NextResponse.json(
      { valid: false, reason: "Internal server error" },
      { status: 500 }
    );
  }
}