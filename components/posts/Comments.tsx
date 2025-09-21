'use client';

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useState, useTransition, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Trash2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@supabase/supabase-js';
import type { Tables } from '@/lib/database.types';
import { AuthSession } from '@/lib/cookies.types';

type Comment = Tables<'post_comments'> & { name?: string; avatar?: string };

interface CommentsProps {
  postId: string;
  initialComments: Comment[];
  currentUserId?: string;
  isAuthenticated: boolean;
  session?: AuthSession;
}

interface StudentData {
  uid: string;
  name: string;
  avatar?: string;
}

export function Comments({ postId, initialComments, currentUserId, isAuthenticated, session }: CommentsProps) {
  const [comments, setComments] = useState(initialComments);
  const [commentText, setCommentText] = useState('');
  const [showAllComments, setShowAllComments] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [studentData, setStudentData] = useState<{ [key: string]: { name: string; avatar?: string } }>({});

  useEffect(() => {
    async function fetchStudentData() {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const userUids = [...new Set(comments.map((c) => c.user_id).filter(Boolean))] as string[];

      if (userUids.length > 0) {
        const { data: students } = await supabase
          .from('students')
          .select('uid, name, avatar')
          .in('uid', userUids);

        if (students) {
          const dataMap = students.reduce(
            (acc: { [key: string]: { name: string; avatar?: string } }, student: StudentData) => {
              acc[student.uid] = { name: student.name, avatar: student.avatar };
              return acc;
            },
            {}
          );
          setStudentData(dataMap);
        }
      }
    }

    fetchStudentData();
  }, [comments]);

  const displayedComments = showAllComments ? comments : comments.slice(0, 3);

  const handleAddComment = () => {
    if (!isAuthenticated) {
      toast.error('Please log in to comment');
      return;
    }

    if (!commentText.trim()) {
      toast.error('Please enter a comment before submitting');
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch('/api/posts/comments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ post_id: postId, comment: commentText }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to add comment');
        }

        const newComment = await response.json();
        setComments([newComment, ...comments]);
        setCommentText('');
        toast.success('Comment added successfully!');
      } catch (error: any) {
        toast.error(error.message || 'Failed to add comment. Please try again.');
      }
    });
  };

  const handleDeleteComment = (commentId: string) => {
    if (!isAuthenticated) {
      toast.error('Please log in to delete a comment');
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch('/api/posts/comments', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ comment_id: commentId, post_id: postId }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete comment');
        }

        setComments(comments.filter((c) => c.uuid !== commentId));
        toast.success('Comment deleted');
      } catch (error: any) {
        toast.error(error.message || 'Failed to delete comment. Please try again.');
      }
    });
  };

  if (comments.length === 0 && !isAuthenticated) {
    return null;
  }

  return (
    <div className="space-y-4">
      <Separator />

      {isAuthenticated && (
        <div className="space-y-3">
          <div className="flex space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">You</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <Textarea
                placeholder="Write a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="min-h-[80px] resize-none"
                disabled={isPending}
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={handleAddComment}
                  disabled={isPending || !commentText.trim()}
                  className="gap-2"
                >
                  <Send className="h-4 w-4" />
                  {isPending ? 'Posting...' : 'Post Comment'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {comments.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold">Comments ({comments.length})</h4>

          <div className="space-y-4">
            {displayedComments.map((comment) => (
              <div key={comment.uuid} className="flex space-x-3 group">
                <Avatar className="h-8 w-8">
                  {studentData[comment.user_id]?.avatar ? (
                    <AvatarImage src={studentData[comment.user_id].avatar} alt={studentData[comment.user_id].name} />
                  ) : (
                    <AvatarFallback className="text-xs">
                      {studentData[comment.user_id]?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  )}
                </Avatar>

                <div className="flex-1 space-y-1">
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <span className="font-semibold text-sm">
                          {studentData[comment.user_id]?.name || 'User'}
                        </span>
                        <p className="text-sm mt-1 leading-relaxed">{comment.comment}</p>
                      </div>

                      {currentUserId === comment.user_id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 ml-2 hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => handleDeleteComment(comment.uuid)}
                          disabled={isPending}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 text-xs text-muted-foreground px-3">
                    <span>
                      {comment.created_at
                        ? formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })
                        : 'Just now'}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 text-xs hover:text-foreground"
                    >
                      Reply
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {comments.length > 3 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAllComments(!showAllComments)}
              className="text-muted-foreground hover:text-foreground"
            >
              {showAllComments ? 'Show less comments' : `View all ${comments.length} comments`}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}