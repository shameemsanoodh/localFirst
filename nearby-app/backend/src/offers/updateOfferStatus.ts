import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { response } from '../shared/response.js';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const merchantId = event.requestContext.authorizer?.merchantId;
    if (!merchantId) {
      return response.error('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const offerId = event.pathParameters?.offerId;
    if (!offerId) {
      return response.error('Offer ID is required', 400, 'INVALID_INPUT');
    }

    const body = JSON.parse(event.body || '{}');
    const { action, extendHours } = body; // action: 'pause' | 'activate' | 'delete' | 'extend'

    const OFFERS_TABLE = process.env.OFFERS_TABLE || 'nearby-backend-dev-offers';

    // Verify offer belongs to merchant
    const getResult = await docClient.send(new GetCommand({
      TableName: OFFERS_TABLE,
      Key: { offerId }
    }));

    if (!getResult.Item) {
      return response.error('Offer not found', 404, 'OFFER_NOT_FOUND');
    }

    if (getResult.Item.merchantId !== merchantId) {
      return response.error('Unauthorized', 403, 'FORBIDDEN');
    }

    let updateExpression = '';
    let expressionAttributeValues: any = {};

    switch (action) {
      case 'pause':
        updateExpression = 'SET #status = :paused';
        expressionAttributeValues = { ':paused': 'paused' };
        break;

      case 'activate':
        updateExpression = 'SET #status = :active';
        expressionAttributeValues = { ':active': 'active' };
        break;

      case 'delete':
        updateExpression = 'SET #status = :deleted';
        expressionAttributeValues = { ':deleted': 'deleted' };
        break;

      case 'extend':
        if (!extendHours || extendHours <= 0) {
          return response.error('Valid extendHours is required', 400, 'INVALID_INPUT');
        }
        const newExpiresAt = getResult.Item.expiresAt + (extendHours * 60 * 60 * 1000);
        updateExpression = 'SET expiresAt = :newExpiresAt, validityHours = validityHours + :extendHours';
        expressionAttributeValues = {
          ':newExpiresAt': newExpiresAt,
          ':extendHours': extendHours
        };
        break;

      default:
        return response.error('Invalid action', 400, 'INVALID_ACTION');
    }

    await docClient.send(new UpdateCommand({
      TableName: OFFERS_TABLE,
      Key: { offerId },
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: action !== 'extend' ? { '#status': 'status' } : undefined,
      ExpressionAttributeValues: expressionAttributeValues
    }));

    return response.success({
      message: `Offer ${action}d successfully`,
      offerId
    });
  } catch (error: any) {
    console.error('Error updating offer:', error);
    return response.error(
      'Failed to update offer',
      500,
      'INTERNAL_ERROR',
      { message: error.message }
    );
  }
};
