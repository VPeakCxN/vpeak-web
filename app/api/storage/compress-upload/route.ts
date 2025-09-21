// app/api/storage/compress-upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { 
  compressImage, 
  isImage, 
  CompressionResult,
  getCompressionStats,
  getImageDimensions 
} from "@/lib/storage/imageCompressor";

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

// Upload configuration
const UPLOAD_CONFIG = {
  maxOriginalSize: 20 * 1024 * 1024, // 20MB
  maxCompressedSize: 2 * 1024 * 1024, // 2MB
};

export async function POST(request: NextRequest) {
  try {
    console.log("Compressed upload request received");
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fileName = formData.get('fileName') as string;
    const postUid = formData.get('postUid') as string;
    const compress = formData.get('compress') === 'true'; // Optional: force compression
    const quality = parseInt(formData.get('quality') as string) || 85; // Optional: custom quality

    console.log("Upload params:", { 
      fileName, 
      postUid, 
      fileSize: file?.size, 
      fileType: file?.type,
      hasFile: !!file,
      compress,
      quality
    });

    if (!file || !fileName || !postUid) {
      return NextResponse.json(
        { error: "File, fileName, and postUid are required" },
        { status: 400 }
      );
    }

    // Validate original file size (20MB max before compression)
    if (file.size > UPLOAD_CONFIG.maxOriginalSize) {
      return NextResponse.json(
        { error: "Original file size must be less than 20MB" },
        { status: 400 }
      );
    }

    let uploadFile: File = file;
    let compressionResult: CompressionResult | null = null;
    let originalDimensions: { width: number; height: number } | null = null;

    // Determine if we should compress
    const shouldCompress = compress || isImage(file);
    
    if (shouldCompress) {
      console.log("Processing image compression...");
      const startTime = Date.now();
      
      // Get original dimensions once
      originalDimensions = await getImageDimensions(file);
      
      // Compress using the library
      compressionResult = await compressImage(file, {
        quality,
        maxFileSize: UPLOAD_CONFIG.maxCompressedSize,
      });
      
      uploadFile = compressionResult.compressedFile;
      
      console.log(`Compression complete in ${Date.now() - startTime}ms`);
      console.log(`Size: ${compressionResult.originalSize} → ${compressionResult.compressedSize} bytes (${(compressionResult.compressionRatio * 100).toFixed(1)}%)`);
    } else {
      console.log("File is not an image, skipping compression");
    }

    // Validate final file size
    if (uploadFile.size > UPLOAD_CONFIG.maxCompressedSize) {
      return NextResponse.json(
        { error: "File exceeds maximum size limit after processing" },
        { status: 400 }
      );
    }

    // Prepare upload parameters
    const finalFileName = compressionResult?.wasCompressed 
      ? `compressed_${fileName}` 
      : fileName;
    
    // Upload the processed file
    const uploadResult = await uploadToStorage(uploadFile, finalFileName, postUid);
    
    if (!uploadResult) {
      return NextResponse.json(
        { error: "Upload failed" },
        { status: 500 }
      );
    }

    // Prepare response
    const responseData = {
      path: uploadResult.path,
      publicUrl: uploadResult.publicUrl,
      fileName: uploadResult.fileName,
      fileSize: uploadFile.size,
      originalFileName: fileName,
      wasCompressed: !!compressionResult?.wasCompressed,
    };

    // Add compression metadata if applicable
    if (compressionResult) {
      Object.assign(responseData, {
        compression: {
          originalSize: compressionResult.originalSize,
          compressedSize: compressionResult.compressedSize,
          savings: compressionResult.originalSize - compressionResult.compressedSize,
          savingsPercentage: Math.round((1 - compressionResult.compressionRatio) * 100),
          dimensions: {
            original: originalDimensions,
            compressed: {
              width: compressionResult.width,
              height: compressionResult.height,
            },
          },
          format: compressionResult.format,
        },
      });
    }

    return NextResponse.json(responseData, { status: 200 });

  } catch (error: any) {
    console.error("Unexpected compressed upload error:", error);
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

// Helper function to handle the actual upload
async function uploadToStorage(file: File, fileName: string, postUid: string): Promise<{
  path: string;
  publicUrl: string;
  fileName: string;
} | null> {
  try {
    // Check if bucket exists and is accessible
    try {
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      if (bucketsError) {
        console.error("Cannot list buckets:", bucketsError);
        return null;
      }
      
      const postsBucket = buckets.find(b => b.name === 'posts');
      if (!postsBucket) {
        console.error("Posts bucket not found. Available buckets:", buckets.map(b => b.name));
        return null;
      }
      console.log("Posts bucket found:", postsBucket);
    } catch (bucketError) {
      console.error("Error checking buckets:", bucketError);
    }

    console.log("Uploading file...");
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
      
      if (uploadError.message?.includes('new row violates row-level security policy')) {
        throw new Error("Storage permission denied. Check bucket policies.");
      }
      
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    if (!uploadData) {
      console.error("No upload data returned");
      throw new Error("Upload completed but no data returned");
    }

    console.log("Upload successful:", uploadData);

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('posts')
      .getPublicUrl(filePath);

    console.log("Generated public URL:", publicUrlData.publicUrl);

    return {
      path: uploadData.path,
      publicUrl: publicUrlData.publicUrl,
      fileName: fileName,
    };

  } catch (uploadError) {
    console.error("Upload handling error:", uploadError);
    return null;
  }
}