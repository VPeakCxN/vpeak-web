'use client';

import { useState, useEffect } from 'react';

export interface SessionData {
  uid: string;
  name: string;
  email: string;
  regno: string;
  avatar?: string;
}

export interface AuthSession {
  id: string;
  uid: string;
  created_at: string;
  expires_at: string;
  user?: SessionData;
}

export function useSession() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifySession = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('🔍 useSession: Fetching session...');

        const response = await fetch('/api/auth/session/fetch', {
          credentials: 'include', // Send cookies
        });

        const data = await response.json();

        if (!response.ok) {
          console.log(`❌ useSession: Fetch failed with status ${response.status}:`, data.reason);
          setSession(null);
          return;
        }

        if (data.valid) {
          console.log('✅ useSession: Valid session received:', data.session?.id);
          const sessionData = data.session || {
            id: data.session_id,
            uid: data.uid,
            created_at: data.created_at || new Date().toISOString(),
            expires_at: data.expires_at,
          };

          let userData: SessionData = {
            uid: sessionData.uid,
            name: '',
            email: '',
            regno: '',
          };

          if (data.user) {
            userData = { ...userData, ...data.user };
          } else if (data.supabaseUser) {
            userData = {
              ...userData,
              email: data.supabaseUser.email || '',
              name: (data.supabaseUser.user_metadata?.name as string) || '',
            };
          }

          const storedUser = localStorage.getItem('user_data');
          if (storedUser) {
            try {
              const stored = JSON.parse(storedUser);
              userData = { ...userData, ...stored };
            } catch {
              console.log('⚠️ useSession: Failed to parse user_data from localStorage');
            }
          }

          setSession({
            ...sessionData,
            user: userData,
          });

          localStorage.setItem('user_data', JSON.stringify(userData));
          console.log('✅ useSession: Session set, user:', userData.uid);
        } else {
          console.log('❌ useSession: Invalid session:', data.reason);
          setSession(null);
        }
      } catch (err) {
        console.error('❌ useSession: Session fetch error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    verifySession();

    const interval = setInterval(verifySession, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      setSession(null);
      localStorage.removeItem('user_data');
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = '/login';
    }
  };

  return {
    session,
    loading,
    error,
    isAuthenticated: !!session,
    user: session?.user || null,
    logout,
  };
}