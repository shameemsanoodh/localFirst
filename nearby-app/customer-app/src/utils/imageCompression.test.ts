/**
 * Tests for Image Compression Utility
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  validateImage,
  compressImage,
  extractBase64Data,
  formatFileSize,
  CompressionResult,
} from './imageCompression';

describe('imageCompression', () => {
  describe('validateImage', () => {
    it('should accept valid JPEG image', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      expect(() => validateImage(file)).not.toThrow();
    });

    it('should accept valid PNG image', () => {
      const file = new File(['test'], 'test.png', { type: 'image/png' });
      expect(() => validateImage(file)).not.toThrow();
    });

    it('should accept valid WEBP image', () => {
      const file = new File(['test'], 'test.webp', { type: 'image/webp' });
      expect(() => validateImage(file)).not.toThrow();
    });

    it('should reject unsupported format', () => {
      const file = new File(['test'], 'test.gif', { type: 'image/gif' });
      expect(() => validateImage(file)).toThrow('Unsupported image format');
    });

    it('should reject file larger than max size', () => {
      const largeData = new Array(6 * 1024 * 1024).fill('a').join('');
      const file = new File([largeData], 'large.jpg', { type: 'image/jpeg' });
      expect(() => validateImage(file)).toThrow('Image too large');
    });

    it('should accept file within size limit', () => {
      const smallData = new Array(1024).fill('a').join('');
      const file = new File([smallData], 'small.jpg', { type: 'image/jpeg' });
      expect(() => validateImage(file)).not.toThrow();
    });

    it('should use custom max size', () => {
      const data = new Array(2 * 1024 * 1024).fill('a').join('');
      const file = new File([data], 'test.jpg', { type: 'image/jpeg' });
      
      // Should fail with 1MB limit
      expect(() => validateImage(file, 1024 * 1024)).toThrow('Image too large');
      
      // Should pass with 3MB limit
      expect(() => validateImage(file, 3 * 1024 * 1024)).not.toThrow();
    });
  });

  describe('extractBase64Data', () => {
    it('should extract base64 data from data URL', () => {
      const dataUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';
      const result = extractBase64Data(dataUrl);
      expect(result).toBe('/9j/4AAQSkZJRg==');
    });

    it('should handle PNG data URL', () => {
      const dataUrl = 'data:image/png;base64,iVBORw0KGgo=';
      const result = extractBase64Data(dataUrl);
      expect(result).toBe('iVBORw0KGgo=');
    });

    it('should return original string if not a data URL', () => {
      const base64 = '/9j/4AAQSkZJRg==';
      const result = extractBase64Data(base64);
      expect(result).toBe(base64);
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(500)).toBe('500 Bytes');
    });

    it('should format kilobytes', () => {
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
    });

    it('should format megabytes', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formatFileSize(2.5 * 1024 * 1024)).toBe('2.5 MB');
    });

    it('should format gigabytes', () => {
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
      expect(formatFileSize(1.75 * 1024 * 1024 * 1024)).toBe('1.75 GB');
    });
  });

  describe('compressImage', () => {
    let mockCanvas: any;
    let mockContext: any;
    let mockImage: any;

    beforeEach(() => {
      // Mock canvas and context
      mockContext = {
        drawImage: vi.fn(),
      };

      mockCanvas = {
        width: 0,
        height: 0,
        getContext: vi.fn(() => mockContext),
        toDataURL: vi.fn(() => 'data:image/jpeg;base64,/9j/4AAQSkZJRg=='),
      };

      // Mock document.createElement
      vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
        if (tagName === 'canvas') {
          return mockCanvas as any;
        }
        return document.createElement(tagName);
      });

      // Mock Image
      mockImage = {
        width: 2048,
        height: 1536,
        onload: null as any,
        onerror: null as any,
        src: '',
      };

      global.Image = vi.fn(() => mockImage) as any;

      // Mock FileReader
      const mockFileReader = {
        onload: null as any,
        onerror: null as any,
        readAsDataURL: vi.fn(function (this: any) {
          setTimeout(() => {
            if (this.onload) {
              this.onload({ target: { result: 'data:image/jpeg;base64,test' } });
              setTimeout(() => {
                if (mockImage.onload) {
                  mockImage.onload();
                }
              }, 0);
            }
          }, 0);
        }),
      };

      global.FileReader = vi.fn(() => mockFileReader) as any;
    });

    it('should compress image with default options', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 1024 * 1024 });

      const result = await compressImage(file);

      expect(result).toHaveProperty('base64');
      expect(result).toHaveProperty('originalSize');
      expect(result).toHaveProperty('compressedSize');
      expect(result).toHaveProperty('compressionRatio');
      expect(result).toHaveProperty('width');
      expect(result).toHaveProperty('height');
      expect(result).toHaveProperty('format');
      expect(result.format).toBe('image/jpeg');
    });

    it('should scale down large images', async () => {
      mockImage.width = 2048;
      mockImage.height = 1536;

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      await compressImage(file);

      // Should scale to fit within 1024x1024
      expect(mockCanvas.width).toBeLessThanOrEqual(1024);
      expect(mockCanvas.height).toBeLessThanOrEqual(1024);
    });

    it('should maintain aspect ratio when scaling', async () => {
      mockImage.width = 2000;
      mockImage.height = 1000;

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      await compressImage(file);

      // Aspect ratio should be maintained (2:1)
      const aspectRatio = mockCanvas.width / mockCanvas.height;
      expect(aspectRatio).toBeCloseTo(2, 1);
    });

    it('should not upscale small images', async () => {
      mockImage.width = 500;
      mockImage.height = 400;

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      await compressImage(file);

      // Should keep original dimensions
      expect(mockCanvas.width).toBe(500);
      expect(mockCanvas.height).toBe(400);
    });

    it('should use custom compression options', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      await compressImage(file, {
        maxWidth: 512,
        maxHeight: 512,
        quality: 0.6,
      });

      expect(mockCanvas.toDataURL).toHaveBeenCalledWith('image/jpeg', 0.6);
    });

    it('should handle PNG format', async () => {
      const file = new File(['test'], 'test.png', { type: 'image/png' });
      mockCanvas.toDataURL.mockReturnValue('data:image/png;base64,iVBORw0KGgo=');

      const result = await compressImage(file);

      expect(result.format).toBe('image/png');
      expect(mockCanvas.toDataURL).toHaveBeenCalledWith('image/png', 0.8);
    });

    it('should handle WEBP format', async () => {
      const file = new File(['test'], 'test.webp', { type: 'image/webp' });
      mockCanvas.toDataURL.mockReturnValue('data:image/webp;base64,UklGRg==');

      const result = await compressImage(file);

      expect(result.format).toBe('image/webp');
      expect(mockCanvas.toDataURL).toHaveBeenCalledWith('image/webp', 0.8);
    });

    it('should throw error for invalid file', async () => {
      const file = new File(['test'], 'test.gif', { type: 'image/gif' });

      await expect(compressImage(file)).rejects.toThrow('Unsupported image format');
    });

    it('should throw error if canvas context fails', async () => {
      mockCanvas.getContext.mockReturnValue(null);

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      await expect(compressImage(file)).rejects.toThrow('Failed to get canvas context');
    });
  });
});
