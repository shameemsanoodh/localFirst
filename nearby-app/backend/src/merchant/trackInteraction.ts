import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../shared/db.js';
import { response } from '../shared/response.js';

/**
 * Merchant Interaction Tracking
 * 
 * Tracks complete lifecycle of merchant-customer interactions:
 * 1. Request received
 * 2. Response given (or not)
 * 3. Fulfillment status (picked up or not)
 * 
 * Used for AI analysis of merchant behavior and customer patterns
 */

interface MerchantInteraction {
  interactionId: string;
  merchantId: string;
  shopName: string;
  broadcastId: string;
  
  // Request details
  productName: string;
  category: string;
  priority: string;
  customerDistance: number;
  requestReceivedAt: string;
  
  // Response tracking
  responseStatus: 'pending' | 'responded' | 'ignored';
  responseType?: 'YES' | 'ALTERNATIVE' | 'NO';
  responseTime?: number; // seconds from request to response
  respondedAt?: string;
  
  // Response details
  price?: number;
  scheduledTime?: string;
  notes?: string;
  
  // Fulfillment tracking (for YES and ALTERNATIVE responses)
  fulfillmentStatus?: 'pending' | 'picked_up' | 'not_picked_up' | 'cancelled';
  pickedUpAt?: string;
  cancellationReason?: string;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  created_at: number; // timestamp for filtering
}

// Create interaction when broadcast is received
export const createInteraction = async (
  merchantId: string,
  shopName: string,
  broadcast: any
): Promise<string> => {
  const INTERACTIONS_TABLE = process.env.INTERACTIONS_TABLE || 'nearby-backend-dev-merchant-interactions';
  
  const interactionId = uuidv4();
  const now = new Date().toISOString();
  const created_at = Date.now();
  
  const interaction: MerchantInteraction = {
    interactionId,
    merchantId,
    shopName,
    broadcastId: broadcast.broadcastId,
    
    // Request details
    productName: broadcast.productName || broadcast.query || 'Unknown',
    category: broadcast.category || broadcast.detectedCategory || 'General',
    priority: broadcast.priority || 'general',
    customerDistance: 0, // Will be calculated
    requestReceivedAt: now,
    
    // Response tracking
    responseStatus: 'pending',
    
    // Metadata
    createdAt: now,
    updatedAt: now,
    created_at
  };
  
  await db.put(INTERACTIONS_TABLE, interaction as any);
  
  console.log('Merchant interaction created:', interactionId);
  
  return interactionId;
};

// Update interaction when merchant responds
export const updateInteractionResponse = async (
  broadcastId: string,
  merchantId: string,
  responseType: 'YES' | 'ALTERNATIVE' | 'NO',
  responseDetails: {
    price?: number;
    scheduledTime?: string;
    notes?: string;
  }
): Promise<void> => {
  const INTERACTIONS_TABLE = process.env.INTERACTIONS_TABLE || 'nearby-backend-dev-merchant-interactions';
  
  // Find interaction by broadcastId and merchantId
  const allInteractions = await db.scan(INTERACTIONS_TABLE);
  const interaction = allInteractions.find(
    (i: any) => i.broadcastId === broadcastId && i.merchantId === merchantId
  );
  
  if (!interaction) {
    console.error('Interaction not found for broadcast:', broadcastId, 'merchant:', merchantId);
    return;
  }
  
  const now = new Date().toISOString();
  const respondedAt = Date.now();
  const requestReceivedAt = new Date(interaction.requestReceivedAt).getTime();
  const responseTime = Math.round((respondedAt - requestReceivedAt) / 1000); // seconds
  
  const updates: any = {
    responseStatus: 'responded',
    responseType,
    responseTime,
    respondedAt: now,
    updatedAt: now,
    ...responseDetails
  };
  
  // Set initial fulfillment status for YES and ALTERNATIVE
  if (responseType === 'YES' || responseType === 'ALTERNATIVE') {
    updates.fulfillmentStatus = 'pending';
  }
  
  await db.update(
    INTERACTIONS_TABLE,
    { interactionId: interaction.interactionId },
    updates
  );
  
  console.log('Interaction updated with response:', interaction.interactionId, responseType);
};

// Mark interaction as ignored (no response after timeout)
export const markInteractionIgnored = async (
  broadcastId: string,
  merchantId: string
): Promise<void> => {
  const INTERACTIONS_TABLE = process.env.INTERACTIONS_TABLE || 'nearby-backend-dev-merchant-interactions';
  
  const allInteractions = await db.scan(INTERACTIONS_TABLE);
  const interaction = allInteractions.find(
    (i: any) => i.broadcastId === broadcastId && i.merchantId === merchantId
  );
  
  if (!interaction || interaction.responseStatus !== 'pending') {
    return;
  }
  
  const now = new Date().toISOString();
  
  await db.update(
    INTERACTIONS_TABLE,
    { interactionId: interaction.interactionId },
    {
      responseStatus: 'ignored',
      updatedAt: now
    }
  );
  
  console.log('Interaction marked as ignored:', interaction.interactionId);
};

