const AWS = require('aws-sdk');
const axios = require('axios');
const bcrypt = require('bcryptjs');

// Configure AWS
AWS.config.update({ region: 'ap-south-1' });
const dynamodb = new AWS.DynamoDB.DocumentClient();

const SHOPS_TABLE = process.env.SHOPS_TABLE || 'nearby-backend-dev-shops';
const MERCHANTS_TABLE = 'nearby-backend-dev-merchants';
const USERS_TABLE = 'nearby-backend-dev-users';

// Get current location
async function getCurrentLocation() {
  try {
    const response = await axios.get('https://ipapi.co/json/');
    const data = response.data;
    return {
      lat: 10.9973691,
      lng: 76.958887,
      city: data.city || 'Your City',
      state: data.region || 'Your State'
    };
  } catch (error) {
    return {
      lat: 10.9973691,
      lng: 76.958887,
      city: 'Your City',
      state: 'Your State'
    };
  }
}

// Generate nearby coordinates
function generateNearbyCoordinates(baseLat, baseLng, index) {
  const latOffset = (Math.random() - 0.5) * 0.09;
  const lngOffset = (Math.random() - 0.5) * 0.09;
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

// Demo shops data with merchant info
const DEMO_SHOPS = [
  { name: 'Fresh Mart', category: 'Groceries', description: 'Fresh vegetables and daily essentials', openTime: '08:00', closeTime: '22:00', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400', email: 'grocery1@shop.com', phone: '9001001001', passcode: '123456', owner: 'Ramesh Kumar' },
  { name: 'Daily Needs Store', category: 'Groceries', description: 'Your daily grocery needs', openTime: '07:00', closeTime: '21:00', image: 'https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?w=400', email: 'grocery2@shop.com', phone: '9001001002', passcode: '123456', owner: 'Suresh Patel' },
  
  { name: 'HealthPlus Pharmacy', category: 'Pharmacy', description: '24/7 medical store', openTime: '00:00', closeTime: '23:59', image: 'https://images.unsplash.com/photo-1576602976047-174e57a47881?w=400', email: 'pharmacy1@shop.com', phone: '9002002001', passcode: '123456', owner: 'Dr. Amit Shah' },
  { name: 'MediCare Pharmacy', category: 'Pharmacy', description: 'Trusted medicines', openTime: '09:00', closeTime: '17:00', image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400', email: 'pharmacy2@shop.com', phone: '9002002002', passcode: '123456', owner: 'Priya Sharma' },
  { name: 'Quick Meds', category: 'Pharmacy', description: 'Fast delivery pharmacy', openTime: '08:00', closeTime: '20:00', image: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400', email: 'pharmacy3@shop.com', phone: '9002002003', passcode: '123456', owner: 'Rajesh Gupta' },
  
  { name: 'Speed Auto Service', category: 'Automobile', description: 'Car repair and maintenance', openTime: '09:00', closeTime: '19:00', image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400', email: 'auto1@shop.com', phone: '9003003001', passcode: '123456', owner: 'Vijay Singh' },
  { name: 'Bike Care Center', category: 'Automobile', description: 'Two-wheeler service', openTime: '10:00', closeTime: '18:00', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', email: 'auto2@shop.com', phone: '9003003002', passcode: '123456', owner: 'Arun Kumar' },
  { name: 'Auto Parts Hub', category: 'Automobile', description: 'Genuine auto parts', openTime: '08:00', closeTime: '17:00', image: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=400', email: 'auto3@shop.com', phone: '9003003003', passcode: '123456', owner: 'Manoj Verma' },
  
  { name: 'Tech World', category: 'Electronics', description: 'Latest gadgets', openTime: '10:00', closeTime: '21:00', image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400', email: 'electronics1@shop.com', phone: '9004004001', passcode: '123456', owner: 'Kiran Reddy' },
  { name: 'Digital Store', category: 'Electronics', description: 'Computers and accessories', openTime: '09:00', closeTime: '20:00', image: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=400', email: 'electronics2@shop.com', phone: '9004004002', passcode: '123456', owner: 'Sanjay Mehta' },
  { name: 'Gadget Zone', category: 'Electronics', description: 'Mobile and laptop repairs', openTime: '11:00', closeTime: '19:00', image: 'https://images.unsplash.com/photo-1601524909162-ae8725290836?w=400', email: 'electronics3@shop.com', phone: '9004004003', passcode: '123456', owner: 'Deepak Joshi' },
  
  { name: 'Mobile Hub', category: 'Mobile', description: 'Latest smartphones', openTime: '10:00', closeTime: '21:00', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400', email: 'mobile1@shop.com', phone: '9005005001', passcode: '123456', owner: 'Raj Kumar' },
  { name: 'Phone Repair Pro', category: 'Mobile', description: 'Quick mobile repairs', openTime: '09:00', closeTime: '20:00', image: 'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=400', email: 'mobile2@shop.com', phone: '9005005002', passcode: '123456', owner: 'Amit Shah' },
  { name: 'Smart Phones Store', category: 'Mobile', description: 'All brands available', openTime: '10:00', closeTime: '22:00', image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400', email: 'mobile3@shop.com', phone: '9005005003', passcode: '123456', owner: 'Priya Sharma' },
  
  { name: 'Tasty Bites', category: 'Restaurants', description: 'Multi-cuisine restaurant', openTime: '11:00', closeTime: '23:00', image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400', email: 'restaurant1@shop.com', phone: '9006006001', passcode: '123456', owner: 'Chef Ravi' },
  { name: 'Pizza Corner', category: 'Restaurants', description: 'Best pizzas in town', openTime: '12:00', closeTime: '22:00', image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400', email: 'restaurant2@shop.com', phone: '9006006002', passcode: '123456', owner: 'Tony D\'Souza' },
  { name: 'Biryani House', category: 'Restaurants', description: 'Authentic biryani', openTime: '11:00', closeTime: '15:00', image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=400', email: 'restaurant3@shop.com', phone: '9006006003', passcode: '123456', owner: 'Imran Khan' },
  
  { name: 'Style Studio', category: 'Fashion', description: 'Trendy clothing', openTime: '10:00', closeTime: '21:00', image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400', email: 'fashion1@shop.com', phone: '9007007001', passcode: '123456', owner: 'Neha Kapoor' },
  { name: 'Fashion Hub', category: 'Fashion', description: 'Latest fashion trends', openTime: '09:00', closeTime: '20:00', image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400', email: 'fashion2@shop.com', phone: '9007007002', passcode: '123456', owner: 'Anjali Singh' },
  { name: 'Boutique Collection', category: 'Fashion', description: 'Designer wear', openTime: '11:00', closeTime: '19:00', image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400', email: 'fashion3@shop.com', phone: '9007007003', passcode: '123456', owner: 'Ritu Malhotra' },
  
  { name: 'Fix It Pro', category: 'Home Services', description: 'Plumbing and electrical', openTime: '08:00', closeTime: '20:00', image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400', email: 'homeservice1@shop.com', phone: '9008008001', passcode: '123456', owner: 'Sunil Yadav' },
  { name: 'Clean Home Services', category: 'Home Services', description: 'Professional cleaning', openTime: '07:00', closeTime: '19:00', image: 'https://images.unsplash.com/photo-1581578017093-cd30ed8d0d43?w=400', email: 'homeservice2@shop.com', phone: '9008008002', passcode: '123456', owner: 'Mohan Das' },
  { name: 'Handyman Services', category: 'Home Services', description: 'All home repairs', openTime: '09:00', closeTime: '18:00', image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400', email: 'homeservice3@shop.com', phone: '9008008003', passcode: '123456', owner: 'Prakash Nair' }
];

async function seedComplete() {
  console.log('🌱 Complete Seeding: Shops + Merchants...\n');
  
  const baseLocation = await getCurrentLocation();
  console.log(`📍 Base location: ${baseLocation.city}, ${baseLocation.state}`);
  console.log(`   Coordinates: ${baseLocation.lat}, ${baseLocation.lng}\n`);
  
  console.log(`📊 Tables:`);
  console.log(`   SHOPS: ${SHOPS_TABLE}`);
  console.log(`   MERCHANTS: ${MERCHANTS_TABLE}`);
  console.log(`   USERS: ${USERS_TABLE}\n`);
  
  let shopSuccess = 0;
  let merchantSuccess = 0;
  let errors = 0;
  
  for (let i = 0; i < DEMO_SHOPS.length; i++) {
    const shop = DEMO_SHOPS[i];
    const shopLocation = generateNearbyCoordinates(baseLocation.lat, baseLocation.lng, i);
    const shopId = `SHOP_${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
    const merchantId = `MERCH_${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
    const timestamp = new Date().toISOString();
    
    console.log(`${i + 1}. ${shop.name} (${shop.category})`);
    
    try {
      // 1. Create SHOP entry (for display in customer app)
      const shopItem = {
        shopId,
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
        createdAt: timestamp
      };
      
      await dynamodb.put({
        TableName: SHOPS_TABLE,
        Item: shopItem
      }).promise();
      
      shopSuccess++;
      console.log(`   ✓ Shop created: ${shopId}`);
      
      // 2. Create USER entry
      await dynamodb.put({
        TableName: USERS_TABLE,
        Item: {
          phone: shop.phone,
          email: shop.email,
          role: 'merchant',
          name: shop.owner,
          merchantId: merchantId,
          shopName: shop.name,
          createdAt: timestamp,
          updatedAt: timestamp
        }
      }).promise();
      
      // 3. Create MERCHANT entry (for login and broadcasts)
      const hashedPasscode = await hashPasscode(shop.passcode);
      
      await dynamodb.put({
        TableName: MERCHANTS_TABLE,
        Item: {
          merchantId,
          phone: shop.phone,
          email: shop.email,
          passcode: hashedPasscode,
          shopName: shop.name,
          ownerName: shop.owner,
          description: shop.description,
          address: `${baseLocation.city}, ${baseLocation.state}`,
          majorCategory: shop.category,
          subCategory: shop.category,
          capabilities: [shop.category.toLowerCase()],
          capabilities_enabled: [shop.category.toLowerCase()],
          location: {
            lat: shopLocation.lat,
            lng: shopLocation.lng
          },
          location_geohash: null,
          openTime: shop.openTime,
          closeTime: shop.closeTime,
          whatsapp: shop.phone,
          isOpen: true,
          is_live: true,
          isVerified: true,
          onboardingCompleted: true,
          createdAt: timestamp,
          updatedAt: timestamp
        }
      }).promise();
      
      merchantSuccess++;
      console.log(`   ✓ Merchant created: ${merchantId}`);
      console.log(`   📧 Email: ${shop.email} | 🔐 Passcode: ${shop.passcode}`);
      console.log(`   📍 Location: ${shopLocation.lat.toFixed(4)}, ${shopLocation.lng.toFixed(4)}\n`);
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (error) {
      console.error(`   ✗ Error:`, error.message);
      errors++;
    }
  }
  
  console.log('\n✅ Seeding completed!');
  console.log(`   Shops created: ${shopSuccess}`);
  console.log(`   Merchants created: ${merchantSuccess}`);
  console.log(`   Errors: ${errors}\n`);
  
  // Save credentials
  const fs = require('fs');
  const credentials = `# Complete Merchant Credentials

## All merchants use passcode: 123456

### Mobile Shops (for broadcast testing)
1. mobile1@shop.com - Mobile Hub
2. mobile2@shop.com - Phone Repair Pro  
3. mobile3@shop.com - Smart Phones Store

### Other Categories
- grocery1@shop.com - Fresh Mart
- pharmacy1@shop.com - HealthPlus Pharmacy
- electronics1@shop.com - Tech World
- restaurant1@shop.com - Tasty Bites
- fashion1@shop.com - Style Studio
- auto1@shop.com - Speed Auto Service
- homeservice1@shop.com - Fix It Pro

## Login
- Go to: http://localhost:5176/login
- Email: mobile1@shop.com
- Passcode: 123456

Last updated: ${new Date().toLocaleString()}
Location: ${baseLocation.lat}, ${baseLocation.lng}
`;
  
  fs.writeFileSync('ALL_CREDENTIALS.md', credentials);
  console.log('📝 Credentials saved to ALL_CREDENTIALS.md\n');
  console.log('🎉 You can now login to merchant app!');
  console.log('   Email: mobile1@shop.com');
  console.log('   Passcode: 123456\n');
}

seedComplete().catch(error => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});
