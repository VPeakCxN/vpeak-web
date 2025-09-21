'use client';

import { useState, useEffect } from 'react';
import { AuthSession } from '@/lib/cookies.types'; // Import AuthSession from database.types

export interface SessionData {
  uid: string;
  name: string;
  email: string;
  regno: string;
  avatar?: string;
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
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();

        if (!response.ok) {
          console.log(`❌ useSession: Fetch failed with status ${response.status}:`, data.reason);
          setSession(null);
          setError(data.reason || 'Session fetch failed');
          return;
        }

        if (data.valid) {
          console.log('✅ useSession: Valid session received:', data.session?.id);
          const sessionData: AuthSession = {
            id: data.session.id,
            uid: data.session.uid,
            session_key: data.session.session_key,
            created_at: data.session.created_at,
            expires_at: data.session.expires_at,
            user: data.user,
          };

          setSession(sessionData);
          localStorage.setItem('user_data', JSON.stringify(data.user));
          console.log('✅ useSession: Session set, user:', data.user.uid);

          if (data.cookiesToSet) {
            document.cookie = `session_id=${data.cookiesToSet.session_id}; path=/; max-age=604800; SameSite=Lax`;
            document.cookie = `session_key=${data.cookiesToSet.session_key}; path=/; max-age=604800; SameSite=Lax`;
            document.cookie = `uid=${data.cookiesToSet.uid}; path=/; max-age=604800; SameSite=Lax`;
            document.cookie = `user_data=${JSON.stringify(data.user)}; path=/; max-age=604800; SameSite=Lax`;
          }
        } else {
          console.log('❌ useSession: Invalid session:', data.reason);
          setSession(null);
          setError(data.reason || 'Invalid session');
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
      document.cookie = 'session_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'session_key=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'uid=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'user_data=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
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