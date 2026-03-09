const AWS = require('aws-sdk');

AWS.config.update({
  region: 'ap-south-1',
  endpoint: process.env.DYNAMODB_ENDPOINT || undefined
});

const dynamodb = new AWS.DynamoDB.DocumentClient();
const SHOPS_TABLE = 'nearby-backend-dev-shops';
const MERCHANTS_TABLE = 'nearby-backend-dev-merchants';

async function checkStatus() {
  console.log('🔍 Checking Mobile Hub status...\n');
  
  // Find Mobile Hub shop
  const shopsResult = await dynamodb.scan({
    TableName: SHOPS_TABLE,
    FilterExpression: 'contains(#name, :name)',
    ExpressionAttributeNames: {
      '#name': 'name'
    },
    ExpressionAttributeValues: {
      ':name': 'Mobile Hub'
    }
  }).promise();
  
  if (shopsResult.Items && shopsResult.Items.length > 0) {
    const shop = shopsResult.Items[0];
    console.log('📦 SHOP TABLE:');
    console.log(`   Shop ID: ${shop.shopId}`);
    console.log(`   Name: ${shop.name}`);
    console.log(`   Status: ${shop.isOpen !== undefined ? (shop.isOpen ? 'OPEN' : 'CLOSED') : 'NOT SET'}`);
    console.log(`   Has isOpen field: ${shop.isOpen !== undefined}\n`);
  } else {
    console.log('❌ Mobile Hub shop not found\n');
  }
  
  // Find Mobile Hub merchant
  const merchantsResult = await dynamodb.scan({
    TableName: MERCHANTS_TABLE,
    FilterExpression: 'contains(shopName, :name)',
    ExpressionAttributeValues: {
      ':name': 'Mobile Hub'
    }
  }).promise();
  
  if (merchantsResult.Items && merchantsResult.Items.length > 0) {
    const merchant = merchantsResult.Items[0];
    console.log('👤 MERCHANT TABLE:');
    console.log(`   Merchant ID: ${merchant.merchantId}`);
    console.log(`   Shop Name: ${merchant.shopName}`);
    console.log(`   Email: ${merchant.email}`);
    console.log(`   Status: ${merchant.isOpen !== undefined ? (merchant.isOpen ? 'OPEN' : 'CLOSED') : 'NOT SET'}`);
    console.log(`   Has isOpen field: ${merchant.isOpen !== undefined}\n`);
  } else {
    console.log('❌ Mobile Hub merchant not found\n');
  }
}

checkStatus().catch(console.error);
