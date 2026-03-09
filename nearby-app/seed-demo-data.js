const axios = require('axios');

const API_BASE = 'http://localhost:3000/dev';

// Demo users
const DEMO_USERS = [
  { email: 'user1@gmail.com', password: '12345678', name: 'Demo User 1', phone: '9876543210', role: 'customer' },
  { email: 'user2@gmail.com', password: '12345678', name: 'Demo User 2', phone: '9876543211', role: 'customer' },
  { email: 'user3@gmail.com', password: '12345678', name: 'Demo User 3', phone: '9876543212', role: 'customer' }
];

// Demo merchants with shops
const DEMO_MERCHANTS = [
  // Groceries - 2 shops
  { 
    email: 'grocery1@shop.com', 
    password: '12345678', 
    name: 'Fresh Mart', 
    phone: '9001001001',
    category: 'Groceries',
    description: 'Fresh vegetables and daily essentials',
    openTime: '08:00',
    closeTime: '22:00',
    status: 'online'
  },
  { 
    email: 'grocery2@shop.com', 
    password: '12345678', 
    name: 'Daily Needs Store', 
    phone: '9001001002',
    category: 'Groceries',
    description: 'Your daily grocery needs',
    openTime: '07:00',
    closeTime: '21:00',
    status: 'online'
  },
  
  // Pharmacy - 3 shops (1 closed, 2 online)
  { 
    email: 'pharmacy1@shop.com', 
    password: '12345678', 
    name: 'HealthPlus Pharmacy', 
    phone: '9002002001',
    category: 'Pharmacy',
    description: '24/7 medical store',
    openTime: '00:00',
    closeTime: '23:59',
    status: 'online'
  },
  { 
    email: 'pharmacy2@shop.com', 
    password: '12345678', 
    name: 'MediCare Pharmacy', 
    phone: '9002002002',
    category: 'Pharmacy',
    description: 'Trusted medicines and healthcare',
    openTime: '09:00',
    closeTime: '17:00', // Will be closed if current time > 5 PM
    status: 'closed'
  },
  { 
    email: 'pharmacy3@shop.com', 
    password: '12345678', 
    name: 'Quick Meds', 
    phone: '9002002003',
    category: 'Pharmacy',
    description: 'Fast delivery pharmacy',
    openTime: '08:00',
    closeTime: '20:00',
    status: 'online'
  },
  
  // Automobile - 3 shops
  { 
    email: 'auto1@shop.com', 
    password: '12345678', 
    name: 'Speed Auto Service', 
    phone: '9003003001',
    category: 'Automobile',
    description: 'Car repair and maintenance',
    openTime: '09:00',
    closeTime: '19:00',
    status: 'online'
  },
  { 
    email: 'auto2@shop.com', 
    password: '12345678', 
    name: 'Bike Care Center', 
    phone: '9003003002',
    category: 'Automobile',
    description: 'Two-wheeler service center',
    openTime: '10:00',
    closeTime: '18:00',
    status: 'online'
  },
  { 
    email: 'auto3@shop.com', 
    password: '12345678', 
    name: 'Auto Parts Hub', 
    phone: '9003003003',
    category: 'Automobile',
    description: 'Genuine auto parts',
    openTime: '08:00',
    closeTime: '17:00',
    status: 'closed'
  },
  
  // Electronics - 3 shops
  { 
    email: 'electronics1@shop.com', 
    password: '12345678', 
    name: 'Tech World', 
    phone: '9004004001',
    category: 'Electronics',
    description: 'Latest gadgets and electronics',
    openTime: '10:00',
    closeTime: '21:00',
    status: 'online'
  },
  { 
    email: 'electronics2@shop.com', 
    password: '12345678', 
    name: 'Digital Store', 
    phone: '9004004002',
    category: 'Electronics',
    description: 'Computers and accessories',
    openTime: '09:00',
    closeTime: '20:00',
    status: 'online'
  },
  { 
    email: 'electronics3@shop.com', 
    password: '12345678', 
    name: 'Gadget Zone', 
    phone: '9004004003',
    category: 'Electronics',
    description: 'Mobile and laptop repairs',
    openTime: '11:00',
    closeTime: '19:00',
    status: 'online'
  },
  
  // Mobile - 3 shops
  { 
    email: 'mobile1@shop.com', 
    passcode: '123456',  // 6-digit passcode
    name: 'Mobile Hub', 
    phone: '9005005001',
    category: 'Mobile',
    description: 'Latest smartphones and accessories',
    openTime: '10:00',
    closeTime: '21:00',
    status: 'online'
  },
  { 
    email: 'mobile2@shop.com', 
    passcode: '123456',  // 6-digit passcode
    name: 'Phone Repair Pro', 
    phone: '9005005002',
    category: 'Mobile',
    description: 'Quick mobile repairs',
    openTime: '09:00',
    closeTime: '20:00',
    status: 'online'
  },
  { 
    email: 'mobile3@shop.com', 
    passcode: '123456',  // 6-digit passcode
    name: 'Smart Phones Store', 
    phone: '9005005003',
    category: 'Mobile',
    description: 'All brands available',
    openTime: '10:00',
    closeTime: '22:00',
    status: 'online'
  },
  
  // Restaurants - 3 shops
  { 
    email: 'restaurant1@shop.com', 
    password: '12345678', 
    name: 'Tasty Bites', 
    phone: '9006006001',
    category: 'Restaurants',
    description: 'Multi-cuisine restaurant',
    openTime: '11:00',
    closeTime: '23:00',
    status: 'online'
  },
  { 
    email: 'restaurant2@shop.com', 
    password: '12345678', 
    name: 'Pizza Corner', 
    phone: '9006006002',
    category: 'Restaurants',
    description: 'Best pizzas in town',
    openTime: '12:00',
    closeTime: '22:00',
    status: 'online'
  },
  { 
    email: 'restaurant3@shop.com', 
    password: '12345678', 
    name: 'Biryani House', 
    phone: '9006006003',
    category: 'Restaurants',
    description: 'Authentic biryani',
    openTime: '11:00',
    closeTime: '15:00',
    status: 'closed'
  },
  
  // Fashion - 3 shops
  { 
    email: 'fashion1@shop.com', 
    password: '12345678', 
    name: 'Style Studio', 
    phone: '9007007001',
    category: 'Fashion',
    description: 'Trendy clothing and accessories',
    openTime: '10:00',
    closeTime: '21:00',
    status: 'online'
  },
  { 
    email: 'fashion2@shop.com', 
    password: '12345678', 
    name: 'Fashion Hub', 
    phone: '9007007002',
    category: 'Fashion',
    description: 'Latest fashion trends',
    openTime: '09:00',
    closeTime: '20:00',
    status: 'online'
  },
  { 
    email: 'fashion3@shop.com', 
    password: '12345678', 
    name: 'Boutique Collection', 
    phone: '9007007003',
    category: 'Fashion',
    description: 'Designer wear',
    openTime: '11:00',
    closeTime: '19:00',
    status: 'online'
  },
  
  // Home Services - 3 shops
  { 
    email: 'homeservice1@shop.com', 
    password: '12345678', 
    name: 'Fix It Pro', 
    phone: '9008008001',
    category: 'Home Services',
    description: 'Plumbing and electrical services',
    openTime: '08:00',
    closeTime: '20:00',
    status: 'online'
  },
  { 
    email: 'homeservice2@shop.com', 
    password: '12345678', 
    name: 'Clean Home Services', 
    phone: '9008008002',
    category: 'Home Services',
    description: 'Professional cleaning',
    openTime: '07:00',
    closeTime: '19:00',
    status: 'online'
  },
  { 
    email: 'homeservice3@shop.com', 
    password: '12345678', 
    name: 'Handyman Services', 
    phone: '9008008003',
    category: 'Home Services',
    description: 'All home repairs',
    openTime: '09:00',
    closeTime: '18:00',
    status: 'online'
  }
];

