import { uploadFiles } from '../files/upload';
import { type Database } from '@/lib/database.types';
import { generateUUID } from '@/lib/tools/generateUUID';

export type CreatePostPayload = {
  title: string;
  content: string;
  author_id: string;
  files?: File[];
};

export interface CreatePostResult {
  success: boolean;
  post?: {
    post_id: string;
    title: string;
    content: string;
    author_id: string;
    created_at: string;
    uploaded_at: string;
  };
  files?: {
    path: string;
    publicUrl: string;
    fileName: string;
    fileSize: number;
    originalFileName: string;
  }[];
  errors?: string[];
};

export async function createPost(payload: CreatePostPayload): Promise<CreatePostResult> {
  try {
    console.log("Creating post with payload:", {
      title: payload.title.substring(0, 50),
      hasFiles: !!payload.files?.length,
      author_id: payload.author_id
    });

    // Step 1: Generate post ID using UUID
    const postId = generateUUID();

    // Step 2: Upload files first (if any)
    let uploadedFiles: any[] = [];
    if (payload.files && payload.files.length > 0) {
      const uploadResult = await uploadFiles({
        files: payload.files,
        postUid: postId,
      });

      if (!uploadResult.success) {
        return {
          success: false,
          errors: uploadResult.errors,
        };
      }

      uploadedFiles = uploadResult.files;
    }

    // Step 3: Create post in database
    const postPayload = {
      post_id: postId,
      title: payload.title,
      content: payload.content,
      author_id: payload.author_id,
      created_at: new Date().toISOString(),
      uploaded_at: new Date().toISOString(),
    };

    console.log("Creating post in database:", postPayload);

    const response = await fetch('/api/db/posts', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postPayload),
    });

    console.log("Database response status:", response.status);
    
    if (!response.ok) {
      let errorMessage;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || `HTTP ${response.status}`;
        console.error("Database Error:", errorData);
      } catch (parseErr) {
        const errorText = await response.text();
        errorMessage = `HTTP ${response.status}: ${errorText}`;
        console.error("Failed to parse database error response:", errorText);
      }

      return { 
        success: false, 
        errors: [errorMessage] 
      };
    }

    const postData = await response.json();
    console.log("Post created successfully:", postData);

    // Step 4: Save file references to post_files table
    if (uploadedFiles.length > 0) {
      const fileRecords = uploadedFiles.map((file) => ({
        uuid: generateUUID(),
        post_id: postId,
        file_name: file.fileName,
        file_url: file.publicUrl,
        type: file.wasCompressed && file.compression?.format
          ? `image/${file.compression.format}` // Use MIME type from compression result
          : (file.type || 'application/octet-stream'), // Fallback to file.type or generic MIME
        content: payload.content.substring(0, 100),
        created_at: new Date().toISOString(),
      }));

      const fileResponse = await fetch('/api/db/post-files', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fileRecords),
      });

      if (!fileResponse.ok) {
        console.warn("Failed to save file references:", await fileResponse.text());
      }
    }

    return { 
      success: true, 
      post: postPayload,
      files: uploadedFiles,
    };

  } catch (error) {
    console.error("Post creation error:", error);
    return { 
      success: false, 
      errors: [error instanceof Error ? error.message : 'Unknown error'] 
    };
  }
}