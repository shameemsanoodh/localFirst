import { APIGatewayProxyHandler } from 'aws-lambda';
import AWS from 'aws-sdk';

const dynamodb = new AWS.DynamoDB.DocumentClient();
const BROADCASTS_TABLE = process.env.BROADCASTS_TABLE || 'nearby-backend-dev-broadcasts';

// List all broadcasts
export const listBroadcasts: APIGatewayProxyHandler = async (event) => {
  console.log('List broadcasts request received');

  try {
    const result = await dynamodb.scan({
      TableName: BROADCASTS_TABLE,
    }).promise();

    const broadcasts = result.Items || [];

    // Sort by createdAt descending
    broadcasts.sort((a: any, b: any) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify(broadcasts),
    };
  } catch (error) {
    console.error('Error listing broadcasts:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        error: 'Failed to list broadcasts',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

// Delete broadcast
export const deleteBroadcast: APIGatewayProxyHandler = async (event) => {
  const broadcastId = event.pathParameters?.broadcastId;

  if (!broadcastId) {
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({ error: 'Broadcast ID is required' }),
    };
  }

  try {
    await dynamodb.delete({
      TableName: BROADCASTS_TABLE,
      Key: { broadcastId },
    }).promise();

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({ success: true, message: 'Broadcast deleted' }),
    };
  } catch (error) {
    console.error('Error deleting broadcast:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        error: 'Failed to delete broadcast',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
