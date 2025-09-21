import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Database } from "@/lib/database.types";
import { AuthCookieData, AuthSession } from "@/lib/cookies.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  
  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
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
          throw new Error('Could not parse set-cookie header');
        }
      },
    },
  });
}

export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function validateSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session_id")?.value;
  const sessionKey = cookieStore.get("session_key")?.value;
  const authToken = cookieStore.get("auth_token")?.value;

  // Basic cookie validation
  if (!sessionId || !sessionKey || !authToken) {
    return false;
  }

  return true;
}

export async function getSessionData(): Promise<AuthSession | null> {
  const cookieStore = await cookies();
  
  // Check required session cookies
  const sessionId = cookieStore.get("session_id")?.value;
  const sessionKey = cookieStore.get("session_key")?.value;
  const authToken = cookieStore.get("auth_token")?.value;
  const userDataCookie = cookieStore.get("user_data")?.value;

  if (!sessionId || !sessionKey || !authToken) {
    return null;
  }

  // Validate Supabase token
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser(authToken);
  
  if (authError || !user) {
    return null;
  }

  // Validate session against database
  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .select("session_id, session_key, uid, expires_at, created_at")
    .eq("session_id", sessionId)
    .eq("session_key", sessionKey)
    .single();

  if (sessionError || !session) {
    return null;
  }

  // Check expiry
  const now = new Date();
  const expiresAt = new Date(session.expires_at);
  
  if (now > expiresAt) {
    // Clean up expired session
    await supabase.from("sessions").delete().eq("session_id", sessionId);
    return null;
  }

  // Parse user data from cookie
  let userData: AuthCookieData | null = null;
  
  if (userDataCookie) {
    try {
      userData = JSON.parse(userDataCookie);
    } catch {
      userData = null;
    }
  }

  // Fallback: query students table
  if (!userData) {
    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("uid, name, regno, email")
      .eq("uid", user.id)
      .single();

    if (studentError || !student) {
      return null;
    }

    userData = {
      uid: student.uid,
      name: student.name,
      email: student.email,
      regno: student.regno,
    };
  }

  if (!userData) {
    return null;
  }

  return {
    session_id: session.session_id,
    session_key: session.session_key,
    uid: session.uid,
    created_at: session.created_at,
    expires_at: session.expires_at,
    user: userData,
  };
}

// Only use on protected pages
export async function requireAuth(): Promise<void> {
  const session = await getSessionData();
  
  if (!session) {
    redirect("/login");
  }
}

export async function redirectIfAuthed(): Promise<void> {
  const session = await getSessionData();
  
  if (session) {
    redirect("/dashboard");
  }
}

export function displayName(user: any): string {
  return user?.name || user?.username || user?.email || "User";
}