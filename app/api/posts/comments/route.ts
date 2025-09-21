// API route for comments: /api/posts/comments.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database, Tables } from '@/lib/database.types';
import { generateUUID } from '@/lib/tools/generateUUID';
import { AuthSession } from '@/lib/cookies.types';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const post_id = searchParams.get('post_id');
    if (!post_id) {
      return NextResponse.json({ error: 'Missing post_id' }, { status: 400 });
    }

    const { data: comments, error: commentsError } = await supabase
      .from('post_comments')
      .select('uuid, user_id, comment, created_at, post_id')
      .eq('post_id', post_id)
      .order('created_at', { ascending: false });

    if (commentsError) {
      return NextResponse.json({ error: `Failed to fetch comments: ${commentsError.message}` }, { status: 500 });
    }

    const { count } = await supabase
      .from('post_comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', post_id);

    return NextResponse.json({ comments, count: count || 0 }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: `Server error: ${error.message || 'Unknown error'}` }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { post_id, comment } = await request.json();
    if (!post_id || !comment) {
      return NextResponse.json({ error: 'Missing post_id or comment' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('auth_session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    let session: AuthSession;
    try {
      session = JSON.parse(sessionCookie) as AuthSession;
    } catch {
      return NextResponse.json({ error: 'Invalid session cookie' }, { status: 401 });
    }

    // Removed session validation query

    const newComment: Tables<'post_comments'> = {
      uuid: generateUUID(),
      post_id,
      user_id: session.uid,
      comment,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('post_comments')
      .insert(newComment)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: `Failed to add comment: ${error.message}` }, { status: 500 });
    }

    const { count } = await supabase
      .from('post_comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', post_id);

    return NextResponse.json({ comment: data, count: count || 0 }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: `Server error: ${error.message || 'Unknown error'}` }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { comment_id, post_id, comment } = await request.json();
    if (!comment_id || !post_id || !comment) {
      return NextResponse.json({ error: 'Missing comment_id, post_id, or comment' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('auth_session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    let session: AuthSession;
    try {
      session = JSON.parse(sessionCookie) as AuthSession;
    } catch {
      return NextResponse.json({ error: 'Invalid session cookie' }, { status: 401 });
    }

    // Removed session validation query

    const { data: existingComment, error: commentError } = await supabase
      .from('post_comments')
      .select('*')
      .eq('uuid', comment_id)
      .eq('post_id', post_id)
      .eq('user_id', session.uid)
      .single();

    if (commentError || !existingComment) {
      return NextResponse.json({ error: 'Comment not found or not authorized to edit' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('post_comments')
      .update({ comment, created_at: new Date().toISOString() })
      .eq('uuid', comment_id)
      .eq('user_id', session.uid)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: `Failed to update comment: ${error.message}` }, { status: 500 });
    }

    const { count } = await supabase
      .from('post_comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', post_id);

    return NextResponse.json({ comment: data, count: count || 0 }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: `Server error: ${error.message || 'Unknown error'}` }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { comment_id, post_id } = await request.json();
    if (!comment_id || !post_id) {
      return NextResponse.json({ error: 'Missing comment_id or post_id' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('auth_session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    let session: AuthSession;
    try {
      session = JSON.parse(sessionCookie) as AuthSession;
    } catch {
      return NextResponse.json({ error: 'Invalid session cookie' }, { status: 401 });
    }

    // Removed session validation query

    const { data: comment, error: commentError } = await supabase
      .from('post_comments')
      .select('*')
      .eq('uuid', comment_id)
      .eq('post_id', post_id)
      .eq('user_id', session.uid)
      .single();

    if (commentError || !comment) {
      return NextResponse.json({ error: 'Comment not found or not authorized to delete' }, { status: 403 });
    }

    const { error } = await supabase
      .from('post_comments')
      .delete()
      .eq('uuid', comment_id)
      .eq('user_id', session.uid);

    if (error) {
      return NextResponse.json({ error: `Failed to delete comment: ${error.message}` }, { status: 500 });
    }

    const { count } = await supabase
      .from('post_comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', post_id);

    return NextResponse.json({ message: 'Comment deleted', count: count || 0 }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: `Server error: ${error.message || 'Unknown error'}` }, { status: 500 });
  }
}