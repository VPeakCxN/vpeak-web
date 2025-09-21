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

    const { count } = await supabase
      .from('post_shares')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', post_id);

    return NextResponse.json({ sharesCount: count || 0 }, { status: 200 });
  } catch (error: any) {
    console.log('Server error in GET shares:', error); // Debug log
    return NextResponse.json({ error: `Server error: ${error.message || 'Unknown error'}` }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Share request body:', body); // Debug log
    const { post_id, user_id: callerUserId } = body;
    if (!post_id) {
      return NextResponse.json({ error: 'Missing post_id' }, { status: 400 });
    }

    // Check for uid cookie
    const cookieStore = await cookies();
    const uidCookie = cookieStore.get('uid')?.value;
    console.log('uid cookie for share:', uidCookie); // Debug log
    let user_id: string | null = null;

    if (uidCookie) {
      user_id = uidCookie; // Use uid from cookie
    } else if (callerUserId) {
      user_id = callerUserId; // Fallback to user_id from request body
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

    // Check for existing share
    if (user_id) {
      const { data: existingShare, error: shareError } = await supabase
        .from('post_shares')
        .select('uuid')
        .eq('post_id', post_id)
        .eq('user_id', user_id)
        .single();

      if (shareError && shareError.code !== 'PGRST116') {
        console.log('Supabase share check error:', shareError); // Debug log
        return NextResponse.json({ error: `Failed to check share status: ${shareError.message}` }, { status: 500 });
      }

      if (existingShare) {
        const { count } = await supabase
          .from('post_shares')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post_id);
        return NextResponse.json({ message: 'Post already shared by user', sharesCount: count || 0 }, { status: 200 });
      }
    }

    const share: Tables<'post_shares'> = {
      uuid: generateUUID(),
      post_id,
      user_id,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('post_shares')
      .insert(share)
      .select()
      .single();

    if (error) {
      console.log('Supabase share error:', error); // Debug log
      if (error.message.includes('duplicate key value')) {
        return NextResponse.json({ error: 'Post already shared' }, { status: 409 });
      }
      return NextResponse.json({ error: `Failed to add share: ${error.message}` }, { status: 500 });
    }

    const { count } = await supabase
      .from('post_shares')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', post_id);

    return NextResponse.json({ share: data, sharesCount: count || 0 }, { status: 201 });
  } catch (error: any) {
    console.log('Server error in POST share:', error); // Debug log
    return NextResponse.json({ error: `Server error: ${error.message || 'Unknown error'}` }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Share delete request body:', body); // Debug log
    const { post_id, user_id: callerUserId } = body;
    if (!post_id) {
      return NextResponse.json({ error: 'Missing post_id' }, { status: 400 });
    }

    // Check for uid cookie
    const cookieStore = await cookies();
    const uidCookie = cookieStore.get('uid')?.value;
    console.log('uid cookie for delete share:', uidCookie); // Debug log
    let user_id: string | null = null;

    if (uidCookie) {
      user_id = uidCookie;
    } else if (callerUserId) {
      user_id = callerUserId;
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

    // Find and delete the share (if user_id is provided)
    if (user_id) {
      const { data: existingShare, error: shareError } = await supabase
        .from('post_shares')
        .select('uuid')
        .eq('post_id', post_id)
        .eq('user_id', user_id)
        .single();

      if (shareError && shareError.code !== 'PGRST116') {
        console.log('Supabase share check error:', shareError); // Debug log
        return NextResponse.json({ error: `Failed to check share status: ${shareError.message}` }, { status: 500 });
      }

      if (!existingShare) {
        return NextResponse.json({ error: 'Share not found' }, { status: 404 });
      }

      const { error } = await supabase
        .from('post_shares')
        .delete()
        .eq('uuid', existingShare.uuid);

      if (error) {
        console.log('Supabase delete share error:', error); // Debug log
        return NextResponse.json({ error: `Failed to delete share: ${error.message}` }, { status: 500 });
      }
    } else {
      return NextResponse.json({ error: 'Missing user_id and no uid cookie' }, { status: 400 });
    }

    const { count } = await supabase
      .from('post_shares')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', post_id);

    return NextResponse.json({ message: 'Share removed', sharesCount: count || 0 }, { status: 200 });
  } catch (error: any) {
    console.log('Server error in DELETE share:', error); // Debug log
    return NextResponse.json({ error: `Server error: ${error.message || 'Unknown error'}` }, { status: 500 });
  }
}