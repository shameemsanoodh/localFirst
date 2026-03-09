#!/bin/bash

echo "🔍 BROADCAST DEBUG TEST"
echo "======================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

API_URL="http://localhost:3000/dev"

# Step 1: Get user token
echo -e "${BLUE}Step 1: Login as user${NC}"
USER_TOKEN=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@test.com",
    "password": "password123"
  }' | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('token') or data.get('data', {}).get('token', ''))")

if [ -z "$USER_TOKEN" ]; then
  echo -e "${RED}❌ Failed to get user token${NC}"
  exit 1
fi
echo -e "${GREEN}✓ User token obtained${NC}"
echo ""

# Step 2: Create a broadcast
echo -e "${BLUE}Step 2: Creating broadcast for 'mobile case'${NC}"
BROADCAST_RESPONSE=$(curl -s -X POST "$API_URL/broadcasts" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{
    "productId": "test-product-123",
    "userLat": 12.9662976,
    "userLng": 77.5192576,
    "radius": 5
  }')

echo "Broadcast Response:"
echo "$BROADCAST_RESPONSE" | python3 -m json.tool
echo ""

BROADCAST_ID=$(echo "$BROADCAST_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('broadcastId') or data.get('broadcast_id') or data.get('data', {}).get('broadcastId', ''))")

if [ -z "$BROADCAST_ID" ]; then
  echo -e "${RED}❌ Failed to create broadcast${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Broadcast created: $BROADCAST_ID${NC}"
echo ""

# Check matched_merchant_ids in response
MATCHED_MERCHANTS=$(echo "$BROADCAST_RESPONSE" | jq -r '.matched_merchant_ids // .data.matched_merchant_ids // []')
echo -e "${YELLOW}Matched merchant IDs in response:${NC}"
echo "$MATCHED_MERCHANTS" | jq '.'
echo ""

# Step 3: Get merchant token
echo -e "${BLUE}Step 3: Login as merchant${NC}"
MERCHANT_TOKEN=$(curl -s -X POST "$API_URL/merchants/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "mobile.hub@test.com",
    "passcode": "123456"
  }' | jq -r '.token // .data.token // empty')

if [ -z "$MERCHANT_TOKEN" ]; then
  echo -e "${RED}❌ Failed to get merchant token${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Merchant token obtained${NC}"
echo ""

# Step 4: Check merchant broadcasts with since=0
echo -e "${BLUE}Step 4: Fetching merchant broadcasts (since=0)${NC}"
MERCHANT_BROADCASTS=$(curl -s -X GET "$API_URL/merchant/broadcasts?since=0" \
  -H "Authorization: Bearer $MERCHANT_TOKEN")

echo "Merchant Broadcasts Response:"
echo "$MERCHANT_BROADCASTS" | jq '.'
echo ""

BROADCAST_COUNT=$(echo "$MERCHANT_BROADCASTS" | jq '.broadcasts | length')
echo -e "${YELLOW}Found $BROADCAST_COUNT broadcasts for merchant${NC}"
echo ""

# Step 5: Check if our broadcast is in the list
if [ "$BROADCAST_COUNT" -gt 0 ]; then
  echo -e "${GREEN}✓ Merchant received broadcasts!${NC}"
  echo ""
  echo "Broadcast details:"
  echo "$MERCHANT_BROADCASTS" | jq '.broadcasts[] | {broadcastId, productId, matched_merchant_ids, created_at}'
else
  echo -e "${RED}❌ Merchant did not receive any broadcasts${NC}"
  echo ""
  echo "This means either:"
  echo "1. matched_merchant_ids was not stored correctly"
  echo "2. The merchant ID doesn't match"
  echo "3. The filtering logic is wrong"
fi

echo ""
echo "======================="
echo "🏁 Test Complete"
