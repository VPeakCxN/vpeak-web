"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Database } from "@/lib/database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function getOrigin() {
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const host = process.env.VERCEL_URL || "localhost:3000";
  return `${protocol}://${host}`;
}

export async function signInWithGoogle() {
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
        } catch {
          throw new Error('Could not parse set-cookie header');
        }
      },
    },
  });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${getOrigin()}/auth/callback`,
    },
  });

  if (error) {
    console.error("OAuth initiation error:", error);
    throw new Error("Failed to initiate Google sign-in");
  }

  if (data.url) {
    redirect(data.url);
  }

  throw new Error("No redirect URL received");
}

export async function signOut() {
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
        } catch {
          throw new Error('Could not parse set-cookie header');
        }
      },
    },
  });

  // Clear all auth cookies
  const cookieNames = [
    "auth_token",
    "session_id", 
    "session_key",
    "uid",
    "name",
    "regno",
    "email",
    "user_data"
  ];

  cookieNames.forEach(name => {
    cookieStore.delete(name);
  });

  // Sign out from Supabase
  await supabase.auth.signOut();
  
  redirect("/login");
}