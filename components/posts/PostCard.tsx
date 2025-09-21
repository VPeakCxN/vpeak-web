// @/components/PostCard.tsx
import { createClient } from '@supabase/supabase-js';
import type { Database, Tables } from '@/lib/database.types';
import { ImageCarousel } from './ImageCarousel';
import { LikesList } from './LikesList';
import { Comments } from './Comments';
import { SharePopover } from './SharePopover';
import { AuthSession } from '@/lib/cookies.types';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import avatarPlaceholder from '@/components/images/placeholder-avatar.png';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

interface PostCardProps {
  post_id: string;
}

export async function PostCard({ post_id }: PostCardProps) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('auth_session')?.value;
  let session: AuthSession | null = null;
  let isAuthenticated = false;

  if (sessionCookie) {
    try {
      session = JSON.parse(sessionCookie) as AuthSession;
      isAuthenticated = true;
    } catch {
      console.error('Invalid auth_session cookie');
    }
  }

  const { data: post, error: postError } = await supabase
    .from('posts')
    .select('*')
    .eq('post_id', post_id)
    .single();

  if (postError || !post) {
    return (
      <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
        Error loading post: {postError?.message || 'Post not found'}
      </div>
    );
  }

  const { data: author, error: authorError } = await supabase
    .from('students')
    .select('uid, name, email, avatar')
    .eq('uid', post.author_id ?? '')
    .single();

  if (authorError || !author) {
    return (
      <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
        Error loading author: {authorError?.message || 'Author not found'}
      </div>
    );
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
          const { data: student, error: studentError } = await supabase
            .from('students')
            .select('name, avatar')
            .eq('uid', like.user_id ?? '')
            .single();

          return {
            ...like,
            name: studentError || !student ? 'Unknown' : student.name,
            avatar: student?.avatar || undefined,
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
          const { data: student, error: studentError } = await supabase
            .from('students')
            .select('name, avatar')
            .eq('uid', comment.user_id ?? '')
            .single();

          return {
            ...comment,
            name: studentError || !student ? 'Unknown' : student.name,
            avatar: student?.avatar || undefined,
          };
        })
      )
    : [];
  const commentsCount = comments.length;

  const { count: sharesCount } = await supabase
    .from('post_shares')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', post_id);

  let isShared = false;
  if (session) {
    const { data: userShare } = await supabase
      .from('post_shares')
      .select('uuid')
      .eq('post_id', post_id)
      .eq('user_id', session.uid)
      .single();
    isShared = !!userShare;
  }

  const images = files?.filter((f) => f.type.startsWith('image/')) || [];
  const videos = files?.filter((f) => f.type.startsWith('video/')) || [];
  const otherFiles = files?.filter((f) => !f.type.startsWith('image/') && !f.type.startsWith('video/')) || [];

  const postUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/posts/${post_id}`;

  return (
    <Card className="w-full bg-background border-border shadow-md rounded-xl overflow-hidden">
      <CardHeader className="pb-2 bg-muted/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Avatar className="h-10 w-10">
              <AvatarImage src={author.avatar || avatarPlaceholder.src} alt={author.name || 'User'} />
              <AvatarFallback className="bg-muted text-foreground">
                {author.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col space-y-0.5">
              <Link
                href={`/profile/${author.uid}`}
                className="font-semibold text-sm text-foreground hover:underline"
              >
                {author.name || 'Anonymous'}
              </Link>
              <span className="text-xs text-muted-foreground">
                {post.created_at ? formatDistanceToNow(new Date(post.created_at), { addSuffix: true }) : 'Unknown date'}
              </span>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="text-foreground hover:bg-accent">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 p-4">
        {post.title && (
          <h1 className="text-lg font-semibold text-foreground">{post.title}</h1>
        )}

        {post.content && (
          <p className="text-sm leading-tight text-foreground">{post.content}</p>
        )}

        {(images.length > 0 || videos.length > 0) && (
          <div className="space-y-2">
            {images.length > 0 && <ImageCarousel files={images} />}

            {videos.map((video) => (
              <div key={video.uuid} className="relative rounded-lg overflow-hidden">
                <video
                  controls
                  className="w-full max-h-96 bg-black"
                  preload="metadata"
                >
                  <source src={video.file_url} type={video.type} />
                  Your browser does not support the video tag.
                </video>
              </div>
            ))}
          </div>
        )}

        {otherFiles.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Attachments</h4>
            <div className="space-y-1">
              {otherFiles.map((file) => (
                <a
                  key={file.uuid}
                  href={file.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent text-sm text-foreground"
                >
                  <div className="h-8 w-8 bg-muted rounded flex items-center justify-center text-foreground">
                    📎
                  </div>
                  <span className="truncate">{file.file_name}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-between items-center border-t border-border pt-4">
          <LikesList
            postId={post_id}
            likers={likers}
            initialLikesCount={likesCount}
            isAuthenticated={isAuthenticated}
            currentUserId={session?.uid}
          />
          <Comments
            postId={post_id}
            initialComments={comments}
            initialCommentsCount={commentsCount}
            isAuthenticated={isAuthenticated}
            currentUserId={session?.uid}
          />
          <SharePopover
            postId={post_id}
            postUrl={postUrl}
            initialSharesCount={sharesCount || 0}
            isAuthenticated={isAuthenticated}
            initialIsShared={isShared}
          />
        </div>
      </CardContent>
    </Card>
  );
}