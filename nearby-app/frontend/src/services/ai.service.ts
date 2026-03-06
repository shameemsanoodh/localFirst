import api from './api';
import { compressImage as compressImageUtil, extractBase64Data } from '../utils/imageCompression';

// Backend response types matching analyzeImage.ts
interface ProductInfo {
  name: string;
  category: string;
  confidence: number;
  description: string;
}

interface ImageAnalysisResult {
  products: ProductInfo[];
  primaryProduct: {
    name: string;
    category: string;
  };
  searchQuery: string;
  processingTime: number;
}

interface SmartBroadcastRequest {
  image: string; // base64
  additionalNotes?: string;
  latitude: number;
  longitude: number;
  radius?: number;
}

interface SmartBroadcastResponse {
  broadcastId: string;
  broadcast: any;
  aiAnalysis: any;
  nearbyMerchants: number;
  message: string;
}

interface CategoryDetectionResult {
  category: string;
  confidence: number;
  alternativeCategories?: string[];
  intent?: string;
  product?: string;
  brand?: string;
  urgency?: string;
  quantity?: string;
  context_used?: string;
  broadcast_message?: string;
}

interface LocalDemandEntry {
  query: string;
  detected_category: string;
  locality: string;
  coordinates: { lat: number; lng: number };
  timestamp: Date;
  user_id: string;
}

// Export types for use in components
export type { ImageAnalysisResult, ProductInfo, CategoryDetectionResult };

