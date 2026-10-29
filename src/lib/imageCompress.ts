export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0 to 1
  mimeType?: string;
}

export interface CompressedImageResult {
  file: File;
  blob: Blob;
  width: number;
  height: number;
  originalSizeBytes: number;
  compressedSizeBytes: number;
}

/**
 * Compresses an image file client-side before upload to stay within size bounds.
 * Max dimension ~1600px, JPEG quality ~0.8 by default.
 */
export async function compressImage(
  inputFile: File,
  options: CompressionOptions = {}
): Promise<CompressedImageResult> {
  const {
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 0.8,
    mimeType = 'image/jpeg',
  } = options;

  // If PDF file, bypass canvas image compression entirely
  if (inputFile.type === 'application/pdf' || inputFile.name.toLowerCase().endsWith('.pdf')) {
    return {
      file: inputFile,
      blob: inputFile,
      width: 0,
      height: 0,
      originalSizeBytes: inputFile.size,
      compressedSizeBytes: inputFile.size,
    };
  }

  // If already small (< 500KB) and correct format, return directly without degradation
  if (inputFile.size < 500 * 1024 && inputFile.type === mimeType) {
    return {
      file: inputFile,
      blob: inputFile,
      width: 0,
      height: 0,
      originalSizeBytes: inputFile.size,
      compressedSizeBytes: inputFile.size,
    };
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(inputFile);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;
      if (width > maxWidth || height > maxHeight) {
        if (width / height > maxWidth / maxHeight) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get 2D canvas context for image compression'));
        return;
      }

      // Draw image to canvas
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas toBlob failed'));
            return;
          }

          const compressedFile = new File(
            [blob],
            inputFile.name.replace(/\.[^/.]+$/, '') + '.jpg',
            { type: mimeType, lastModified: Date.now() }
          );

          resolve({
            file: compressedFile,
            blob,
            width,
            height,
            originalSizeBytes: inputFile.size,
            compressedSizeBytes: blob.size,
          });
        },
        mimeType,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image for compression'));
    };

    img.src = objectUrl;
  });
}
