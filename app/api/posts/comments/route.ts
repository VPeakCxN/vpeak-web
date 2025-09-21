import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database, Tables } from '@/lib/database.types';
import { generateUUID } from '@/lib/tools/generateUUID';
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
    const body = await request.json();
    console.log('Request body:', body); // Debug log
    const { post_id, comment, user_id: callerUserId } = body;
    if (!post_id || !comment) {
      return NextResponse.json({ error: 'Missing post_id or comment' }, { status: 400 });
    }

    // Check for uid cookie
    const cookieStore = await cookies();
    const uidCookie = cookieStore.get('uid')?.value;
    console.log('uid cookie:', uidCookie); // Debug log
    let user_id: string;

    if (uidCookie) {
      user_id = uidCookie; // Use uid from cookie
    } else if (callerUserId) {
      user_id = callerUserId; // Fallback to user_id from request body
    } else {
      return NextResponse.json({ error: 'Missing user_id and no uid cookie' }, { status: 400 });
    }

    // Verify post_id exists in posts table
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('post_id')
      .eq('post_id', post_id)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: 'Invalid post_id: Post not found' }, { status: 404 });
    }

    const newComment: Tables<'post_comments'> = {
      uuid: generateUUID(),
      post_id,
      user_id,
      comment,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('post_comments')
      .insert(newComment)
      .select()
      .single();

    if (error) {
      console.log('Supabase error:', error); // Debug log
      return NextResponse.json({ error: `Failed to add comment: ${error.message}` }, { status: 500 });
    }

    const { count } = await supabase
      .from('post_comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', post_id);

    return NextResponse.json({ comment: data, count: count || 0 }, { status: 201 });
  } catch (error: any) {
    console.log('Server error:', error); // Debug log
    return NextResponse.json({ error: `Server error: ${error.message || 'Unknown error'}` }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('PATCH request body:', body); // Debug log
    const { comment_id, post_id, comment } = body;
    if (!comment_id || !post_id || !comment) {
      return NextResponse.json({ error: 'Missing comment_id, post_id, or comment' }, { status: 400 });
    }

    // Verify post_id exists in posts table
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('post_id')
      .eq('post_id', post_id)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: 'Invalid post_id: Post not found' }, { status: 404 });
    }

    // Verify comment exists
    const { data: existingComment, error: commentError } = await supabase
      .from('post_comments')
      .select('*')
      .eq('uuid', comment_id)
      .eq('post_id', post_id)
      .single();

    if (commentError || !existingComment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    const { data, error } = await supabase
      .from('post_comments')
      .update({ comment, created_at: new Date().toISOString() })
      .eq('uuid', comment_id)
      .select()
      .single();

    if (error) {
      console.log('Supabase error:', error); // Debug log
      return NextResponse.json({ error: `Failed to update comment: ${error.message}` }, { status: 500 });
    }

    const { count } = await supabase
      .from('post_comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', post_id);

    return NextResponse.json({ comment: data, count: count || 0 }, { status: 200 });
  } catch (error: any) {
    console.log('Server error:', error); // Debug log
    return NextResponse.json({ error: `Server error: ${error.message || 'Unknown error'}` }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('DELETE request body:', body); // Debug log
    const { comment_id, post_id } = body;
    if (!comment_id || !post_id) {
      return NextResponse.json({ error: 'Missing comment_id or post_id' }, { status: 400 });
    }

    // Verify post_id exists in posts table
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('post_id')
      .eq('post_id', post_id)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: 'Invalid post_id: Post not found' }, { status: 404 });
    }

    // Verify comment exists
    const { data: comment, error: commentError } = await supabase
      .from('post_comments')
      .select('*')
      .eq('uuid', comment_id)
      .eq('post_id', post_id)
      .single();

    if (commentError || !comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    const { error } = await supabase
      .from('post_comments')
      .delete()
      .eq('uuid', comment_id);

    if (error) {
      console.log('Supabase error:', error); // Debug log
      return NextResponse.json({ error: `Failed to delete comment: ${error.message}` }, { status: 500 });
    }

    const { count } = await supabase
      .from('post_comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', post_id);

    return NextResponse.json({ message: 'Comment deleted', count: count || 0 }, { status: 200 });
  } catch (error: any) {
    console.log('Server error:', error); // Debug log
    return NextResponse.json({ error: `Server error: ${error.message || 'Unknown error'}` }, { status: 500 });
  }
}