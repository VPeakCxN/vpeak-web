// API route for shares: /api/posts/shares.ts
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

export async function POST(request: NextRequest) {
  try {
    const { post_id } = await request.json();
    if (!post_id) {
      return NextResponse.json({ error: 'Missing post_id' }, { status: 400 });
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

    const { data: existingShare, error: shareError } = await supabase
      .from('post_shares')
      .select('uuid')
      .eq('post_id', post_id)
      .eq('user_id', session.uid)
      .single();

    if (shareError && shareError.code !== 'PGRST116') {
      return NextResponse.json({ error: `Failed to check share status: ${shareError.message}` }, { status: 500 });
    }

    const { count } = await supabase
      .from('post_shares')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', post_id);

    if (existingShare) {
      return NextResponse.json({ message: 'Post already shared by user', sharesCount: count || 0 }, { status: 200 });
    }

    const share: Tables<'post_shares'> = {
      uuid: generateUUID(),
      post_id,
      user_id: session.uid,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('post_shares').insert(share);

    if (error) {
      return NextResponse.json({ error: `Failed to share post: ${error.message}` }, { status: 500 });
    }

    const { count: newCount } = await supabase
      .from('post_shares')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', post_id);

    return NextResponse.json({ message: 'Post shared', sharesCount: newCount || 0 }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: `Server error: ${error.message || 'Unknown error'}` }, { status: 500 });
  }
}

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
    return NextResponse.json({ error: `Server error: ${error.message || 'Unknown error'}` }, { status: 500 });
  }
}