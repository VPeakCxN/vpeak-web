// app/api/storage/upload/route.ts (Alternative implementation)
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use service role key for storage operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(request: NextRequest) {
  try {
    console.log("Storage upload request received");
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fileName = formData.get('fileName') as string;
    const postUid = formData.get('postUid') as string;

    console.log("Upload params:", { 
      fileName, 
      postUid, 
      fileSize: file?.size, 
      fileType: file?.type,
      hasFile: !!file 
    });

    if (!file || !fileName || !postUid) {
      return NextResponse.json(
        { error: "File, fileName, and postUid are required" },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 10MB" },
        { status: 400 }
      );
    }

    // Check if bucket exists and is accessible
    try {
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      if (bucketsError) {
        console.error("Cannot list buckets:", bucketsError);
        return NextResponse.json(
          { error: "Storage service not accessible" },
          { status: 500 }
        );
      }
      
      const postsBucket = buckets.find(b => b.name === 'posts');
      if (!postsBucket) {
        console.error("Posts bucket not found. Available buckets:", buckets.map(b => b.name));
        return NextResponse.json(
          { error: "Posts storage bucket not found" },
          { status: 500 }
        );
      }
      console.log("Posts bucket found:", postsBucket);
    } catch (bucketError) {
      console.error("Error checking buckets:", bucketError);
    }

    console.log("Converting file to array buffer...");
    const arrayBuffer = await file.arrayBuffer();
    console.log("Array buffer size:", arrayBuffer.byteLength);

    // Upload to Supabase storage
    const filePath = `${postUid}/${fileName}`;
    console.log("Uploading to path:", filePath);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('posts')
      .upload(filePath, arrayBuffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("Storage upload error:", {
        message: uploadError.message,
        error: uploadError,
      });
      
      // Check if it's a bucket policy issue
      if (uploadError.message?.includes('new row violates row-level security policy')) {
        return NextResponse.json(
          { error: "Storage permission denied. Check bucket policies." },
          { status: 403 }
        );
      }
      
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    if (!uploadData) {
      console.error("No upload data returned");
      return NextResponse.json(
        { error: "Upload completed but no data returned" },
        { status: 500 }
      );
    }

    console.log("Upload successful:", uploadData);

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('posts')
      .getPublicUrl(filePath);

    console.log("Generated public URL:", publicUrlData.publicUrl);

    return NextResponse.json({
      path: uploadData.path,
      publicUrl: publicUrlData.publicUrl,
      fileName: fileName,
    }, { status: 200 });

  } catch (error: any) {
    console.error("Unexpected upload error:", error);
    console.error("Error details:", {
      name: error?.name,
      message: error?.message,
      stack: error?.stack,
    });
    
    return NextResponse.json(
      { error: `Server error: ${error?.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}
