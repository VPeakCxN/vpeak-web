import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import type { Database, Tables } from '@/lib/database.types';
import { generateUUID } from '@/lib/tools/generateUUID';
import { AuthSession } from '@/lib/cookies.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { post_id } = req.body;
    if (!post_id) {
      return res.status(400).json({ error: 'Missing post_id' });
    }

    const sessionCookie = req.cookies['auth_session'];
    if (!sessionCookie) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    let session: AuthSession;
    try {
      session = JSON.parse(sessionCookie) as AuthSession;
    } catch {
      return res.status(401).json({ error: 'Invalid session cookie' });
    }

    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('session_id', session.session_id)
      .eq('session_key', session.session_key)
      .eq('uid', session.uid)
      .single();

    if (sessionError || !sessionData) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    const { data: existingLike, error: likeError } = await supabase
      .from('post_likes')
      .select('uuid')
      .eq('post_id', post_id)
      .eq('user_id', session.uid)
      .single();

    if (likeError && likeError.code !== 'PGRST116') {
      return res.status(500).json({ error: `Failed to check like status: ${likeError.message}` });
    }

    if (existingLike) {
      const { error } = await supabase
        .from('post_likes')
        .delete()
        .eq('uuid', existingLike.uuid)
        .eq('user_id', session.uid);

      if (error) {
        return res.status(500).json({ error: `Failed to unlike post: ${error.message}` });
      }

      return res.status(200).json({ action: 'removed' });
    } else {
      const like: Tables<'post_likes'> = {
        uuid: generateUUID(),
        post_id,
        user_id: session.uid,
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('post_likes')
        .insert(like);

      if (error) {
        return res.status(500).json({ error: `Failed to like post: ${error.message}` });
      }

      return res.status(201).json({ action: 'added' });
    }
  } catch (error: any) {
    return res.status(500).json({ error: `Server error: ${error.message || 'Unknown error'}` });
  }
}