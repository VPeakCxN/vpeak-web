import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { compressImage } from '@/lib/storage/imageCompressor';
import { Database } from '@/lib/database.types';
import { generateUUID } from '@/lib/tools/generateUUID';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fileName = formData.get('fileName') as string;
    const postUid = formData.get('postUid') as string;
    const compress = formData.get('compress') === 'true';

    if (!file || !fileName || !postUid) {
      return NextResponse.json(
        { error: 'Missing required fields: file, fileName, postUid' },
        { status: 400 }
      );
    }

    let uploadFile = file;
    let compressionDetails: any = {};

    if (compress && file.type.startsWith('image/')) {
      const index = parseInt(fileName.split('.')[0], 10) - 1;
      const compressionResult = await compressImage(file, undefined, index);
      uploadFile = compressionResult.compressedFile;
      compressionDetails = {
        originalSize: compressionResult.originalSize,
        compressedSize: compressionResult.compressedSize,
        savings: compressionResult.originalSize - compressionResult.compressedSize,
        savingsPercentage: (compressionResult.compressionRatio * 100).toFixed(1),
        dimensions: {
          original: { width: compressionResult.width, height: compressionResult.height },
          compressed: { width: compressionResult.width, height: compressionResult.height },
        },
        format: compressionResult.format,
      };
    }

    const { data, error } = await supabase.storage
      .from('posts')
      .upload(`${postUid}/${fileName}`, uploadFile, {
        contentType: uploadFile.type,
        upsert: true,
      });

    if (error) {
      console.error('Storage upload error:', error);
      return NextResponse.json(
        { error: `Failed to upload file: ${error.message}` },
        { status: 500 }
      );
    }

    const publicUrl = supabase.storage
      .from('posts')
      .getPublicUrl(`${postUid}/${fileName}`).data.publicUrl;

    return NextResponse.json({
      path: data.path,
      publicUrl,
      fileName,
      fileSize: uploadFile.size,
      originalFileName: file.name,
      wasCompressed: compress && file.type.startsWith('image/'),
      compression: compressionDetails,
    }, { status: 200 });

  } catch (error: any) {
    console.error('Unexpected error in compress-upload:', error);
    return NextResponse.json(
      { error: `Server error: ${error.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}