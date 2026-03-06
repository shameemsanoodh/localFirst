import AWS from 'aws-sdk';
import { APIGatewayProxyHandler } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { notifications } from '../shared/notifications';
import geohash from 'ngeohash';

const dynamodb = new AWS.DynamoDB.DocumentClient();
const bedrock = new AWS.BedrockRuntime({ region: 'ap-south-1' });

const BROADCASTS_TABLE = process.env.BROADCASTS_TABLE || 'nearby-broadcasts';
const MERCHANTS_TABLE = process.env.MERCHANTS_TABLE || 'nearby-merchants';

interface CreateBroadcastRequest {
  user_id: string;
  query: string;
  location: {
    lat: number;
    lng: number;
  };
  radius_km?: number;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body: CreateBroadcastRequest = JSON.parse(event.body || '{}');

    if (!body.user_id || !body.query || !body.location) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Missing required fields',
          required: ['user_id', 'query', 'location']
        })
      };
    }

    const radius_km = body.radius_km || 2;

    // Step 1: Use Bedrock to detect capabilities from query
    const detectedCapabilities = await detectCapabilities(body.query);

    // Step 2: Find nearby merchants with matching capabilities
    const matchedMerchants = await findMatchingMerchants(
      body.location,
      radius_km,
      detectedCapabilities.capability_ids
    );

    // Step 3: Create broadcast record
    const broadcast_id = `BC_${uuidv4().substring(0, 8).toUpperCase()}`;
    const broadcast = {
      broadcast_id,
      user_id: body.user_id,
      query: body.query,
      detected_capabilities: detectedCapabilities.capability_ids,
      detected_category: detectedCapabilities.category,
      location: body.location,
      radius_km,
      status: 'active',
      matched_shops_count: matchedMerchants.length,
      responses_count: 0,
      created_at: Date.now(),
      expires_at: Date.now() + (60 * 60 * 1000) // 1 hour expiry
    };

    await dynamodb.put({
      TableName: BROADCASTS_TABLE,
      Item: broadcast
    }).promise();

    // Step 4: Send SNS notifications to matched merchants
    for (const merchant of matchedMerchants) {
      try {
        await notifications.notifyMerchant({
          type: 'BROADCAST_RECEIVED',
          title: 'New Customer Request',
          message: `Someone nearby is looking for: "${body.query}"`,
          merchantId: merchant.shop_id,
          broadcastId: broadcast_id,
          data: {
            query: body.query,
            distance_km: merchant.distance_km,
            capabilities: detectedCapabilities.capability_ids,
            expires_at: broadcast.expires_at,
          },
        });
      } catch (notifErr) {
        console.warn(`SNS notification failed for merchant ${merchant.shop_id}:`, notifErr);
      }
    }

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        broadcast_id,
        query: body.query,
        detected_capabilities: detectedCapabilities,
        matched_shops: matchedMerchants.map(m => ({
          shop_id: m.shop_id,
          shop_name: m.shop_name,
          distance_km: m.distance_km
        })),
        matched_count: matchedMerchants.length
      })
    };

  } catch (error) {
    console.error('Error creating broadcast:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Failed to create broadcast',
        details: error.message
      })
    };
  }
};

async function detectCapabilities(query: string): Promise<{
  capability_ids: string[];
  category: string;
}> {
  try {
    // Use Claude via Bedrock to classify the query
    const prompt = `You are a capability classifier for a local shop discovery app.

Given a user query, identify:
1. The relevant capability IDs (e.g., "tempered_glass", "smartphones")
2. The major category (e.g., "Mobile, Electronics & Computers")

Query: "${query}"

Respond ONLY with valid JSON in this format:
{
  "capability_ids": ["capability1", "capability2"],
  "category": "Category Name"
}`;

    const response = await bedrock.invokeModel({
      modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    }).promise();

    const result = JSON.parse(response.body.toString());
    const content = result.content[0].text;
    const parsed = JSON.parse(content);

    return {
      capability_ids: parsed.capability_ids || [],
      category: parsed.category || 'Unknown'
    };

  } catch (error) {
    console.error('Error detecting capabilities:', error);
    // Fallback to simple keyword matching
    return {
      capability_ids: extractKeywords(query),
      category: 'General'
    };
  }
}

function extractKeywords(query: string): string[] {
  const keywords = query.toLowerCase().split(/\s+/);
  const capabilities: string[] = [];

  // Simple keyword mapping
  if (keywords.some(k => ['glass', 'tempered', 'screen'].includes(k))) {
    capabilities.push('tempered_glass');
  }
  if (keywords.some(k => ['cover', 'case', 'back'].includes(k))) {
    capabilities.push('back_cover');
  }
  if (keywords.some(k => ['charger', 'cable'].includes(k))) {
    capabilities.push('chargers_cables');
  }

  return capabilities;
}

async function findMatchingMerchants(
  location: { lat: number; lng: number },
  radius_km: number,
  capability_ids: string[]
): Promise<any[]> {
  try {
    // Get geohash for the location
    const centerHash = geohash.encode(location.lat, location.lng, 5);

    // Get nearby geohashes (including neighbors)
    const neighbors = geohash.neighbors(centerHash);
    const searchHashes = [centerHash, ...Object.values(neighbors)];

    // Query merchants by geohash
    const merchants: any[] = [];

    for (const hash of searchHashes) {
      const result = await dynamodb.query({
        TableName: MERCHANTS_TABLE,
        IndexName: 'location-index',
        KeyConditionExpression: 'location_geohash = :hash',
        ExpressionAttributeValues: {
          ':hash': hash
        }
      }).promise();

      if (result.Items) {
        merchants.push(...result.Items);
      }
    }

    // Filter by capabilities and calculate distance
    const matched = merchants
      .filter(m => {
        // Check if merchant has any of the required capabilities
        const hasCapability = capability_ids.some(cap =>
          m.capabilities_enabled.includes(cap)
        );
        return hasCapability && m.is_live;
      })
      .map(m => {
        const distance = calculateDistance(
          location.lat, location.lng,
          m.location.lat, m.location.lng
        );
        return { ...m, distance_km: distance };
      })
      .filter(m => m.distance_km <= radius_km)
      .sort((a, b) => a.distance_km - b.distance_km);

    return matched;

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
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}
