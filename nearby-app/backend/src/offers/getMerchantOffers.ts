import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { response } from '../shared/response.js';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const merchantId = event.requestContext.authorizer?.merchantId;
    if (!merchantId) {
      return response.error('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const OFFERS_TABLE = process.env.OFFERS_TABLE || 'nearby-backend-dev-offers';

    // Get all offers for this merchant
    const scanResult = await docClient.send(new ScanCommand({
      TableName: OFFERS_TABLE,
      FilterExpression: 'merchantId = :merchantId',
      ExpressionAttributeValues: {
        ':merchantId': merchantId
      }
    }));

    const offers = (scanResult.Items || []).map(offer => ({
      ...offer,
      isExpired: offer.expiresAt < Date.now(),
      isActive: offer.status === 'active' && offer.expiresAt > Date.now()
    }));

    // Sort by creation date (newest first)
    offers.sort((a: any, b: any) => b.created_at - a.created_at);

    return response.success({
      offers,
      count: offers.length,
      activeCount: offers.filter(o => o.isActive).length
    });
  } catch (error: any) {
    console.error('Error fetching merchant offers:', error);
    return response.error(
      'Failed to fetch offers',
      500,
      'INTERNAL_ERROR',
      { message: error.message }
    );
  }
};
