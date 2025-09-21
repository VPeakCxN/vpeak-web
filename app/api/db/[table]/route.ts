// app/api/db/[table]/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";

const ALLOWED_TABLES = new Set([
  "students",
  "chatroom_messages",
  "chatrooms",
  "posts",
  "class_divisions",
  "clubs",
  "direct_chats",
  "direct_messages",
  "events",
  "faculty",
  "classes",
  "post_engagements",
  "post_files",
  "announcements",
  "post_privacy",
]);

function guard(table: string) {
  if (!ALLOWED_TABLES.has(table)) {
    return NextResponse.json({ error: "Table not allowed" }, { status: 400 });
  }
  return null;
}

// GET /api/db/:table -> list all rows
export async function GET(
  req: Request,
  { params }: { params: { table: string } }
) {
  const blocked = guard(params.table);
  if (blocked) return blocked;

  try {
    const supabase = createSupabaseServerClient();
    
    if (!supabase) {
      console.error("Failed to create Supabase client");
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
    }

    const { data, error } = await supabase.from(params.table).select("*");

    if (error) {
      console.error(`Error fetching ${params.table}:`, error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data ?? []);
  } catch (e: any) {
    console.error(`Unexpected error in GET ${params.table}:`, e);
    return NextResponse.json({ error: e?.message ?? "Unexpected error" }, { status: 500 });
  }
}

// POST /api/db/:table -> insert one or many rows
export async function POST(
  req: Request,
  { params }: { params: { table: string } }
) {
  const blocked = guard(params.table);
  if (blocked) return blocked;

  try {
    const payload = await req.json();
    console.log(`POST request to ${params.table}:`, payload);
    
    // Special handling for posts table with privacy
    if (params.table === "posts") {
      return await handlePostCreation(payload);
    }

    const rows = Array.isArray(payload) ? payload : [payload];
    const supabase = createSupabaseServerClient();
    
    if (!supabase) {
      console.error("Failed to create Supabase client");
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
    }

    const { data, error } = await supabase.from(params.table).insert(rows).select("*");

    if (error) {
      console.error(`Error inserting into ${params.table}:`, error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data ?? [], { status: 201 });
  } catch (e: any) {
    console.error(`Unexpected error in POST ${params.table}:`, e);
    return NextResponse.json({ error: e?.message ?? "Unexpected error" }, { status: 500 });
  }
}

// Special handler for post creation with privacy (files handled separately)
async function handlePostCreation(payload: any) {
  const supabase = createSupabaseServerClient();
  
  if (!supabase) {
    console.error("Failed to create Supabase client for post creation");
    return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
  }

  try {
    console.log("Creating post with payload:", payload);

    if (!payload.author_uid || !payload.title || !payload.description) {
      return NextResponse.json(
        { error: "author_uid, title, and description are required" }, 
        { status: 400 }
      );
    }

    // Insert into posts
    const { data: postRow, error: postErr } = await supabase
      .from("posts")
      .insert({
        author_uid: payload.author_uid,
        title: payload.title,
        target_id: payload.target_id || null,
        description: payload.description,
        type: payload.type || "post",
      })
      .select("uid")
      .single();

    if (postErr) {
      console.error("Post insert error:", postErr);
      return NextResponse.json({ error: postErr.message }, { status: 500 });
    }

    if (!postRow) {
      console.error("No post row returned");
      return NextResponse.json({ error: "Post creation failed" }, { status: 500 });
    }

    const post_uid = postRow.uid as string;
    console.log("Post created with UID:", post_uid);

    // Insert privacy row
    const privacyData = {
      post_uid,
      everyone: payload.everyone ?? true,
      clubs: payload.clubs || [],
      class: payload.classes || [], // column name is "class"
      privacy_list: payload.privacy_lists || [],
      exception: payload.exception || [],
    };
    
    console.log("Inserting privacy data:", privacyData);

    const { error: privacyErr } = await supabase.from("post_privacy").insert(privacyData);

    if (privacyErr) {
      console.error("Privacy insert error:", privacyErr);
      return NextResponse.json({ error: privacyErr.message }, { status: 500 });
    }

    console.log("Post creation completed successfully");
    return NextResponse.json({ uid: post_uid }, { status: 201 });
  } catch (e: any) {
    console.error("Unexpected error in post creation:", e);
    return NextResponse.json({ error: e?.message ?? "Unexpected error" }, { status: 500 });
  }
}
