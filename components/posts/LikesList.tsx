'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import type { Tables } from '@/lib/database.types';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { AuthSession } from '@/lib/cookies.types';

type PostLike = Tables<'post_likes'> & { name?: string };

interface LikesListProps {
  postId: string;
  likers: (PostLike & { name: string })[];
  likesCount: number;
  currentUserId?: string;
  isAuthenticated: boolean;
  session?: AuthSession;
}

export function LikesList({ postId, likers, likesCount, currentUserId, isAuthenticated, session }: LikesListProps) {
  const [isPending, startTransition] = useTransition();
  const [currentLikes, setCurrentLikes] = useState(likesCount);
  const [isLiked, setIsLiked] = useState(likers.some((like) => like.user_id === currentUserId));

  const handleToggleLike = () => {
    if (!isAuthenticated || !session) {
      toast.error('Please log in to like this post');
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch('/api/posts/likes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ post_id: postId }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to toggle like');
        }

        const result = await response.json();
        if (result.action === 'added') {
          setCurrentLikes((prev) => prev + 1);
          setIsLiked(true);
        } else {
          setCurrentLikes((prev) => prev - 1);
          setIsLiked(false);
        }
        toast.success(`Like ${result.action === 'added' ? 'added' : 'removed'}`);
      } catch (error: any) {
        toast.error(error.message || 'Failed to toggle like. Please try again.');
      }
    });
  };

  return (
    <div className="flex items-center space-x-2">
      <Button
        variant="ghost"
        size="sm"
        className="p-0 h-auto hover:bg-transparent"
        onClick={handleToggleLike}
        disabled={isPending || !isAuthenticated}
      >
        <span role="img" aria-label="heart" className={`mr-1 ${isLiked ? 'text-red-500' : ''}`}>
          {isLiked ? '❤️' : '🤍'}
        </span>
      </Button>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="ghost" className="p-0 h-auto font-normal hover:bg-transparent">
            <span>{currentLikes} Likes</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Likes ({currentLikes})</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {likers.length > 0 ? (
              likers.map((like) => (
                <div key={like.uuid} className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{like.name?.[0] || 'U'}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{like.name || 'Unknown User'}</span>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground">No likes yet</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}