// Update fulfillment status
export const updateFulfillmentStatus = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const merchantId = event.requestContext.authorizer?.merchantId || event.requestContext.authorizer?.userId;
    if (!merchantId) {
      return response.error('Unauthorized', 401, 'UNAUTHORIZED');
    }
    
    const interactionId = event.pathParameters?.interactionId;
    if (!interactionId) {
      return response.error('Interaction ID is required', 400, 'INVALID_INPUT');
    }
    
    const body = JSON.parse(event.body || '{}');
    const { fulfillmentStatus, cancellationReason } = body;
    
    if (!fulfillmentStatus) {
      return response.error('Fulfillment status is required', 400, 'INVALID_INPUT');
    }
    
    const INTERACTIONS_TABLE = process.env.INTERACTIONS_TABLE || 'nearby-backend-dev-merchant-interactions';
    
    // Get interaction
    const interaction = await db.get(INTERACTIONS_TABLE, { interactionId });
    
    if (!interaction) {
      return response.error('Interaction not found', 404, 'NOT_FOUND');
    }
    
    if (interaction.merchantId !== merchantId) {
      return response.error('Unauthorized', 403, 'FORBIDDEN');
    }
    
    const now = new Date().toISOString();
    const updates: any = {
      fulfillmentStatus,
      updatedAt: now
    };
    
    if (fulfillmentStatus === 'picked_up') {
      updates.pickedUpAt = now;
    }
    
    if (fulfillmentStatus === 'cancelled' && cancellationReason) {
      updates.cancellationReason = cancellationReason;
    }
    
    await db.update(
      INTERACTIONS_TABLE,
      { interactionId },
      updates
    );
    
    console.log('Fulfillment status updated:', interactionId, fulfillmentStatus);
    
    return response.success({
      interactionId,
      fulfillmentStatus,
      message: 'Fulfillment status updated successfully'
    });
  } catch (error) {
    console.error('Update fulfillment status error:', error);
    return response.error('Failed to update fulfillment status', 500, 'INTERNAL_ERROR');
  }
};

// Get merchant's interaction history
export const getMerchantInteractions = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const merchantId = event.requestContext.authorizer?.merchantId || event.requestContext.authorizer?.userId;
    if (!merchantId) {
      return response.error('Unauthorized', 401, 'UNAUTHORIZED');
    }
    
    const queryParams = event.queryStringParameters || {};
    const limit = parseInt(queryParams.limit || '50');
    const status = queryParams.status; // pending, responded, ignored
    const fulfillmentStatus = queryParams.fulfillmentStatus; // pending, picked_up, not_picked_up
    
    const INTERACTIONS_TABLE = process.env.INTERACTIONS_TABLE || 'nearby-backend-dev-merchant-interactions';
    
    // Get all interactions for merchant
    let interactions = await db.query({
      TableName: INTERACTIONS_TABLE,
      IndexName: 'merchantId-createdAt-index',
      KeyConditionExpression: 'merchantId = :merchantId',
      ExpressionAttributeValues: {
        ':merchantId': merchantId
      },
      ScanIndexForward: false, // newest first
      Limit: limit
    });
    
    // Filter by status if provided
    if (status) {
      interactions = interactions.filter((i: any) => i.responseStatus === status);
    }
    
    if (fulfillmentStatus) {
      interactions = interactions.filter((i: any) => i.fulfillmentStatus === fulfillmentStatus);
    }
    
    // Calculate statistics
    const stats = {
      totalRequests: interactions.length,
      responded: interactions.filter((i: any) => i.responseStatus === 'responded').length,
      ignored: interactions.filter((i: any) => i.responseStatus === 'ignored').length,
      pending: interactions.filter((i: any) => i.responseStatus === 'pending').length,
      
      acceptedCount: interactions.filter((i: any) => i.responseType === 'YES').length,
      rejectedCount: interactions.filter((i: any) => i.responseType === 'NO').length,
      scheduledCount: interactions.filter((i: any) => i.responseType === 'ALTERNATIVE').length,
      
      pickedUp: interactions.filter((i: any) => i.fulfillmentStatus === 'picked_up').length,
      notPickedUp: interactions.filter((i: any) => i.fulfillmentStatus === 'not_picked_up').length,
      pendingFulfillment: interactions.filter((i: any) => i.fulfillmentStatus === 'pending').length,
      
      averageResponseTime: calculateAverageResponseTime(interactions)
    };
    
    return response.success({
      interactions,
      stats,
      count: interactions.length
    });
  } catch (error) {
    console.error('Get merchant interactions error:', error);
    return response.error('Failed to get merchant interactions', 500, 'INTERNAL_ERROR');
  }
};

function calculateAverageResponseTime(interactions: any[]): number {
  const respondedInteractions = interactions.filter(
    (i: any) => i.responseStatus === 'responded' && i.responseTime
  );
  
  if (respondedInteractions.length === 0) return 0;
  
  const totalTime = respondedInteractions.reduce(
    (sum: number, i: any) => sum + i.responseTime,
    0
  );
  
  return Math.round(totalTime / respondedInteractions.length);
}

export const handler = getMerchantInteractions;
