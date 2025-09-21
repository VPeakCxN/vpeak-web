import { createClient } from '@supabase/supabase-js';
import type { Database, Tables } from '@/lib/database.types';
import { generateUUID } from '@/lib/tools/generateUUID';
import { cookies } from 'next/headers';
import { AuthSession } from '@/lib/cookies.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

export async function addComment(postId: string, commentText: string): Promise<Tables<'post_comments'>> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('auth_session')?.value;
  
  if (!sessionCookie) {
    throw new Error('Not authenticated');
  }

  let session: AuthSession;
  try {
    session = JSON.parse(sessionCookie) as AuthSession;
  } catch {
    throw new Error('Invalid session cookie');
  }

  const { data: sessionData, error: sessionError } = await supabase
    .from('sessions')
    .select('*')
    .eq('session_id', session.session_id)
    .eq('session_key', session.session_key)
    .eq('uid', session.uid)
    .single();

  if (sessionError || !sessionData) {
    throw new Error('Invalid or expired session');
  }

  const comment: Tables<'post_comments'> = {
    uuid: generateUUID(),
    post_id: postId,
    user_id: session.uid,
    comment: commentText,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('post_comments')
    .insert(comment)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to add comment: ${error.message}`);
  }

  return data;
}

export async function deleteComment(commentId: string, postId: string): Promise<void> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('auth_session')?.value;
  
  if (!sessionCookie) {
    throw new Error('Not authenticated');
  }

  let session: AuthSession;
  try {
    session = JSON.parse(sessionCookie) as AuthSession;
  } catch {
    throw new Error('Invalid session cookie');
  }

  const { data: sessionData, error: sessionError } = await supabase
    .from('sessions')
    .select('*')
    .eq('session_id', session.session_id)
    .eq('session_key', session.session_key)
    .eq('uid', session.uid)
    .single();

  if (sessionError || !sessionData) {
    throw new Error('Invalid or expired session');
  }

  const { data: comment, error: commentError } = await supabase
    .from('post_comments')
    .select('*')
    .eq('uuid', commentId)
    .eq('post_id', postId)
    .eq('user_id', session.uid)
    .single();

  if (commentError || !comment) {
    throw new Error('Comment not found or not authorized to delete');
  }

  const { error } = await supabase
    .from('post_comments')
    .delete()
    .eq('uuid', commentId)
    .eq('user_id', session.uid);

  if (error) {
    throw new Error(`Failed to delete comment: ${error.message}`);
  }
}