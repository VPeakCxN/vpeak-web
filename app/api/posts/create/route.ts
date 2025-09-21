import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import type { Database, Tables } from '@/lib/database.types';
import { generateUUID } from '@/lib/tools/generateUUID';
import { uploadFiles } from '@/lib/actions/files/upload';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { title, content, author_id, files } = req.body as CreatePostPayload;
    if (!title || !content || !author_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const postId = generateUUID();

    let uploadedFiles: any[] = [];
    if (files && files.length > 0) {
      const uploadResult = await uploadFiles({
        files,
        postUid: postId,
      });

      if (!uploadResult.success) {
        return res.status(400).json({ success: false, errors: uploadResult.errors });
      }

      uploadedFiles = uploadResult.files;
    }

    const postPayload = {
      post_id: postId,
      title,
      content,
      author_id,
      created_at: new Date().toISOString(),
      uploaded_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('posts')
      .insert(postPayload)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ success: false, errors: [`Failed to create post: ${error.message}`] });
    }

    if (uploadedFiles.length > 0) {
      const fileRecords = uploadedFiles.map((file) => ({
        uuid: generateUUID(),
        post_id: postId,
        file_name: file.fileName,
        file_url: file.publicUrl,
        type: file.wasCompressed && file.compression?.format
          ? `image/${file.compression.format}`
          : file.type || 'application/octet-stream',
        content: content.substring(0, 100),
        created_at: new Date().toISOString(),
      }));

      const { error: fileError } = await supabase.from('post_files').insert(fileRecords);
      if (fileError) {
        console.warn('Failed to save file references:', fileError.message);
      }
    }

    return res.status(201).json({ success: true, post: postPayload, files: uploadedFiles });
  } catch (error: any) {
    return res.status(500).json({ success: false, errors: [error.message || 'Unknown error'] });
  }
}