import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { response } from '../shared/response.js';
import { v4 as uuidv4 } from 'uuid';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const merchantId = event.requestContext.authorizer?.merchantId;
    if (!merchantId) {
      return response.error('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const body = JSON.parse(event.body || '{}');
    const { offer, message, validityHours } = body;

    if (!offer || !validityHours) {
      return response.error('Offer and validity hours are required', 400, 'INVALID_INPUT');
    }

    // Get merchant and shop details
    const MERCHANTS_TABLE = process.env.MERCHANTS_TABLE || 'nearby-backend-dev-merchants';
    const SHOPS_TABLE = process.env.SHOPS_TABLE || 'nearby-backend-dev-shops';
    const OFFERS_TABLE = process.env.OFFERS_TABLE || 'nearby-backend-dev-offers';

    const merchantScan = new ScanCommand({
      TableName: MERCHANTS_TABLE,
      FilterExpression: 'merchantId = :merchantId',
      ExpressionAttributeValues: { ':merchantId': merchantId }
    });

    const merchantResult = await docClient.send(merchantScan);
    if (!merchantResult.Items || merchantResult.Items.length === 0) {
      return response.error('Merchant not found', 404, 'MERCHANT_NOT_FOUND');
    }

    const merchant = merchantResult.Items[0];

    // Get shop details
    const shopScan = new ScanCommand({
      TableName: SHOPS_TABLE,
      FilterExpression: 'shopId = :shopId',
      ExpressionAttributeValues: { ':shopId': merchant.shopId }
    });

    const shopResult = await docClient.send(shopScan);
    if (!shopResult.Items || shopResult.Items.length === 0) {
      return response.error('Shop not found', 404, 'SHOP_NOT_FOUND');
    }

    const shop = shopResult.Items[0];

    // Create offer
    const offerId = uuidv4();
    const now = Date.now();
    const expiresAt = now + (validityHours * 60 * 60 * 1000);

    const offerItem = {
      offerId,
      merchantId,
      shopId: shop.shopId,
      shopName: shop.name,
      category: shop.category || shop.majorCategory || 'General',
      offer,
      message: message || '',
      location: shop.location,
      createdAt: new Date().toISOString(),
      created_at: now,
      expiresAt,
      validityHours,
      status: 'active',
      views: 0,
      clicks: 0
    };

    await docClient.send(new PutCommand({
      TableName: OFFERS_TABLE,
      Item: offerItem
    }));

    console.log('Merchant offer created:', offerId);

    return response.success({
      offerId,
      message: 'Offer broadcast successfully',
      expiresAt: new Date(expiresAt).toISOString()
    });
  } catch (error: any) {
    console.error('Error creating merchant offer:', error);
    return response.error(
      'Failed to create offer',
      500,
      'INTERNAL_ERROR',
      { message: error.message }
    );
  }
};