// Get current location using IP geolocation
async function getCurrentLocation() {
  try {
    console.log('🌍 Getting your current location...');
    
    // Use ipapi.co for free IP geolocation
    const response = await axios.get('https://ipapi.co/json/');
    const data = response.data;
    
    console.log(`   IP-based location: ${data.city}, ${data.region}, ${data.country_name}`);
    console.log(`   IP coordinates: ${data.latitude}, ${data.longitude}`);
    
    // Override with your actual GPS location if you want shops at your exact location
    // Comment out these lines to use IP-based location instead
    const actualLocation = {
      lat: 10.9973691,
      lng: 76.958887,
      city: data.city || 'Your City',
      state: data.region || 'Your State',
      country: data.country_name || 'India'
    };
    
    console.log(`   Using GPS location: ${actualLocation.lat}, ${actualLocation.lng}`);
    
    return actualLocation;
    
  } catch (error) {
    console.log('   ⚠️  Could not detect location, using your GPS coordinates');
    // Fallback to your GPS coordinates
    return {
      lat: 10.9973691,
      lng: 76.958887,
      city: 'Your City',
      state: 'Your State',
      country: 'India'
    };
  }
}

// Generate nearby coordinates (within 5km radius)
function generateNearbyCoordinates(baseLat, baseLng, index) {
  // Generate random offset within ~5km
  const latOffset = (Math.random() - 0.5) * 0.09; // ~5km
  const lngOffset = (Math.random() - 0.5) * 0.09;
  
  return {
    lat: baseLat + latOffset,
    lng: baseLng + lngOffset
  };
}

