const AWS = require('aws-sdk');
const bcrypt = require('bcryptjs');

AWS.config.update({ region: 'ap-south-1' });
const dynamodb = new AWS.DynamoDB.DocumentClient();

const MERCHANTS_TABLE = 'nearby-backend-dev-merchants';
const USERS_TABLE = 'nearby-backend-dev-users';

async function hashPasscode(passcode) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(passcode, salt);
}

async function seedMerchants() {
  console.log('🌱 Seeding merchants directly to DynamoDB...\n');
  
  const merchants = [
    {
      merchantId: 'SHOP_MOBILE1',
      phone: '9001001001',
      email: 'mobile1@shop.com',
      passcode: '123456',
      shopName: 'Mobile Hub',
      ownerName: 'Raj Kumar',
      majorCategory: 'Mobile',
      subCategory: 'Smartphones',
      location: { lat: 10.9973691, lng: 76.958887 }
    },
    {
      merchantId: 'SHOP_MOBILE2',
      phone: '9001001002',
      email: 'mobile2@shop.com',
      passcode: '123456',
      shopName: 'Phone Repair Pro',
      ownerName: 'Amit Shah',
      majorCategory: 'Mobile',
      subCategory: 'Repairs',
      location: { lat: 10.9980, lng: 76.9590 }
    },
    {
      merchantId: 'SHOP_MOBILE3',
      phone: '9001001003',
      email: 'mobile3@shop.com',
      passcode: '123456',
      shopName: 'Smart Phones Store',
      ownerName: 'Priya Sharma',
      majorCategory: 'Mobile',
      subCategory: 'Smartphones',
      location: { lat: 10.9965, lng: 76.9580 }
    }
  ];
  
  for (const merchant of merchants) {
    try {
      const hashedPasscode = await hashPasscode(merchant.passcode);
      const timestamp = new Date().toISOString();
      
      // Create user entry
      await dynamodb.put({
        TableName: USERS_TABLE,
        Item: {
          phone: merchant.phone,
          email: merchant.email,
          role: 'merchant',
          name: merchant.ownerName,
          merchantId: merchant.merchantId,
          shopName: merchant.shopName,
          createdAt: timestamp,
          updatedAt: timestamp
        }
      }).promise();
      
      // Create merchant entry
      await dynamodb.put({
        TableName: MERCHANTS_TABLE,
        Item: {
          merchantId: merchant.merchantId,
          phone: merchant.phone,
          email: merchant.email,
          passcode: hashedPasscode,
          shopName: merchant.shopName,
          ownerName: merchant.ownerName,
          description: `${merchant.shopName} - ${merchant.subCategory}`,
          address: 'Thrissur, Kerala',
          majorCategory: merchant.majorCategory,
          subCategory: merchant.subCategory,
          capabilities: [merchant.subCategory.toLowerCase()],
          capabilities_enabled: [merchant.subCategory.toLowerCase()],
          location: merchant.location,
          location_geohash: null,
          openTime: '09:00',
          closeTime: '21:00',
          whatsapp: merchant.phone,
          isOpen: true,
          is_live: true,
          isVerified: true,
          onboardingCompleted: true,
          createdAt: timestamp,
          updatedAt: timestamp
        }
      }).promise();
      
      console.log(`✓ ${merchant.shopName}`);
      console.log(`  Email: ${merchant.email}`);
      console.log(`  Passcode: ${merchant.passcode}`);
      console.log(`  Merchant ID: ${merchant.merchantId}\n`);
      
    } catch (error) {
      console.error(`✗ Error creating ${merchant.shopName}:`, error.message);
    }
  }
  
  console.log('\n✅ Done! You can now login with:');
  console.log('   Email: mobile1@shop.com');
  console.log('   Passcode: 123456\n');
}

seedMerchants().catch(console.error);
