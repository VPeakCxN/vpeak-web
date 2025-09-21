  "use client";

  import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
  import { Button } from "@/components/ui/button";
  import { Textarea } from "@/components/ui/textarea";
  import { Separator } from "@/components/ui/separator";
  import { useState, useTransition, useEffect } from "react";
  import { addComment, deleteComment } from "./actions";
  import { formatDistanceToNow } from "date-fns";
  import { Trash2, Send } from "lucide-react";
  import { toast } from "sonner";
  import { createClient } from "@supabase/supabase-js";

  interface Comment {
    uid: string;
    user_uid: string;
    comment_content: string;
    created_at: string;
  }

  interface CommentsProps {
    postId: string;
    comments: Comment[];
    currentUserId?: string;
    isAuthenticated: boolean;
  }

  interface StudentData {
    uid: string;
    name: string;
  }

  export function Comments({ postId, comments, currentUserId, isAuthenticated }: CommentsProps) {
    const [commentText, setCommentText] = useState("");
    const [showAllComments, setShowAllComments] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [studentNames, setStudentNames] = useState<{ [key: string]: string }>({});

    // Fetch student names for comment authors
    useEffect(() => {
      async function fetchStudentNames() {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const userUids = [...new Set(comments.map(c => c.user_uid))];
        
        if (userUids.length > 0) {
          const { data: students } = await supabase
            .from("students")
            .select("uid, name")
            .in("uid", userUids);
          
          if (students) {
            const nameMap = students.reduce((acc: { [key: string]: string }, student: StudentData) => {
              acc[student.uid] = student.name;
              return acc;
            }, {});
            setStudentNames(nameMap);
          }
        }
      }

      fetchStudentNames();
    }, [comments]);

    const displayedComments = showAllComments ? comments : comments.slice(0, 3);

    const handleAddComment = () => {
      if (!isAuthenticated) {
        toast.error("Please log in to comment");
        return;
      }

      if (!commentText.trim()) {
        toast.error("Please enter a comment before submitting");
        return;
      }

      startTransition(async () => {
        try {
          await addComment(postId, commentText);
          setCommentText("");
          toast.success("Comment added successfully!");
        } catch (error) {
          toast.error("Failed to add comment. Please try again.");
        }
      });
    };

    const handleDeleteComment = (commentId: string) => {
      startTransition(async () => {
        try {
          await deleteComment(commentId, postId);
          toast.success("Comment deleted");
        } catch (error) {
          toast.error("Failed to delete comment. Please try again.");
        }
      });
    };

    if (comments.length === 0 && !isAuthenticated) {
      return null;
    }

    return (
      <div className="space-y-4">
        <Separator />

        {/* Comment Input */}
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
                    {isPending ? "Posting..." : "Post Comment"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Comments List */}
        {comments.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Comments ({comments.length})</h4>

            <div className="space-y-4">
              {displayedComments.map((comment) => (
                <div key={comment.uid} className="flex space-x-3 group">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {studentNames[comment.user_uid]?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 space-y-1">
                    <div className="bg-muted/50 rounded-lg p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <span className="font-semibold text-sm">
                            {studentNames[comment.user_uid] || "User"}
                          </span>
                          <p className="text-sm mt-1 leading-relaxed">
                            {comment.comment_content}
                          </p>
                        </div>

                        {/* Delete button for own comments */}
                        {currentUserId === comment.user_uid && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 ml-2 hover:bg-destructive hover:text-destructive-foreground"
                            onClick={() => handleDeleteComment(comment.uid)}
                            disabled={isPending}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 text-xs text-muted-foreground px-3">
                      <span>
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
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

            {/* Show more/less comments */}
            {comments.length > 3 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllComments(!showAllComments)}
                className="text-muted-foreground hover:text-foreground"
              >
                {showAllComments ? "Show less comments" : `View all ${comments.length} comments`}
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }