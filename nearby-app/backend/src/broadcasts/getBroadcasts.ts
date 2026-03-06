import AWS from 'aws-sdk';
import { APIGatewayProxyHandler } from 'aws-lambda';

const dynamodb = new AWS.DynamoDB.DocumentClient();
const BROADCASTS_TABLE = process.env.BROADCASTS_TABLE || 'nearby-broadcasts';
const RESPONSES_TABLE = process.env.RESPONSES_TABLE || 'nearby-responses';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const shop_id = event.queryStringParameters?.shop_id;
    const user_id = event.queryStringParameters?.user_id;

    if (!shop_id && !user_id) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'Either shop_id or user_id is required'
        })
      };
    }

    if (shop_id) {
      // Get broadcasts for merchant (where they can respond)
      // This requires scanning broadcasts and checking if shop matches capabilities
      // For MVP, we'll return all active broadcasts
      const result = await dynamodb.scan({
        TableName: BROADCASTS_TABLE,
        FilterExpression: '#status = :status',
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        ExpressionAttributeValues: {
          ':status': 'active'
        }
      }).promise();

      return {
        statusCode: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: true,
          broadcasts: result.Items || [],
          count: result.Items?.length || 0
        })
      };
    }

    if (user_id) {
      // Get broadcasts created by user
      const result = await dynamodb.query({
        TableName: BROADCASTS_TABLE,
        IndexName: 'user-broadcasts',
        KeyConditionExpression: 'user_id = :user_id',
        ExpressionAttributeValues: {
          ':user_id': user_id
        },
        ScanIndexForward: false // Most recent first
      }).promise();

      // Get responses for each broadcast
      const broadcasts = await Promise.all(
        (result.Items || []).map(async (broadcast) => {
          const responses = await dynamodb.query({
            TableName: RESPONSES_TABLE,
            IndexName: 'broadcast-responses',
            KeyConditionExpression: 'broadcast_id = :broadcast_id',
            ExpressionAttributeValues: {
              ':broadcast_id': broadcast.broadcast_id
            }
          }).promise();

          return {
            ...broadcast,
            responses: responses.Items || []
          };
        })
      );

      return {
        statusCode: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: true,
          broadcasts,
          count: broadcasts.length
        })
      };
    }

  } catch (error) {
    console.error('Error fetching broadcasts:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Failed to fetch broadcasts',
        details: error.message 
      })
    };
  }
};
