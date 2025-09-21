// app/home/page.tsx
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AppUser, Student, VerifiedUser } from "@/lib/auths/types";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { EngagementActions } from "@/app/components/posts/engagement-actions";
import { Comments } from "@/app/components/posts/comments-section";
import { ImageCarousel } from "@/app/components/posts/image-carousel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal } from "lucide-react";

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
  post_id: string;
  file_name: string;
  file_url: string;
  contentType: string | null;
}

interface PostEngagement {
  uid: string;
  post_id: string;
  user_uid: string;
  engagement_type: string;
  comment_content: string | null;
  created_at: string;
}

interface StudentData {
  uid: string;
  name: string | null;
}

export default async function HomePage() {
  const supabase = createSupabaseServerClient();
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  // Fetch user profile (student) and verified user info
  let headerUser: AppUser | null = null;
  if (currentUser) {
    const { data: studentRow } = await supabase
      .from("students")
      .select("uid, name, regno, dob, dept, personal_email, phone")
      .eq("uid", currentUser.id)
      .maybeSingle();

    const verified: VerifiedUser = {
      uid: currentUser.id,
      supabase_user_id: currentUser.id,
      email: currentUser.email ?? null,
      username: currentUser.user_metadata?.preferred_username ?? currentUser.user_metadata?.username ?? null,
      avatar_url: currentUser.user_metadata?.avatar_url ?? null,
      roles: Array.isArray(currentUser.user_metadata?.roles) ? currentUser.user_metadata?.roles : [],
      permissions: Array.isArray(currentUser.user_metadata?.permissions) ? currentUser.user_metadata?.permissions : [],
    };
    headerUser = { ...verified, student: (studentRow as Student | null) ?? null };
  }

  // Fetch posts in descending order of creation
  const { data: rawPosts } = await supabase
    .from<PostData>("posts")
    .select("uid, author_uid, title, description, type, created_at, updated_at")
    .order("created_at", { ascending: false });
  const posts = rawPosts || [];

  // Fetch related data for posts: authors, files, engagements in batch queries
  // Note: This is more efficient than querying inside the map for each post.
  // Query all author data for posts author_uids
  let authorUids = posts.map((p) => p.author_uid);
  authorUids = Array.from(new Set(authorUids.filter(Boolean))); // unique non-empty

  const { data: authors } = await supabase
    .from<StudentData>("students")
    .select("uid, name")
    .in("uid", authorUids);

  // Query all files for posts
  const postUids = posts.map((p) => p.uid);
  const { data: files } = await supabase
    .from<PostFile>("post_files")
    .select("*")
    .in("post_id", postUids)
    .order("created_at", { ascending: true });

  // Query all engagements for posts
  const { data: engagements } = await supabase
    .from<PostEngagement>("post_engagements")
    .select("*")
    .in("post_id", postUids)
    .order("created_at", { ascending: false });

  // Map authors by uid
  const authorMap = new Map<string, StudentData>(
    (authors || []).map((author) => [author.uid, author])
  );

  // Find display name and avatar initial
  const displayName =
    headerUser?.student?.name ?? headerUser?.username ?? headerUser?.email ?? "User";
  const initial =
    headerUser?.student?.name?.charAt(0) ??
    headerUser?.email?.charAt(0) ??
    "U";

  return (
        <main className="flex-1 px-4 py-6 md:px-8 lg:px-10">
          <section className="mx-auto max-w-5xl space-y-4">
            <Link href="/create/post">
              <Card className="hover:bg-accent/10 transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={headerUser?.avatar_url || undefined}
                        alt={displayName}
                      />
                      <AvatarFallback>{initial}</AvatarFallback>
                    </Avatar>
                    <span className="text-muted-foreground flex-1">
                      What&apos;s on your mind today?
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Feed - left (2/3 width) */}
              <section className="lg:col-span-2 space-y-6">
                <h2 className="text-2xl font-semibold text-foreground mb-4">Your Feed</h2>
                {posts.map((postData) => {
                  const {
                    uid,
                    title,
                    description,
                    type,
                    created_at,
                    author_uid,
                  } = postData;

                  const author = authorMap.get(author_uid) ?? { uid: author_uid, name: "Anonymous" };

                  // Related files
                  const filesForPost = (files || []).filter((f) => f.post_id === uid);
                  const images = filesForPost.filter((f) => f.contentType?.startsWith("image/"));
                  const videos = filesForPost.filter((f) => f.contentType?.startsWith("video/"));
                  const otherFiles = filesForPost.filter(
                    (f) =>
                      !f.contentType?.startsWith("image/") &&
                      !f.contentType?.startsWith("video/")
                  );

                  // Related engagements
                  const engagementsForPost = (engagements || []).filter((e) => e.post_id === uid);
                  const likes = engagementsForPost.filter((e) => e.engagement_type === "like").length;
                  const commentsEng = engagementsForPost.filter((e) => e.engagement_type === "comment");
                  const shares = engagementsForPost.filter((e) => e.engagement_type === "share").length;

                  const isLiked =
                    !!currentUser &&
                    engagementsForPost.some((e) => e.user_uid === currentUser.id && e.engagement_type === "like");
                  const isBookmarked =
                    !!currentUser &&
                    engagementsForPost.some((e) => e.user_uid === currentUser.id && e.engagement_type === "bookmark");

                  const commentItems = commentsEng
                    .filter((c) => typeof c.comment_content === "string" && c.comment_content.trim().length > 0)
                    .map((c) => ({
                      uid: c.uid,
                      user_uid: c.user_uid,
                      comment_content: c.comment_content as string,
                      created_at: c.created_at,
                    }));

                  return (
                    <Card key={uid} className="w-full">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src="{avatarPlaceholder}" />
                              <AvatarFallback>{author.name?.charAt(0) || "U"}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <Link
                                href={`/profile/${author.uid}`}
                                className="font-semibold text-sm hover:underline"
                              >
                                {author.name || "Anonymous"}
                              </Link>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(created_at), {
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
                      <CardContent className="space-y-4">
                        {title && <h1 className="text-lg font-semibold">{title}</h1>}
                        {description && <p className="text-sm leading-relaxed">{description}</p>}
                        {type !== "post" && (
                          <Badge variant="secondary" className="w-fit">
                            {type}
                          </Badge>
                        )}
                        {(images.length > 0 || videos.length > 0) && (
                          <div className="space-y-2">
                            {images.length > 0 && <ImageCarousel images={images} />}
                            {videos.map((video) => (
                              <div key={video.uid} className="relative rounded-lg overflow-hidden">
                                <video controls className="w-full max-h-96 bg-black" preload="metadata">
                                  <source src={video.file_url} type={video.contentType || "video/mp4"} />
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
                          postId={uid}
                          isLiked={isLiked}
                          isBookmarked={isBookmarked}
                          likesCount={likes}
                          commentsCount={commentItems.length}
                          sharesCount={shares}
                          isAuthenticated={!!currentUser}
                        />
                        <Comments
                          postId={uid}
                          comments={commentItems}
                          currentUserId={currentUser?.id}
                          isAuthenticated={!!currentUser}
                        />
                      </CardContent>
                    </Card>
                  );
                })}
              </section>
              {/* Announcements - right (1/3 width) */}
              <aside className="space-y-4">
                <h2 className="text-2xl font-semibold mb-4 text-foreground">Announcements</h2>
                {/* Replace below div with dynamic map/render of your announcements */}
                <div className="text-muted-foreground italic text-center py-10 border border-border rounded-lg bg-card">
                  Loading announcements...
                </div>
              </aside>
            </section>
          </section>
        </main>
  );
}