import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { db, Tables } from '../shared/db.js';
import { response } from '../shared/response.js';
import { updateInteractionResponse } from '../merchant/trackInteraction.js';

interface RespondRequest {
  responseType: 'YES' | 'ALTERNATIVE' | 'NO';
  price?: number;
  scheduledTime?: string;
  notes?: string;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const merchantId = event.requestContext.authorizer?.merchantId || event.requestContext.authorizer?.userId;
    if (!merchantId) {
      return response.error('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const broadcastId = event.pathParameters?.broadcastId;
    if (!broadcastId) {
      return response.error('Broadcast ID is required', 400, 'INVALID_INPUT');
    }

    const body: RespondRequest = JSON.parse(event.body || '{}');
    const { responseType, price, scheduledTime, notes } = body;

    if (!responseType) {
      return response.error('Response type is required', 400, 'INVALID_INPUT');
    }

    // Get merchant details
    const MERCHANTS_TABLE = process.env.MERCHANTS_TABLE || 'nearby-backend-dev-merchants';
    const merchantData = await db.get(MERCHANTS_TABLE, { merchantId });
    
    if (!merchantData) {
      return response.error('Merchant not found', 404, 'NOT_FOUND');
    }

    // Get broadcast details
    const BROADCASTS_TABLE = process.env.BROADCASTS_TABLE || 'nearby-backend-dev-broadcasts';
    const broadcast = await db.get(BROADCASTS_TABLE, { broadcastId });
    
    if (!broadcast) {
      return response.error('Broadcast not found', 404, 'NOT_FOUND');
    }

    // Create response record
    const responseId = uuidv4();
    const now = new Date().toISOString();
    const createdAt = Date.now();

    const RESPONSES_TABLE = process.env.RESPONSES_TABLE || 'nearby-backend-dev-responses';
    
    const merchantResponse = {
      responseId,
      broadcastId,
      merchantId,
      shopName: merchantData.shopName || merchantData.name || 'Unknown Shop',
      responseType,
      price: price || null,
      scheduledTime: scheduledTime || null,
      notes: notes || null,
      createdAt: now,
      created_at: createdAt,
      timestamp: now
    };

    await db.put(RESPONSES_TABLE, merchantResponse);

    console.log('Merchant response saved:', {
      responseId,
      broadcastId,
      merchantId,
      responseType
    });

    // Track interaction for AI analysis (optional - don't fail if this fails)
    try {
      await updateInteractionResponse(
        broadcastId,
        merchantId,
        responseType,
        { price, scheduledTime, notes }
      );
      console.log('✅ Interaction tracked for AI analysis');
    } catch (trackError: any) {
      console.error('⚠️ Failed to track interaction (non-critical):', trackError.message);
      // Don't fail the response if tracking fails - this is optional
    }

    // Update broadcast status if this is the first response
    if (broadcast.status === 'active') {
      await db.update(
        BROADCASTS_TABLE,
        { broadcastId },
        {
          status: 'responded',
          updatedAt: now
        }
      );
    }

    return response.success({
      responseId,
      message: 'Response recorded successfully'
    }, 201);
  } catch (error) {
    console.error('Respond to broadcast error:', error);
    return response.error('Failed to respond to broadcast', 500, 'INTERNAL_ERROR');
  }
};
