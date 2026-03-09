#!/bin/bash

# Test Merchant Response System
# This script tests the complete flow: create broadcast -> merchant responds -> customer sees response

API_URL="http://localhost:3000/dev"

echo "=== Testing Merchant Response System ==="
echo ""

# Step 1: Get auth tokens (you need to replace these with real tokens from login)
echo "📝 Note: You need to login first and get real tokens"
echo "   - Customer app: Login and copy token from localStorage"
echo "   - Merchant app: Login and copy token from localStorage"
echo ""

read -p "Enter CUSTOMER token: " USER_TOKEN
read -p "Enter MERCHANT token: " MERCHANT_TOKEN

echo ""
echo "=== Step 1: Create Broadcast ==="
BROADCAST_RESPONSE=$(curl -s -X POST "$API_URL/broadcasts" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{
    "productId": "test-product-123",
    "productName": "Mobile Case",
    "query": "Mobile case for iPhone 14",
    "userLat": 12.9716,
    "userLng": 77.5946,
    "radius": 5,
    "priority": "urgent"
  }')

echo "$BROADCAST_RESPONSE" | jq '.'

BROADCAST_ID=$(echo "$BROADCAST_RESPONSE" | jq -r '.broadcastId')

if [ "$BROADCAST_ID" == "null" ] || [ -z "$BROADCAST_ID" ]; then
  echo "❌ Failed to create broadcast"
  exit 1
fi

echo ""
echo "✅ Broadcast created: $BROADCAST_ID"
echo ""

# Step 2: Merchant responds with "I Have It"
echo "=== Step 2: Merchant Responds (I Have It) ==="
RESPONSE_YES=$(curl -s -X POST "$API_URL/broadcasts/$BROADCAST_ID/respond" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $MERCHANT_TOKEN" \
  -d '{
    "responseType": "YES",
    "price": 299
  }')

echo "$RESPONSE_YES" | jq '.'
echo ""

# Step 3: Get broadcast details to see responses
echo "=== Step 3: Get Broadcast with Responses ==="
BROADCAST_DETAILS=$(curl -s -X GET "$API_URL/broadcasts/$BROADCAST_ID" \
  -H "Authorization: Bearer $USER_TOKEN")

echo "$BROADCAST_DETAILS" | jq '.'
echo ""

# Check if response was recorded
RESPONSE_COUNT=$(echo "$BROADCAST_DETAILS" | jq '.responses | length')
echo "📊 Total responses: $RESPONSE_COUNT"

if [ "$RESPONSE_COUNT" -gt 0 ]; then
  echo "✅ Merchant response recorded successfully!"
  echo ""
  echo "Response details:"
  echo "$BROADCAST_DETAILS" | jq '.responses[0]'
else
  echo "❌ No responses found"
fi

echo ""
echo "=== Test Complete ==="
