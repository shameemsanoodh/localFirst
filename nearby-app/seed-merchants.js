const axios = require('axios');

const API_BASE = 'http://localhost:3000/dev';

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

// Mobile shop merchants
const MOBILE_MERCHANTS = [
  {
    phone: '9005005001',
    email: 'mobile1@shop.com',
    passcode: '123456',
    shopName: 'Mobile Hub',
    ownerName: 'Raj Kumar',
    description: 'Latest smartphones and accessories',
    majorCategory: 'Mobile',
    subCategory: 'Smartphones',
    capabilities: ['smartphones', 'accessories', 'repairs'],
    openTime: '10:00',
    closeTime: '21:00'
  },
  {
    phone: '9005005002',
    email: 'mobile2@shop.com',
    passcode: '123456',
    shopName: 'Phone Repair Pro',
    ownerName: 'Amit Shah',
    description: 'Quick mobile repairs and servicing',
    majorCategory: 'Mobile',
    subCategory: 'Repairs',
    capabilities: ['repairs', 'screen-replacement', 'battery'],
    openTime: '09:00',
    closeTime: '20:00'
  },
  {
    phone: '9005005003',
    email: 'mobile3@shop.com',
    passcode: '123456',
    shopName: 'Smart Phones Store',
    ownerName: 'Priya Sharma',
    description: 'All brands available with best prices',
    majorCategory: 'Mobile',
    subCategory: 'Smartphones',
    capabilities: ['smartphones', 'accessories', 'exchange'],
    openTime: '10:00',
    closeTime: '22:00'
  }
];

async function seedMerchants() {
  console.log('🌱 Seeding mobile merchants...\n');
  
  const baseLocation = await getCurrentLocation();
  console.log(`📍 Base location: ${baseLocation.city}, ${baseLocation.state}`);
  console.log(`   Coordinates: ${baseLocation.lat}, ${baseLocation.lng}\n`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < MOBILE_MERCHANTS.length; i++) {
    const merchant = MOBILE_MERCHANTS[i];
    const shopLocation = generateNearbyCoordinates(baseLocation.lat, baseLocation.lng, i);
    
    const merchantData = {
      ...merchant,
      address: `${baseLocation.city}, ${baseLocation.state}`,
      location: {
        lat: shopLocation.lat,
        lng: shopLocation.lng
      },
      whatsapp: merchant.phone
    };
    
    try {
      const response = await axios.post(`${API_BASE}/merchants/signup`, merchantData);
      
      console.log(`✓ ${i + 1}. ${merchant.shopName}`);
      console.log(`   Email: ${merchant.email}`);
      console.log(`   Passcode: ${merchant.passcode}`);
      console.log(`   Merchant ID: ${response.data.merchantId}`);
      console.log(`   Location: ${shopLocation.lat.toFixed(4)}, ${shopLocation.lng.toFixed(4)}\n`);
      
      successCount++;
      
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      if (error.response?.status === 409) {
        console.log(`ℹ️  ${merchant.shopName} already exists, skipping...\n`);
      } else {
        console.error(`✗ Error creating ${merchant.shopName}:`, error.response?.data || error.message);
        console.error(`\n`);
        errorCount++;
      }
    }
  }
  
  console.log('\n✅ Merchant seeding completed!');
  console.log(`   Success: ${successCount}`);
  console.log(`   Errors: ${errorCount}`);
  console.log(`   Skipped: ${MOBILE_MERCHANTS.length - successCount - errorCount}`);
  
  // Save credentials
  const fs = require('fs');
  const credentials = `# Mobile Merchant Credentials

## Login Instructions
1. Go to: http://localhost:5176/login
2. Enter email (or merchant ID after first login)
3. Enter 6-digit passcode: 123456

## Mobile Shop Merchants

### 1. Mobile Hub
- **Email**: mobile1@shop.com
- **Passcode**: 123456
- **Phone**: 9005005001
- **Owner**: Raj Kumar

### 2. Phone Repair Pro
- **Email**: mobile2@shop.com
- **Passcode**: 123456
- **Phone**: 9005005002
- **Owner**: Amit Shah

### 3. Smart Phones Store
- **Email**: mobile3@shop.com
- **Passcode**: 123456
- **Phone**: 9005005003
- **Owner**: Priya Sharma

---

## Customer Account (for testing)
- **Email**: user1@gmail.com
- **Password**: 12345678

---

## Test Broadcast Flow
1. Customer searches "mobile" → Creates broadcast
2. Login as merchant → See broadcast
3. Respond with product/price
4. Customer sees response with Navigate button

Last updated: ${new Date().toLocaleString()}
`;
  
  fs.writeFileSync('MOBILE_MERCHANTS.md', credentials);
  console.log(`\n📝 Credentials saved to MOBILE_MERCHANTS.md`);
}

seedMerchants().catch(error => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});
