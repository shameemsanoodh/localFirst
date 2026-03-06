import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { response } from '../shared/response.js';

const bedrockClient = new BedrockRuntimeClient({ 
  region: process.env.BEDROCK_REGION || process.env.AWS_REGION || 'ap-south-1' 
});

// Use Claude 3.5 Sonnet with vision for image analysis
const VISION_MODEL = 'apac.anthropic.claude-3-5-sonnet-20241022-v2:0';
const TEMPERATURE = 0.1; // Low randomness for consistent results
const MAX_TOKENS = 1000;

// Rate limiting (simple in-memory store - use Redis/DynamoDB in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per minute per user

// Supported categories matching the app's category system
const CATEGORIES = [
  'Groceries',
  'Pharmacy',
  'Electronics',
  'Mobile',
  'Hardware',
  'Automobile',
  'Home Essentials',
  'Pet Supplies',
  'Clothing',
  'Fitness',
  'Books',
  'Cafe & Restaurant'
];

interface AnalyzeImageRequest {
  image: string; // base64 encoded image
  prompt?: string;
}

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

/**
 * Product Detection Prompt for Claude Vision
 * Analyzes images to identify products and categories for local shop search
 */
const DEFAULT_PRODUCT_DETECTION_PROMPT = `You are a product identification expert for an Indian hyperlocal marketplace app.

Analyze this image and identify products that a user might want to buy from local shops.

Available Categories: ${CATEGORIES.join(', ')}

Return a JSON object with this EXACT structure:
{
  "products": [
    {
      "name": "specific product name",
      "category": "one of the available categories",
      "confidence": 0.95,
      "description": "brief description"
    }
  ],
  "primaryProduct": {
    "name": "main product name",
    "category": "category"
  },
  "searchQuery": "simple search term for shops"
}

Guidelines:
1. Identify ALL visible products, but mark the most prominent as primaryProduct
2. Use specific product names (e.g., "Fresh Tomatoes" not just "vegetables")
3. Choose the MOST APPROPRIATE category from the available list
4. Confidence should be 0-1 (0.8+ for clear products, 0.5-0.8 for unclear)
5. searchQuery should be simple and shop-friendly (e.g., "tomatoes", "headache medicine")
6. If multiple products, list up to 5 most prominent ones
7. For food items, default to "Groceries" unless it's clearly from a "Cafe & Restaurant"
8. For medicines/health items, use "Pharmacy"
9. For phone accessories, use "Mobile" not "Electronics"

Examples:

Image of tomatoes:
{
  "products": [
    {
      "name": "Fresh Red Tomatoes",
      "category": "Groceries",
      "confidence": 0.95,
      "description": "Ripe red tomatoes"
    }
  ],
  "primaryProduct": {
    "name": "Fresh Red Tomatoes",
    "category": "Groceries"
  },
  "searchQuery": "tomatoes"
}

Image of medicine bottle:
{
  "products": [
    {
      "name": "Pain Relief Medicine",
      "category": "Pharmacy",
      "confidence": 0.90,
      "description": "Painkiller tablets"
    }
  ],
  "primaryProduct": {
    "name": "Pain Relief Medicine",
    "category": "Pharmacy"
  },
  "searchQuery": "pain relief medicine"
}

Image of phone case:
{
  "products": [
    {
      "name": "Mobile Phone Case",
      "category": "Mobile",
      "confidence": 0.92,
      "description": "Protective phone case"
    }
  ],
  "primaryProduct": {
    "name": "Mobile Phone Case",
    "category": "Mobile"
  },
  "searchQuery": "phone case"
}

Return ONLY valid JSON. No explanation or markdown.`;

/**
 * Check rate limit for a user
 */
