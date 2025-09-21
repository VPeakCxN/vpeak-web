// lib/actions/files/upload.ts
export interface UploadFileResult {
  path: string;
  publicUrl: string;
  fileName: string;
  fileSize: number;
  originalFileName: string;
  wasCompressed?: boolean;
  compression?: {
    originalSize: number;
    compressedSize: number;
    savings: number;
    savingsPercentage: number;
    dimensions: {
      original: { width: number; height: number };
      compressed: { width: number; height: number };
    };
    format: string;
  };
}

export interface UploadFilesPayload {
  files: File[];
  postUid: string;
}

export async function uploadFiles(payload: UploadFilesPayload): Promise<{
  success: boolean;
  files: UploadFileResult[];
  errors: string[];
}> {
  try {
    console.log(`Uploading ${payload.files.length} files for post ${payload.postUid}`);

    const uploadPromises = payload.files.map(async (file, index) => {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('fileName', `${index + 1}${getFileExtension(file.name)}`);
        formData.append('postUid', payload.postUid);
        formData.append('compress', 'true');

        const endpoint = isImageFile(file) ? '/api/storage/compress-upload' : '/api/storage/upload';
        
        const response = await fetch(endpoint, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Upload failed with status ${response.status}`);
        }

        const result = await response.json();
        return {
          success: true,
          result: result as UploadFileResult,
        };
      } catch (error) {
        console.error(`Failed to upload file ${file.name}:`, error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown upload error',
          fileName: file.name,
        };
      }
    });

    const results = await Promise.all(uploadPromises);
    const successfulUploads = results.filter(r => r.success) as { success: true; result: UploadFileResult }[];
    const failedUploads = results.filter(r => !r.success) as { success: false; error: string; fileName: string }[];

    return {
      success: failedUploads.length === 0,
      files: successfulUploads.map(r => r.result),
      errors: failedUploads.map(f => `Failed to upload ${f.fileName}: ${f.error}`),
    };
  } catch (error) {
    console.error('Batch upload error:', error);
    return {
      success: false,
      files: [],
      errors: [error instanceof Error ? error.message : 'Upload failed'],
    };
  }
}

function getFileExtension(filename: string): string {
  return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2);
}

function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}