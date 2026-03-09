import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { db, Tables } from '../shared/db.js';
import { response } from '../shared/response.js';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const broadcastId = event.pathParameters?.broadcastId;
    if (!broadcastId) {
      return response.error('Broadcast ID is required', 400, 'INVALID_INPUT');
    }

    console.log('=== GET BROADCAST REQUEST ===');
    console.log('Broadcast ID:', broadcastId);

    const broadcast = await db.get(Tables.BROADCASTS!, { broadcastId });
    
    if (!broadcast) {
      console.log('Broadcast not found:', broadcastId);
      return response.error('Broadcast not found', 404, 'BROADCAST_NOT_FOUND');
    }

    console.log('=== BROADCAST ITEM FROM DYNAMODB ===');
    console.log(JSON.stringify(broadcast, null, 2));

    // Get matched merchant details (safely handle missing fields)
    const matchedMerchantIds = (broadcast as any).matched_merchant_ids ?? [];
    const matchedMerchants = [];
    
    console.log('Matched merchant IDs:', matchedMerchantIds);
    
    if (matchedMerchantIds.length > 0) {
      const MERCHANTS_TABLE = process.env.MERCHANTS_TABLE || 'nearby-backend-dev-merchants';
      const SHOPS_TABLE = process.env.SHOPS_TABLE || 'nearby-backend-dev-shops';
      
      for (const merchantId of matchedMerchantIds) {
        try {
          // Get merchant details
          const merchantScan = new ScanCommand({
            TableName: MERCHANTS_TABLE,
            FilterExpression: 'merchantId = :merchantId',
            ExpressionAttributeValues: { ':merchantId': merchantId }
          });
          
          const merchantResult = await docClient.send(merchantScan);
          
          if (merchantResult.Items && merchantResult.Items.length > 0) {
            const merchant = merchantResult.Items[0];
            
            // Get shop details
            const shopScan = new ScanCommand({
              TableName: SHOPS_TABLE,
              FilterExpression: 'shopId = :shopId',
              ExpressionAttributeValues: { ':shopId': merchant.shopId }
            });
            
            const shopResult = await docClient.send(shopScan);
            
            if (shopResult.Items && shopResult.Items.length > 0) {
              const shop = shopResult.Items[0];
              
              // Calculate distance (safely handle missing coordinates)
              const userLat = (broadcast as any).userLat ?? 0;
              const userLng = (broadcast as any).userLng ?? 0;
              const shopLat = shop.location?.lat ?? 0;
              const shopLng = shop.location?.lng ?? 0;
              
              const distance = calculateDistance(userLat, userLng, shopLat, shopLng);
              
              matchedMerchants.push({
                merchantId: merchant.merchantId,
                shopName: shop.name ?? 'Unknown Shop',
                shopId: shop.shopId,
                distance: Math.round(distance * 10) / 10,
                category: shop.category ?? shop.majorCategory ?? 'General',
                location: {
                  lat: shopLat,
                  lng: shopLng
                }
              });
            }
          }
        } catch (err) {
          console.error(`Error fetching merchant ${merchantId}:`, err);
          // Continue with other merchants
        }
      }
    }

    console.log('Matched merchants details:', matchedMerchants);

    // Get responses for this broadcast (safely handle missing table)
    const RESPONSES_TABLE = process.env.RESPONSES_TABLE || 'nearby-backend-dev-responses';
    let merchantResponses = [];
    
    try {
      const responsesResult = await db.query({
        TableName: RESPONSES_TABLE,
        IndexName: 'broadcastId-createdAt-index',
        KeyConditionExpression: 'broadcastId = :broadcastId',
        ExpressionAttributeValues: {
          ':broadcastId': broadcastId
        }
      });
      
      merchantResponses = responsesResult ?? [];
      console.log('Found responses:', merchantResponses.length);
      console.log('Response data:', JSON.stringify(merchantResponses, null, 2));
      
      // Transform responses to match frontend expectations
      merchantResponses = merchantResponses.map((r: any) => {
        // Find merchant details from matchedMerchants
        const merchantInfo = matchedMerchants.find(m => m.merchantId === r.merchantId);
        
        return {
          responseId: r.responseId,
          merchantId: r.merchantId,
          broadcastId: r.broadcastId,
          response: r.responseType === 'YES' ? 'accept' : r.responseType === 'ALTERNATIVE' ? 'schedule' : 'reject',
          responseType: r.responseType,
          price: r.price,
          scheduledTime: r.scheduledTime,
          message: r.notes,
          timestamp: r.timestamp || r.createdAt,
          merchant: {
            shopName: r.shopName || merchantInfo?.shopName || 'Unknown Shop',
            distance: merchantInfo?.distance || 0,
            category: merchantInfo?.category || 'General'
          }
        };
      });
      
      console.log('Transformed responses:', JSON.stringify(merchantResponses, null, 2));
    } catch (responseError: any) {
      console.error('Error fetching responses (non-critical):', responseError.message);
      // Continue without responses - table might not exist yet
      merchantResponses = [];
    }

    // Return broadcast with matched merchants and responses
    return response.success({
      broadcast: {
        ...(broadcast as any),
        matched_merchants: matchedMerchants,
        // Ensure these fields exist with defaults
        productName: (broadcast as any).productName ?? (broadcast as any).query ?? 'Unknown',
        query: (broadcast as any).query ?? (broadcast as any).productName ?? '',
        category: (broadcast as any).category ?? (broadcast as any).detectedCategory ?? 'General',
        priority: (broadcast as any).priority ?? 'general'
      },
      responses: merchantResponses,
      matchedShopsCount: matchedMerchants.length
    });
  } catch (error: any) {
    console.error('=== GET BROADCAST ERROR ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return response.error(
      'Failed to get broadcast',
      500,
      'INTERNAL_ERROR',
      { message: error.message, type: error.constructor.name }
    );
  }
};

// Helper function to calculate distance
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
