/**
 * Image Compression Utility - Usage Examples
 * 
 * This file demonstrates how to use the image compression utility
 * in various scenarios throughout the application.
 */

import { compressImage, validateImage, extractBase64Data, formatFileSize } from './imageCompression';

/**
 * Example 1: Basic Image Compression
 * 
 * Compress an image with default settings (1024x1024, quality 0.8)
 */
export const basicCompressionExample = async (file: File) => {
  try {
    // Compress with defaults
    const result = await compressImage(file);
    
    console.log('Compression complete!');
    console.log(`Original size: ${formatFileSize(result.originalSize)}`);
    console.log(`Compressed size: ${formatFileSize(result.compressedSize)}`);
    console.log(`Compression ratio: ${(result.compressionRatio * 100).toFixed(1)}%`);
    console.log(`Dimensions: ${result.width}x${result.height}`);
    
    // Use the base64 string
    return result.base64;
  } catch (error) {
    console.error('Compression failed:', error);
    throw error;
  }
};

/**
 * Example 2: Custom Compression Settings
 * 
 * Compress with custom dimensions and quality
 */
export const customCompressionExample = async (file: File) => {
  try {
    const result = await compressImage(file, {
      maxWidth: 512,
      maxHeight: 512,
      quality: 0.6,
      maxSizeBytes: 2 * 1024 * 1024, // 2MB max
    });
    
    return result.base64;
  } catch (error) {
    console.error('Compression failed:', error);
    throw error;
  }
};

/**
 * Example 3: Validate Before Compression
 * 
 * Check if file is valid before attempting compression
 */
export const validateBeforeCompressionExample = async (file: File) => {
  try {
    // Validate first
    validateImage(file);
    
    // If validation passes, compress
    const result = await compressImage(file);
    return result.base64;
  } catch (error) {
    if (error instanceof Error) {
      // Handle validation errors
      if (error.message.includes('Unsupported')) {
        console.error('Invalid file format');
      } else if (error.message.includes('too large')) {
        console.error('File size exceeds limit');
      }
    }
    throw error;
  }
};

/**
 * Example 4: Extract Base64 Data for API
 * 
 * Remove data URL prefix before sending to backend
 */
export const extractDataForAPIExample = async (file: File) => {
  try {
    const result = await compressImage(file);
    
    // Full base64 with data URL prefix
    console.log('Full:', result.base64.substring(0, 50) + '...');
    
    // Extract just the base64 data
    const base64Data = extractBase64Data(result.base64);
    console.log('Data only:', base64Data.substring(0, 50) + '...');
    
    // Send to API
    return {
      image: base64Data,
      metadata: {
        width: result.width,
        height: result.height,
        format: result.format,
        size: result.compressedSize,
      },
    };
  } catch (error) {
    console.error('Processing failed:', error);
    throw error;
  }
};

/**
 * Example 5: Image Upload with Progress
 * 
 * Show compression progress to user
 */
export const compressionWithProgressExample = async (
  file: File,
  onProgress: (stage: string, percent: number) => void
) => {
  try {
    onProgress('Validating...', 10);
    validateImage(file);
    
    onProgress('Compressing...', 50);
    const result = await compressImage(file);
    
    onProgress('Complete!', 100);
    
    return result;
  } catch (error) {
    onProgress('Failed', 0);
    throw error;
  }
};

/**
 * Example 6: React Component Integration
 * 
 * How to use in a React component
 */
export const reactComponentExample = `
import React, { useState } from 'react';
import { compressImage, formatFileSize } from '@/utils/imageCompression';

export const ImageUploader: React.FC = () => {
  const [compressing, setCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCompressing(true);
    setError(null);

    try {
      const result = await compressImage(file);
      
      console.log('Compressed from ' + formatFileSize(result.originalSize) + ' to ' + formatFileSize(result.compressedSize));
      
      // Use result.base64 for preview or upload
      // ...
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Compression failed');
    } finally {
      setCompressing(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        disabled={compressing}
      />
      {compressing && <p>Compressing...</p>}
      {error && <p className="error">{error}</p>}
    </div>
  );
};
`;

/**
 * Example 7: Error Handling
 * 
 * Comprehensive error handling
 */
export const errorHandlingExample = async (file: File) => {
  try {
    const result = await compressImage(file);
    return result;
  } catch (error) {
    if (error instanceof Error) {
      // Specific error handling
      if (error.message.includes('Unsupported image format')) {
        // Show user-friendly message
        alert('Please select a JPG, PNG, or WEBP image');
      } else if (error.message.includes('Image too large')) {
        // Suggest solution
        alert('Image is too large. Please select an image smaller than 5MB');
      } else if (error.message.includes('Failed to load image')) {
        // Corrupted file
        alert('Unable to read image file. It may be corrupted');
      } else if (error.message.includes('Failed to get canvas context')) {
        // Browser compatibility issue
        alert('Your browser does not support image compression');
      } else {
        // Generic error
        alert('Failed to process image. Please try again');
      }
    }
    throw error;
  }
};

/**
 * Example 8: Batch Compression
 * 
 * Compress multiple images
 */
export const batchCompressionExample = async (files: File[]) => {
  const results = await Promise.all(
    files.map(async (file) => {
      try {
        return await compressImage(file);
      } catch (error) {
        console.error('Failed to compress ' + file.name + ':', error);
        return null;
      }
    })
  );
  
  // Filter out failed compressions
  return results.filter((result) => result !== null);
};
