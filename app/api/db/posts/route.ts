import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database.types';
import { generateUUID } from '@/lib/tools/generateUUID';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const post_id = body.post_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.post_id)
      ? body.post_id
      : generateUUID();

    console.log('Creating post:', {
      post_id,
      title: body.title.substring(0, 50) + '...',
      author_id: body.author_id
    });

    if (!body.title || !body.content || !body.author_id) {
      return NextResponse.json(
        { error: 'Missing required fields: title, content, author_id' },
        { status: 400 }
      );
    }

    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert([{ ...body, post_id, uploaded_at: new Date().toISOString() }])
      .select()
      .single();

    if (postError) {
      console.error('Post creation error:', postError);
      return NextResponse.json(
        { error: `Failed to create post: ${postError.message}` },
        { status: 500 }
      );
    }

    console.log('Post created successfully:', post.post_id);
    
    return NextResponse.json(post, { status: 201 });

  } catch (error: any) {
    console.error('Unexpected post creation error:', error);
    return NextResponse.json(
      { error: `Server error: ${error?.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}