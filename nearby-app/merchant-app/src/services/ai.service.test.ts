import { describe, it, expect, vi, beforeEach } from 'vitest';
import { aiService } from './ai.service';
import api from './api';
import * as imageCompression from '../utils/imageCompression';

// Mock dependencies
vi.mock('./api');
vi.mock('../utils/imageCompression');

describe('aiService.analyzeImage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should compress image and call API with base64 data', async () => {
    // Arrange
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const mockCompressionResult = {
      base64: 'data:image/jpeg;base64,mockBase64Data',
      originalSize: 1000000,
      compressedSize: 500000,
      compressionRatio: 0.5,
      width: 800,
      height: 600,
      format: 'image/jpeg',
    };
    const mockApiResponse = {
      data: {
        success: true,
        data: {
          products: [
            {
              name: 'Fresh Tomatoes',
              category: 'Groceries',
              confidence: 0.95,
              description: 'Red ripe tomatoes',
            },
          ],
          primaryProduct: {
            name: 'Fresh Tomatoes',
            category: 'Groceries',
          },
          searchQuery: 'tomatoes',
          processingTime: 2.3,
        },
      },
    };

    vi.mocked(imageCompression.compressImage).mockResolvedValue(mockCompressionResult);
    vi.mocked(imageCompression.extractBase64Data).mockReturnValue('mockBase64Data');
    vi.mocked(api.post).mockResolvedValue(mockApiResponse);

    // Act
    const result = await aiService.analyzeImage(mockFile);

    // Assert
    expect(imageCompression.compressImage).toHaveBeenCalledWith(mockFile, {
      maxWidth: 1024,
      maxHeight: 1024,
      quality: 0.8,
      maxSizeBytes: 5 * 1024 * 1024,
    });
    expect(imageCompression.extractBase64Data).toHaveBeenCalledWith(mockCompressionResult.base64);
    expect(api.post).toHaveBeenCalledWith('/ai/analyze-image', {
      image: 'mockBase64Data',
      prompt: undefined,
    });
    expect(result).toEqual(mockApiResponse.data.data);
  });

  it('should pass custom prompt to API', async () => {
    // Arrange
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const customPrompt = 'Identify this product';
    const mockCompressionResult = {
      base64: 'data:image/jpeg;base64,mockBase64Data',
      originalSize: 1000000,
      compressedSize: 500000,
      compressionRatio: 0.5,
      width: 800,
      height: 600,
      format: 'image/jpeg',
    };
    const mockApiResponse = {
      data: {
        success: true,
        data: {
          products: [],
          primaryProduct: { name: 'Product', category: 'Groceries' },
          searchQuery: 'product',
          processingTime: 1.5,
        },
      },
    };

    vi.mocked(imageCompression.compressImage).mockResolvedValue(mockCompressionResult);
    vi.mocked(imageCompression.extractBase64Data).mockReturnValue('mockBase64Data');
    vi.mocked(api.post).mockResolvedValue(mockApiResponse);

    // Act
    await aiService.analyzeImage(mockFile, customPrompt);

    // Assert
    expect(api.post).toHaveBeenCalledWith('/ai/analyze-image', {
      image: 'mockBase64Data',
      prompt: customPrompt,
    });
  });

  it('should throw user-friendly error for unsupported format', async () => {
    // Arrange
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    vi.mocked(imageCompression.compressImage).mockRejectedValue(
      new Error('Unsupported image format: image/bmp')
    );

    // Act & Assert
    await expect(aiService.analyzeImage(mockFile)).rejects.toThrow(
      'Unsupported image format. Please use JPG, PNG, or WEBP.'
    );
  });

  it('should throw user-friendly error for large image', async () => {
    // Arrange
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    vi.mocked(imageCompression.compressImage).mockRejectedValue(
      new Error('Image too large: 10.0MB. Maximum size is 5.0MB.')
    );

    // Act & Assert
    await expect(aiService.analyzeImage(mockFile)).rejects.toThrow(
      'Image too large. Please select an image smaller than 5MB.'
    );
  });

  it('should throw user-friendly error for rate limiting', async () => {
    // Arrange
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const mockCompressionResult = {
      base64: 'data:image/jpeg;base64,mockBase64Data',
      originalSize: 1000000,
      compressedSize: 500000,
      compressionRatio: 0.5,
      width: 800,
      height: 600,
      format: 'image/jpeg',
    };

    vi.mocked(imageCompression.compressImage).mockResolvedValue(mockCompressionResult);
    vi.mocked(imageCompression.extractBase64Data).mockReturnValue('mockBase64Data');
    vi.mocked(api.post).mockRejectedValue({
      response: { status: 429 },
      message: 'Too many requests',
    });

    // Act & Assert
    await expect(aiService.analyzeImage(mockFile)).rejects.toThrow(
      'Too many requests. Please try again in a moment.'
    );
  });

  it('should throw user-friendly error for service unavailable', async () => {
    // Arrange
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const mockCompressionResult = {
      base64: 'data:image/jpeg;base64,mockBase64Data',
      originalSize: 1000000,
      compressedSize: 500000,
      compressionRatio: 0.5,
      width: 800,
      height: 600,
      format: 'image/jpeg',
    };

    vi.mocked(imageCompression.compressImage).mockResolvedValue(mockCompressionResult);
    vi.mocked(imageCompression.extractBase64Data).mockReturnValue('mockBase64Data');
    vi.mocked(api.post).mockRejectedValue({
      response: { status: 503 },
      message: 'Service unavailable',
    });

    // Act & Assert
    await expect(aiService.analyzeImage(mockFile)).rejects.toThrow(
      'AI service temporarily unavailable. Please try again later.'
    );
  });

  it('should throw generic error for unknown failures', async () => {
    // Arrange
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const mockCompressionResult = {
      base64: 'data:image/jpeg;base64,mockBase64Data',
      originalSize: 1000000,
      compressedSize: 500000,
      compressionRatio: 0.5,
      width: 800,
      height: 600,
      format: 'image/jpeg',
    };

    vi.mocked(imageCompression.compressImage).mockResolvedValue(mockCompressionResult);
    vi.mocked(imageCompression.extractBase64Data).mockReturnValue('mockBase64Data');
    vi.mocked(api.post).mockRejectedValue(new Error('Network error'));

    // Act & Assert
    await expect(aiService.analyzeImage(mockFile)).rejects.toThrow(
      'Failed to analyze image. Please try again.'
    );
  });

  it('should log compression statistics', async () => {
    // Arrange
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const mockCompressionResult = {
      base64: 'data:image/jpeg;base64,mockBase64Data',
      originalSize: 1000000,
      compressedSize: 500000,
      compressionRatio: 0.5,
      width: 800,
      height: 600,
      format: 'image/jpeg',
    };
    const mockApiResponse = {
      data: {
        success: true,
        data: {
          products: [],
          primaryProduct: { name: 'Product', category: 'Groceries' },
          searchQuery: 'product',
          processingTime: 1.5,
        },
      },
    };

    vi.mocked(imageCompression.compressImage).mockResolvedValue(mockCompressionResult);
    vi.mocked(imageCompression.extractBase64Data).mockReturnValue('mockBase64Data');
    vi.mocked(api.post).mockResolvedValue(mockApiResponse);

    const consoleSpy = vi.spyOn(console, 'log');

    // Act
    await aiService.analyzeImage(mockFile);

    // Assert
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Image compressed: 1000000 -> 500000 bytes (50.0%)')
    );
  });
});
