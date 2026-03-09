/**
 * Image Compression Utility
 * 
 * Compresses images before upload to reduce bandwidth and improve performance.
 * Uses canvas-based compression with configurable quality and dimensions.
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeBytes?: number;
}

export interface CompressionResult {
  base64: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  width: number;
  height: number;
  format: string;
}

const DEFAULT_OPTIONS: Required<CompressionOptions> = {
  maxWidth: 1024,
  maxHeight: 1024,
  quality: 0.8,
  maxSizeBytes: 5 * 1024 * 1024, // 5MB
};

const SUPPORTED_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

/**
 * Validates image file format and size
 */
export const validateImage = (file: File, maxSizeBytes: number = DEFAULT_OPTIONS.maxSizeBytes): void => {
  // Validate file type
  if (!SUPPORTED_FORMATS.includes(file.type)) {
    throw new Error(
      `Unsupported image format: ${file.type}. Please use JPG, PNG, or WEBP.`
    );
  }

  // Validate file size
  if (file.size > maxSizeBytes) {
    const maxSizeMB = (maxSizeBytes / (1024 * 1024)).toFixed(1);
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
    throw new Error(
      `Image too large: ${fileSizeMB}MB. Maximum size is ${maxSizeMB}MB.`
    );
  }
};

/**
 * Calculates new dimensions while maintaining aspect ratio
 */
const calculateDimensions = (
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } => {
  let width = originalWidth;
  let height = originalHeight;

  // Calculate scaling factor
  if (width > maxWidth || height > maxHeight) {
    const widthRatio = maxWidth / width;
    const heightRatio = maxHeight / height;
    const ratio = Math.min(widthRatio, heightRatio);

    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  return { width, height };
};

/**
 * Loads an image file and returns an HTMLImageElement
 */
const loadImage = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image'));
      
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

/**
 * Compresses an image using canvas
 */
const compressImageToCanvas = (
  img: HTMLImageElement,
  width: number,
  height: number,
  quality: number,
  format: string
): string => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Draw image on canvas with new dimensions
  ctx.drawImage(img, 0, 0, width, height);

  // Convert to base64 with compression
  const mimeType = format === 'image/jpg' ? 'image/jpeg' : format;
  return canvas.toDataURL(mimeType, quality);
};

/**
 * Compresses an image file and returns base64 string with metadata
 */
export const compressImage = async (
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> => {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Validate image
  validateImage(file, opts.maxSizeBytes);

  // Load image
  const img = await loadImage(file);

  // Calculate new dimensions
  const { width, height } = calculateDimensions(
    img.width,
    img.height,
    opts.maxWidth,
    opts.maxHeight
  );

  // Compress image
  const base64 = compressImageToCanvas(img, width, height, opts.quality, file.type);

  // Calculate sizes
  const originalSize = file.size;
  const compressedSize = Math.round((base64.length * 3) / 4); // Approximate base64 size
  const compressionRatio = originalSize > 0 ? compressedSize / originalSize : 1;

  return {
    base64,
    originalSize,
    compressedSize,
    compressionRatio,
    width,
    height,
    format: file.type,
  };
};

/**
 * Extracts base64 data without the data URL prefix
 */
export const extractBase64Data = (base64String: string): string => {
  const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (matches && matches.length === 3) {
    return matches[2];
  }
  return base64String;
};

/**
 * Formats file size in human-readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};
