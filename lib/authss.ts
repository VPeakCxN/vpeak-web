// lib/auth/server.ts (server-only functions)
import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function getTokenFromCookie(): Promise<string | null> {
  const store = await cookies();
  return store.get("auth_token")?.value ?? null;
}

export async function getUserFromCookie(): Promise<any> {
  const store = await cookies();
  const userData = store.get("user_data")?.value;
  return userData ? JSON.parse(userData) : null;
}

export async function requireAuth(): Promise<void> {
  const token = await getTokenFromCookie();
  if (!token) {
    redirect("/login");
  }
}

export async function redirectIfAuthed(): Promise<void> {
  const token = await getTokenFromCookie();
  if (token) {
    redirect("/home");
  }
}

export function displayName(user: any): string {
  return user?.name || user?.username || user?.email || "User";
}
