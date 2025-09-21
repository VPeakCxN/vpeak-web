// utils/supabase/admin.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// IMPORTANT: This client must never be shared with user sessions or cookies.
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
