// app/api/db/post-files/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database.types';

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
      uuid: string;
      post_id: string;
      file_name: string;
      file_url: string;
      type: string;
      content?: string | null;
      created_at: string;
    }>;

    console.log(`Creating ${files.length} file records for post`);

    // Validate files array
    if (!Array.isArray(files) || files.length === 0) {
      return NextResponse.json(
        { error: 'Invalid files array' },
        { status: 400 }
      );
    }

    // Insert all files
    const { data: fileRecords, error: fileError } = await supabase
      .from('post_files')
      .insert(files)
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