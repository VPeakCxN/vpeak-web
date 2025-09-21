// lib/supabase/server.ts
import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function createSupabaseServerClient() {
  const cookieStorePromise = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async getAll() {
          return (await cookieStorePromise).getAll();
        },
        async setAll(cookiesToSet) {
          try {
            const store = await cookieStorePromise;
            cookiesToSet.forEach(({ name, value, options }) => {
              store.set(name, value, options);
            });
          } catch {
            // Safe to ignore if called from a Server Component without direct response access
          }
        },
      },
      auth: {
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
      },
    }
  );
}