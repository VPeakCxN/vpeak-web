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
    const files = await request.json() as Array<{
      uuid?: string;
      post_id: string;
      file_name: string;
      file_url: string;
      type: string;
      content?: string | null;
      created_at?: string;
    }>;

    console.log(`Creating ${files.length} file records for post`);

    if (!Array.isArray(files) || files.length === 0) {
      return NextResponse.json(
        { error: 'Invalid files array' },
        { status: 400 }
      );
    }

    // Validate post_id format (must be UUID)
    const invalidPostIds = files.filter(
      file => !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(file.post_id)
    );
    if (invalidPostIds.length > 0) {
      console.error('Invalid post_id format:', invalidPostIds.map(file => file.post_id));
      return NextResponse.json(
        { error: `Invalid post_id format: ${invalidPostIds.map(file => file.post_id).join(', ')}` },
        { status: 400 }
      );
    }

    // Validate post_id exists in posts table
    const postIds = [...new Set(files.map(file => file.post_id))];
    const { data: existingPosts, error: postCheckError } = await supabase
      .from('posts')
      .select('post_id')
      .in('post_id', postIds);

    if (postCheckError) {
      console.error('Error checking post_ids:', postCheckError);
      return NextResponse.json(
        { error: `Failed to validate post_ids: ${postCheckError.message}` },
        { status: 500 }
      );
    }

    const validPostIds = new Set(existingPosts.map(post => post.post_id));
    const invalidFiles = files.filter(file => !validPostIds.has(file.post_id));

    if (invalidFiles.length > 0) {
      console.error('Invalid post_ids:', invalidFiles.map(file => file.post_id));
      return NextResponse.json(
        { error: `Invalid post_id(s): ${invalidFiles.map(file => file.post_id).join(', ')} not found in posts table` },
        { status: 400 }
      );
    }

    const validatedFiles = files.map(file => ({
      ...file,
      uuid: file.uuid && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(file.uuid)
        ? file.uuid
        : generateUUID(),
      created_at: file.created_at || new Date().toISOString(),
    }));

    const { data: fileRecords, error: fileError } = await supabase
      .from('post_files')
      .insert(validatedFiles)
      .select();

    if (fileError) {
      console.error('File records creation error:', fileError);
      return NextResponse.json(
        { error: `Failed to create file records: ${fileError.message}` },
        { status: 500 }
      );
    }

    console.log(`${fileRecords?.length || 0} file records created successfully`);
    
    return NextResponse.json(fileRecords, { status: 201 });

  } catch (error: any) {
    console.error('Unexpected file records creation error:', error);
    return NextResponse.json(
      { error: `Server error: ${error?.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}