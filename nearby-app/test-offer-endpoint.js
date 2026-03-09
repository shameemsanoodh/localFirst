#!/usr/bin/env node

const API_BASE_URL = 'http://localhost:3000/dev';

async function testOfferEndpoint() {
  console.log('🧪 Testing Merchant Offer Endpoint\n');

  // Step 1: Login as merchant
  console.log('Step 1: Logging in as merchant...');
  const loginResponse = await fetch(`${API_BASE_URL}/merchants/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'electronics1@shop.com',
      passcode: '123456'
    })
  });

  const loginData = await loginResponse.json();
  
  if (!loginResponse.ok) {
    console.error('❌ Login failed:', loginData);
    return;
  }

  console.log('✅ Login successful');
  console.log('   Merchant:', loginData.merchant.shopName);
  console.log('   Token:', loginData.token.substring(0, 20) + '...\n');

  // Step 2: Create offer
  console.log('Step 2: Creating broadcast offer...');
  const offerResponse = await fetch(`${API_BASE_URL}/merchant/offers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${loginData.token}`
    },
    body: JSON.stringify({
      offer: '20% off on mobile cases',
      message: 'Limited time offer!',
      validityHours: 12
    })
  });

  const offerData = await offerResponse.json();

  if (!offerResponse.ok) {
    console.error('❌ Offer creation failed:', offerData);
    console.error('   Status:', offerResponse.status);
    console.error('   Response:', JSON.stringify(offerData, null, 2));
    return;
  }

  console.log('✅ Offer created successfully!');
  console.log('   Offer ID:', offerData.data.offerId);
  console.log('   Expires:', offerData.data.expiresAt);
  console.log('\n');

  // Step 3: Get active offers
  console.log('Step 3: Fetching active offers...');
  const activeOffersResponse = await fetch(
    `${API_BASE_URL}/offers/active?lat=12.9787757&lng=77.5513751&radius=10`
  );

  const activeOffersData = await activeOffersResponse.json();

  if (!activeOffersResponse.ok) {
    console.error('❌ Failed to fetch offers:', activeOffersData);
    return;
  }

  console.log('✅ Active offers fetched successfully!');
  console.log('   Count:', activeOffersData.data.count);
  if (activeOffersData.data.offers.length > 0) {
    console.log('   Latest offer:', activeOffersData.data.offers[0].offer);
  }
}

testOfferEndpoint().catch(console.error);
