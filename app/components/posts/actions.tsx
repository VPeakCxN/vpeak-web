// app/posts/[post_uid]/actions.ts
"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function toggleLike(postId: string) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: existingLike } = await supabase
    .from("post_engagements")
    .select("uid")
    .eq("post_id", postId)
    .eq("user_uid", user.id)
    .eq("engagement_type", "like")
    .single();

  if (existingLike) {
    await supabase.from("post_engagements").delete().eq("uid", existingLike.uid);
  } else {
    await supabase.from("post_engagements").insert({
      post_id: postId,
      user_uid: user.id,
      engagement_type: "like",
    });
  }

  revalidatePath(`/posts/${postId}`);
}

export async function toggleBookmark(postId: string) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: existingBookmark } = await supabase
    .from("post_engagements")
    .select("uid")
    .eq("post_id", postId)
    .eq("user_uid", user.id)
    .eq("engagement_type", "bookmark")
    .single();

  if (existingBookmark) {
    await supabase.from("post_engagements").delete().eq("uid", existingBookmark.uid);
  } else {
    await supabase.from("post_engagements").insert({
      post_id: postId,
      user_uid: user.id,
      engagement_type: "bookmark",
    });
  }

  revalidatePath(`/posts/${postId}`);
}

export async function addComment(postId: string, content: string) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");
  if (!content.trim()) throw new Error("Comment content cannot be empty");

  await supabase.from("post_engagements").insert({
    post_id: postId,
    user_uid: user.id,
    engagement_type: "comment",
    comment_content: content.trim(),
  });

  revalidatePath(`/posts/${postId}`);
}

export async function deleteComment(commentId: string, postId: string) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  await supabase
    .from("post_engagements")
    .delete()
    .eq("uid", commentId)
    .eq("user_uid", user.id);

  revalidatePath(`/posts/${postId}`);
}

export async function sharePost(postId: string) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  await supabase.from("post_engagements").insert({
    post_id: postId,
    user_uid: user.id,
    engagement_type: "share",
  });

  revalidatePath(`/posts/${postId}`);
}
