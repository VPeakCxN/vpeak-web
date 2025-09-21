export interface AuthCookieData {
  uid: string;
  name: string;
  email: string;
  regno: string;
  avatar?: string;
}

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