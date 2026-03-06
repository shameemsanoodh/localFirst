import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { db, Tables } from '../shared/db.js';
import { response } from '../shared/response.js';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.requestContext.authorizer?.principalId;
    if (!userId) {
      return response.error('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const view = event.queryStringParameters?.view;

    let queryParams;

    if (view === 'merchant') {
      // A simple way to associate a user with a merchant is needed.
      // For this example, we assume a user can only own one merchant.
      // A more robust solution would query a User-Merchant mapping table.
      const merchantQueryResult = await db.query({
        TableName: Tables.MERCHANTS!,
        IndexName: 'ownerId-index', // This index would need to be created
        KeyConditionExpression: 'ownerId = :ownerId',
        ExpressionAttributeValues: { ':ownerId': userId },
      });

      if (!merchantQueryResult || merchantQueryResult.length === 0) {
        return response.error('You are not registered as a merchant.', 403, 'FORBIDDEN');
      }
      const merchantId = merchantQueryResult[0].merchantId;
      
      queryParams = {
        TableName: Tables.ORDERS!,
        IndexName: 'merchantId-createdAt-index',
        KeyConditionExpression: 'merchantId = :merchantId',
        ExpressionAttributeValues: { ':merchantId': merchantId },
        ScanIndexForward: false, // Sort by newest first
      };

    } else {
      // Default view is for the user
      queryParams = {
        TableName: Tables.ORDERS!,
        IndexName: 'userId-createdAt-index',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: { ':userId': userId },
        ScanIndexForward: false, // Sort by newest first
      };
    }

    const orders = await db.query(queryParams);

    return response.success({ orders });

  } catch (error) {
    console.error('List orders error:', error);
    // A specific check for a missing index.
    if (error instanceof Error && error.name === 'ValidationException') {
        return response.error('A required index is missing on the backend. Please contact support.', 500, 'CONFIG_ERROR');
    }
    return response.error('Failed to list orders', 500, 'INTERNAL_ERROR');
  }
};
