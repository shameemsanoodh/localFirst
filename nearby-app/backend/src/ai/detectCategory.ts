import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { response } from '../shared/response.js';

const bedrockClient = new BedrockRuntimeClient({ region: process.env.AWS_REGION || 'ap-south-1' });

// Use APAC cross-region inference profiles for Bedrock models
// Different models per layer to optimize cost and performance
const NORMALIZATION_MODEL = 'apac.anthropic.claude-3-haiku-20240307-v1:0'; // Fast + cheap for language normalization
const INTENT_MODEL = 'apac.anthropic.claude-3-5-sonnet-20241022-v2:0'; // Smart + accurate for intent extraction
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
    throw error; // Let the caller (processQuery) handle the fallback
  }
}

/**
 * Simple keyword-based category detection as a fallback when AI fails
 */
function fallbackCategoryDetection(query: string): string {
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

  let bestMatch = 'Groceries'; // Default to Groceries if no other keywords match
  let maxMatches = 0;

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    const matches = keywords.filter(keyword => lowerQuery.includes(keyword)).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      bestMatch = category;
    }
  }

  return bestMatch;
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

  try {
    // Layer 2: Extract intent with context
    const intent = await extractIntent(normalizedQuery, userProfile);

    // Add normalized query to result
    intent.normalized_query = normalizedQuery;

    return intent;
  } catch (error) {
    console.error('Intent extraction error:', error);
    // Fallback to basic classification using keyword matching
    const fallbackCategory = fallbackCategoryDetection(normalizedQuery);

    return {
      intent: 'buy',
      category: fallbackCategory,
      product: null,
      brand: null,
      urgency: 'immediate',
      quantity: null,
      context_used: false,
      broadcast_message: `Customer is looking for: ${normalizedQuery}`,
      normalized_query: normalizedQuery
    };
  }
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body: DetectCategoryRequest = JSON.parse(event.body || '{}');
    const { query, userProfile } = body;

    if (!query || query.trim().length === 0) {
      return response.error('Query is required', 400, 'INVALID_INPUT');
    }

    console.log(`Processing query: "${query}"`);

    // Run 3-layer AI pipeline
    const result = await processQuery(query, userProfile);

    console.log(`Final result:`, result);

    return response.success(result, 200);
  } catch (error) {
    console.error('Detect category error:', error);
    return response.error('Failed to detect category', 500, 'INTERNAL_ERROR');
  }
};
