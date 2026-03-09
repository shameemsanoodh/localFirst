#!/usr/bin/env node

// Create a test broadcast directly in DynamoDB
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

async function createTestBroadcast() {
  const broadcastId = uuidv4();
  const now = Date.now();
  
  const broadcast = {
    broadcastId,
    userId: '63eee298-04fa-4ea2-962d-41c1a033626c',
    productId: 'test-product-' + Date.now(),
    productName: 'iPhone 15 Pro Max',
    query: 'iPhone 15 Pro Max',
    userLat: 12.9716,
    userLng: 77.5946,
    radius: 5,
    priority: 'URGENT',
    status: 'active',
    matched_merchant_ids: ['MERCHANT_IJ7E21IU', 'MERCHANT_ABC123'],
    createdAt: now.toString(),
    created_at: now,
    expiresAt: Math.floor(Date.now() / 1000) + 86400, // 24 hours
    geohash: 'tdr1y'
  };

  try {
    await docClient.send(new PutCommand({
      TableName: 'nearby-backend-dev-broadcasts',
      Item: broadcast
    }));

    console.log('✅ Test broadcast created successfully!');
    console.log('📡 Broadcast ID:', broadcastId);
    console.log('🏪 Matched merchants:', broadcast.matched_merchant_ids.join(', '));
    console.log('');
    console.log('Now test the response buttons in the merchant app!');
    console.log('The broadcast should appear for merchant: MERCHANT_IJ7E21IU');
    
    return broadcastId;
  } catch (error) {
    console.error('❌ Error creating broadcast:', error);
    throw error;
  }
}

createTestBroadcast().catch(console.error);
