// app/posts/[post_uid]/engagement-actions.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Share, Bookmark } from "lucide-react";
import { useState, useTransition } from "react";
import { toggleLike, toggleBookmark, sharePost } from "./actions";
import { toast } from "sonner";

interface EngagementActionsProps {
  postId: string;
  isLiked: boolean;
  isBookmarked: boolean;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  isAuthenticated: boolean;
}

export function EngagementActions({
  postId,
  isLiked,
  isBookmarked,
  likesCount,
  commentsCount,
  sharesCount,
  isAuthenticated,
}: EngagementActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [optimisticLiked, setOptimisticLiked] = useState(isLiked);
  const [optimisticBookmarked, setOptimisticBookmarked] = useState(isBookmarked);
  const [optimisticLikesCount, setOptimisticLikesCount] = useState(likesCount);

  const handleLike = () => {
    if (!isAuthenticated) return toast.error("Please log in to like posts");
    setOptimisticLiked(!optimisticLiked);
    setOptimisticLikesCount((p) => (optimisticLiked ? p - 1 : p + 1));
    startTransition(async () => {
      try {
        await toggleLike(postId);
      } catch {
        setOptimisticLiked(isLiked);
        setOptimisticLikesCount(likesCount);
        toast.error("Failed to update like. Please try again.");
      }
    });
  };

  const handleBookmark = () => {
    if (!isAuthenticated) return toast.error("Please log in to bookmark posts");
    setOptimisticBookmarked(!optimisticBookmarked);
    startTransition(async () => {
      try {
        await toggleBookmark(postId);
      } catch {
        setOptimisticBookmarked(isBookmarked);
        toast.error("Failed to update bookmark. Please try again.");
      }
    });
  };

  const handleShare = async () => {
    if (!isAuthenticated) return toast.error("Please log in to share posts");
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
      startTransition(async () => {
        await sharePost(postId);
      });
    } catch {
      toast.error("Failed to copy link. Please try again.");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            className={`p-2 hover:bg-red-50 transition-colors ${
              optimisticLiked ? "text-red-500 hover:text-red-600" : "hover:text-red-500"
            }`}
            onClick={handleLike}
            disabled={isPending}
          >
            <Heart
              className={`h-5 w-5 transition-all duration-200 ${
                optimisticLiked ? "fill-current scale-110" : ""
              }`}
            />
          </Button>

          <Button variant="ghost" size="sm" className="p-2 hover:bg-blue-50 hover:text-blue-500 transition-colors">
            <MessageCircle className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="p-2 hover:bg-green-50 hover:text-green-500 transition-colors"
            onClick={handleShare}
            disabled={isPending}
          >
            <Share className="h-5 w-5" />
          </Button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className={`p-2 hover:bg-yellow-50 transition-colors ${
            optimisticBookmarked ? "text-yellow-600 hover:text-yellow-700" : "hover:text-yellow-600"
          }`}
          onClick={handleBookmark}
          disabled={isPending}
        >
          <Bookmark className={`h-5 w-5 transition-all duration-200 ${optimisticBookmarked ? "fill-current scale-110" : ""}`} />
        </Button>
      </div>

      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
        {optimisticLikesCount > 0 && (
          <span className="font-semibold text-foreground">
            {optimisticLikesCount} {optimisticLikesCount === 1 ? "like" : "likes"}
          </span>
        )}
        {commentsCount > 0 && <span>{commentsCount} {commentsCount === 1 ? "comment" : "comments"}</span>}
        {sharesCount > 0 && <span>{sharesCount} {sharesCount === 1 ? "share" : "shares"}</span>}
      </div>
    </div>
  );
}
