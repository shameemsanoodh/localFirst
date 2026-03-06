/**
 * AI Service Usage Examples
 * 
 * This file demonstrates how to use the updated AI service methods
 * for image analysis with automatic compression and error handling.
 */

import React, { useState } from 'react';
import { aiService, ImageAnalysisResult } from './ai.service';
import { ImageSearchButton } from '@/components/search/ImageSearchButton';

/**
 * Example 1: Basic Image Analysis
 * 
 * The simplest way to analyze an image - just pass the File object.
 * The service handles compression, validation, and API communication.
 */
export const BasicImageAnalysisExample: React.FC = () => {
  const [result, setResult] = useState<ImageAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageSelected = async (_imageData: string, file: File) => {
    setLoading(true);
    setError(null);

    try {
      // Analyze image - compression happens automatically
      const analysis = await aiService.analyzeImage(file);
      
      console.log('Detected product:', analysis.primaryProduct.name);
      console.log('Category:', analysis.primaryProduct.category);
      console.log('Processing time:', analysis.processingTime, 'seconds');
      
      setResult(analysis);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Image analysis failed:', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <ImageSearchButton onImageSelected={handleImageSelected} />
      
      {loading && <p>Analyzing image...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      {result && (
        <div>
          <h3>Detected: {result.primaryProduct.name}</h3>
          <p>Category: {result.primaryProduct.category}</p>
          <p>Search query: {result.searchQuery}</p>
        </div>
      )}
    </div>
  );
};

/**
 * Example 2: Image Analysis with Custom Prompt
 * 
 * You can provide a custom prompt to guide the AI analysis.
 * Useful for specific use cases or to improve accuracy.
 */
export const CustomPromptExample: React.FC = () => {
  const handleImageSelected = async (_imageData: string, file: File) => {
    try {
      const customPrompt = `
        Analyze this image and identify any food items.
        Focus on fresh produce and groceries.
        Return the product name and category.
      `;

      const analysis = await aiService.analyzeImage(file, customPrompt);
      console.log('Analysis with custom prompt:', analysis);
    } catch (err) {
      console.error('Failed:', err);
    }
  };

  return <ImageSearchButton onImageSelected={handleImageSelected} />;
};

/**
 * Example 3: Complete Search Flow with Broadcast
 * 
 * Full integration: analyze image, detect category, create broadcast,
 * and navigate to radar page.
 */
export const CompleteSearchFlowExample: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleImageSearch = async (_imageData: string, file: File) => {
    setIsProcessing(true);

    try {
      // Step 1: Analyze image
      const analysis = await aiService.analyzeImage(file);
      console.log('Image analyzed:', analysis.primaryProduct);

      // Step 2: Use the detected category and search query
      const { category } = analysis.primaryProduct;
      const { searchQuery } = analysis;

      // Step 3: Create broadcast (using existing broadcast service)
      // This would typically be done in the parent component
      console.log('Creating broadcast for:', searchQuery, 'in category:', category);
      
      // Step 4: Navigate to radar page
      // window.location.href = `/broadcast-radar?query=${searchQuery}&category=${category}`;
      
    } catch (err) {
      console.error('Search flow failed:', err);
      alert(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      <ImageSearchButton 
        onImageSelected={handleImageSearch}
        disabled={isProcessing}
      />
      {isProcessing && <p>Processing your search...</p>}
    </div>
  );
};

/**
 * Example 4: Error Handling
 * 
 * The service provides user-friendly error messages for common issues:
 * - Unsupported image format
 * - Image too large
 * - Rate limiting
 * - Service unavailable
 */
export const ErrorHandlingExample: React.FC = () => {
  const [errorType, setErrorType] = useState<string | null>(null);

  const handleImageSelected = async (_imageData: string, file: File) => {
    try {
      await aiService.analyzeImage(file);
      setErrorType(null);
    } catch (err) {
      if (err instanceof Error) {
        // User-friendly error messages
        if (err.message.includes('Unsupported image format')) {
          setErrorType('format');
        } else if (err.message.includes('Image too large')) {
          setErrorType('size');
        } else if (err.message.includes('Too many requests')) {
          setErrorType('rate-limit');
        } else if (err.message.includes('temporarily unavailable')) {
          setErrorType('service');
        } else {
          setErrorType('unknown');
        }
      }
    }
  };

  return (
    <div>
      <ImageSearchButton onImageSelected={handleImageSelected} />
      
      {errorType === 'format' && (
        <p className="text-red-500">
          Please use JPG, PNG, or WEBP format
        </p>
      )}
      {errorType === 'size' && (
        <p className="text-red-500">
          Image must be smaller than 5MB
        </p>
      )}
      {errorType === 'rate-limit' && (
        <p className="text-yellow-500">
          Too many requests. Please wait a moment.
        </p>
      )}
      {errorType === 'service' && (
        <p className="text-yellow-500">
          Service temporarily unavailable. Try again later.
        </p>
      )}
    </div>
  );
};

/**
 * Example 5: Multiple Products Detection
 * 
 * The AI can detect multiple products in a single image.
 * Access all detected products via the products array.
 */
export const MultipleProductsExample: React.FC = () => {
  const [products, setProducts] = useState<ImageAnalysisResult['products']>([]);

  const handleImageSelected = async (_imageData: string, file: File) => {
    try {
      const analysis = await aiService.analyzeImage(file);
      
      // Access all detected products
      setProducts(analysis.products);
      
      console.log('Primary product:', analysis.primaryProduct);
      console.log('All products:', analysis.products);
      
      // Show confidence scores
      analysis.products.forEach(product => {
        console.log(`${product.name}: ${(product.confidence * 100).toFixed(0)}% confidence`);
      });
    } catch (err) {
      console.error('Failed:', err);
    }
  };

  return (
    <div>
      <ImageSearchButton onImageSelected={handleImageSelected} />
      
      {products.length > 0 && (
        <div>
          <h3>Detected Products:</h3>
          <ul>
            {products.map((product, index) => (
              <li key={index}>
                {product.name} - {product.category} 
                ({(product.confidence * 100).toFixed(0)}% confidence)
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

/**
 * Key Features of the Updated AI Service:
 * 
 * 1. Automatic Image Compression
 *    - Reduces image size before upload
 *    - Configurable quality and dimensions
 *    - Logs compression statistics
 * 
 * 2. Validation
 *    - Checks file format (JPG, PNG, WEBP)
 *    - Validates file size (max 5MB)
 *    - Provides clear error messages
 * 
 * 3. Error Handling
 *    - User-friendly error messages
 *    - Handles rate limiting
 *    - Handles service unavailability
 *    - Graceful degradation
 * 
 * 4. Type Safety
 *    - Full TypeScript support
 *    - Exported types for components
 *    - Matches backend response structure
 * 
 * 5. Performance
 *    - Compression reduces bandwidth
 *    - Logs processing time
 *    - Efficient base64 handling
 */
