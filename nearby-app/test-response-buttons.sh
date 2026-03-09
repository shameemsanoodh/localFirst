#!/bin/bash

# Test merchant response buttons
# This script creates a broadcast and tests all three response buttons

echo "🧪 Testing Merchant Response Buttons"
echo "===================================="
echo ""

# Configuration
API_URL="http://localhost:3000/dev"
USER_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2M2VlZTI5OC0wNGZhLTRlYTItOTYyZC00MWMxYTAzMzYyNmMiLCJlbWFpbCI6InVzZXIxQGdtYWlsLmNvbSIsInJvbGVzIjpbImN1c3RvbWVyIl0sImlhdCI6MTc3MzA0MTY5NSwiZXhwIjoxNzczMDQ1Mjk1fQ.x00-9h2Lgskvq7d4c5CuYknQ9uG_7Sq4IhnI2NWt1vc"
MERCHANT_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJNRVJDSEFOVF9JSjdFMjFJVSIsImVtYWlsIjoibW9iaWxlMUBzaG9wLmNvbSIsInJvbGVzIjpbIm1lcmNoYW50Il0sImlhdCI6MTc3MzA0MjExOSwiZXhwIjoxNzczNjQ2OTE5fQ.CRUvt8wHMVoTmRcbRT7fVp5sAJoIb9r2dIl78GWq-Ho"

# Step 1: Create a broadcast
echo "📡 Step 1: Creating broadcast..."
BROADCAST_RESPONSE=$(curl -s -X POST "$API_URL/broadcasts" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{
    "productId": "test-product-123",
    "productName": "iPhone 15 Pro",
    "query": "iPhone 15 Pro",
    "userLat": 12.9716,
    "userLng": 77.5946,
    "radius": 5,
    "priority": "URGENT"
  }')

echo "Response: $BROADCAST_RESPONSE"
BROADCAST_ID=$(echo $BROADCAST_RESPONSE | jq -r '.broadcastId // .broadcast_id // .id // empty')

if [ -z "$BROADCAST_ID" ] || [ "$BROADCAST_ID" == "null" ]; then
  echo "❌ Failed to create broadcast"
  echo "Response: $BROADCAST_RESPONSE"
  exit 1
fi

echo "✅ Broadcast created: $BROADCAST_ID"
echo ""

# Wait a moment
sleep 2

# Step 2: Test "I Have It" button
echo "📱 Step 2: Testing 'I Have It' button..."
RESPONSE_YES=$(curl -s -X POST "$API_URL/broadcasts/$BROADCAST_ID/respond" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $MERCHANT_TOKEN" \
  -d '{
    "response": "YES",
    "message": "Yes, I have it in stock!",
    "price": 999.99,
    "availability": "immediate"
  }')

echo "Response: $RESPONSE_YES"
if echo "$RESPONSE_YES" | jq -e '.success' > /dev/null 2>&1; then
  echo "✅ 'I Have It' button works!"
else
  echo "❌ 'I Have It' button failed"
  echo "Error: $RESPONSE_YES"
fi
echo ""

# Step 3: Create another broadcast for Schedule test
echo "📡 Step 3: Creating second broadcast for Schedule test..."
BROADCAST_RESPONSE_2=$(curl -s -X POST "$API_URL/broadcasts" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{
    "productId": "test-product-456",
    "productName": "MacBook Pro",
    "query": "MacBook Pro",
    "userLat": 12.9716,
    "userLng": 77.5946,
    "radius": 5,
    "priority": "GENERAL"
  }')

BROADCAST_ID_2=$(echo $BROADCAST_RESPONSE_2 | jq -r '.broadcastId // .broadcast_id // .id // empty')

if [ -z "$BROADCAST_ID_2" ] || [ "$BROADCAST_ID_2" == "null" ]; then
  echo "❌ Failed to create second broadcast"
  exit 1
fi

echo "✅ Second broadcast created: $BROADCAST_ID_2"
sleep 1

# Step 4: Test "Schedule" button
echo "📅 Step 4: Testing 'Schedule' button..."
RESPONSE_SCHEDULE=$(curl -s -X POST "$API_URL/broadcasts/$BROADCAST_ID_2/respond" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $MERCHANT_TOKEN" \
  -d '{
    "response": "ALTERNATIVE",
    "message": "Can arrange in 2 days",
    "estimatedTime": "2 days",
    "price": 1299.99
  }')

echo "Response: $RESPONSE_SCHEDULE"
if echo "$RESPONSE_SCHEDULE" | jq -e '.success' > /dev/null 2>&1; then
  echo "✅ 'Schedule' button works!"
else
  echo "❌ 'Schedule' button failed"
  echo "Error: $RESPONSE_SCHEDULE"
fi
echo ""

# Step 5: Create third broadcast for No Stock test
echo "📡 Step 5: Creating third broadcast for No Stock test..."
BROADCAST_RESPONSE_3=$(curl -s -X POST "$API_URL/broadcasts" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{
    "productId": "test-product-789",
    "productName": "iPad Air",
    "query": "iPad Air",
    "userLat": 12.9716,
    "userLng": 77.5946,
    "radius": 5,
    "priority": "INFO"
  }')

BROADCAST_ID_3=$(echo $BROADCAST_RESPONSE_3 | jq -r '.broadcastId // .broadcast_id // .id // empty')

if [ -z "$BROADCAST_ID_3" ] || [ "$BROADCAST_ID_3" == "null" ]; then
  echo "❌ Failed to create third broadcast"
  exit 1
fi

echo "✅ Third broadcast created: $BROADCAST_ID_3"
sleep 1

# Step 6: Test "No Stock" button
echo "❌ Step 6: Testing 'No Stock' button..."
RESPONSE_NO=$(curl -s -X POST "$API_URL/broadcasts/$BROADCAST_ID_3/respond" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $MERCHANT_TOKEN" \
  -d '{
    "response": "NO",
    "message": "Sorry, out of stock"
  }')

echo "Response: $RESPONSE_NO"
if echo "$RESPONSE_NO" | jq -e '.success' > /dev/null 2>&1; then
  echo "✅ 'No Stock' button works!"
else
  echo "❌ 'No Stock' button failed"
  echo "Error: $RESPONSE_NO"
fi
echo ""

echo "=================================="
echo "✅ All response button tests complete!"
echo "=================================="
