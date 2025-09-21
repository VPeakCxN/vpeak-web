import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { PostCard } from '@/components/posts/PostCard';
import { AuthSession } from '@/lib/cookies.types';
import type { Database } from '@/lib/database.types';
import { notFound } from 'next/navigation';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

interface PostPageProps {
  params: Promise<{ post_id: string }>;
}

export default async function PostPage({ params }: PostPageProps) {
  const { post_id } = await params; // Await the params Promise

  if (!post_id || typeof post_id !== 'string') {
    notFound();
  }

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('auth_session')?.value;
  let currentUserId: string | undefined;
  let isAuthenticated = false;
  let session: AuthSession | undefined;

  if (sessionCookie) {
    try {
      session = JSON.parse(sessionCookie) as AuthSession;
      const { data: sessionData, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('session_id', session.session_id)
        .eq('session_key', session.session_key)
        .eq('uid', session.uid)
        .single();

      if (!error && sessionData) {
        currentUserId = session.uid;
        isAuthenticated = true;
      } else {
        session = undefined;
      }
    } catch {
      console.error('Invalid session cookie');
      session = undefined;
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <PostCard
          post_id={post_id}
          currentUserId={currentUserId}
          isAuthenticated={isAuthenticated}
          session={session}
        />
      </div>
    </div>
  );
}