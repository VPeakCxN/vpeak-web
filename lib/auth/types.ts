// lib/auth/types.ts
export type Student = {
  uid: string;
  name: string;
  regno: string;
  dob: string;             // YYYY-MM-DD
  dept: string;
  personal_email: string;
  phone: string;
};

export type VerifiedUser = {
  uid: string;
  supabase_user_id: string;
  email?: string | null;
  username?: string | null;
  avatar_url?: string | null;
  roles?: string[];
  permissions?: string[];
  // no 'name' here; use student.name
};

export type AppUser = VerifiedUser & { student?: Student | null };
