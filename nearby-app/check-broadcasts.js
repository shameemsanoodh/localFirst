const AWS = require('aws-sdk');

// Configure AWS SDK for local DynamoDB
AWS.config.update({
  region: 'us-east-1',
  endpoint: 'http://localhost:8000',
  accessKeyId: 'dummy',
  secretAccessKey: 'dummy'
});

const dynamodb = new AWS.DynamoDB.DocumentClient();
const BROADCASTS_TABLE = 'nearby-backend-dev-broadcasts';

async function checkBroadcasts() {
  try {
    console.log('📡 Checking broadcasts table...\n');
    
    const result = await dynamodb.scan({
      TableName: BROADCASTS_TABLE
    }).promise();

    const broadcasts = result.Items || [];
    
    console.log(`Found ${broadcasts.length} broadcasts:\n`);
    
    broadcasts.forEach((broadcast, index) => {
      console.log(`\n🔔 Broadcast ${index + 1}:`);
      console.log(`   ID: ${broadcast.broadcastId || broadcast.broadcast_id}`);
      console.log(`   Query: ${broadcast.query}`);
      console.log(`   Created: ${new Date(broadcast.created_at).toLocaleString()}`);
      console.log(`   Matched shops: ${broadcast.matched_shops_count || 0}`);
      console.log(`   Matched merchant IDs:`, broadcast.matched_merchant_ids || 'NONE');
      console.log(`   Category: ${broadcast.detected_category || 'N/A'}`);
      console.log(`   Location: ${JSON.stringify(broadcast.location)}`);
    });
    
    if (broadcasts.length === 0) {
      console.log('❌ No broadcasts found in the table!');
      console.log('   This means the broadcast creation is failing or not saving to the database.');
    }
    
  } catch (error) {
    console.error('Error checking broadcasts:', error);
  }
}

checkBroadcasts();
