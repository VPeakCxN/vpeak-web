import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { PostCard } from '@/components/posts/PostCard';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export default async function PostPage({ params }: { params: Promise<{ post_id: string }> }) {
  const { post_id } = await params; // Await params to access post_id

  const { data: post } = await supabase
    .from('posts')
    .select('post_id')
    .eq('post_id', post_id)
    .single();

  if (!post) {
    return <div className="p-4 bg-destructive/10 text-destructive rounded-lg">Post not found</div>;
  }

  return <PostCard post_id={post_id} />;
}