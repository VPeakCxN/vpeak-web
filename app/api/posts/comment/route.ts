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
  if (req.method === 'POST') {
    return handleAddComment(req, res);
  } else if (req.method === 'DELETE') {
    return handleDeleteComment(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleAddComment(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { post_id, comment } = req.body;
    if (!post_id || !comment) {
      return res.status(400).json({ error: 'Missing post_id or comment' });
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

    const newComment: Tables<'post_comments'> = {
      uuid: generateUUID(),
      post_id,
      user_id: session.uid,
      comment,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('post_comments')
      .insert(newComment)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: `Failed to add comment: ${error.message}` });
    }

    return res.status(201).json(data);
  } catch (error: any) {
    return res.status(500).json({ error: `Server error: ${error.message || 'Unknown error'}` });
  }
}

async function handleDeleteComment(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { comment_id, post_id } = req.body;
    if (!comment_id || !post_id) {
      return res.status(400).json({ error: 'Missing comment_id or post_id' });
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

    const { data: comment, error: commentError } = await supabase
      .from('post_comments')
      .select('*')
      .eq('uuid', comment_id)
      .eq('post_id', post_id)
      .eq('user_id', session.uid)
      .single();

    if (commentError || !comment) {
      return res.status(403).json({ error: 'Comment not found or not authorized to delete' });
    }

    const { error } = await supabase
      .from('post_comments')
      .delete()
      .eq('uuid', comment_id)
      .eq('user_id', session.uid);

    if (error) {
      return res.status(500).json({ error: `Failed to delete comment: ${error.message}` });
    }

    return res.status(200).json({ message: 'Comment deleted' });
  } catch (error: any) {
    return res.status(500).json({ error: `Server error: ${error.message || 'Unknown error'}` });
  }
}