import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { db, Tables } from '../shared/db.js';
import { response } from '../shared/response.js';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.requestContext.authorizer?.principalId;
    if (!userId) {
      return response.error('Unauthorized', 401, 'UNAUTHORIZED');
    }

    // Fetch broadcasts for that user
    const broadcasts = await db.query({
        TableName: Tables.BROADCASTS!,
        IndexName: 'userId-createdAt-index',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: { ':userId': userId },
        ScanIndexForward: false, // Sort by newest first
    });

    return response.success({ broadcasts });

  } catch (error) {
    console.error('Get merchant broadcasts error:', error);
    return response.error('Failed to get merchant broadcasts', 500, 'INTERNAL_ERROR');
  }
};
