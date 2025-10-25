// @/hooks/getAvatar.ts
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type AvatarResult = {
  avatarUrl: string | null;
  source: 'student' | 'auth' | 'placeholder';
};

export function useAvatar(uid?: string | null) {
  const [avatar, setAvatar] = useState<string | null>(null);
  const [source, setSource] = useState<AvatarResult['source']>('placeholder');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const abortRef = useRef<AbortController | null>(null);
  const debugId = useMemo(() => crypto.randomUUID(), []);

  useEffect(() => {
    if (!uid) {
      console.debug(`[useAvatar][${debugId}] No uid provided`);
      setAvatar(null);
      setSource('placeholder');
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    if (abortRef.current) {
      abortRef.current.abort();
    }
    const ac = new AbortController();
    abortRef.current = ac;

    const url = `/api/avatar?uid=${encodeURIComponent(uid)}`;
    console.debug(`[useAvatar][${debugId}] Fetching ${url}`);

    fetch(url, { signal: ac.signal, headers: { 'Accept': 'application/json' } })
      .then(async (res) => {
        const xId = res.headers.get('X-Debug-Id');
        console.debug(`[useAvatar][${debugId}] Response status=${res.status} x-debug-id=${xId}`);
        const json = await res.json();
        if (!res.ok) {
          console.error(`[useAvatar][${debugId}] Error body:`, json);
          throw new Error(json?.error || `HTTP ${res.status}`);
        }
        const { avatarUrl, source } = json as AvatarResult;
        console.debug(`[useAvatar][${debugId}] Resolved source=${source} url=${avatarUrl || 'null'}`);
        setAvatar(avatarUrl || null);
        setSource(source);
      })
      .catch((err) => {
        if (ac.signal.aborted) {
          console.warn(`[useAvatar][${debugId}] Fetch aborted`);
          return;
        }
        console.error(`[useAvatar][${debugId}] Fetch error:`, err);
        setError(err);
        setAvatar(null);
        setSource('placeholder');
      })
      .finally(() => {
        setLoading(false);
      });

    return () => {
      ac.abort();
    };
  }, [uid, debugId]);

  return { avatar, source, loading, error };
}
