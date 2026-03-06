import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { db, Tables } from '../shared/db.js';
import { response } from '../shared/response.js';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.requestContext.authorizer?.principalId;
    if (!userId) {
      return response.error('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const merchantQueryResult = await db.query({
      TableName: Tables.MERCHANTS!,
      IndexName: 'ownerId-index',
      KeyConditionExpression: 'ownerId = :ownerId',
      ExpressionAttributeValues: { ':ownerId': userId },
    });

    if (!merchantQueryResult || merchantQueryResult.length === 0) {
      return response.error('Merchant profile not found for this user.', 404, 'NOT_FOUND');
    }

    const merchant = merchantQueryResult[0];

    return response.success({ merchant });

  } catch (error) {
    console.error('Get merchant profile error:', error);
    return response.error('Failed to get merchant profile', 500, 'INTERNAL_ERROR');
  }
};
