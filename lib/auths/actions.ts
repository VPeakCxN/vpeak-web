// lib/auth/actions.ts

"use server";

import { redirect } from "next/navigation";
import { headers, cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function getOrigin() {
  const h = await headers();
  const origin = h.get("origin");
  const host = h.get("x-forwarded-host");
  const proto = h.get("x-forwarded-proto") || "http";
  if (origin) return origin;
  if (host) return `${proto}://${host}`;
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export async function signInWithGithub() {
  const supabase = createSupabaseServerClient();
  const origin = await getOrigin();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: `${origin}/api/auth/callback`,
    },
  });

  if (error) {
    throw new Error(`GitHub sign-in failed: ${error.message}`);
  }

  return redirect(data.url);
}

export async function signInWithGoogle() {
  const supabase = createSupabaseServerClient();
  const origin = await getOrigin();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/api/auth/callback`,
    },
  });

  if (error) {
    throw new Error(`Google sign-in failed: ${error.message}`);
  }

  return redirect(data.url);
}

export async function signInWithEmail(email: string, password: string) {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(`Email sign-in failed: ${error.message}`);
  }
}

export async function signOut() {
  const cookieStore = await cookies();

  try {
    cookieStore.delete("auth_token");
    cookieStore.delete("refresh_token");
    cookieStore.delete("user_data");
  } catch (err) {
    console.error("Cookie clear error:", err);
  }

  redirect("/login");
}