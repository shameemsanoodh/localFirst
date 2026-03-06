import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, Tables } from '../shared/db.js';
import { response } from '../shared/response.js';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const parentId = event.queryStringParameters?.parentId;
    const level = event.queryStringParameters?.level;

    let filterExpression = 'isActive = :isActive';
    const expressionAttributeValues: Record<string, unknown> = { ':isActive': true };

    if (parentId) {
      filterExpression += ' AND parentId = :parentId';
      expressionAttributeValues[':parentId'] = parentId;
    }

    if (level !== undefined) {
      filterExpression += ' AND #level = :level';
      expressionAttributeValues[':level'] = parseInt(level);
    }

    const command = new ScanCommand({
      TableName: Tables.CATEGORIES,
      FilterExpression: filterExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ExpressionAttributeNames: level !== undefined ? { '#level': 'level' } : undefined,
    });

    const result = await docClient.send(command);
    const categories = result.Items || [];

    // Sort by sortOrder
    categories.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

    return response.success({ categories });
  } catch (error) {
    console.error('List categories error:', error);
    return response.error('Failed to list categories', 500, 'INTERNAL_ERROR');
  }
};
