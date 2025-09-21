import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Database } from "@/lib/database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  console.log("🔄 Auth callback received:", { 
    code: !!code, 
    error, 
    errorDescription, 
    next,
    fullUrl: request.url
  });

  // Handle OAuth errors from URL params
  if (error || errorDescription) {
    console.error("❌ OAuth error:", { error, errorDescription });
    const redirectUrl = new URL("/login", origin);
    redirectUrl.searchParams.set("error", error || errorDescription || "Authentication failed");
    return NextResponse.redirect(redirectUrl);
  }

  if (!code) {
    console.error("❌ No authorization code received");
    const redirectUrl = new URL("/login", origin);
    redirectUrl.searchParams.set("error", "Invalid callback - no code");
    return NextResponse.redirect(redirectUrl);
  }

  try {
    const cookieStore = await cookies();
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
          } catch (e) {
            console.error("Cookie setting error:", e);
          }
        },
      },
    });

    // Exchange code for session
    console.log("🔄 Exchanging code for session...");
    const { data: { session }, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    console.log("📋 Exchange result:", { 
      hasSession: !!session, 
      exchangeError: exchangeError?.message,
      userId: session?.user?.id 
    });

    if (exchangeError || !session) {
      console.error("❌ Exchange error:", exchangeError);
      const redirectUrl = new URL("/login", origin);
      redirectUrl.searchParams.set("error", "Failed to exchange code for session");
      return NextResponse.redirect(redirectUrl);
    }

    const user = session.user;
    const email = user.email!;

    console.log("✅ User authenticated:", { email, userId: user.id });

    // Validate email domain
    if (!email.endsWith("@vitstudent.ac.in")) {
      console.log("❌ Invalid email domain:", email);
      await supabase.auth.signOut();
      const redirectUrl = new URL("/login", origin);
      redirectUrl.searchParams.set("error", "Only vitstudent.ac.in email addresses are allowed");
      return NextResponse.redirect(redirectUrl);
    }

    // Extract name and regno from user metadata
    const fullName = user.user_metadata?.full_name || user.user_metadata?.name || email.split('@')[0];
    const nameParts = fullName.trim().split(/\s+/);
    const regno = nameParts.pop() || "";
    const name = nameParts.join(" ") || "Student";

    console.log("👤 User data extracted:", { name, regno, email });

    // Call session create API to set custom cookies
    console.log("🔄 Creating custom session...");
    const sessionResponse = await fetch(`${origin}/api/auth/session/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: user.id,
        email,
        name,
        regno,
      }),
      credentials: 'include',
    });

    console.log("📡 Session API response:", { status: sessionResponse.status });

    if (!sessionResponse.ok) {
      const errorData = await sessionResponse.json();
      console.error("❌ Session create failed:", errorData);
      const redirectUrl = new URL("/login", origin);
      redirectUrl.searchParams.set("error", errorData.error || "Failed to create session");
      return NextResponse.redirect(redirectUrl);
    }

    console.log("🎉 Authentication successful! Redirecting to:", next);
    
    // Success - redirect to dashboard
    const redirectUrl = new URL(next, origin);
    return NextResponse.redirect(redirectUrl);

  } catch (err) {
    console.error("💥 Callback error:", err);
    const redirectUrl = new URL("/login", origin);
    redirectUrl.searchParams.set("error", "Server error during authentication");
    return NextResponse.redirect(redirectUrl);
  }
}