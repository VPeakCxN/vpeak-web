import { createClient, type Session, type User } from "@supabase/supabase-js"

/**
 * Supabase client setup
 * Reads config from multiple sources to work locally (Vite) and in other environments.
 */
const supabaseUrl =
  (import.meta as any)?.env?.VITE_SUPABASE_URL ||
  (typeof window !== "undefined" && (window as any).SUPABASE_URL) ||
  (typeof process !== "undefined" && (process as any).env?.SUPABASE_URL)

const supabaseAnonKey =
  (import.meta as any)?.env?.VITE_SUPABASE_ANON_KEY ||
  (typeof window !== "undefined" && (window as any).SUPABASE_ANON_KEY) ||
  (typeof process !== "undefined" && (process as any).env?.SUPABASE_ANON_KEY)

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("[SCUD] Missing Supabase configuration. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.")
}

export const supabase = createClient(supabaseUrl as string, supabaseAnonKey as string)

export type { Session, User }
