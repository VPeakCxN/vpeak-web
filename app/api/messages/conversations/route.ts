// File: app/api/messages/conversations/route.ts

import { supabase } from "@/lib/supabase/client";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "User ID required" }, { status: 400 });
  }

  // @ts-ignore: Suppress type error for unknown table
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Enrich with other user's name and avatar
  const enrichedData = await Promise.all(
    // @ts-ignore: Suppress type errors for unknown properties
    (data as any[]).map(async (conv: any) => {
      const otherUserId = conv.user1_id === userId ? conv.user2_id : conv.user1_id;
      // @ts-ignore: Suppress type error for unknown table
      const { data: student } = await supabase
        .from("students")
        .select("name, avatar")
        .eq("uid", otherUserId)
        .single();
      return {
        ...conv,
        title: student?.name || "Unknown User",
        avatar: student?.avatar || null,
      };
    })
  );

  return NextResponse.json(enrichedData);
}
