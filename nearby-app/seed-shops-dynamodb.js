const AWS = require('aws-sdk');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const readline = require('readline');

// Configure AWS SDK for local DynamoDB
AWS.config.update({
  region: 'ap-south-1',
  endpoint: process.env.DYNAMODB_ENDPOINT || undefined
});

const dynamodb = new AWS.DynamoDB.DocumentClient();
const SHOPS_TABLE = process.env.SHOPS_TABLE || 'nearby-backend-dev-shops';
const MERCHANTS_TABLE = 'nearby-backend-dev-merchants';
const USERS_TABLE = 'nearby-backend-dev-users';

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Promisify readline question
function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

// Get current location from user input
async function getCurrentLocation() {
  try {
    console.log('\n🌍 Location Setup');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const input = await question('Enter your location (lat,lng) or press Enter for default [10.5742336,76.1659392]: ');
    
    let lat, lng;
    if (input.trim()) {
      const parts = input.split(',').map(s => s.trim());
      if (parts.length === 2) {
        lat = parseFloat(parts[0]);
        lng = parseFloat(parts[1]);
        
        if (isNaN(lat) || isNaN(lng)) {
          console.log('⚠️  Invalid coordinates, using default location');
          lat = 10.5742336;
          lng = 76.1659392;
        }
      } else {
        console.log('⚠️  Invalid format, using default location');
        lat = 10.5742336;
        lng = 76.1659392;
      }
    } else {
      lat = 10.5742336;
      lng = 76.1659392;
    }
    
    // Try to get city/state from IP
    let city = 'Your City';
    let state = 'Your State';
    try {
      const response = await axios.get('https://ipapi.co/json/', { timeout: 3000 });
      city = response.data.city || city;
      state = response.data.region || state;
    } catch (err) {
      // Ignore error, use defaults
    }
    
    const location = { lat, lng, city, state };
    console.log(`\n✓ Using location: ${lat}, ${lng}`);
    console.log(`  Area: ${city}, ${state}\n`);
    
    return location;
  } catch (error) {
    console.error('Error getting location:', error);
    return {
      lat: 10.5742336,
      lng: 76.1659392,
      city: 'Your City',
      state: 'Your State'
    };
  }
}

// Generate nearby coordinates within specified radius (default 3km)
function generateNearbyCoordinates(baseLat, baseLng, maxRadiusKm = 3) {
  // Convert km to degrees (approximately)
  // 1 degree latitude ≈ 111 km
  // 1 degree longitude ≈ 111 km * cos(latitude)
  const latDegreePerKm = 1 / 111;
  const lngDegreePerKm = 1 / (111 * Math.cos(baseLat * Math.PI / 180));
  
  // Random angle and distance
  const angle = Math.random() * 2 * Math.PI;
  const distance = Math.random() * maxRadiusKm; // Random distance up to maxRadius
  
  // Calculate offset
  const latOffset = distance * Math.cos(angle) * latDegreePerKm;
  const lngOffset = distance * Math.sin(angle) * lngDegreePerKm;
  
  return {
    lat: baseLat + latOffset,
    lng: baseLng + lngOffset
  };
}

// Hash passcode
async function hashPasscode(passcode) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(passcode, salt);
}

