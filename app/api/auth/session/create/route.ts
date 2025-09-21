import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import crypto from "crypto";
import { Database } from "@/lib/database.types";
import { AuthCookieData } from "@/lib/cookies.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const cookieOptions = {
  path: "/",
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 7, // 1 week
};

export async function POST(request: NextRequest) {
  try {
    const { userId, email, name, regno, avatar }: {
      userId: string;
      email: string;
      name: string;
      regno: string;
      avatar?: string;
    } = await request.json();

    console.log("🔄 Creating session for:", { userId, email, name, regno });

    // Validate required fields
    if (!userId || !email || !name || !regno) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const uid = userId;

    // ✅ STEP 1: Handle student data via separate API
    console.log("👤 Handling student data...");
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    
    const studentResponse = await fetch(`${baseUrl}/api/students/fetch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ uid }),
      credentials: 'include',
    });

    let studentData;

    if (!studentResponse.ok) {
      console.error("❌ Student fetch failed:", await studentResponse.text());
      return NextResponse.json(
        { error: "Failed to process student data" },
        { status: 500 }
      );
    }

    const studentResult = await studentResponse.json();
    
    if (studentResult.exists) {
      studentData = studentResult.student;
      console.log("✅ Student exists:", studentData.uid);
    } else {
      // Create student
      const createResponse = await fetch(`${baseUrl}/api/students/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          uid, 
          name, 
          regno, 
          email,
          avatar 
        }),
        credentials: 'include',
      });

      if (!createResponse.ok) {
        console.error("❌ Student create failed:", await createResponse.text());
        return NextResponse.json(
          { error: "Failed to create student profile" },
          { status: 500 }
        );
      }

      studentData = await createResponse.json();
      console.log("✅ New student created:", studentData.uid);
    }

    // ✅ STEP 2: Create session record
    console.log("🔐 Creating session record...");
    
    const cookieStore = await cookies();
    
    const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            console.error('Could not parse set-cookie header');
          }
        },
      },
    });

    const session_id = crypto.randomUUID();
    const session_key = crypto.randomBytes(32).toString("hex");
    const expires_at = new Date(Date.now() + 60 * 60 * 24 * 7 * 1000); // 1 week

    // Delete any existing sessions for this user
    await supabase.from("sessions").delete().eq("uid", uid);

    const { error: sessionInsertError } = await supabase
      .from("sessions")
      .insert({
        session_id,
        session_key,
        uid,
        created_at: new Date().toISOString(),
        expires_at: expires_at.toISOString(),
      });

    if (sessionInsertError) {
      console.error("⚠️ Session insert error:", sessionInsertError);
    } else {
      console.log("✅ Session record created:", session_id);
    }

    // ✅ STEP 3: Prepare response with session data (cookies will be set client-side)
    const userData: AuthCookieData = {
      uid,
      name,
      email,
      regno,
      avatar,
    };

    console.log("✅ Session data prepared successfully");
    console.log("🎉 Session creation complete!");

    return NextResponse.json({
      success: true,
      session_id,
      session_key,
      expires_at: expires_at.toISOString(),
      user: userData,
      message: "Session created successfully",
      // ✅ Include session data for client-side cookie setting
      cookiesToSet: {
        session_id,
        session_key,
        uid,
        name,
        email,
        regno,
        user_data: JSON.stringify(userData),
      },
    });

  } catch (error) {
    console.error("💥 Session create error:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}