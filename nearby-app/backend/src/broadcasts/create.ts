import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { db, Tables } from '../shared/db.js';
import { response } from '../shared/response.js';
import ngeohash from 'ngeohash';

interface CreateBroadcastRequest {
  productId: string;
  userLat: number;
  userLng: number;
  radius: number;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.requestContext.authorizer?.userId;
    if (!userId) {
      return response.error('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const body: CreateBroadcastRequest = JSON.parse(event.body || '{}');
    const { productId, userLat, userLng, radius } = body;

    if (!productId || !userLat || !userLng || !radius) {
      return response.error('Missing required fields', 400, 'INVALID_INPUT');
    }

    // In a real app, you might want to validate the product exists
    // const product = await db.get(Tables.PRODUCTS, { productId });
    // if (!product) {
    //   return response.error('Product not found', 404, 'PRODUCT_NOT_FOUND');
    // }

    const broadcastId = uuidv4();
    const now = new Date().toISOString();
    const expiresAt = Math.floor(Date.now() / 1000) + 1800; // 30 minutes TTL
    const geohash = ngeohash.encode(userLat, userLng, 7); // Precision 7 for ~150m area

    const broadcast = {
      broadcastId,
      userId,
      productId,
      // productName: (product as { name: string }).name,
      // categoryId: (product as { categoryId: string }).categoryId,
      userLat,
      userLng,
      geohash,
      radius,
      status: 'active',
      expiresAt,
      createdAt: now,
    };

    await db.put(Tables.BROADCASTS!, broadcast);

    return response.success(broadcast, 201);
  } catch (error) {
    console.error('Create broadcast error:', error);
    return response.error('Failed to create broadcast', 500, 'INTERNAL_ERROR');
  }
};
