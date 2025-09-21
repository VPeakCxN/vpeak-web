// @/components/Comments.tsx
'use client';

import { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { formatDistanceToNow } from 'date-fns';
import { Trash2, Send, Edit2, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useCookies } from '@/hooks/getCookies';
import type { Tables } from '@/lib/database.types';

type Comment = Tables<'post_comments'> & { name?: string; avatar?: string };

interface CommentsProps {
  postId: string;
  initialComments: Comment[];
  initialCommentsCount: number;
  isAuthenticated: boolean;
  currentUserId?: string | null;
}

export function Comments({
  postId,
  initialComments,
  initialCommentsCount,
  isAuthenticated: initialAuthenticated,
  currentUserId: initialUserId,
}: CommentsProps) {
  const { isAuthenticated, user, currentUserId } = useCookies();
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [commentsCount, setCommentsCount] = useState(initialCommentsCount);
  const [commentText, setCommentText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isWriteOpen, setIsWriteOpen] = useState(false);
  const [isListOpen, setIsListOpen] = useState(false);

  const handleAddComment = async () => {
    if (!isAuthenticated || !currentUserId) {
      toast.error('Please log in to comment');
      return;
    }

    if (!commentText.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    setIsPending(true);
    const newComment: Comment = {
      uuid: `temp-${Date.now()}`,
      post_id: postId,
      user_id: currentUserId,
      comment: commentText,
      created_at: new Date().toISOString(),
      name: user?.name || 'Unknown',
      avatar: user?.avatar,
    };

    setComments([newComment, ...comments]);
    setCommentsCount((prev) => prev + 1);
    setCommentText('');

    try {
      const response = await fetch('/api/posts/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId, comment: commentText }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add comment');
      }

      const { comment: savedComment } = await response.json();
      setComments((prev) =>
        prev.map((c) => (c.uuid === newComment.uuid ? savedComment : c))
      );
      toast.success('Comment added!');

      await fetch('/api/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: `/posts/${postId}` }),
        credentials: 'include',
      });
    } catch (error: any) {
      setComments(comments);
      setCommentsCount(commentsCount);
      toast.error(error.message || 'Failed to add comment');
    } finally {
      setIsPending(false);
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!isAuthenticated || !currentUserId) {
      toast.error('Please log in to edit a comment');
      return;
    }

    if (!commentText.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    setIsPending(true);
    const originalComments = comments;
    setComments(
      comments.map((c) =>
        c.uuid === commentId
          ? { ...c, comment: commentText, created_at: new Date().toISOString() }
          : c
      )
    );

    try {
      const response = await fetch('/api/posts/comments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment_id: commentId, post_id: postId, comment: commentText }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update comment');
      }

      const { comment: updatedComment } = await response.json();
      setComments((prev) =>
        prev.map((c) => (c.uuid === commentId ? updatedComment : c))
      );
      setCommentText('');
      setEditingCommentId(null);
      toast.success('Comment updated!');

      await fetch('/api/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: `/posts/${postId}` }),
        credentials: 'include',
      });
    } catch (error: any) {
      setComments(originalComments);
      toast.error(error.message || 'Failed to update comment');
    } finally {
      setIsPending(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!isAuthenticated || !currentUserId) {
      toast.error('Please log in to delete a comment');
      return;
    }

    setIsPending(true);
    const originalComments = comments;
    setComments(comments.filter((c) => c.uuid !== commentId));
    setCommentsCount((prev) => prev - 1);

    try {
      const response = await fetch('/api/posts/comments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment_id: commentId, post_id: postId }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete comment');
      }

      toast.success('Comment deleted!');

      await fetch('/api/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: `/posts/${postId}` }),
        credentials: 'include',
      });
    } catch (error: any) {
      setComments(originalComments);
      setCommentsCount(commentsCount);
      toast.error(error.message || 'Failed to delete comment');
    } finally {
      setIsPending(false);
    }
  };

  const startEditing = (comment: Comment) => {
    setEditingCommentId(comment.uuid);
    setCommentText(comment.comment);
    setIsWriteOpen(true);
    setIsListOpen(false); // Close the list popover
  };

  return (
    <div className="flex items-center space-x-2">
      <Popover open={isWriteOpen} onOpenChange={setIsWriteOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="p-0 h-auto text-foreground hover:bg-transparent"
            disabled={!isAuthenticated}
          >
            <MessageCircle className="h-4 w-4 mr-1" />
            <span>Comment</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96 bg-background border-border">
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">
              {editingCommentId ? 'Edit Comment' : 'Write a Comment'}
            </h4>
            <div className="flex space-x-3">
              <Avatar className="h-8 w-8">
                {user?.avatar ? (
                  <AvatarImage src={user.avatar} alt={user.name} />
                ) : (
                  <AvatarFallback className="text-xs text-foreground">
                    {user?.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex-1 space-y-2">
                <Textarea
                  placeholder={editingCommentId ? 'Edit your comment...' : 'Write a comment...'}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="min-h-[80px] resize-none bg-background text-foreground border-border"
                  disabled={isPending}
                />
                <div className="flex justify-end space-x-2">
                  {editingCommentId && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingCommentId(null);
                        setCommentText('');
                      }}
                      disabled={isPending}
                      className="text-foreground border-border"
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={() =>
                      editingCommentId ? handleEditComment(editingCommentId) : handleAddComment()
                    }
                    disabled={isPending || !commentText.trim()}
                    className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <Send className="h-4 w-4" />
                    {isPending
                      ? editingCommentId
                        ? 'Updating...'
                        : 'Posting...'
                      : editingCommentId
                        ? 'Update'
                        : 'Post'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <Popover open={isListOpen} onOpenChange={setIsListOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className="p-0 h-auto font-normal hover:bg-transparent text-foreground"
          >
            <span>{commentsCount} Comments</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96 bg-background border-border">
          <div className="space-y-4 max-h-[50vh] overflow-y-auto">
            <h4 className="text-sm font-semibold text-foreground">
              Comments ({commentsCount})
            </h4>
            {comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment.uuid} className="flex space-x-3 group">
                  <Avatar className="h-8 w-8">
                    {comment.avatar ? (
                      <AvatarImage src={comment.avatar} alt={comment.name} />
                    ) : (
                      <AvatarFallback className="text-xs text-foreground">
                        {comment.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="bg-muted/50 rounded-lg p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <span className="font-semibold text-sm text-foreground">
                            {comment.name || 'User'}
                          </span>
                          <p className="text-sm mt-1 leading-relaxed text-foreground">
                            {comment.comment}
                          </p>
                        </div>
                        {currentUserId === comment.user_id && (
                          <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 hover:bg-accent"
                              onClick={() => startEditing(comment)}
                              disabled={isPending}
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                              onClick={() => handleDeleteComment(comment.uuid)}
                              disabled={isPending}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground px-3">
                      {comment.created_at
                        ? formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })
                        : 'Just now'}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground">No comments yet</p>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
