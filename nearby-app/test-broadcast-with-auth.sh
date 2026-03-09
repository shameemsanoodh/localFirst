#!/bin/bash

echo "🔍 COMPLETE BROADCAST DEBUG TEST (WITH REAL AUTH)"
echo "=================================================="
echo ""

API_URL="http://localhost:3000/dev"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Login as user to get real token
echo -e "${BLUE}Step 1: Logging in as user...${NC}"
USER_LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@test.com",
    "password": "password123"
  }')

echo "User Login Response:"
echo "$USER_LOGIN_RESPONSE" | python3 -m json.tool
echo ""

USER_TOKEN=$(echo "$USER_LOGIN_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('token', data.get('data', {}).get('token', '')))" 2>/dev/null)

if [ -z "$USER_TOKEN" ]; then
  echo -e "${RED}❌ Failed to get user token${NC}"
  echo "Response was: $USER_LOGIN_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✓ User token obtained: ${USER_TOKEN:0:20}...${NC}"
echo ""

# Step 2: Login as merchant to get real token
echo -e "${BLUE}Step 2: Logging in as merchant (Mobile Hub)...${NC}"
MERCHANT_LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/merchants/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "mobile.hub@test.com",
    "passcode": "123456"
  }')

echo "Merchant Login Response:"
echo "$MERCHANT_LOGIN_RESPONSE" | python3 -m json.tool
echo ""

MERCHANT_TOKEN=$(echo "$MERCHANT_LOGIN_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('token', data.get('data', {}).get('token', '')))" 2>/dev/null)

if [ -z "$MERCHANT_TOKEN" ]; then
  echo -e "${RED}❌ Failed to get merchant token${NC}"
  echo "Response was: $MERCHANT_LOGIN_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✓ Merchant token obtained: ${MERCHANT_TOKEN:0:20}...${NC}"
echo ""

# Get merchant ID from token for verification
MERCHANT_ID=$(echo "$MERCHANT_LOGIN_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('merchantId', data.get('data', {}).get('merchantId', data.get('user', {}).get('userId', ''))))" 2>/dev/null)
echo -e "${YELLOW}Merchant ID: $MERCHANT_ID${NC}"
echo ""

# Step 3: Create broadcast as user
echo -e "${BLUE}Step 3: Creating broadcast...${NC}"
echo ""

BROADCAST_RESPONSE=$(curl -s -X POST "$API_URL/broadcasts" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{
    "productId": "test-product-123",
    "userLat": 12.9662976,
    "userLng": 77.5192576,
    "radius": 5
  }')

echo -e "${YELLOW}=== BROADCAST CREATION RESPONSE ===${NC}"
echo "$BROADCAST_RESPONSE" | python3 -m json.tool
echo ""

BROADCAST_ID=$(echo "$BROADCAST_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('broadcastId', ''))" 2>/dev/null)

if [ -z "$BROADCAST_ID" ]; then
  echo -e "${RED}❌ Failed to create broadcast${NC}"
  echo "Check if response has error"
  exit 1
fi

echo -e "${GREEN}✓ Broadcast created: $BROADCAST_ID${NC}"
echo ""

# Step 4: Check what merchant IDs were matched
echo -e "${BLUE}Step 4: Checking matched merchant IDs...${NC}"
MATCHED_IDS=$(echo "$BROADCAST_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(json.dumps(data.get('matched_merchant_ids', [])))" 2>/dev/null)
echo -e "${YELLOW}Matched merchant IDs: $MATCHED_IDS${NC}"
echo ""

# Check if our merchant is in the list
IS_MATCHED=$(echo "$MATCHED_IDS" | python3 -c "import sys, json; ids=json.load(sys.stdin); print('$MERCHANT_ID' in ids)" 2>/dev/null)
if [ "$IS_MATCHED" = "True" ]; then
  echo -e "${GREEN}✓ Our merchant ($MERCHANT_ID) is in the matched list!${NC}"
else
  echo -e "${RED}❌ Our merchant ($MERCHANT_ID) is NOT in the matched list${NC}"
  echo "This means the merchant won't receive the broadcast"
fi
echo ""

# Step 5: Poll as merchant (with since=0 to get all broadcasts)
echo -e "${BLUE}Step 5: Polling as merchant (since=0)...${NC}"
echo ""

MERCHANT_RESPONSE=$(curl -s -X GET "$API_URL/merchant/broadcasts?since=0" \
  -H "Authorization: Bearer $MERCHANT_TOKEN")

echo -e "${YELLOW}=== MERCHANT BROADCASTS RESPONSE ===${NC}"
echo "$MERCHANT_RESPONSE" | python3 -m json.tool
echo ""

BROADCAST_COUNT=$(echo "$MERCHANT_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(len(data.get('broadcasts', [])))" 2>/dev/null)

echo -e "${YELLOW}Found $BROADCAST_COUNT broadcasts for merchant${NC}"
echo ""

if [ "$BROADCAST_COUNT" -gt 0 ]; then
  echo -e "${GREEN}✓ Merchant received broadcasts!${NC}"
  echo ""
  echo "Checking if our broadcast is in the list..."
  HAS_OUR_BROADCAST=$(echo "$MERCHANT_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(any(b.get('broadcastId') == '$BROADCAST_ID' for b in data.get('broadcasts', [])))" 2>/dev/null)
  
  if [ "$HAS_OUR_BROADCAST" = "True" ]; then
    echo -e "${GREEN}✓ Our broadcast ($BROADCAST_ID) is in the merchant's list!${NC}"
  else
    echo -e "${RED}❌ Our broadcast ($BROADCAST_ID) is NOT in the merchant's list${NC}"
  fi
else
  echo -e "${RED}❌ Merchant did not receive any broadcasts${NC}"
  echo ""
  echo "Possible reasons:"
  echo "  1. matched_merchant_ids was not stored correctly"
  echo "  2. The merchant ID doesn't match"
  echo "  3. The filtering logic is wrong"
  echo "  4. The 'since' timestamp is filtering them out"
fi

echo ""
echo "=================================================="
echo -e "${BLUE}🏁 Test Complete${NC}"
echo ""
echo "Next steps:"
echo "1. Check backend terminal for detailed logs:"
echo "   - 'Matched X merchants: [...]' in create broadcast"
echo "   - '=== DYNAMODB SCAN RESULTS ===' in getMerchantBroadcasts"
echo "   - 'Broadcast X matches' or 'No broadcasts matched'"
echo ""
echo "2. Check merchant app console (F12) for:"
echo "   - '🔍 Merchant broadcasts API response'"
echo "   - '📦 Broadcasts array'"
echo ""
echo "3. If broadcasts array is empty, issue is in backend matching/storage"
echo "4. If broadcasts array has data but card doesn't show, issue is in UI"
