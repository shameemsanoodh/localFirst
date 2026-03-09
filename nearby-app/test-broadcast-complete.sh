#!/bin/bash

echo "🔍 COMPLETE BROADCAST DEBUG TEST"
echo "================================="
echo ""

API_URL="http://localhost:3000/dev"

# Step 1: Create broadcast as user
echo "Step 1: Creating broadcast..."
echo ""

BROADCAST_RESPONSE=$(curl -s -X POST "$API_URL/broadcasts" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-user-token" \
  -d '{
    "productId": "test-product-123",
    "userLat": 12.9662976,
    "userLng": 77.5192576,
    "radius": 5
  }')

echo "Broadcast Response:"
echo "$BROADCAST_RESPONSE" | python3 -m json.tool
echo ""

BROADCAST_ID=$(echo "$BROADCAST_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('broadcastId', ''))" 2>/dev/null)

if [ -z "$BROADCAST_ID" ]; then
  echo "❌ Failed to create broadcast"
  exit 1
fi

echo "✓ Broadcast created: $BROADCAST_ID"
echo ""

# Step 2: Check what merchant IDs were matched
echo "Step 2: Checking matched merchant IDs..."
MATCHED_IDS=$(echo "$BROADCAST_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(json.dumps(data.get('matched_merchant_ids', [])))" 2>/dev/null)
echo "Matched merchant IDs: $MATCHED_IDS"
echo ""

# Step 3: Poll as merchant (with since=0 to get all broadcasts)
echo "Step 3: Polling as merchant (since=0)..."
echo ""

MERCHANT_RESPONSE=$(curl -s -X GET "$API_URL/merchant/broadcasts?since=0" \
  -H "Authorization: Bearer test-merchant-token")

echo "Merchant Broadcasts Response:"
echo "$MERCHANT_RESPONSE" | python3 -m json.tool
echo ""

BROADCAST_COUNT=$(echo "$MERCHANT_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(len(data.get('broadcasts', [])))" 2>/dev/null)

echo "Found $BROADCAST_COUNT broadcasts for merchant"
echo ""

# Step 4: Check backend logs
echo "Step 4: Check backend logs for details"
echo "Look for:"
echo "  - 'Matched X merchants: [...]' in create broadcast"
echo "  - 'Items from DynamoDB:' in getMerchantBroadcasts"
echo "  - 'Broadcast X matches' or 'No broadcasts matched'"
echo ""

echo "================================="
echo "🏁 Test Complete"
echo ""
echo "Next steps:"
echo "1. Check backend terminal for detailed logs"
echo "2. Check merchant app console for '🔍 Merchant broadcasts API response'"
echo "3. If broadcasts array is empty, the issue is in matching/storage"
echo "4. If broadcasts array has data but card doesn't show, issue is in UI"
