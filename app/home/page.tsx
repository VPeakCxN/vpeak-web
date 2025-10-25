// app/(routes)/home/page.tsx (server component)
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { PostCard } from '@/components/posts/PostCard';
import type { Database } from '@/lib/database.types';
import { AuthSession } from '@/lib/cookies.types';
import { TweetComposer } from '@/components/composer/TweetComposer';

export default async function Home() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('auth_session')?.value;

  let session: AuthSession | null = null;
  let isAuthenticated = false;
  let currentUserId: string | null = null;

  if (sessionCookie) {
    try {
      session = JSON.parse(sessionCookie) as AuthSession;
      isAuthenticated = true;
      currentUserId = session.uid;
      console.log('Home - Current user ID:', currentUserId);
    } catch (error) {
      console.error('Home - Invalid auth_session cookie:', error);
    }
  }

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: posts, error: postsError } = await supabase
    .from('posts')
    .select('post_id, title, content, created_at, author_id')
    .order('created_at', { ascending: false });

  if (postsError || !posts) {
    console.error('Home - Posts fetch error:', postsError);
    return (
      <div className="container mx-auto p-4">
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
          Error loading posts: {postsError?.message || 'Unknown error'}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      {/* Centered column wrapper */}
      <div className="flex justify-center">
        <div className="w-full max-w-2xl mx-auto">
          {/* Theme-aware, no-hardcode Tweet card */}
          <TweetComposer />

          {posts.length === 0 ? (
            <p className="text-muted-foreground">No posts available.</p>
          ) : (
            <div className="space-y-4">
              <h1 className="text-2xl font-bold">Posts</h1>
              {posts.map((post) => (
                <PostCard key={post.post_id} post_id={post.post_id} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
