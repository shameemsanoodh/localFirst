import AWS from 'aws-sdk';
import { APIGatewayProxyHandler } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';

const dynamodb = new AWS.DynamoDB.DocumentClient();

export const handler: APIGatewayProxyHandler = async (event) => {
  console.log('=== SIMPLE BROADCAST CREATION ===');
  console.log('Event body:', event.body);
  
  try {
    const body = JSON.parse(event.body || '{}');
    console.log('Parsed body:', JSON.stringify(body, null, 2));

    const broadcast_id = `BC_${uuidv4().substring(0, 8).toUpperCase()}`;
    const BROADCASTS_TABLE = process.env.BROADCASTS_TABLE || 'nearby-backend-dev-broadcasts';
    
    console.log('Creating broadcast in table:', BROADCASTS_TABLE);
    
    const broadcast = {
      broadcastId: broadcast_id,
      broadcast_id,
      user_id: body.user_id || 'test-user',
      query: body.query || 'test query',
      location: body.location || { lat: 0, lng: 0 },
      radius_km: body.radius_km || 5,
      status: 'active',
      matched_shops_count: 0,
      matched_merchant_ids: [],
      responses_count: 0,
      created_at: Date.now(),
      expires_at: Date.now() + (60 * 60 * 1000)
    };

    console.log('Saving broadcast:', JSON.stringify(broadcast, null, 2));

    await dynamodb.put({
      TableName: BROADCASTS_TABLE,
      Item: broadcast
    }).promise();

    console.log('Broadcast saved successfully!');

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        broadcast_id,
        message: 'Simple broadcast created (no matching yet)'
      })
    };

  } catch (error: any) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Failed to create broadcast',
        details: error.message,
        stack: error.stack
      })
    };
  }
};
