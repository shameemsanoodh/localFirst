import AWS from 'aws-sdk';
import { APIGatewayProxyHandler } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import geohash from 'ngeohash';

const dynamodb = new AWS.DynamoDB.DocumentClient();
const MERCHANTS_TABLE = process.env.MERCHANTS_TABLE || 'nearby-merchants';

interface RegisterMerchantRequest {
  owner_phone: string;
  shop_name: string;
  major_category: string;
  sub_category: string;
  capabilities_enabled: string[];
  location: {
    lat: number;
    lng: number;
  };
  whatsapp?: string;
  shop_images?: string[];
}

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body: RegisterMerchantRequest = JSON.parse(event.body || '{}');

    // Validate required fields
    if (!body.owner_phone || !body.shop_name || !body.major_category || 
        !body.capabilities_enabled || !body.location) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'Missing required fields',
          required: ['owner_phone', 'shop_name', 'major_category', 'capabilities_enabled', 'location']
        })
      };
    }

    // Generate shop ID
    const shop_id = `SHOP_${uuidv4().substring(0, 8).toUpperCase()}`;
    
    // Generate geohash for location-based queries (precision 5 = ~5km)
    const location_geohash = geohash.encode(body.location.lat, body.location.lng, 5);

    // Create merchant record
    const merchant = {
      shop_id,
      owner_phone: body.owner_phone,
      shop_name: body.shop_name,
      major_category: body.major_category,
      sub_category: body.sub_category || null,
      capabilities_enabled: body.capabilities_enabled,
      location: body.location,
      location_geohash,
      is_live: true,
      profile_completeness: calculateCompleteness(body),
      open_hours: null,
      whatsapp: body.whatsapp || null,
      shop_images: body.shop_images || [],
      ai_description: null,
      brands_stocked: [],
      delivery_enabled: false,
      languages: [],
      created_at: Date.now(),
      updated_at: Date.now()
    };

    // Save to DynamoDB
    await dynamodb.put({
      TableName: MERCHANTS_TABLE,
      Item: merchant
    }).promise();

    return {
      statusCode: 201,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        shop_id,
        message: 'Merchant registered successfully',
        merchant: {
          shop_id,
          shop_name: merchant.shop_name,
          profile_completeness: merchant.profile_completeness
        }
      })
    };

  } catch (error) {
    console.error('Error registering merchant:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Failed to register merchant',
        details: error.message 
      })
    };
  }
};

function calculateCompleteness(data: RegisterMerchantRequest): number {
  let score = 40; // Base score for required fields
  
  if (data.whatsapp) score += 10;
  if (data.shop_images && data.shop_images.length > 0) score += 20;
  if (data.capabilities_enabled.length > 3) score += 10;
  if (data.sub_category) score += 10;
  
  return Math.min(score, 100);
}
