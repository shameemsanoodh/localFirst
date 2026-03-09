import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import AWS from 'aws-sdk';
import { createInteraction } from './trackInteraction.js';

const dynamodb = new AWS.DynamoDB.DocumentClient();
const BROADCASTS_TABLE = process.env.BROADCASTS_TABLE || 'nearby-backend-dev-broadcasts';
const MERCHANTS_TABLE = process.env.MERCHANTS_TABLE || 'nearby-backend-dev-merchants';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  };

  try {
    // Get merchantId from authorizer context
    const merchantId = event.requestContext?.authorizer?.merchantId 
      || event.requestContext?.authorizer?.userId;
      
    console.log('getMerchantBroadcasts - merchantId:', merchantId);
      
    if (!merchantId) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }

    // Get merchant details for shop name
    const merchantResult = await dynamodb.get({
      TableName: MERCHANTS_TABLE,
      Key: { merchantId }
    }).promise();
    
    const shopName = merchantResult.Item?.shopName || merchantResult.Item?.name || 'Unknown Shop';

    // Get since parameter for polling
    const since = event.queryStringParameters?.since 
      ? parseInt(event.queryStringParameters.since) 
      : 0;

    console.log('Fetching broadcasts since:', since, 'for merchant:', merchantId);

    // Scan broadcasts table
    // Note: contains() doesn't work for List types in DynamoDB FilterExpression
    // We need to scan and filter in application code
    const result = await dynamodb.scan({
      TableName: BROADCASTS_TABLE,
      FilterExpression: 'created_at > :since AND attribute_exists(matched_merchant_ids)',
      ExpressionAttributeValues: {
        ':since': since
      }
    }).promise();

    const allBroadcasts = result.Items || [];
    
    console.log('=== DYNAMODB SCAN RESULTS ===');
    console.log('Items from DynamoDB:', JSON.stringify(result.Items, null, 2));
    console.log(`Scanned ${allBroadcasts.length} broadcasts total`);
    console.log('Filtering for merchant:', merchantId);

    // Filter broadcasts that include this merchantId in matched_merchant_ids array
    const broadcasts = allBroadcasts.filter((broadcast: any) => {
      const matchedIds = broadcast.matched_merchant_ids || [];
      const isMatch = matchedIds.includes(merchantId);
      
      console.log(`  Broadcast ${broadcast.broadcastId}:`);
      console.log(`    - matched_merchant_ids:`, matchedIds);
      console.log(`    - includes ${merchantId}?`, isMatch);
      console.log(`    - created_at:`, broadcast.created_at);
      
      return isMatch;
    });
    
    console.log('=== FILTER RESULTS ===');
    console.log(`Found ${broadcasts.length} broadcasts for merchant ${merchantId}`);
    if (broadcasts.length > 0) {
      console.log('Matched broadcast IDs:', broadcasts.map((b: any) => b.broadcastId));
      console.log('Full matched broadcasts:', JSON.stringify(broadcasts, null, 2));
      
      // Track interactions for AI analysis (optional - don't fail if this fails)
      for (const broadcast of broadcasts) {
        try {
          await createInteraction(merchantId, shopName, broadcast);
          console.log('✅ Interaction tracked for broadcast:', broadcast.broadcastId);
        } catch (trackError: any) {
          console.error('⚠️ Failed to track interaction (non-critical):', trackError.message);
          // Don't fail the request if tracking fails - this is optional
        }
      }
    } else {
      console.log('❌ No broadcasts matched this merchant');
      console.log('Possible reasons:');
      console.log('  1. matched_merchant_ids array is empty or missing');
      console.log('  2. Merchant ID mismatch');
      console.log('  3. created_at timestamp filter excluded them');
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true,
        broadcasts: broadcasts 
      }),
    };

  } catch (error: any) {
    console.error('Get merchant broadcasts error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to get merchant broadcasts',
        message: error.message 
      }),
    };
  }
};
