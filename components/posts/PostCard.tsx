import { createClient } from '@supabase/supabase-js';
import type { Database, Tables } from '@/lib/database.types';
import { ImageCarousel } from './ImageCarousel';
import { LikesList } from './LikesList';
import { Comments } from './Comments';
import { Suspense } from 'react';
import { AuthSession } from '@/lib/cookies.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

interface PostCardProps {
  post_id: string;
  currentUserId?: string;
  isAuthenticated: boolean;
  session?: AuthSession;
}

export async function PostCard({ post_id, currentUserId, isAuthenticated, session }: PostCardProps) {
  const { data: post, error: postError } = await supabase
    .from('posts')
    .select('*')
    .eq('post_id', post_id)
    .single();

  if (postError || !post) {
    return <div className="p-4 bg-red-100 text-red-700 rounded-lg">Error loading post: {postError?.message || 'Post not found'}</div>;
  }

  const { data: author, error: authorError } = await supabase
    .from('students')
    .select('name, email')
    .eq('uid', post.author_id ?? '')
    .single();

  if (authorError || !author) {
    return <div className="p-4 bg-red-100 text-red-700 rounded-lg">Error loading author: {authorError?.message || 'Author not found'}</div>;
  }

  const { data: files } = await supabase
    .from('post_files')
    .select('*')
    .eq('post_id', post_id)
    .order('created_at', { ascending: true });

  const { data: likesData } = await supabase
    .from('post_likes')
    .select('uuid, user_id, created_at, post_id')
    .eq('post_id', post_id);

  const likers = likesData?.length
    ? await Promise.all(
        likesData.map(async (like) => {
          const { data: student } = await supabase
            .from('students')
            .select('name')
            .eq('uid', like.user_id ?? '')
            .single();
          return {
            ...like,
            name: student?.name || 'Unknown',
          };
        })
      )
    : [];
  const likesCount = likers.length;

  const { data: commentsData } = await supabase
    .from('post_comments')
    .select('uuid, user_id, comment, created_at, post_id')
    .eq('post_id', post_id)
    .order('created_at', { ascending: false });

  const comments = commentsData?.length
    ? await Promise.all(
        commentsData.map(async (comment) => {
          const { data: student } = await supabase
            .from('students')
            .select('name')
            .eq('uid', comment.user_id ?? '')
            .single();
          return {
            ...comment,
            name: student?.name || 'Unknown',
          };
        })
      )
    : [];
  const commentsCount = comments.length;

  const { count: sharesCount } = await supabase
    .from('post_shares')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', post_id);

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl my-4">
      <div className="flex items-center p-4">
        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600">
          {author.name?.[0] || 'U'}
        </div>
        <div className="ml-3">
          <p className="font-semibold">{author.name || 'Unknown User'}</p>
          <p className="text-xs text-gray-500">
            {post.created_at ? new Date(post.created_at).toLocaleDateString() : 'Unknown date'}
          </p>
        </div>
      </div>

      {files && files.length > 0 && <ImageCarousel files={files} />}

      <div className="p-4">
        <h2 className="font-bold text-xl mb-2">{post.title}</h2>
        <p className="text-gray-700">{post.content}</p>
      </div>

      <div className="flex justify-between p-4 border-t">
        <LikesList
          postId={post_id}
          likers={likers}
          likesCount={likesCount}
          currentUserId={currentUserId}
          isAuthenticated={isAuthenticated}
          session={session}
        />
        <div className="flex items-center">
          <span role="img" aria-label="comment" className="mr-1">💬</span>
          <span>{commentsCount} Comments</span>
        </div>
        <div className="flex items-center">
          <span role="img" aria-label="share" className="mr-1">🔗</span>
          <span>{sharesCount || 0} Shares</span>
        </div>
      </div>

      <Suspense fallback={<div>Loading comments...</div>}>
        <Comments
          postId={post_id}
          initialComments={comments}
          currentUserId={currentUserId}
          isAuthenticated={isAuthenticated}
          session={session}
        />
      </Suspense>
    </div>
  );
}