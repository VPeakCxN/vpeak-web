"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import avatarPlaceholder  from "@/components/images/placeholder-avatar.png"
import { EngagementActions } from "./engagement-actions";
import { Comments } from "./comments-section";
import { ImageCarousel } from "./image-carousel";

interface PostData {
  uid: string;
  author_uid: string;
  title: string;
  description: string | null;
  type: string;
  created_at: string;
  updated_at: string;
}

interface PostFile {
  uid: string;
  file_name: string;
  file_url: string;
  contentType: string | null;
}

interface PostEngagement {
  uid: string;
  user_uid: string;
  engagement_type: string;
  comment_content: string | null;
  created_at: string;
}

interface StudentData {
  uid: string;
  name: string;
}

interface PostProps {
  post: PostData;
  files: PostFile[];
  engagements: PostEngagement[];
  author: StudentData;
  currentUser: any; // Adjust type based on your Supabase user type
}

export function Post({ post, files, engagements, author, currentUser }: PostProps) {
  const likes = engagements.filter((e) => e.engagement_type === "like").length;
  const commentsEng = engagements.filter((e) => e.engagement_type === "comment");
  const shares = engagements.filter((e) => e.engagement_type === "share").length;

  const isLiked = !!currentUser && engagements.some((e) => e.user_uid === currentUser.id && e.engagement_type === "like");
  const isBookmarked = !!currentUser && engagements.some((e) => e.user_uid === currentUser.id && e.engagement_type === "bookmark");

  const commentItems = commentsEng
    .filter((c) => typeof c.comment_content === "string" && c.comment_content.trim().length > 0)
    .map((c) => ({
      uid: c.uid,
      user_uid: c.user_uid,
      comment_content: c.comment_content as string,
      created_at: c.created_at,
    }));

  const images = files.filter((f) => f.contentType?.startsWith("image/"));
  const videos = files.filter((f) => f.contentType?.startsWith("video/"));
  const otherFiles = files.filter(
    (f) => !f.contentType?.startsWith("image/") && !f.contentType?.startsWith("video/")
  );

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Avatar className="h-10 w-10">
              <AvatarImage src="{avatarPlaceholder}" />
              <AvatarFallback>
                {author.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col space-y-0.5">
              <Link
                href={`/profile/${author.uid}`}
                className="font-semibold text-sm hover:underline"
              >
                {author.name || "Anonymous"}
              </Link>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(post.created_at), {
                  addSuffix: true,
                })}
              </span>
            </div>
          </div>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {post.title && (
          <h1 className="text-lg font-semibold mt-0">{post.title}</h1>
        )}

        {post.description && (
          <p className="text-sm leading-tight mt-0">{post.description}</p>
        )}

        {post.type !== "post" && (
          <Badge variant="secondary" className="w-fit mt-0">
            {post.type}
          </Badge>
        )}

        {(images.length > 0 || videos.length > 0) && (
          <div className="space-y-2">
            {images.length > 0 && <ImageCarousel images={images} />}

            {videos.map((video) => (
              <div key={video.uid} className="relative rounded-lg overflow-hidden">
                <video
                  controls
                  className="w-full max-h-96 bg-black"
                  preload="metadata"
                >
                  <source
                    src={video.file_url}
                    type={video.contentType || "video/mp4"}
                  />
                  Your browser does not support the video tag.
                </video>
              </div>
            ))}
          </div>
        )}

        {otherFiles.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">
              Attachments
            </h4>
            <div className="space-y-1">
              {otherFiles.map((file) => (
                <a
                  key={file.uid}
                  href={file.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent text-sm"
                >
                  <div className="h-8 w-8 bg-muted rounded flex items-center justify-center">
                    📎
                  </div>
                  <span className="truncate">{file.file_name}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        <EngagementActions
          postId={post.uid}
          isLiked={isLiked}
          isBookmarked={isBookmarked}
          likesCount={likes}
          commentsCount={commentItems.length}
          sharesCount={shares}
          isAuthenticated={!!currentUser}
        />

        <Comments
          postId={post.uid}
          comments={commentItems}
          currentUserId={currentUser?.id}
          isAuthenticated={!!currentUser}
        />
      </CardContent>
    </Card>
  );
}