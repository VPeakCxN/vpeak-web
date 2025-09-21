// @/pages/api/posts/likes.ts
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

    const { data: likesData, error: likesError } = await supabase
      .from('post_likes')
      .select('uuid, user_id, created_at, post_id')
      .eq('post_id', post_id);

    if (likesError) {
      return NextResponse.json({ error: `Failed to fetch likes: ${likesError.message}` }, { status: 500 });
    }

    const likers = likesData?.length
      ? await Promise.all(
          likesData.map(async (like) => {
            const { data: student, error: studentError } = await supabase
              .from('students')
              .select('name, avatar')
              .eq('uid', like.user_id ?? '')
              .single();

            return {
              ...like,
              name: studentError || !student ? 'Unknown' : student.name,
              avatar: student?.avatar || undefined,
            };
          })
        )
      : [];

    const { count } = await supabase
      .from('post_likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', post_id);

    return NextResponse.json({ likers, likesCount: count || 0 }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: `Server error: ${error.message || 'Unknown error'}` }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { post_id } = await request.json();
    if (!post_id) {
      return NextResponse.json({ error: 'Missing post_id' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const uid = cookieStore.get('uid')?.value;

    if (!uid) {
      return NextResponse.json({ error: 'Missing uid' }, { status: 401 });
    }

    const { data: existingLike, error: likeError } = await supabase
      .from('post_likes')
      .select('uuid')
      .eq('post_id', post_id)
      .eq('user_id', uid)
      .single();

    if (likeError && likeError.code !== 'PGRST116') {
      return NextResponse.json({ error: `Failed to check like status: ${likeError.message}` }, { status: 500 });
    }

    if (existingLike) {
      const { error } = await supabase
        .from('post_likes')
        .delete()
        .eq('uuid', existingLike.uuid)
        .eq('user_id', uid);

      if (error) {
        return NextResponse.json({ error: `Failed to unlike post: ${error.message}` }, { status: 500 });
      }

      const { count } = await supabase
        .from('post_likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', post_id);

      return NextResponse.json({ action: 'removed', likesCount: count || 0 }, { status: 200 });
    } else {
      const like: Tables<'post_likes'> = {
        uuid: generateUUID(),
        post_id,
        user_id: uid,
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('post_likes').insert(like);

      if (error) {
        return NextResponse.json({ error: `Failed to like post: ${error.message}` }, { status: 500 });
      }

      const { count } = await supabase
        .from('post_likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', post_id);

      return NextResponse.json({ action: 'added', likesCount: count || 0 }, { status: 201 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: `Server error: ${error.message || 'Unknown error'}` }, { status: 500 });
  }
}