// Check if shop should be closed based on time
function shouldBeClosed(closeTime) {
  const now = new Date();
  const currentHour = now.getHours();
  const [closeHour] = closeTime.split(':').map(Number);
  
  // If current time is past closing time, mark as closed
  return currentHour >= closeHour;
}

// Delete all existing data
async function deleteAllData() {
  console.log('🗑️  Deleting all existing data...');
  
  try {
    // Note: You'll need to implement these endpoints in your backend
    // For now, we'll just log
    console.log('⚠️  Manual cleanup required:');
    console.log('   - Clear DynamoDB tables');
    console.log('   - Or implement DELETE endpoints');
  } catch (error) {
    console.log('⚠️  Could not delete data:', error.message);
  }
}

// Register user
async function registerUser(user) {
  try {
    const response = await axios.post(`${API_BASE}/auth/register`, user);
    return response.data;
  } catch (error) {
    if (error.response?.status === 409) {
      console.log(`   ℹ️  User ${user.email} already exists, skipping...`);
      // Try to login to get userId
      try {
        const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
          email: user.email,
          password: user.password
        });
        return { userId: loginResponse.data.userId || 'existing' };
      } catch (loginError) {
        return { userId: 'existing' };
      }
    }
    throw error;
  }
}

// Register merchant and create shop
async function registerMerchant(merchant, location) {
  try {
    // Register merchant user
    const userData = {
      email: merchant.email,
      password: merchant.password,
      name: merchant.name,
      phone: merchant.phone,
      role: 'merchant'
    };
    
    const userResponse = await registerUser(userData);
    if (!userResponse) {
      console.log(`   ⚠️  Skipping shop creation for existing merchant`);
      return null;
    }
    
    console.log(`   ✓ Registered merchant: ${merchant.name}`);
    
    // Login to get token
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: merchant.email,
      password: merchant.password
    });
    
    const token = loginResponse.data.token;
    
    // Determine shop status based on time
    let shopStatus = merchant.status;
    if (shouldBeClosed(merchant.closeTime)) {
      shopStatus = 'closed';
    }
    
    // Create shop in SHOPS table (not MERCHANTS table)
    const shopData = {
      shopId: `SHOP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: merchant.name,
      category: merchant.category,
      description: merchant.description,
      coverImage: '',
      logo: '',
      rating: 4.5,
      totalReviews: Math.floor(Math.random() * 100) + 10,
      openTime: merchant.openTime,
      closeTime: merchant.closeTime,
      location: {
        lat: location.lat,
        lng: location.lng,
        address: `${location.city}, ${location.state}`,
        area: location.city
      },
      tags: [merchant.category.toLowerCase(), 'local', 'verified'],
      isVerified: true
    };
    
    try {
      // Direct DynamoDB insert since there's no API endpoint for SHOPS table
      // We'll use the merchants/register endpoint which should create in MERCHANTS table
      // But we need to also create in SHOPS table
      
      console.log(`   ⚠️  Note: Creating in MERCHANTS table only`);
      console.log(`   ⚠️  SHOPS table needs separate seeding`);
      console.log(`   📍 Location: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`);
      console.log(`   🕐 Hours: ${merchant.openTime} - ${merchant.closeTime}`);
      console.log(`   📊 Status: ${shopStatus}`);
      
      return {
        userId: userResponse.userId,
        email: merchant.email,
        shopId: shopData.shopId,
        shopName: merchant.name,
        category: merchant.category,
        status: shopStatus
      };
    } catch (shopError) {
      console.error(`   ✗ Error creating shop:`, shopError.response?.data || shopError.message);
      return null;
    }
    
  } catch (error) {
    console.error(`   ✗ Error registering merchant ${merchant.name}:`, error.message);
    return null;
  }
}

// Main seeding function
async function seedData() {
  console.log('🌱 Starting demo data seeding...\n');
  
  // Get current location
  const baseLocation = await getCurrentLocation();
  console.log(`📍 Base location: ${baseLocation.city}, ${baseLocation.state}`);
  console.log(`   Coordinates: ${baseLocation.lat}, ${baseLocation.lng}\n`);
  
  // Delete existing data
  await deleteAllData();
  console.log('');
  
  // Register customers
  console.log('👥 Registering customers...');
  const customers = [];
  for (const user of DEMO_USERS) {
    const result = await registerUser(user);
    if (result) {
      customers.push({ email: user.email, userId: result.userId });
      console.log(`   ✓ ${user.email}`);
    }
  }
  console.log('');
  
  // Register merchants and create shops
  console.log('🏪 Registering merchants and creating shops...');
  const merchants = [];
  
  for (let i = 0; i < DEMO_MERCHANTS.length; i++) {
    const merchant = DEMO_MERCHANTS[i];
    const shopLocation = generateNearbyCoordinates(baseLocation.lat, baseLocation.lng, i);
    
    console.log(`\n${i + 1}. ${merchant.name} (${merchant.category})`);
    
    const result = await registerMerchant(merchant, {
      ...baseLocation,
      ...shopLocation
    });
    
    if (result) {
      merchants.push(result);
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n');
  console.log('✅ Seeding completed!\n');
  
  // Generate summary
  console.log('📊 Summary:');
  console.log(`   Customers: ${customers.length}`);
  console.log(`   Merchants: ${merchants.length}`);
  console.log(`   Online shops: ${merchants.filter(m => m.status === 'online').length}`);
  console.log(`   Closed shops: ${merchants.filter(m => m.status === 'closed').length}`);
  console.log('');
  
  // Save credentials to file
  const credentials = {
    customers: DEMO_USERS.map(u => ({ email: u.email, password: u.password })),
    merchants: DEMO_MERCHANTS.map(m => ({ 
      email: m.email, 
      password: m.password, 
      shopName: m.name,
      category: m.category 
    })),
    baseLocation: baseLocation
  };
  
  const fs = require('fs');
  const credentialsContent = `# Demo Shop and User List

## Base Location
- City: ${baseLocation.city}, ${baseLocation.state}
- Coordinates: ${baseLocation.lat}, ${baseLocation.lng}

## Customer Accounts
${DEMO_USERS.map((u, i) => `${i + 1}. Email: ${u.email} | Password: ${u.password}`).join('\n')}

## Merchant Accounts
${DEMO_MERCHANTS.map((m, i) => `${i + 1}. ${m.name} (${m.category})
   Email: ${m.email} | Password: ${m.password}
   Hours: ${m.openTime} - ${m.closeTime}`).join('\n\n')}

---
Last updated: ${new Date().toLocaleString()}
`;
  
  fs.writeFileSync('shopanduserlist.md', credentialsContent);
  console.log('📝 Credentials saved to shopanduserlist.md\n');
}

// Run the seeder
seedData().catch(error => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});