export const aiService = {
  /**
   * Detect product category from search query using AI
   */
  async detectCategory(query: string): Promise<CategoryDetectionResult> {
    try {
      const response = await api.post<{ success: boolean; data: CategoryDetectionResult }>(
        '/ai/detect-category',
        { query }
      );
      return response.data.data;
    } catch (error) {
      // Fallback to local classification if API fails
      return this.localCategoryDetection(query);
    }
  },

  /**
   * Local fallback category detection using keyword matching
   */
  localCategoryDetection(query: string): CategoryDetectionResult {
    const lowerQuery = query.toLowerCase();

    const categoryKeywords: Record<string, string[]> = {
      'Pharmacy': ['medicine', 'drug', 'tablet', 'capsule', 'syrup', 'pharmacy', 'medical', 'health', 'prescription', 'vitamin'],
      'Electronics': ['tv', 'television', 'laptop', 'computer', 'camera', 'speaker', 'headphone', 'electronic', 'appliance', 'ac', 'fridge', 'washing'],
      'Mobile': ['phone', 'mobile', 'smartphone', 'charger', 'earphone', 'case', 'screen guard', 'sim'],
      'Automobile': ['car', 'bike', 'vehicle', 'auto', 'tire', 'oil', 'battery', 'spare', 'mechanic', 'service'],
      'Hardware': ['hardware', 'tool', 'nail', 'screw', 'hammer', 'drill', 'paint', 'cement', 'plumbing', 'electrical'],
      'Home Essentials': ['furniture', 'bed', 'sofa', 'table', 'chair', 'curtain', 'utensil', 'kitchen', 'home', 'decor'],
      'Pet Supplies': ['pet', 'dog', 'cat', 'bird', 'fish', 'food', 'toy', 'collar', 'leash', 'cage'],
      'Cafe & Restaurant': ['food', 'restaurant', 'cafe', 'pizza', 'burger', 'coffee', 'tea', 'snacks', 'eat'],
      'Groceries': ['grocery', 'vegetable', 'fruit', 'rice', 'dal', 'milk', 'bread', 'egg', 'snack', 'drink', 'beverage']
    };

    let bestMatch = 'General';
    let maxMatches = 0;

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      const matches = keywords.filter(keyword => lowerQuery.includes(keyword)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        bestMatch = category;
      }
    }

    return {
      category: bestMatch,
      confidence: maxMatches > 0 ? Math.min(maxMatches * 0.3, 0.95) : 0.3,
      alternativeCategories: maxMatches === 0 ? Object.keys(categoryKeywords) : undefined
    };
  },

  /**
   * Save search query to local demand database
   */
  async saveLocalDemand(data: LocalDemandEntry): Promise<void> {
    try {
      await api.post('/local-demand', data);
    } catch (error) {
      console.error('Failed to save local demand:', error);
      // Don't throw - this is a background operation
    }
  },
  /**
   * Analyze an image using AI to detect products
   * Compresses the image before sending to reduce bandwidth
   * 
   * @param file - Image file to analyze
   * @param prompt - Optional custom prompt for AI analysis
   * @returns Product information detected in the image
   * @throws Error if image validation fails or API request fails
   */
  async analyzeImage(file: File, prompt?: string): Promise<ImageAnalysisResult> {
    try {
      // Validate file before processing
      if (!file) {
        throw new Error('No file provided');
      }

      if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image');
      }

      // Compress image before upload
      let compressionResult;
      try {
        compressionResult = await compressImageUtil(file, {
          maxWidth: 1024,
          maxHeight: 1024,
          quality: 0.8,
          maxSizeBytes: 5 * 1024 * 1024, // 5MB
        });
      } catch (compressionError: any) {
        console.error('Image compression error:', compressionError);

        if (compressionError.message?.includes('Unsupported image format')) {
          throw new Error('Unsupported image format. Please use JPG, PNG, or WEBP.');
        } else if (compressionError.message?.includes('Image too large')) {
          throw new Error('Image too large. Please select an image smaller than 5MB.');
        } else {
          throw new Error('Failed to process image. Please try a different image.');
        }
      }

      // Extract base64 data without data URL prefix
      const base64Data = extractBase64Data(compressionResult.base64);

      console.log(`Image compressed: ${compressionResult.originalSize} -> ${compressionResult.compressedSize} bytes (${(compressionResult.compressionRatio * 100).toFixed(1)}%)`);

      // Send to backend for AI analysis with timeout
      let response;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        response = await api.post<{ success: boolean; data: ImageAnalysisResult }>(
          '/ai/analyze-image',
          {
            image: base64Data,
            prompt,
          },
          {
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);
      } catch (apiError: any) {
        console.error('API request error:', apiError);

        // Handle network errors
        if (apiError.name === 'AbortError' || apiError.code === 'ECONNABORTED') {
          throw new Error('Request timed out. Please try again.');
        }

        if (!apiError.response) {
          throw new Error('Network error. Please check your connection.');
        }

        // Handle API error responses
        const status = apiError.response?.status;
        const errorData = apiError.response?.data;

        if (status === 400) {
          if (errorData?.code === 'INVALID_IMAGE') {
            throw new Error('Invalid image format. Please use JPG, PNG, or WEBP.');
          } else if (errorData?.code === 'INVALID_INPUT') {
            throw new Error(errorData?.message || 'Invalid image data.');
          } else {
            throw new Error('Invalid request. Please try again.');
          }
        } else if (status === 429) {
          const retryAfter = errorData?.retryAfter || 60;
          throw new Error(`Too many requests. Please try again in ${retryAfter} seconds.`);
        } else if (status === 503) {
          throw new Error('AI service temporarily unavailable. Please try again later.');
        } else if (status >= 500) {
          throw new Error('Server error. Please try again later.');
        } else {
          throw new Error(errorData?.message || 'Failed to analyze image.');
        }
      }

      // Validate response
      if (!response.data || !response.data.success) {
        console.error('Invalid response structure:', response.data);
        throw new Error('Invalid response from server');
      }

      if (!response.data.data) {
        console.error('No data in response:', response.data);
        throw new Error('No analysis data received');
      }

      const analysisData = response.data.data;
      console.log('Image analysis result:', analysisData);

      // Validate analysis data structure
      if (!analysisData.primaryProduct) {
        console.error('Missing primaryProduct in analysis:', analysisData);
        throw new Error('Invalid analysis result: missing product information');
      }

      if (!analysisData.primaryProduct.name || !analysisData.primaryProduct.category) {
        console.error('Incomplete primaryProduct data:', analysisData.primaryProduct);
        throw new Error('Could not identify product clearly. Please try a different image.');
      }

      return analysisData;
    } catch (error: any) {
      console.error('Image analysis error:', error);

      // Re-throw with user-friendly message if not already handled
      if (error.message) {
        throw error;
      } else {
        throw new Error('Failed to analyze image. Please try again.');
      }
    }
  },

  /**
   * Create a smart broadcast from an image
   * AI will analyze the image and create a broadcast automatically
   */
  async createSmartBroadcast(request: SmartBroadcastRequest): Promise<SmartBroadcastResponse> {
    const response = await api.post<{ success: boolean; data: SmartBroadcastResponse }>(
      '/ai/smart-broadcast',
      request
    );
    return response.data.data;
  },

  /**
   * Convert a file to base64 (with data URL prefix)
   * For direct base64 data without prefix, use compressImage from utils
   */
  async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },
};
