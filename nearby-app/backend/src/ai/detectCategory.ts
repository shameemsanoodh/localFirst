import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { response } from '../shared/response.js';

const bedrockClient = new BedrockRuntimeClient({ region: process.env.AWS_REGION || 'ap-south-1' });

// Use subscribed Claude models for best accuracy
// Claude 3.5 Sonnet v2 for intent extraction (excellent accuracy + cost balance)
// Claude 3 Haiku for normalization (fast + cheap)
const NORMALIZATION_MODEL = 'apac.anthropic.claude-3-haiku-20240307-v1:0'; // Fast + cheap for language normalization
const INTENT_MODEL = 'apac.anthropic.claude-3-5-sonnet-20241022-v2:0'; // Excellent accuracy, subscribed via AWS Marketplace
const TEMPERATURE = 0.1; // Low randomness for consistent results
const MAX_TOKENS = 300; // Increased for structured JSON responses

interface DetectCategoryRequest {
  query: string;
  userProfile?: UserProfile;
}

interface UserProfile {
  devices?: {
    phone?: { model: string; brand: string };
  };
  vehicles?: {
    bike?: { model: string; brand: string };
    car?: { model: string; brand: string };
  };
  preferences?: {
    milk?: { brand: string };
    grocery?: { stores: string[] };
  };
}

interface IntentExtractionResult {
  intent: 'buy' | 'find' | 'repair' | 'compare' | 'check_availability';
  category: string;
  product: string | null;
  brand: string | null;
  urgency: 'immediate' | 'today' | 'flexible';
  quantity: string | null;
  context_used: boolean;
  broadcast_message: string;
  normalized_query: string;
}

// Supported categories
const CATEGORIES = [
  'Groceries',
  'Pharmacy',
  'Electronics',
  'Mobile',
  'Hardware',
  'Automobile',
  'Home Essentials',
  'Pet Supplies',
  'Cafe & Restaurant'
];

/**
 * LAYER 1: Language Normalization
 * Handles Tanglish, Hinglish, Kannada-English mixed queries
 */
