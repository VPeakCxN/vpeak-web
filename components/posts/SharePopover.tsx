// @/components/SharePopover.tsx
'use client';

import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCookies } from '@/hooks/getCookies';

interface SharePopoverProps {
  postId: string;
  postUrl: string;
  initialSharesCount: number;
  isAuthenticated: boolean;
  initialIsShared: boolean;
}

export function SharePopover({
  postId,
  postUrl,
  initialSharesCount,
  isAuthenticated: initialAuthenticated,
  initialIsShared,
}: SharePopoverProps) {
  const { isAuthenticated, currentUserId } = useCookies();
  const [sharesCount, setSharesCount] = useState(initialSharesCount);
  const [isShared, setIsShared] = useState(initialIsShared);
  const [isPending, setIsPending] = useState(false);

  const handleShare = async () => {
    if (!isAuthenticated || !currentUserId) {
      toast.error('Please log in to share this post');
      return;
    }

    if (isShared) {
      toast.info('You have already shared this post');
      return;
    }

    setIsPending(true);
    const originalSharesCount = sharesCount;
    const originalIsShared = isShared;

    setSharesCount((prev) => prev + 1);
    setIsShared(true);

    try {
      const response = await fetch('/api/posts/shares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to share post');
      }

      const { message, sharesCount: updatedSharesCount } = await response.json();
      setSharesCount(updatedSharesCount);
      if (message === 'Post already shared by user') {
        toast.info('You have already shared this post');
      } else {
        toast.success('Post shared!');
      }

      await fetch('/api/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: `/posts/${postId}` }),
        credentials: 'include',
      });
    } catch (error: any) {
      setSharesCount(originalSharesCount);
      setIsShared(originalIsShared);
      toast.error(error.message || 'Failed to share post');
    } finally {
      setIsPending(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(postUrl);
    toast.success('Link copied to clipboard!');
  };

  return (
    <div className="flex items-center space-x-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="p-0 h-auto text-foreground hover:bg-transparent"
            disabled={!isAuthenticated || isPending}
            onClick={handleShare}
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 bg-background border-border">
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Share Post</h4>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-foreground border-border"
              onClick={handleCopyLink}
            >
              Copy Link
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      <Button
        variant="ghost"
        className="p-0 h-auto font-normal hover:bg-transparent text-foreground"
        disabled={!isAuthenticated}
      >
        <span>{sharesCount} Shares</span>
      </Button>
    </div>
  );
}