// Demo shops data with images
const DEMO_SHOPS = [
  { name: 'Fresh Mart', category: 'Groceries', description: 'Fresh vegetables and daily essentials', openTime: '08:00', closeTime: '22:00', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400', phone: '9001001001', email: 'grocery1@shop.com', passcode: '123456', owner: 'Ramesh Kumar' },
  { name: 'Daily Needs Store', category: 'Groceries', description: 'Your daily grocery needs', openTime: '07:00', closeTime: '21:00', image: 'https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?w=400', phone: '9001001002', email: 'grocery2@shop.com', passcode: '123456', owner: 'Suresh Patel' },
  { name: 'HealthPlus Pharmacy', category: 'Pharmacy', description: '24/7 medical store', openTime: '00:00', closeTime: '23:59', image: 'https://images.unsplash.com/photo-1576602976047-174e57a47881?w=400', phone: '9002002001', email: 'pharmacy1@shop.com', passcode: '123456', owner: 'Dr. Amit Shah' },
  { name: 'MediCare Pharmacy', category: 'Pharmacy', description: 'Trusted medicines', openTime: '09:00', closeTime: '17:00', image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400', phone: '9002002002', email: 'pharmacy2@shop.com', passcode: '123456', owner: 'Priya Sharma' },
  { name: 'Quick Meds', category: 'Pharmacy', description: 'Fast delivery pharmacy', openTime: '08:00', closeTime: '20:00', image: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400', phone: '9002002003', email: 'pharmacy3@shop.com', passcode: '123456', owner: 'Rajesh Gupta' },
  { name: 'Speed Auto Service', category: 'Automobile', description: 'Car repair and maintenance', openTime: '09:00', closeTime: '19:00', image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400', phone: '9003003001', email: 'auto1@shop.com', passcode: '123456', owner: 'Vijay Singh' },
  { name: 'Bike Care Center', category: 'Automobile', description: 'Two-wheeler service', openTime: '10:00', closeTime: '18:00', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', phone: '9003003002', email: 'auto2@shop.com', passcode: '123456', owner: 'Arun Kumar' },
  { name: 'Auto Parts Hub', category: 'Automobile', description: 'Genuine auto parts', openTime: '08:00', closeTime: '17:00', image: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=400', phone: '9003003003', email: 'auto3@shop.com', passcode: '123456', owner: 'Manoj Verma' },
  { name: 'Tech World', category: 'Electronics', description: 'Latest gadgets', openTime: '10:00', closeTime: '21:00', image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400', phone: '9004004001', email: 'electronics1@shop.com', passcode: '123456', owner: 'Kiran Reddy' },
  { name: 'Digital Store', category: 'Electronics', description: 'Computers and accessories', openTime: '09:00', closeTime: '20:00', image: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=400', phone: '9004004002', email: 'electronics2@shop.com', passcode: '123456', owner: 'Sanjay Mehta' },
  { name: 'Gadget Zone', category: 'Electronics', description: 'Mobile and laptop repairs', openTime: '11:00', closeTime: '19:00', image: 'https://images.unsplash.com/photo-1601524909162-ae8725290836?w=400', phone: '9004004003', email: 'electronics3@shop.com', passcode: '123456', owner: 'Deepak Joshi' },
  { name: 'Mobile Hub', category: 'Mobile', description: 'Latest smartphones', openTime: '10:00', closeTime: '21:00', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400', phone: '9005005001', email: 'mobile1@shop.com', passcode: '123456', owner: 'Raj Kumar' },
  { name: 'Phone Repair Pro', category: 'Mobile', description: 'Quick mobile repairs', openTime: '09:00', closeTime: '20:00', image: 'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=400', phone: '9005005002', email: 'mobile2@shop.com', passcode: '123456', owner: 'Amit Shah' },
  { name: 'Smart Phones Store', category: 'Mobile', description: 'All brands available', openTime: '10:00', closeTime: '22:00', image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400', phone: '9005005003', email: 'mobile3@shop.com', passcode: '123456', owner: 'Priya Sharma' },
  { name: 'Tasty Bites', category: 'Restaurants', description: 'Multi-cuisine restaurant', openTime: '11:00', closeTime: '23:00', image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400', phone: '9006006001', email: 'restaurant1@shop.com', passcode: '123456', owner: 'Chef Ravi' },
  { name: 'Pizza Corner', category: 'Restaurants', description: 'Best pizzas in town', openTime: '12:00', closeTime: '22:00', image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400', phone: '9006006002', email: 'restaurant2@shop.com', passcode: '123456', owner: 'Tony D\'Souza' },
  { name: 'Biryani House', category: 'Restaurants', description: 'Authentic biryani', openTime: '11:00', closeTime: '15:00', image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=400', phone: '9006006003', email: 'restaurant3@shop.com', passcode: '123456', owner: 'Imran Khan' },
  { name: 'Style Studio', category: 'Fashion', description: 'Trendy clothing', openTime: '10:00', closeTime: '21:00', image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400', phone: '9007007001', email: 'fashion1@shop.com', passcode: '123456', owner: 'Neha Kapoor' },
  { name: 'Fashion Hub', category: 'Fashion', description: 'Latest fashion trends', openTime: '09:00', closeTime: '20:00', image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400', phone: '9007007002', email: 'fashion2@shop.com', passcode: '123456', owner: 'Anjali Singh' },
  { name: 'Boutique Collection', category: 'Fashion', description: 'Designer wear', openTime: '11:00', closeTime: '19:00', image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400', phone: '9007007003', email: 'fashion3@shop.com', passcode: '123456', owner: 'Ritu Malhotra' },
  { name: 'Fix It Pro', category: 'Home Services', description: 'Plumbing and electrical', openTime: '08:00', closeTime: '20:00', image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400', phone: '9008008001', email: 'homeservice1@shop.com', passcode: '123456', owner: 'Sunil Yadav' },
  { name: 'Clean Home Services', category: 'Home Services', description: 'Professional cleaning', openTime: '07:00', closeTime: '19:00', image: 'https://images.unsplash.com/photo-1581578017093-cd30ed8d0d43?w=400', phone: '9008008002', email: 'homeservice2@shop.com', passcode: '123456', owner: 'Mohan Das' },
  { name: 'Handyman Services', category: 'Home Services', description: 'All home repairs', openTime: '09:00', closeTime: '18:00', image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400', phone: '9008008003', email: 'homeservice3@shop.com', passcode: '123456', owner: 'Prakash Nair' }
];

// Delete all existing shops, merchants, and users
async function deleteExistingData() {
  console.log('🗑️  Cleaning up old data...\n');
  
  let shopsDeleted = 0;
  let merchantsDeleted = 0;
  let usersDeleted = 0;
  
  try {
    // Delete all shops
    const shopsResult = await dynamodb.scan({ TableName: SHOPS_TABLE }).promise();
    for (const shop of shopsResult.Items || []) {
      await dynamodb.delete({
        TableName: SHOPS_TABLE,
        Key: { shopId: shop.shopId }
      }).promise();
      shopsDeleted++;
    }
    
    // Delete all merchants
    const merchantsResult = await dynamodb.scan({ TableName: MERCHANTS_TABLE }).promise();
    for (const merchant of merchantsResult.Items || []) {
      await dynamodb.delete({
        TableName: MERCHANTS_TABLE,
        Key: { merchantId: merchant.merchantId }
      }).promise();
      merchantsDeleted++;
    }
    
    // Delete all users with role='merchant'
    const usersResult = await dynamodb.scan({ TableName: USERS_TABLE }).promise();
    for (const user of usersResult.Items || []) {
      if (user.role === 'merchant') {
        await dynamodb.delete({
          TableName: USERS_TABLE,
          Key: { userId: user.userId }
        }).promise();
        usersDeleted++;
      }
    }
    
    console.log(`✓ Deleted ${shopsDeleted} shops`);
    console.log(`✓ Deleted ${merchantsDeleted} merchants`);
    console.log(`✓ Deleted ${usersDeleted} merchant users\n`);
  } catch (error) {
    console.error('Error deleting data:', error.message);
  }
}

async function seedShops() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  🌱 NearBy Shop Seeder');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const baseLocation = await getCurrentLocation();
  
  // Ask if user wants to delete old data
  const deleteOld = await question('Delete existing shops and merchants? (y/n) [y]: ');
  if (!deleteOld.trim() || deleteOld.toLowerCase() === 'y') {
    await deleteExistingData();
  }
  
  console.log('📊 Tables:');
  console.log(`   SHOPS: ${SHOPS_TABLE}`);
  console.log(`   MERCHANTS: ${MERCHANTS_TABLE}`);
  console.log(`   USERS: ${USERS_TABLE}\n`);
  
  console.log('🏪 Creating 23 shops...\n');
  
  let shopsCreated = 0;
  let merchantsCreated = 0;
  let errorCount = 0;
  
  for (let i = 0; i < DEMO_SHOPS.length; i++) {
    const shop = DEMO_SHOPS[i];
    const shopLocation = generateNearbyCoordinates(baseLocation.lat, baseLocation.lng);
    
    const shopId = `SHOP_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const merchantId = `MERCHANT_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const userId = `USER_${shop.phone}`;
    
    console.log(`${i + 1}. ${shop.name} (${shop.category})`);
    
    // Create SHOP entry
    const shopItem = {
      shopId: shopId,
      name: shop.name,
      category: shop.category,
      description: shop.description,
      coverImage: shop.image,
      logo: shop.image,
      rating: (Math.random() * 2 + 3).toFixed(1),
      totalReviews: Math.floor(Math.random() * 100) + 10,
      openTime: shop.openTime,
      closeTime: shop.closeTime,
      location: {
        lat: shopLocation.lat,
        lng: shopLocation.lng,
        address: `${baseLocation.city}, ${baseLocation.state}`,
        area: baseLocation.city
      },
      tags: [shop.category.toLowerCase(), 'local', 'verified'],
      isVerified: true,
      createdAt: Date.now()
    };
    
    try {
      await dynamodb.put({
        TableName: SHOPS_TABLE,
        Item: shopItem
      }).promise();
      console.log(`   ✓ Shop created: ${shopId}`);
      shopsCreated++;
    } catch (error) {
      console.log(`   ✗ Shop error: ${error.message}`);
      errorCount++;
      continue;
    }
    
    // Create USER entry
    const userItem = {
      userId: userId,
      phone: shop.phone,
      email: shop.email,
      role: 'merchant',
      createdAt: Date.now()
    };
    
    try {
      await dynamodb.put({
        TableName: USERS_TABLE,
        Item: userItem
      }).promise();
      console.log(`   ✓ User created: ${userId}`);
    } catch (error) {
      console.log(`   ✗ User error: ${error.message}`);
      errorCount++;
      continue;
    }
    
    // Create MERCHANT entry
    const hashedPasscode = await hashPasscode(shop.passcode);
    const merchantItem = {
      merchantId: merchantId,
      userId: userId,
      shopId: shopId,
      email: shop.email,
      phone: shop.phone,
      passcode: hashedPasscode,
      shopName: shop.name,
      majorCategory: shop.category,
      category: shop.category,
      ownerName: shop.owner,
      location: {
        lat: shopLocation.lat,
        lng: shopLocation.lng,
        address: `${baseLocation.city}, ${baseLocation.state}`
      },
      openTime: shop.openTime,
      closeTime: shop.closeTime,
      isVerified: true,
      isOpen: true,
      onboardingCompleted: true,
      createdAt: Date.now()
    };
    
    try {
      await dynamodb.put({
        TableName: MERCHANTS_TABLE,
        Item: merchantItem
      }).promise();
      console.log(`   ✓ Merchant created: ${merchantId}`);
      console.log(`   📱 Phone: ${shop.phone} | Email: ${shop.email} | Passcode: ${shop.passcode}\n`);
      merchantsCreated++;
    } catch (error) {
      console.log(`   ✗ Merchant error: ${error.message}\n`);
      errorCount++;
    }
    
    // Small delay to avoid throttling
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Seeding completed!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Shops created: ${shopsCreated}`);
  console.log(`Merchants created: ${merchantsCreated}`);
  console.log(`Errors: ${errorCount}`);
  
  // Save merchant credentials for testing
  const fs = require('fs');
  const credentials = `# Merchant Login Credentials

All merchants use passcode: 123456

## Mobile Shop Merchants (for broadcast testing)
1. Mobile Hub
   Phone: 9005005001
   Email: mobile1@shop.com
   Passcode: 123456
   Owner: Raj Kumar
   
2. Phone Repair Pro
   Phone: 9005005002
   Email: mobile2@shop.com
   Passcode: 123456
   Owner: Amit Shah
   
3. Smart Phones Store
   Phone: 9005005003
   Email: mobile3@shop.com
   Passcode: 123456
   Owner: Priya Sharma

## Grocery Merchants
1. Fresh Mart
   Phone: 9001001001
   Email: grocery1@shop.com
   Passcode: 123456
   Owner: Ramesh Kumar
   
2. Daily Needs Store
   Phone: 9001001002
   Email: grocery2@shop.com
   Passcode: 123456
   Owner: Suresh Patel

## Pharmacy Merchants
1. HealthPlus Pharmacy
   Phone: 9002002001
   Email: pharmacy1@shop.com
   Passcode: 123456
   Owner: Dr. Amit Shah
   
2. MediCare Pharmacy
   Phone: 9002002002
   Email: pharmacy2@shop.com
   Passcode: 123456
   Owner: Priya Sharma
   
3. Quick Meds
   Phone: 9002002003
   Email: pharmacy3@shop.com
   Passcode: 123456
   Owner: Rajesh Gupta

## All Other Merchants
- Speed Auto Service: 9003003001 / auto1@shop.com / 123456
- Bike Care Center: 9003003002 / auto2@shop.com / 123456
- Auto Parts Hub: 9003003003 / auto3@shop.com / 123456
- Tech World: 9004004001 / electronics1@shop.com / 123456
- Digital Store: 9004004002 / electronics2@shop.com / 123456
- Gadget Zone: 9004004003 / electronics3@shop.com / 123456
- Tasty Bites: 9006006001 / restaurant1@shop.com / 123456
- Pizza Corner: 9006006002 / restaurant2@shop.com / 123456
- Biryani House: 9006006003 / restaurant3@shop.com / 123456
- Style Studio: 9007007001 / fashion1@shop.com / 123456
- Fashion Hub: 9007007002 / fashion2@shop.com / 123456
- Boutique Collection: 9007007003 / fashion3@shop.com / 123456
- Fix It Pro: 9008008001 / homeservice1@shop.com / 123456
- Clean Home Services: 9008008002 / homeservice2@shop.com / 123456
- Handyman Services: 9008008003 / homeservice3@shop.com / 123456

---
Last updated: ${new Date().toLocaleString()}
Location: ${baseLocation.lat}, ${baseLocation.lng}
Area: ${baseLocation.city}, ${baseLocation.state}
`;
  
  fs.writeFileSync('ALL_CREDENTIALS.md', credentials);
  console.log(`\n📝 Credentials saved to ALL_CREDENTIALS.md`);
  console.log(`\n🎉 You can now login to merchant app!`);
  console.log(`   Email: mobile1@shop.com`);
  console.log(`   Passcode: 123456\n`);
  
  rl.close();
}

seedShops().catch(error => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});
