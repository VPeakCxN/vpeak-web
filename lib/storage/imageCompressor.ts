// lib/storage/imageCompressor.ts
import sharp from 'sharp';

// Image compression configuration
export interface CompressionConfig {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxFileSize?: number;
  resizeOnly?: boolean;
  format?: 'jpeg' | 'png' | 'webp';
}

export const DEFAULT_CONFIG: CompressionConfig = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 85,
  maxFileSize: 2 * 1024 * 1024, // 2MB
  resizeOnly: false,
  format: 'jpeg' as const,
};

export interface CompressionResult {
  compressedFile: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  width: number;
  height: number;
  format: string;
  wasCompressed: boolean;
}

/**
 * Check if a file is an image
 */
export function isImage(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * Get image dimensions using sharp
 */
export async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const metadata = await sharp(buffer).metadata();
    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
    };
  } catch (error) {
    console.error('Error getting image dimensions:', error);
    throw new Error('Failed to read image dimensions');
  }
}

/**
 * Compress a single image file
 */
export async function compressImage(
  file: File,
  config: CompressionConfig = DEFAULT_CONFIG
): Promise<CompressionResult> {
  try {
    console.log(`Starting compression for: ${file.name} (${file.size} bytes)`);
    
    const originalSize = file.size;
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Get original dimensions
    const { width: origWidth, height: origHeight } = await getImageDimensions(file);
    console.log(`Original dimensions: ${origWidth}x${origHeight}`);

    // Determine if compression is needed
    const needsCompression = 
      file.size > config.maxFileSize! || 
      origWidth > config.maxWidth! || 
      origHeight > config.maxHeight! ||
      !config.resizeOnly;

    if (!needsCompression) {
      console.log('File meets requirements, no compression needed');
      return {
        compressedFile: file,
        originalSize,
        compressedSize: file.size,
        compressionRatio: 1,
        width: origWidth,
        height: origHeight,
        format: file.type.split('/')[1] || 'unknown',
        wasCompressed: false,
      };
    }

    // Determine target format
    const targetFormat = config.format || 'jpeg';

    // Sharp processing options
    const sharpOptions: sharp.ResizeOptions & sharp.JpegOptions & sharp.PngOptions = {
      width: config.maxWidth,
      height: config.maxHeight,
      fit: sharp.fit.inside,
      withoutEnlargement: true,
    };

    // Apply quality settings based on format
    if (targetFormat === 'jpeg') {
      Object.assign(sharpOptions, { quality: config.quality });
    } else if (targetFormat === 'png') {
      Object.assign(sharpOptions, { quality: config.quality, effort: 6 });
    } else if (targetFormat === 'webp') {
      Object.assign(sharpOptions, { quality: config.quality, effort: 4 });
    }

    let processedBuffer: Buffer;
    let finalWidth = origWidth;
    let finalHeight = origHeight;

    // Apply aggressive compression if file is very large
    if (file.size > config.maxFileSize! * 2) {
      console.log('Applying aggressive compression for large file');
      const aggressiveConfig = { ...config, maxWidth: 1024, maxHeight: 768, quality: 70 };
      processedBuffer = await sharp(buffer)
        .resize(aggressiveConfig.maxWidth, aggressiveConfig.maxHeight, {
          fit: sharp.fit.inside,
          withoutEnlargement: true,
        })
        .jpeg({ quality: aggressiveConfig.quality })
        .toBuffer();
      
      const aggressiveMetadata = await sharp(processedBuffer).metadata();
      finalWidth = aggressiveMetadata.width || origWidth;
      finalHeight = aggressiveMetadata.height || origHeight;
    } else {
      // Normal compression
      const sharpChain = sharp(buffer).resize(sharpOptions.width!, sharpOptions.height!);
      
      switch (targetFormat) {
        case 'jpeg':
          processedBuffer = await sharpChain.jpeg(sharpOptions).toBuffer();
          break;
        case 'png':
          processedBuffer = await sharpChain.png(sharpOptions).toBuffer();
          break;
        case 'webp':
          processedBuffer = await sharpChain.webp(sharpOptions).toBuffer();
          break;
        default:
          processedBuffer = await sharpChain.toBuffer();
      }
      
      const metadata = await sharp(processedBuffer).metadata();
      finalWidth = metadata.width || origWidth;
      finalHeight = metadata.height || origHeight;
    }

    // Determine MIME type based on format
    let mimeType: string;
    switch (targetFormat) {
      case 'jpeg':
        mimeType = 'image/jpeg';
        break;
      case 'png':
        mimeType = 'image/png';
        break;
      case 'webp':
        mimeType = 'image/webp';
        break;
      default:
        mimeType = file.type;
    }

    // Create compressed file name
    const ext = targetFormat === 'jpeg' ? 'jpg' : targetFormat;
    const compressedFileName = file.name
      .split('.')
      .slice(0, -1)
      .join('.') + `.${ext}`;

    // Convert Buffer to Uint8Array for File constructor compatibility
    const compressedFile = new File([new Uint8Array(processedBuffer)], compressedFileName, {
      type: mimeType,
      lastModified: Date.now(),
    });

    const compressedSize = compressedFile.size;
    const compressionRatio = compressedSize / originalSize;

    console.log(`Compression complete:`);
    console.log(`- Original: ${originalSize} bytes (${origWidth}x${origHeight})`);
    console.log(`- Compressed: ${compressedSize} bytes (${finalWidth}x${finalHeight})`);
    console.log(`- Ratio: ${(compressionRatio * 100).toFixed(1)}%`);

    return {
      compressedFile,
      originalSize,
      compressedSize,
      compressionRatio,
      width: finalWidth,
      height: finalHeight,
      format: targetFormat,
      wasCompressed: true,
    };
  } catch (error: any) {
    console.error('Image compression error:', error);
    throw new Error(`Compression failed: ${error.message}`);
  }
}

