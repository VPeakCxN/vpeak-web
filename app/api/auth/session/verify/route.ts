import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Database } from "@/lib/database.types";
import { AuthCookieData } from "@/lib/cookies.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Session verify called");
    
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    
    // Log all cookies for debugging
    const authRelatedCookies = allCookies.filter(cookie => 
      cookie.name.includes('session') || 
      ['uid', 'name', 'email', 'regno', 'user_data'].includes(cookie.name)
    );
    
    console.log("📦 All cookies found:", allCookies.length);
    console.log("🔑 Auth-related cookies:", authRelatedCookies.map(c => ({ name: c.name, hasValue: !!c.value })));

    // ✅ FIXED: More flexible cookie checking - try multiple sources
    let sessionId = cookieStore.get("session_id")?.value;
    let sessionKey = cookieStore.get("session_key")?.value;
    let uid = cookieStore.get("uid")?.value;

    // Fallback: try to get from user_data cookie if individual cookies are missing
    if (!sessionId || !sessionKey || !uid) {
      const userDataCookie = cookieStore.get("user_data")?.value;
      if (userDataCookie) {
        try {
          const userData = JSON.parse(userDataCookie);
          if (!uid && userData.uid) uid = userData.uid;
          console.log("🔄 Fallback UID from user_data:", uid);
        } catch (e) {
          console.error("❌ Failed to parse user_data cookie:", e);
        }
      }
    }

    console.log("🔍 Extracted session data:", { 
      session_id: !!sessionId, 
      session_key: !!sessionKey, 
      uid: !!uid 
    });

    if (!sessionId || !sessionKey || !uid) {
      console.log("❌ Missing required session data");
      return NextResponse.json(
        { 
          valid: false, 
          reason: "Missing session data",
          found: {
            session_id: !!sessionId,
            session_key: !!sessionKey,
            uid: !!uid,
          }
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
          } catch {
            // Ignore
          }
        },
      },
    });

    // Get current Supabase user
    const { data: { user }, error: userError } = await supabase.auth.getSession();
    
    if (userError || !user) {
      console.log("❌ No active Supabase session:", userError?.message);
      return NextResponse.json(
        { valid: false, reason: "No active Supabase session" },
        { status: 401 }
      );
    }

    // Verify UID matches
    if (user.id !== uid) {
      console.log("❌ UID mismatch:", { supabaseUid: user.id, cookieUid: uid });
      return NextResponse.json(
        { valid: false, reason: "Session UID mismatch" },
        { status: 401 }
      );
    }

    console.log("✅ Supabase user verified:", user.id);

    // Validate session against database
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select("session_id, session_key, uid, expires_at, created_at")
      .eq("session_id", sessionId)
      .eq("session_key", sessionKey)
      .single();

    if (sessionError || !session) {
      console.log("❌ Invalid session record:", sessionError?.message);
      return NextResponse.json(
        { valid: false, reason: "Invalid session record" },
        { status: 401 }
      );
    }

    console.log("✅ Database session valid:", session.session_id.slice(0, 8));

    // Check expiry
    const now = new Date();
    const expiresAt = new Date(session.expires_at);
    
    if (now > expiresAt) {
      console.log("❌ Session expired");
      await supabase.from("sessions").delete().eq("session_id", sessionId);
      
      // Clear all session cookies
      ["session_id", "session_key", "uid", "name", "email", "regno", "user_data"].forEach(name => {
        cookieStore.delete(name);
      });
      
      return NextResponse.json(
        { valid: false, reason: "Session expired" },
        { status: 401 }
      );
    }

    console.log("✅ Session expires:", expiresAt.toLocaleDateString());

    // Get user data
    const userDataCookie = cookieStore.get("user_data")?.value;
    let userData: AuthCookieData | null = null;
    
    if (userDataCookie) {
      try {
        userData = JSON.parse(userDataCookie);
        console.log("✅ User data from cookie:", userData.uid);
      } catch {
        console.log("❌ Invalid user_data cookie");
        userData = null;
      }
    }

    // Fallback to database
    if (!userData) {
      console.log("🔍 Fetching user data from database...");
      const { data: student, error: studentError } = await supabase
        .from("students")
        .select("uid, name, regno, email")
        .eq("uid", uid)
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
          httpOnly: false, // Client needs access
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7,
        }
      );
    }

    if (!userData) {
      console.error("❌ No user data available");
      return NextResponse.json(
        { valid: false, reason: "Failed to load user data" },
        { status: 401 }
      );
    }

    console.log("✅ Session verification complete:", userData.uid);

    return NextResponse.json({
      valid: true,
      user: userData,
      session: {
        id: session.session_id,
        uid: session.uid,
        created_at: session.created_at,
        expires_at: session.expires_at,
      },
    });

  } catch (error) {
    console.error("💥 Session verify error:", error);
    return NextResponse.json(
      { valid: false, reason: "Internal server error" },
      { status: 500 }
    );
  }
}