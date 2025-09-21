// @/components/LikesList.tsx
'use client';

import { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import { useCookies } from '@/hooks/getCookies';
import type { Tables } from '@/lib/database.types';

type Liker = Tables<'post_likes'> & { name?: string; avatar?: string };

interface LikesListProps {
  postId: string;
  likers: Liker[];
  initialLikesCount: number;
  isAuthenticated: boolean;
  currentUserId?: string | null;
}

export function LikesList({
  postId,
  likers: initialLikers,
  initialLikesCount,
  isAuthenticated: initialAuthenticated,
  currentUserId: initialUserId,
}: LikesListProps) {
  const { isAuthenticated, currentUserId, user } = useCookies();
  const [likers, setLikers] = useState<Liker[]>(initialLikers);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [isLiked, setIsLiked] = useState(
    initialLikers.some((liker) => liker.user_id === currentUserId)
  );
  const [isPending, setIsPending] = useState(false);

  // Sync isLiked when initialLikers or currentUserId changes
  useEffect(() => {
    setIsLiked(initialLikers.some((liker) => liker.user_id === currentUserId));
    setLikers(initialLikers);
    setLikesCount(initialLikesCount);
  }, [initialLikers, currentUserId, initialLikesCount]);

  const handleLike = async () => {
    if (!isAuthenticated || !currentUserId) {
      toast.error('Please log in to like this post');
      return;
    }

    if (isLiked) {
      toast.info('You have already liked this post');
      return;
    }

    setIsPending(true);
    const originalLikers = [...likers];
    const originalLikesCount = likesCount;
    const originalIsLiked = isLiked;

    // Optimistic UI update
    const newLiker: Liker = {
      uuid: `temp-${Date.now()}`,
      post_id: postId,
      user_id: currentUserId,
      created_at: new Date().toISOString(),
      name: user?.name || 'You',
      avatar: user?.avatar,
    };
    setLikers([newLiker, ...likers]);
    setLikesCount((prev) => prev + 1);
    setIsLiked(true);

    try {
      const response = await fetch('/api/posts/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to like');
      }

      const { action, likesCount: updatedLikesCount } = await response.json();
      setLikesCount(updatedLikesCount);

      if (action === 'already') {
        setLikers(originalLikers);
        setLikesCount(originalLikesCount);
        setIsLiked(originalIsLiked);
        toast.info('You have already liked this post');
      } else {
        // Fetch updated likers list
        const res = await fetch(`/api/posts/likes?post_id=${postId}`, {
          credentials: 'include',
        });
        if (res.ok) {
          const { likers: updatedLikers } = await res.json();
          setLikers(updatedLikers || []);
        }

        toast.success('Post liked!');
      }

      // Trigger revalidation
      await fetch('/api/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: `/posts/${postId}` }),
        credentials: 'include',
      });
    } catch (error: any) {
      setLikers(originalLikers);
      setLikesCount(originalLikesCount);
      setIsLiked(originalIsLiked);
      toast.error(error.message || 'Failed to like. Please try again.');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Button
        variant="ghost"
        size="sm"
        className={`p-0 h-auto text-foreground hover:bg-transparent ${isLiked ? 'text-red-500' : ''}`}
        onClick={handleLike}
        disabled={isPending || isLiked}
      >
        <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
      </Button>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className="p-0 h-auto font-normal hover:bg-transparent text-foreground"
          >
            <span>{likesCount} {likesCount === 1 ? 'Like' : 'Likes'}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 bg-background border-border">
          <div className="space-y-4 max-h-[50vh] overflow-y-auto">
            <h4 className="text-sm font-semibold text-foreground">Likes ({likesCount})</h4>
            {likers.length > 0 ? (
              likers.map((liker) => (
                <div key={liker.uuid} className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    {liker.avatar ? (
                      <AvatarImage src={liker.avatar} alt={liker.name} />
                    ) : (
                      <AvatarFallback className="text-xs text-foreground">
                        {liker.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <span className="text-sm text-foreground">{liker.name || 'User'}</span>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground">No likes yet</p>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}