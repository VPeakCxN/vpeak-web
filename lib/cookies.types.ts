export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      sessions: {
        Row: {
          created_at: string
          expires_at: string
          session_id: string
          session_key: string
          uid: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          session_id?: string
          session_key: string
          uid: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          session_id?: string
          session_key?: string
          uid?: string
        }
        Relationships: []
      }
      students: {
        Row: {
          email: string
          name: string
          regno: string
          uid: string
        }
        Insert: {
          email: string
          name: string
          regno: string
          uid: string
        }
        Update: {
          email?: string
          name?: string
          regno?: string
          uid?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export interface AuthCookieData {
  uid: string;
  name: string;
  email: string;
  regno: string;
  avatar?: string;
}

// ✅ FIXED: Removed auth_token
export interface SessionCookie {
  session_id: string;
  session_key: string;
}

export interface CookieOptions {
  path: string;
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'lax' | 'strict' | 'none';
  maxAge: number;
}

export interface SetCookieOptions {
  name: string;
  value: string;
  options: CookieOptions;
}

export interface AuthSession {
  session_id: string;
  uid: string;
  session_key: string;
  created_at: string;
  expires_at: string;
  user: AuthCookieData;
}