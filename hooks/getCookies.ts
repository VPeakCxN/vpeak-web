// @/hooks/getCookies.ts
'use client';

import { useEffect, useState } from 'react';
import type { AuthSession } from '@/lib/cookies.types';

export function useCookies() {
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [isAuthenticated] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null | undefined>(null);

  const getCookie = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return undefined;
  };

  useEffect(() => {
    console.log('useCookies: Checking cookies');
    const uid = getCookie('uid');
    const sessionId = getCookie('session_id');
    const sessionKey = getCookie('session_key');
    let userData = getCookie('user_data');

    console.log('useCookies: Raw cookie values:', { uid, sessionId, sessionKey, userData });

    if (userData) {
      try {
        userData = decodeURIComponent(userData);
        const user = JSON.parse(userData);
        const session: AuthSession = {
          uid: user.uid || uid || 'dummy-uid',
          session_id: sessionId || 'dummy-session-id',
          session_key: sessionKey || 'dummy-session-key',
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Assume 7 days expiry
          user,
        };
        console.log('useCookies: Parsed session from user_data:', session);
        setAuthSession(session);
        setCurrentUserId(session.uid);
        console.log('useCookies: User authenticated, uid:', session.uid);
      } catch (error) {
        console.error('useCookies: Failed to parse user_data cookie:', error);
        setAuthSession(null);
        setCurrentUserId(null);
      }
    } else if (uid && sessionId && sessionKey) {
      console.log('useCookies: Using separate cookies');
      const session: AuthSession = {
        uid,
        session_id: sessionId,
        session_key: sessionKey,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        user: { uid, name: 'Unknown', email: '', regno: '' },
      };
      setAuthSession(session);
      setCurrentUserId(uid);
    } else {
      console.log('useCookies: Required cookies missing');
      setAuthSession(null);
      setCurrentUserId(null);
    }
  }, []); // Empty dependency array

  // Poll for cookie changes
  useEffect(() => {
    const interval = setInterval(() => {
      const uid = getCookie('uid');
      const sessionId = getCookie('session_id');
      const sessionKey = getCookie('session_key');
      let userData = getCookie('user_data');

      if (!authSession) {
        if (userData) {
          try {
            userData = decodeURIComponent(userData);
            const user = JSON.parse(userData);
            const session: AuthSession = {
              uid: user.uid || uid || 'dummy-uid',
              session_id: sessionId || 'dummy-session-id',
              session_key: sessionKey || 'dummy-session-key',
              created_at: new Date().toISOString(),
              expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              user,
            };
            setAuthSession(session);
            setCurrentUserId(session.uid);
          } catch (error) {
            console.error('useCookies: Failed to parse new user_data cookie:', error);
          }
        } else if (uid && sessionId && sessionKey) {
          const session: AuthSession = {
            uid,
            session_id: sessionId,
            session_key: sessionKey,
            created_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            user: { uid, name: 'Unknown', email: '', regno: '' },
          };
          setAuthSession(session);
          setCurrentUserId(uid);
        }
      } else if ((!userData && !uid && !sessionId && !sessionKey) && authSession) {
        console.log('useCookies: Cookies removed');
        setAuthSession(null);
        setCurrentUserId(null);
      }
    }, 1000); // Check every second

    return () => clearInterval(interval);
  }, [authSession]);

  return {
    authSession,
    isAuthenticated,
    user: authSession?.user || null,
    currentUserId,
  };
}