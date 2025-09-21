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

export async function toggleLike(postId: string): Promise<{ action: 'added' | 'removed' }> {
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

  const { data: existingLike, error: likeError } = await supabase
    .from('post_likes')
    .select('uuid')
    .eq('post_id', postId)
    .eq('user_id', session.uid)
    .single();

  if (likeError && likeError.code !== 'PGRST116') {
    throw new Error(`Failed to check like status: ${likeError.message}`);
  }

  if (existingLike) {
    const { error } = await supabase
      .from('post_likes')
      .delete()
      .eq('uuid', existingLike.uuid)
      .eq('user_id', session.uid);

    if (error) {
      throw new Error(`Failed to unlike post: ${error.message}`);
    }

    return { action: 'removed' };
  } else {
    const like: Tables<'post_likes'> = {
      uuid: generateUUID(),
      post_id: postId,
      user_id: session.uid,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('post_likes')
      .insert(like);

    if (error) {
      throw new Error(`Failed to like post: ${error.message}`);
    }

    return { action: 'added' };
  }
}