function checkRateLimit(userId: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const userLimit = rateLimitStore.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    // Reset or create new limit
    rateLimitStore.set(userId, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    });
    return { allowed: true };
  }

  if (userLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
    const retryAfter = Math.ceil((userLimit.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }

  userLimit.count++;
  return { allowed: true };
}

/**
 * Validate image data
 */
function validateImageData(image: string): { valid: boolean; error?: string } {
  if (!image || typeof image !== 'string') {
    return { valid: false, error: 'Image data is required' };
  }

  if (image.trim().length === 0) {
    return { valid: false, error: 'Image data cannot be empty' };
  }

  // Remove data URL prefix if present
  const cleanImage = image.replace(/^data:image\/\w+;base64,/, '');
  
  // Check if it's valid base64
  const base64Regex = /^[A-Za-z0-9+/]+={0,2}$/;
  if (!base64Regex.test(cleanImage)) {
    return { valid: false, error: 'Invalid base64 image data' };
  }

  // Check size (approximate - base64 is ~33% larger than binary)
  const sizeInBytes = (cleanImage.length * 3) / 4;
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  if (sizeInBytes > maxSize) {
    return { valid: false, error: 'Image too large (max 5MB)' };
  }

  if (sizeInBytes < 100) {
    return { valid: false, error: 'Image too small or corrupted' };
  }

  return { valid: true };
}

/**
 * Parse AI response and extract structured product information
 */
function parseProductInfo(aiResponse: string): ImageAnalysisResult {
  try {
    // Extract JSON from response (handle markdown code blocks)
    let jsonString = aiResponse.trim();
    
    if (jsonString.includes('```json')) {
      jsonString = jsonString.split('```json')[1].split('```')[0].trim();
    } else if (jsonString.includes('```')) {
      jsonString = jsonString.split('```')[1].split('```')[0].trim();
    }
    
    const parsed = JSON.parse(jsonString);
    
    // Validate structure
    if (!parsed.products || !Array.isArray(parsed.products)) {
      throw new Error('Invalid response structure: missing products array');
    }
    
    if (!parsed.primaryProduct || !parsed.primaryProduct.name || !parsed.primaryProduct.category) {
      throw new Error('Invalid response structure: missing primaryProduct');
    }
    
    // Validate categories
    parsed.products.forEach((product: ProductInfo) => {
      if (!CATEGORIES.includes(product.category)) {
        console.warn(`Invalid category "${product.category}", defaulting to Groceries`);
        product.category = 'Groceries';
      }
    });
    
    if (!CATEGORIES.includes(parsed.primaryProduct.category)) {
      console.warn(`Invalid primary category "${parsed.primaryProduct.category}", defaulting to Groceries`);
      parsed.primaryProduct.category = 'Groceries';
    }
    
    return {
      products: parsed.products,
      primaryProduct: parsed.primaryProduct,
      searchQuery: parsed.searchQuery || parsed.primaryProduct.name.toLowerCase(),
      processingTime: 0 // Will be set by caller
    };
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    console.error('Raw response:', aiResponse);
    
    // Fallback: create basic structure from text
    return {
      products: [{
        name: 'Unknown Product',
        category: 'Groceries',
        confidence: 0.5,
        description: 'Could not identify product clearly'
      }],
      primaryProduct: {
        name: 'Unknown Product',
        category: 'Groceries'
      },
      searchQuery: 'product',
      processingTime: 0
    };
  }
}

/**
 * Lambda handler for image analysis
 * POST /ai/analyze-image
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,X-User-Id',
        'Access-Control-Allow-Methods': 'POST,OPTIONS',
      },
      body: '',
    };
  }

  const startTime = Date.now();
  
  try {
    // Get user ID from authorizer context for rate limiting
    const userId = event.requestContext?.authorizer?.claims?.sub || 
                   event.requestContext?.authorizer?.userId || 
                   event.headers['x-user-id'] || 
                   'anonymous';

    // Check rate limit
    const rateLimitCheck = checkRateLimit(userId);
    if (!rateLimitCheck.allowed) {
      console.warn(`Rate limit exceeded for user: ${userId}`);
      return {
        statusCode: 429,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,X-User-Id',
          'Access-Control-Allow-Methods': 'POST,OPTIONS',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: `Too many requests. Please try again in ${rateLimitCheck.retryAfter} seconds.`,
          },
          meta: {
            timestamp: new Date().toISOString(),
            retryAfter: rateLimitCheck.retryAfter,
          },
        }),
      };
    }

    // Validate request body exists
    if (!event.body) {
      return response.error('Request body is required', 400, 'MISSING_BODY');
    }

    // Parse request body with error handling
    let body: AnalyzeImageRequest;
    try {
      body = JSON.parse(event.body);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return response.error('Invalid JSON in request body', 400, 'INVALID_JSON');
    }

    const { image, prompt } = body;

    // Validate image data
    const validation = validateImageData(image);
    if (!validation.valid) {
      console.warn('Image validation failed:', validation.error);
      return response.error(validation.error || 'Invalid image', 400, 'INVALID_INPUT');
    }

    // Clean image data (remove data URL prefix if present)
    const cleanImage = image.replace(/^data:image\/\w+;base64,/, '');
    
    console.log(`Analyzing image for user ${userId} (size: ${cleanImage.length} chars)`);

    // Prepare Bedrock request with vision
    const bedrockPayload = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: MAX_TOKENS,
      temperature: TEMPERATURE,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg', // Claude accepts jpeg, png, gif, webp
                data: cleanImage
              }
            },
            {
              type: 'text',
              text: prompt || DEFAULT_PRODUCT_DETECTION_PROMPT
            }
          ]
        }
      ]
    };

    // Call Bedrock Claude 3.5 Sonnet with vision
    const command = new InvokeModelCommand({
      modelId: VISION_MODEL,
      body: JSON.stringify(bedrockPayload)
    });

    let bedrockResponse;
    try {
      bedrockResponse = await bedrockClient.send(command);
    } catch (bedrockError: any) {
      console.error('Bedrock API error:', bedrockError);
      
      // Handle specific Bedrock errors
      if (bedrockError.name === 'ValidationException') {
        return response.error('Invalid image format or data', 400, 'INVALID_IMAGE');
      } else if (bedrockError.name === 'ThrottlingException') {
        return response.error('AI service is busy. Please try again in a moment.', 429, 'RATE_LIMIT_EXCEEDED');
      } else if (bedrockError.name === 'AccessDeniedException') {
        console.error('Bedrock access denied - check IAM permissions');
        return response.error('Service temporarily unavailable', 503, 'SERVICE_ERROR');
      } else if (bedrockError.name === 'ModelNotReadyException') {
        return response.error('AI model is loading. Please try again in a moment.', 503, 'SERVICE_ERROR');
      } else {
        throw bedrockError; // Re-throw for general error handler
      }
    }

    // Parse Bedrock response
    let responseBody;
    try {
      responseBody = JSON.parse(new TextDecoder().decode(bedrockResponse.body));
    } catch (decodeError) {
      console.error('Failed to decode Bedrock response:', decodeError);
      return response.error('Failed to process AI response', 500, 'AI_RESPONSE_ERROR');
    }
    
    // Validate response structure
    if (!responseBody.content || !Array.isArray(responseBody.content) || responseBody.content.length === 0) {
      console.error('Invalid Bedrock response structure:', responseBody);
      return response.error('Invalid AI response format', 500, 'AI_RESPONSE_ERROR');
    }

    // Extract AI response text
    const aiResponseText = responseBody.content[0].text;
    if (!aiResponseText) {
      console.error('Empty AI response text');
      return response.error('AI returned empty response', 500, 'AI_RESPONSE_ERROR');
    }

    console.log('AI Response:', aiResponseText);
    
    // Parse structured product information
    const analysis = parseProductInfo(aiResponseText);
    analysis.processingTime = (Date.now() - startTime) / 1000; // Convert to seconds
    
    console.log(`Image analysis complete: ${analysis.primaryProduct.name} (${analysis.primaryProduct.category})`);
    console.log(`Processing time: ${analysis.processingTime}s`);

    return response.success(analysis, 200);

  } catch (error: any) {
    console.error('Image analysis error:', error);
    
    // Determine error type and message
    let errorMessage = 'Failed to analyze image';
    let errorCode = 'AI_ANALYSIS_ERROR';
    let statusCode = 500;
    
    if (error.name === 'ValidationException') {
      errorMessage = 'Invalid image format or data';
      errorCode = 'INVALID_IMAGE';
      statusCode = 400;
    } else if (error.name === 'ThrottlingException') {
      errorMessage = 'Too many requests. Please try again later.';
      errorCode = 'RATE_LIMIT_EXCEEDED';
      statusCode = 429;
    } else if (error.name === 'AccessDeniedException') {
      errorMessage = 'Service temporarily unavailable';
      errorCode = 'SERVICE_ERROR';
      statusCode = 503;
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      errorMessage = 'Network error. Please check your connection.';
      errorCode = 'NETWORK_ERROR';
      statusCode = 503;
    }
    
    return response.error(errorMessage, statusCode, errorCode);
  }
};
