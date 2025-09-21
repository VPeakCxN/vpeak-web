import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { PostCard } from '@/components/posts/PostCard';
import type { Database } from '@/lib/database.types';
import { AuthSession } from '@/lib/cookies.types';

export default async function Home() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('auth_session')?.value;
  let session: AuthSession | null = null;
  let isAuthenticated = false;
  let currentUserId: string | null = null;

  // Parse auth_session cookie
  if (sessionCookie) {
    try {
      session = JSON.parse(sessionCookie) as AuthSession;
      isAuthenticated = true;
      currentUserId = session.uid;
      console.log('Home - Current user ID:', currentUserId); // Debug log
    } catch (error) {
      console.error('Home - Invalid auth_session cookie:', error); // Debug log
    }
  }

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Fetch posts ordered by created_at descending
  const { data: posts, error: postsError } = await supabase
    .from('posts')
    .select('post_id, title, content, created_at, author_id')
    .order('created_at', { ascending: false });

  if (postsError || !posts) {
    console.error('Home - Posts fetch error:', postsError); // Debug log
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Home</h1>
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
          Error loading posts: {postsError?.message || 'Unknown error'}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Home</h1>
      {posts.length === 0 ? (
        <p className="text-muted-foreground">No posts available.</p>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.post_id} post_id={post.post_id} />
          ))}
        </div>
      )}
    </div>
  );
}