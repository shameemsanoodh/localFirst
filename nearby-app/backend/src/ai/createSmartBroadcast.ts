import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { db, Tables } from '../shared/db.js';
import { response } from '../shared/response.js';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

const bedrockClient = new BedrockRuntimeClient({ 
  region: process.env.BEDROCK_REGION || process.env.AWS_REGION || 'ap-south-1' 
});

interface SmartBroadcastRequest {
  image: string; // base64 encoded
  additionalNotes?: string;
  latitude: number;
  longitude: number;
  radius?: number; // in km
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Get user ID from authorizer
    const userId = event.requestContext.authorizer?.userId;
    if (!userId) {
      return response.error('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const body: SmartBroadcastRequest = JSON.parse(event.body || '{}');
    const { image, additionalNotes, latitude, longitude, radius = 5 } = body;

    if (!image || !latitude || !longitude) {
      return response.error('Image and location are required', 400, 'INVALID_INPUT');
    }

    // Step 1: Analyze the image with AI
    const analysisPrompt = `Analyze this image and identify what products the user is looking for.
    Provide a detailed description that would help local merchants understand what the customer needs.
    Include:
    - What items are visible
    - Estimated quantities if applicable
    - Any specific brands or types
    - Suggested product categories
    
    Format as JSON: { "items": ["item1", "item2"], "description": "detailed description", "categories": ["category1"] }`;

    const bedrockPayload = {
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/jpeg",
                data: image.replace(/^data:image\/\w+;base64,/, ''),
              },
            },
            {
              type: "text",
              text: analysisPrompt,
            },
          ],
        },
      ],
    };

    const command = new InvokeModelCommand({
      modelId: process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-sonnet-20240229-v1:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(bedrockPayload),
    });

    const bedrockResponse = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(bedrockResponse.body));
    const aiResponse = responseBody.content[0].text;

    // Parse AI response
    let aiAnalysis: any;
    try {
      aiAnalysis = JSON.parse(aiResponse);
    } catch {
      aiAnalysis = {
        items: ['Product from image'],
        description: aiResponse,
        categories: ['groceries'],
      };
    }

    // Step 2: Create broadcast with AI-generated description
    const broadcastId = uuidv4();
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 minutes

    const broadcast = {
      broadcastId,
      userId,
      title: `Looking for: ${aiAnalysis.items.slice(0, 3).join(', ')}`,
      description: additionalNotes 
        ? `${aiAnalysis.description}\n\nAdditional notes: ${additionalNotes}`
        : aiAnalysis.description,
      items: aiAnalysis.items,
      categories: aiAnalysis.categories,
      imageUrl: image, // Store the image (in production, upload to S3 first)
      latitude,
      longitude,
      radius,
      status: 'active',
      responseCount: 0,
      createdAt: now,
      expiresAt,
      aiGenerated: true,
    };

    await db.put(Tables.BROADCASTS!, broadcast);

    // Step 3: Find nearby merchants in relevant categories
    const merchants = await findNearbyMerchants(latitude, longitude, radius, aiAnalysis.categories);

    return response.success({
      broadcastId,
      broadcast,
      aiAnalysis,
      nearbyMerchants: merchants.length,
      message: `Broadcast created! ${merchants.length} nearby merchants will be notified.`,
    }, 201);

  } catch (error: any) {
    console.error('Smart broadcast error:', error);
    return response.error(
      `Failed to create smart broadcast: ${error.message}`,
      500,
      'SMART_BROADCAST_ERROR'
    );
  }
};

async function findNearbyMerchants(
  lat: number, 
  lng: number, 
  radius: number, 
  categories: string[]
): Promise<any[]> {
  try {
    // Get all merchants (in production, use geospatial index)
    const allMerchants = await db.scan(Tables.MERCHANTS!);
    
    // Filter by distance and category
    const nearbyMerchants = allMerchants.filter((merchant: any) => {
      if (!merchant.latitude || !merchant.longitude) return false;
      
      const distance = calculateDistance(lat, lng, merchant.latitude, merchant.longitude);
      const inRange = distance <= radius;
      const matchesCategory = !categories.length || categories.some(cat => 
        merchant.categories?.includes(cat)
      );
      
      return inRange && matchesCategory;
    });

    return nearbyMerchants;
  } catch (error) {
    console.error('Error finding merchants:', error);
    return [];
  }
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}
