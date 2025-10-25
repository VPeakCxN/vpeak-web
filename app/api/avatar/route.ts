// app/api/avatar/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const AVATARS_BUCKET = process.env.SUPABASE_AVATARS_BUCKET || 'avatars'; // configure if different
const SIGNED_URL_TTL = parseInt(process.env.AVATAR_SIGNED_URL_TTL || '3600', 10); // 1h

function isAbsoluteUrl(u: string) {
  try { const x = new URL(u); return x.protocol === 'http:' || x.protocol === 'https:'; } catch { return false; }
}

function extractStoragePathFromUrl(url: string): { bucket?: string; path?: string } {
  try {
    const u = new URL(url);
    // Expected: https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path...>
    // or private: .../object/sign/<bucket>/<path...>?token=...
    const parts = u.pathname.split('/').filter(Boolean); // ['storage','v1','object','public','bucket','rest...']
    const idx = parts.findIndex(p => p === 'public' || p === 'sign');
    if (idx >= 0 && parts[idx + 1]) {
      const bucket = parts[idx + 1];
      const path = parts.slice(idx + 2).join('/');
      return { bucket, path };
    }
  } catch {}
  return {};
}

export async function GET(request: Request) {
  const reqId = crypto.randomUUID();
  const url = new URL(request.url);
  const uid = url.searchParams.get('uid');

  if (!uid) {
    console.error(`[avatar][${reqId}] Missing uid`);
    return NextResponse.json({ error: 'Missing uid' }, { status: 400, headers: { 'X-Debug-Id': reqId } });
  }
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error(`[avatar][${reqId}] Missing Supabase env vars`);
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500, headers: { 'X-Debug-Id': reqId } });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

  try {
    // 1) students.avatar (bucket link or full URL)
    console.log(`[avatar][${reqId}] Query students.avatar for uid=${uid}`);
    const { data: studentRow, error: studentErr } = await supabase
      .from('students')
      .select('avatar')
      .eq('uid', uid)
      .maybeSingle();
    if (studentErr) console.warn(`[avatar][${reqId}] student query error:`, studentErr);

    if (studentRow?.avatar) {
      const raw = String(studentRow.avatar);
      console.log(`[avatar][${reqId}] Found students.avatar="${raw}"`);
      if (isAbsoluteUrl(raw)) {
        // If it is a full URL, use as is (works for public buckets or external CDNs)
        console.log(`[avatar][${reqId}] students.avatar is absolute URL -> using directly`);
        return NextResponse.json({ avatarUrl: raw, source: 'student-url' }, { headers: { 'X-Debug-Id': reqId } });
      }
      // Treat as storage object path
      const hinted = extractStoragePathFromUrl(raw);
      const bucket = hinted.bucket || AVATARS_BUCKET;
      const objectPath = hinted.path || raw.replace(/^\/+/, '');
      console.log(`[avatar][${reqId}] students.avatar treated as path bucket="${bucket}" path="${objectPath}"`);

      // Prefer signed URL so it works for private or public buckets alike
      const { data: signed, error: signErr } = await supabase
        .storage
        .from(bucket)
        .createSignedUrl(objectPath, SIGNED_URL_TTL, { transform: { width: 96, height: 96 } });
      if (signErr) {
        console.warn(`[avatar][${reqId}] createSignedUrl error:`, signErr);
        // Fallback: try public URL (will only work if bucket is public)
        const { data: pub } = supabase.storage.from(bucket).getPublicUrl(objectPath, { transform: { width: 96, height: 96 } });
        console.log(`[avatar][${reqId}] Fallback publicUrl="${pub.publicUrl}"`);
        return NextResponse.json({ avatarUrl: pub.publicUrl, source: 'student-public' }, { headers: { 'X-Debug-Id': reqId } });
      }
      console.log(`[avatar][${reqId}] Using signedUrl from students.avatar`);
      return NextResponse.json({ avatarUrl: signed.signedUrl, source: 'student-signed' }, { headers: { 'X-Debug-Id': reqId } });
    }

    // 2) Supabase Auth metadata (Google)
    console.log(`[avatar][${reqId}] Lookup auth.admin.getUserById for uid=${uid}`);
    const { data: adminUserRes, error: adminErr } = await (supabase as any).auth.admin.getUserById(uid);
    if (adminErr) console.warn(`[avatar][${reqId}] auth.admin.getUserById error:`, adminErr);

    const meta = adminUserRes?.user?.user_metadata || {};
    const authAvatar = (meta.avatar_url as string | undefined) || (meta.picture as string | undefined) || null;
    console.log(`[avatar][${reqId}] auth metadata avatar=${authAvatar ? 'present' : 'null'}`);
    if (authAvatar) {
      return NextResponse.json({ avatarUrl: authAvatar, source: 'auth' }, { headers: { 'X-Debug-Id': reqId } });
    }

    // 3) Placeholder: allow UI to show initials/gradient
    console.log(`[avatar][${reqId}] No avatar found, using placeholder`);
    return NextResponse.json({ avatarUrl: null, source: 'placeholder' }, { headers: { 'X-Debug-Id': reqId } });
  } catch (e) {
    console.error(`[avatar][${reqId}] Uncaught error:`, e);
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500, headers: { 'X-Debug-Id': reqId } });
  }
}