/**
 * Batch compress multiple images
 */
export async function compressImages(
  files: File[],
  config: CompressionConfig = DEFAULT_CONFIG
): Promise<CompressionResult[]> {
  console.log(`Starting batch compression for ${files.length} image(s)`);
  
  const results: CompressionResult[] = [];
  const validImages = files.filter(isImage);
  
  if (validImages.length === 0) {
    throw new Error('No valid images found in the provided files');
  }

  for (let i = 0; i < validImages.length; i++) {
    const file = validImages[i];
    console.log(`\n--- Processing image ${i + 1}/${validImages.length}: ${file.name} ---`);
    
    try {
      const result = await compressImage(file, config);
      results.push(result);
    } catch (error) {
      console.error(`Failed to compress ${file.name}:`, error);
      // Continue with other files instead of failing completely
      const { width, height } = await getImageDimensions(file).catch(() => ({ width: 0, height: 0 }));
      results.push({
        compressedFile: file,
        originalSize: file.size,
        compressedSize: file.size,
        compressionRatio: 1,
        width,
        height,
        format: file.type.split('/')[1] || 'unknown',
        wasCompressed: false,
      });
    }
  }

  console.log(`\nBatch compression complete: ${results.length} images processed`);
  return results;
}

/**
 * Get compression statistics
 */
export function getCompressionStats(results: CompressionResult[]): {
  totalOriginalSize: number;
  totalCompressedSize: number;
  totalSavings: number;
  savingsPercentage: number;
  imagesCompressed: number;
  imagesSkipped: number;
} {
  const totalOriginalSize = results.reduce((sum, r) => sum + r.originalSize, 0);
  const totalCompressedSize = results.reduce((sum, r) => sum + r.compressedSize, 0);
  const totalSavings = totalOriginalSize - totalCompressedSize;
  const savingsPercentage = totalOriginalSize > 0 ? (totalSavings / totalOriginalSize) * 100 : 0;
  const imagesCompressed = results.filter(r => r.wasCompressed).length;
  const imagesSkipped = results.length - imagesCompressed;

  return {
    totalOriginalSize,
    totalCompressedSize,
    totalSavings,
    savingsPercentage,
    imagesCompressed,
    imagesSkipped,
  };
}