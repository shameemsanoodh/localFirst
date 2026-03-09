#!/bin/bash

echo "🧪 Testing Broadcast Flow"
echo "========================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_BASE="http://localhost:3000/dev"

# Step 1: Create a broadcast for "mobile case"
echo "📡 Step 1: Creating broadcast for 'mobile case'..."
echo ""

BROADCAST_RESPONSE=$(curl -s -X POST "${API_BASE}/api/broadcasts" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test-user-123",
    "query": "mobile case",
    "location": {
      "lat": 10.5742336,
      "lng": 76.1659392
    },
    "radius_km": 5
  }')

echo "Response:"
echo "$BROADCAST_RESPONSE" | jq '.' 2>/dev/null || echo "$BROADCAST_RESPONSE"
echo ""

# Extract broadcast_id
BROADCAST_ID=$(echo "$BROADCAST_RESPONSE" | jq -r '.broadcast_id' 2>/dev/null)

if [ "$BROADCAST_ID" = "null" ] || [ -z "$BROADCAST_ID" ]; then
  echo -e "${RED}❌ Failed to create broadcast${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Broadcast created: $BROADCAST_ID${NC}"
echo ""

# Extract matched merchant IDs
MERCHANT_IDS=$(echo "$BROADCAST_RESPONSE" | jq -r '.merchant_ids[]' 2>/dev/null)
MATCHED_COUNT=$(echo "$BROADCAST_RESPONSE" | jq -r '.matched_count' 2>/dev/null)

echo "📊 Broadcast Details:"
echo "   Matched shops: $MATCHED_COUNT"
echo "   Merchant IDs: $MERCHANT_IDS"
echo ""

# Step 2: Login as Mobile Hub merchant
echo "🔐 Step 2: Logging in as Mobile Hub merchant..."
echo ""

LOGIN_RESPONSE=$(curl -s -X POST "${API_BASE}/merchants/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "mobile1@shop.com",
    "passcode": "123456"
  }')

echo "Login Response:"
echo "$LOGIN_RESPONSE" | jq '.' 2>/dev/null || echo "$LOGIN_RESPONSE"
echo ""

# Extract token and merchantId
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token' 2>/dev/null)
MERCHANT_ID=$(echo "$LOGIN_RESPONSE" | jq -r '.merchant.merchantId' 2>/dev/null)

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ Failed to login${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Logged in as merchant: $MERCHANT_ID${NC}"
echo ""

# Step 3: Check if merchant received the broadcast
echo "📬 Step 3: Checking merchant's broadcasts..."
echo ""

MERCHANT_BROADCASTS=$(curl -s -X GET "${API_BASE}/merchant/broadcasts?since=0" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "Merchant Broadcasts Response:"
echo "$MERCHANT_BROADCASTS" | jq '.' 2>/dev/null || echo "$MERCHANT_BROADCASTS"
echo ""

# Count broadcasts
BROADCAST_COUNT=$(echo "$MERCHANT_BROADCASTS" | jq '.broadcasts | length' 2>/dev/null)

if [ "$BROADCAST_COUNT" = "0" ] || [ "$BROADCAST_COUNT" = "null" ]; then
  echo -e "${RED}❌ Merchant did NOT receive the broadcast${NC}"
  echo ""
  echo "🔍 Debugging Info:"
  echo "   Broadcast ID: $BROADCAST_ID"
  echo "   Merchant ID: $MERCHANT_ID"
  echo "   Matched Merchant IDs from broadcast: $MERCHANT_IDS"
  echo ""
  echo "   Check if merchant ID matches any of the matched IDs above"
else
  echo -e "${GREEN}✓ Merchant received $BROADCAST_COUNT broadcast(s)${NC}"
  
  # Check if our broadcast is in the list
  HAS_OUR_BROADCAST=$(echo "$MERCHANT_BROADCASTS" | jq --arg bid "$BROADCAST_ID" '.broadcasts[] | select(.broadcastId == $bid or .broadcast_id == $bid)' 2>/dev/null)
  
  if [ -n "$HAS_OUR_BROADCAST" ]; then
    echo -e "${GREEN}✓ Our broadcast ($BROADCAST_ID) is in the list!${NC}"
  else
    echo -e "${YELLOW}⚠ Merchant has broadcasts, but not our specific one${NC}"
  fi
fi

echo ""
echo "========================="
echo "Test Complete!"