async function normalizeQuery(rawQuery: string): Promise<string> {
  const prompt = `You are a language normalizer for an Indian hyperlocal app.
The user may type in English, Hindi, Tamil, Kannada, or mixed languages (Tanglish, Hinglish).
Normalize this query to clean English while preserving the meaning and any brand/product names.

Examples:
- "tomato venuma" → "I need tomato"
- "headache ku medicine" → "medicine for headache"
- "mere bike ka oil khatam" → "bike engine oil finished, need new one"
- "nandhi blue packet milk" → "Nandhi blue packet milk"
- "nandhi blue illai" → "Nandhi blue milk not available"
- "wife birthday tomorrow" → "gift for wife's birthday tomorrow"
- "my head is killing me" → "severe headache, need relief"

Query: "${rawQuery}"

Return ONLY the normalized English query. Nothing else.`;

  try {
    const command = new InvokeModelCommand({
      modelId: NORMALIZATION_MODEL,
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: MAX_TOKENS,
        temperature: TEMPERATURE,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    const bedrockResponse = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(bedrockResponse.body));
    const normalized = responseBody.content[0].text.trim();
    
    console.log(`Normalized: "${rawQuery}" → "${normalized}"`);
    return normalized;
  } catch (error) {
    console.error('Normalization error:', error);
    // Fallback to original query
    return rawQuery;
  }
}

/**
 * LAYER 2: Intent + Entity Extraction
 * Extracts structured meaning from the query with user context
 */
async function extractIntent(
  normalizedQuery: string,
  userProfile?: UserProfile
): Promise<IntentExtractionResult> {
  const profileContext = userProfile
    ? `
User Profile Context:
- Phone: ${userProfile.devices?.phone?.model || 'unknown'}
- Bike: ${userProfile.vehicles?.bike?.model || 'none'}
- Car: ${userProfile.vehicles?.car?.model || 'none'}
- Preferred milk brand: ${userProfile.preferences?.milk?.brand || 'any'}
`
    : 'No user profile available.';

  const prompt = `You are an intent extraction AI for an Indian hyperlocal marketplace.

${profileContext}

User query: "${normalizedQuery}"

Extract and return a JSON object with these fields:
{
  "intent": "buy" | "find" | "repair" | "compare" | "check_availability",
  "category": one of [${CATEGORIES.join(', ')}],
  "product": "specific product name or null",
  "brand": "specific brand or null",
  "urgency": "immediate" | "today" | "flexible",
  "quantity": "quantity mentioned or null",
  "context_used": true/false (did you use profile context?),
  "broadcast_message": "Natural language broadcast to send to shops. Be specific and contextual."
}

Examples:

Query: "laptop charger"
{
  "intent": "buy",
  "category": "Electronics",
  "product": "laptop charger",
  "brand": null,
  "urgency": "immediate",
  "quantity": "1",
  "context_used": false,
  "broadcast_message": "Customer needs laptop charger"
}

Query: "mobile phone case"
{
  "intent": "buy",
  "category": "Mobile",
  "product": "phone case",
  "brand": null,
  "urgency": "flexible",
  "quantity": "1",
  "context_used": false,
  "broadcast_message": "Customer looking for mobile phone case"
}

Query: "drill machine"
{
  "intent": "buy",
  "category": "Hardware",
  "product": "drill machine",
  "brand": null,
  "urgency": "flexible",
  "quantity": "1",
  "context_used": false,
  "broadcast_message": "Customer needs drill machine for home/work"
}

Query: "I need something for headache"
{
  "intent": "buy",
  "category": "Pharmacy",
  "product": "headache medicine",
  "brand": null,
  "urgency": "immediate",
  "quantity": null,
  "context_used": false,
  "broadcast_message": "Customer needs headache relief medicine urgently"
}

Query: "severe headache, need relief"
{
  "intent": "buy",
  "category": "Pharmacy",
  "product": "pain relief medicine",
  "brand": null,
  "urgency": "immediate",
  "quantity": null,
  "context_used": false,
  "broadcast_message": "Customer has severe headache and needs immediate pain relief"
}

Query: "bike engine oil finished, need new one" (user has KTM Duke 390)
{
  "intent": "buy",
  "category": "Automobile",
  "product": "engine oil",
  "brand": "KTM compatible",
  "urgency": "immediate",
  "quantity": "1 litre",
  "context_used": true,
  "broadcast_message": "Customer needs engine oil for KTM Duke 390, 1 litre"
}

Query: "gift for wife's birthday tomorrow"
{
  "intent": "buy",
  "category": "Home Essentials",
  "product": "gift items",
  "brand": null,
  "urgency": "today",
  "quantity": null,
  "context_used": false,
  "broadcast_message": "Customer needs gift for wife's birthday tomorrow - flowers, cake, or jewelry"
}

Query: "Nandhi blue packet milk"
{
  "intent": "buy",
  "category": "Groceries",
  "product": "milk",
  "brand": "Nandhi blue packet",
  "urgency": "immediate",
  "quantity": "1 packet",
  "context_used": false,
  "broadcast_message": "Customer needs Nandhi blue packet milk"
}

Query: "Nandhi blue milk not available"
{
  "intent": "check_availability",
  "category": "Groceries",
  "product": "milk",
  "brand": "Nandhi blue",
  "urgency": "immediate",
  "quantity": null,
  "context_used": false,
  "broadcast_message": "Customer looking for Nandhi blue milk - currently unavailable elsewhere"
}

Query: "something cool for my pixel" (user has Pixel 7)
{
  "intent": "buy",
  "category": "Mobile",
  "product": "mobile accessories",
  "brand": "Pixel 7 compatible",
  "urgency": "flexible",
  "quantity": null,
  "context_used": true,
  "broadcast_message": "Customer wants cool accessories for Pixel 7 phone"
}

Return ONLY valid JSON. No explanation.`;

  try {
    const command = new InvokeModelCommand({
      modelId: INTENT_MODEL,
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: MAX_TOKENS,
        temperature: TEMPERATURE,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    const bedrockResponse = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(bedrockResponse.body));
    const jsonText = responseBody.content[0].text.trim();
    
    // Extract JSON from response (handle markdown code blocks)
    let jsonString = jsonText;
    if (jsonText.includes('```json')) {
      jsonString = jsonText.split('```json')[1].split('```')[0].trim();
    } else if (jsonText.includes('```')) {
      jsonString = jsonText.split('```')[1].split('```')[0].trim();
    }
    
    const extracted = JSON.parse(jsonString);
    
    // Validate category
    if (!CATEGORIES.includes(extracted.category)) {
      extracted.category = 'Groceries'; // Fallback
    }
    
    console.log(`Intent extracted:`, extracted);
    return extracted;
  } catch (error) {
    console.error('Intent extraction error:', error);
    console.error('Failed to parse AI response, using smart fallback');
    
    // Smart fallback based on keywords
    const lowerQuery = normalizedQuery.toLowerCase();
    let category = 'Groceries';
    let product = null;
    
    // Electronics keywords
    if (lowerQuery.match(/laptop|computer|tv|television|monitor|speaker|headphone|charger|adapter|cable|usb/)) {
      category = 'Electronics';
      product = 'electronic device';
    }
    // Mobile keywords
    else if (lowerQuery.match(/phone|mobile|smartphone|sim|earphone|earbuds|case|screen guard/)) {
      category = 'Mobile';
      product = 'mobile accessory';
    }
    // Hardware keywords
    else if (lowerQuery.match(/drill|hammer|screw|nail|tool|paint|cement|plumbing|electrical|wire/)) {
      category = 'Hardware';
      product = 'hardware tool';
    }
    // Pharmacy keywords
    else if (lowerQuery.match(/medicine|tablet|capsule|syrup|drug|pain|fever|headache|cough|cold|pharmacy/)) {
      category = 'Pharmacy';
      product = 'medicine';
    }
    // Automobile keywords
    else if (lowerQuery.match(/car|bike|vehicle|oil|tire|battery|spare|engine|brake|clutch/)) {
      category = 'Automobile';
      product = 'auto part';
    }
    // Pet keywords
    else if (lowerQuery.match(/pet|dog|cat|bird|fish|food|toy|collar|leash|cage/)) {
      category = 'Pet Supplies';
      product = 'pet item';
    }
    // Home Essentials keywords
    else if (lowerQuery.match(/furniture|bed|sofa|table|chair|curtain|utensil|kitchen|home|decor/)) {
      category = 'Home Essentials';
      product = 'home item';
    }
    
    return {
      intent: 'buy',
      category,
      product,
      brand: null,
      urgency: 'immediate',
      quantity: null,
      context_used: false,
      broadcast_message: `Customer is looking for: ${normalizedQuery}`,
      normalized_query: normalizedQuery
    };
  }
}

/**
 * LAYER 3: Complete AI Pipeline
 * Combines normalization + intent extraction
 */
async function processQuery(
  rawQuery: string,
  userProfile?: UserProfile
): Promise<IntentExtractionResult> {
  // Layer 1: Normalize mixed language query
  const normalizedQuery = await normalizeQuery(rawQuery);
  
  // Layer 2: Extract intent with context
  const intent = await extractIntent(normalizedQuery, userProfile);
  
  // Add normalized query to result
  intent.normalized_query = normalizedQuery;
  
  return intent;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'POST,OPTIONS',
      },
      body: '',
    };
  }

  try {
    const body: DetectCategoryRequest = JSON.parse(event.body || '{}');
    const { query, userProfile } = body;

    if (!query || query.trim().length === 0) {
      return response.error('Query is required', 400, 'INVALID_INPUT');
    }

    console.log(`Processing query: "${query}"`);
    console.log(`Using models: Normalization=${NORMALIZATION_MODEL}, Intent=${INTENT_MODEL}`);
    
    // Run 3-layer AI pipeline
    const result = await processQuery(query, userProfile);

    console.log(`Final result:`, JSON.stringify(result, null, 2));

    return response.success(result, 200);
  } catch (error: any) {
    console.error('Detect category error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    return response.error('Failed to detect category', 500, 'INTERNAL_ERROR');
  }
};
