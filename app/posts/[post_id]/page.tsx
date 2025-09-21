// app/posts/[post_id]/page.tsx
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { PostCard } from "@/components/posts/PostCard";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export default async function Page({
  params,
}: {
  params: { post_id: string };
}) {
  const { post_id } = params;

  const { data: post } = await supabase
    .from("posts")
    .select("post_id")
    .eq("post_id", post_id)
    .single();

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto w-full max-w-2xl">
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="p-6">
              <div className="rounded-lg bg-destructive/10 p-4 text-destructive">
                Post not found
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto w-full max-w-2xl">
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="p-6">
            <PostCard post_id={post_id} />
          </div>
        </div>
      </div>
    </div>
  );
}
