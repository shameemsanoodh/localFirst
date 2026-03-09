import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
// import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { v4 as uuidv4 } from 'uuid';
import ngeohash from 'ngeohash';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
// const eventBridge = new EventBridgeClient({});

const BROADCASTS_TABLE = process.env.BROADCASTS_TABLE!;
const SHOPS_TABLE = process.env.SHOPS_TABLE!;
const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME || 'default';

interface CreateBroadcastRequest {
  userId: string;
  query: string;
  location: { lat: number; lng: number };
  radiusKm?: number;
  category?: string;
  budget?: number;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  console.log('Creating broadcast:', event.body);
  
  try {
    const body: CreateBroadcastRequest = JSON.parse(event.body || '{}');
    
    // Validate input
    if (!body.userId || !body.query || !body.location) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    const broadcastId = `bc_${uuidv4()}`;
    const now = Date.now();
    const expiresAt = now + (30 * 60 * 1000); // 30 minutes
    const radiusKm = body.radiusKm || 3;
    
    // Generate geohash for location
    const geohash = ngeohash.encode(body.location.lat, body.location.lng, 7);
    const geohashPrefix5 = geohash.substring(0, 5);

    // Step 1: Find nearby online shops
    const matchedShops = await findNearbyShops(
      geohashPrefix5,
      body.category,
      body.location,
      radiusKm
    );

    console.log(`Found ${matchedShops.length} nearby shops`);

    // Step 2: Save broadcast to DynamoDB
    const broadcast = {
      PK: `BROADCAST#${broadcastId}`,
      SK: 'METADATA',
      broadcastId,
      userId: body.userId,
      query: body.query,
      location: body.location,
      geohash,
      radiusKm,
      category: body.category,
      budget: body.budget,
      status: 'active',
      matchedMerchantIds: matchedShops.map(s => s.merchantId),
      matchedShopsCount: matchedShops.length,
      responsesCount: 0,
      createdAt: now,
      expiresAt: Math.floor(expiresAt / 1000), // DynamoDB TTL in seconds
    };

    await docClient.send(new PutCommand({
      TableName: BROADCASTS_TABLE,
      Item: broadcast
    }));

    console.log('Broadcast saved to DynamoDB');

    // Step 3: Trigger async notification via EventBridge
    // TODO: Re-enable when EventBridge is configured
    /*
    await eventBridge.send(new PutEventsCommand({
      Entries: [{
        Source: 'localconnect.broadcasts',
        DetailType: 'BroadcastCreated',
        Detail: JSON.stringify({
          broadcastId,
          merchantIds: matchedShops.map(s => s.merchantId),
          query: body.query,
          category: body.category,
          location: body.location,
          radiusKm,
          budget: body.budget
        }),
        EventBusName: EVENT_BUS_NAME
      }]
    }));

    console.log('EventBridge event published');
    */

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        broadcastId,
        status: 'active',
        matchedShopsCount: matchedShops.length,
        estimatedResponseTime: '2-5 minutes',
        expiresAt
      })
    };

  } catch (error: any) {
    console.error('Error creating broadcast:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to create broadcast', details: error.message })
    };
  }
};

async function findNearbyShops(
  geohashPrefix5: string,
  category: string | undefined,
  location: { lat: number; lng: number },
  radiusKm: number
): Promise<Array<{ merchantId: string; shopId: string; distance: number }>> {
  
  // Get geohash neighbors for wider search
  const neighbors = ngeohash.neighbors(geohashPrefix5);
  const searchHashes = [geohashPrefix5, ...Object.values(neighbors)];
  
  const allShops: any[] = [];

  // Query each geohash area
  for (const hash of searchHashes) {
    const params: any = {
      TableName: SHOPS_TABLE,
      IndexName: 'geohashPrefix5-category-index',
      KeyConditionExpression: 'geohashPrefix5 = :hash',
      FilterExpression: 'isOnline = :true',
      ExpressionAttributeValues: {
        ':hash': hash,
        ':true': true
      }
    };

    // Add category filter if provided
    if (category) {
      params.KeyConditionExpression += ' AND category = :category';
      params.ExpressionAttributeValues[':category'] = category;
    }

    const result = await docClient.send(new QueryCommand(params));
    if (result.Items) {
      allShops.push(...result.Items);
    }
  }

  // Calculate distances and filter by radius
  const shopsWithDistance = allShops
    .map(shop => ({
      merchantId: shop.merchantId,
      shopId: shop.shopId,
      distance: calculateDistance(
        location.lat,
        location.lng,
        shop.location.lat,
        shop.location.lng
      )
    }))
    .filter(shop => shop.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance);

  return shopsWithDistance;
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
