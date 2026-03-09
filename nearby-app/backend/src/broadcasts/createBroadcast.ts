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
  console.log('=== BROADCAST CREATION STARTED ===');
  console.log('Event body:', event.body);
  
  try {
    const body: CreateBroadcastRequest = JSON.parse(event.body || '{}');
    
    console.log('Parsed body:', JSON.stringify(body, null, 2));

    if (!body.user_id || !body.query || !body.location) {
      console.log('Missing required fields:', { 
        has_user_id: !!body.user_id, 
        has_query: !!body.query, 
        has_location: !!body.location 
      });
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
    console.log('Using radius:', radius_km, 'km');

    // Step 1: Use Bedrock to detect capabilities from query
    console.log('Step 1: Detecting capabilities for query:', body.query);
    const detectedCapabilities = await detectCapabilities(body.query);
    console.log('Detected capabilities:', detectedCapabilities);

    // Step 2: Find nearby merchants with matching capabilities
    console.log('Step 2: Finding matching merchants...');
    const matchedMerchants = await findMatchingMerchants(
      body.location,
      radius_km,
      detectedCapabilities.capability_ids
    );
    console.log('Found', matchedMerchants.length, 'matching merchants');

    // Step 3: Create broadcast record
    const broadcast_id = `BC_${uuidv4().substring(0, 8).toUpperCase()}`;
    
    // Extract merchant IDs from matched merchants
    const merchantIds = matchedMerchants
      .map(m => m.merchant_id)
      .filter(id => id); // Filter out any undefined values
    
    console.log('Creating broadcast with merchant IDs:', merchantIds);
    
    const broadcast = {
      broadcastId: broadcast_id, // Use camelCase for DynamoDB
      broadcast_id, // Keep snake_case for backward compatibility in response
      user_id: body.user_id,
      query: body.query,
      detected_capabilities: detectedCapabilities.capability_ids,
      detected_category: detectedCapabilities.category,
      location: body.location,
      radius_km,
      status: 'active',
      matched_shops_count: matchedMerchants.length,
      matched_merchant_ids: merchantIds, // Store actual merchant IDs
      responses_count: 0,
      created_at: Date.now(),
      expires_at: Date.now() + (60 * 60 * 1000) // 1 hour expiry
    };

    console.log('Saving broadcast to DynamoDB...');
    await dynamodb.put({
      TableName: BROADCASTS_TABLE,
      Item: broadcast
    }).promise();
    console.log('Broadcast saved successfully!');

    // Step 4: Send SNS notifications to matched merchants
    console.log('Step 4: Sending notifications to', matchedMerchants.length, 'merchants');
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

    console.log('=== BROADCAST CREATION COMPLETED ===');
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
          distance_km: m.distance_km,
          merchant_id: m.merchant_id
        })),
        matched_count: matchedMerchants.length,
        merchant_ids: merchantIds
      })
    };

  } catch (error) {
    console.error('=== BROADCAST CREATION ERROR ===');
    console.error('Error creating broadcast:', error);
    console.error('Error stack:', error.stack);
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
  // Skip Bedrock in local development - use simple keyword matching
  const isLocal = process.env.IS_OFFLINE === 'true' || !process.env.AWS_EXECUTION_ENV;
  
  if (isLocal) {
    console.log('Using local keyword matching (Bedrock skipped)');
    return {
      capability_ids: extractKeywords(query),
      category: 'Mobile'
    };
  }
  
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
    console.log('Finding merchants near:', location, 'radius:', radius_km, 'capabilities:', capability_ids);
    
    // For now, scan all shops since we don't have geohash index
    // In production, you'd want to use a geohash-based GSI
    const SHOPS_TABLE = process.env.SHOPS_TABLE || 'nearby-backend-dev-shops';
    
    const result = await dynamodb.scan({
      TableName: SHOPS_TABLE,
      FilterExpression: 'attribute_exists(#loc) AND #pk = :shopPrefix',
      ExpressionAttributeNames: {
        '#loc': 'location',
        '#pk': 'PK'
      },
      ExpressionAttributeValues: {
        ':shopPrefix': 'SHOP'
      }
    }).promise();

    const shops = result.Items || [];
    console.log(`Found ${shops.length} shops in database`);

    // Calculate distance and filter by radius and category
    const matched = shops
      .map((shop: any) => {
        if (!shop.location || !shop.location.lat || !shop.location.lng) {
          return null;
        }
        
        const distance = calculateDistance(
          location.lat, location.lng,
          shop.location.lat, shop.location.lng
        );
        
        return { 
          ...shop, 
          distance_km: distance,
          shop_id: shop.SK, // Use SK as shop_id
          shop_name: shop.name
        };
      })
      .filter((shop: any) => {
        if (!shop) return false;
        
        // Filter by distance
        if (shop.distance_km > radius_km) return false;
        
        // For mobile-related queries, match Mobile category shops
        const query_lower = capability_ids.join(' ').toLowerCase();
        const shop_category = (shop.majorCategory || shop.category || '').toLowerCase();
        
        // Simple category matching - can be enhanced with AI
        if (query_lower.includes('mobile') || query_lower.includes('phone') || 
            query_lower.includes('case') || query_lower.includes('glass')) {
          return shop_category.includes('mobile');
        }
        
        // Match by category for other queries
        return true; // For now, return all nearby shops
      })
      .sort((a: any, b: any) => a.distance_km - b.distance_km);

    console.log(`Matched ${matched.length} shops:`, matched.map((m: any) => ({ name: m.shop_name, distance: m.distance_km, category: m.majorCategory })));
    
    // Now get the merchant IDs for these shops
    const MERCHANTS_TABLE = process.env.MERCHANTS_TABLE || 'nearby-backend-dev-merchants';
    const merchantIds: string[] = [];
    
    for (const shop of matched) {
      try {
        // Query merchants table to find merchant by shopId
        const merchantResult = await dynamodb.scan({
          TableName: MERCHANTS_TABLE,
          FilterExpression: 'shopId = :shopId',
          ExpressionAttributeValues: {
            ':shopId': shop.shopId
          }
        }).promise();
        
        if (merchantResult.Items && merchantResult.Items.length > 0) {
          const merchant = merchantResult.Items[0];
          merchantIds.push(merchant.merchantId);
          console.log(`  Matched merchant: ${merchant.merchantId} for shop: ${shop.shop_name}`);
        }
      } catch (err) {
        console.error(`Error finding merchant for shop ${shop.shopId}:`, err);
      }
    }
    
    console.log(`Total merchant IDs to notify: ${merchantIds.length}`, merchantIds);
    
    return matched.map((m: any, index: number) => ({
      ...m,
      merchant_id: merchantIds[index] // Add merchant_id to each matched shop
    }));

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
