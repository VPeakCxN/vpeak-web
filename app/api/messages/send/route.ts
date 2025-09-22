// /api/messages/send.ts (POST: Send a message)
import { supabase } from "@/lib/supabase/client";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const { content, conversation_id } = body;

  if (!content || !conversation_id) {
    return NextResponse.json({ error: "Content and conversation_id required" }, { status: 400 });
  }

  const { data, error } = await supabase.from("messages").insert([{ content, conversation_id }]).select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Optionally update last_message_id in conversations (assuming messages have id)
  const messageId = data[0]?.id;
  if (messageId) {
    await supabase
      .from("conversations")
      .update({ last_message_id: messageId, updated_at: new Date().toISOString() })
      .eq("conversation_id", conversation_id);
  }

  return NextResponse.json(data);
}
