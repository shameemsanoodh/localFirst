#!/bin/bash

echo "🔍 BROADCAST DEBUG TEST"
echo "======================="
echo ""
echo "INSTRUCTIONS:"
echo "1. Login to customer app and copy your JWT token from localStorage or Network tab"
echo "2. Login to merchant app and copy your JWT token"
echo "3. Paste them below when prompted"
echo ""

# Prompt for tokens
read -p "Enter USER token: " USER_TOKEN
echo ""
read -p "Enter MERCHANT token: " MERCHANT_TOKEN
echo ""

if [ -z "$USER_TOKEN" ] || [ -z "$MERCHANT_TOKEN" ]; then
  echo "❌ Both tokens are required"
  exit 1
fi

API_URL="http://localhost:3000/dev"

echo "=================================================="
echo "Creating broadcast..."
echo ""

BROADCAST_RESPONSE=$(curl -s -X POST "$API_URL/broadcasts" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{
    "productId": "mobile-case-001",
    "productName": "Mobile case for iPhone",
    "query": "Looking for iPhone 14 Pro case",
    "userLat": 12.9662976,
    "userLng": 77.5192576,
    "radius": 5
  }')

echo "=== BROADCAST CREATION RESPONSE ==="
echo "$BROADCAST_RESPONSE" | python3 -m json.tool
echo ""

BROADCAST_ID=$(echo "$BROADCAST_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('broadcastId', ''))" 2>/dev/null)

if [ -z "$BROADCAST_ID" ]; then
  echo "❌ Failed to create broadcast"
  exit 1
fi

echo "✓ Broadcast ID: $BROADCAST_ID"
echo ""

# Check matched merchants
MATCHED_IDS=$(echo "$BROADCAST_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(json.dumps(data.get('matched_merchant_ids', [])))" 2>/dev/null)
echo "Matched merchant IDs: $MATCHED_IDS"
echo ""

echo "=================================================="
echo "Polling as merchant..."
echo ""

MERCHANT_RESPONSE=$(curl -s -X GET "$API_URL/merchant/broadcasts?since=0" \
  -H "Authorization: Bearer $MERCHANT_TOKEN")

echo "=== MERCHANT BROADCASTS RESPONSE ==="
echo "$MERCHANT_RESPONSE" | python3 -m json.tool
echo ""

BROADCAST_COUNT=$(echo "$MERCHANT_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(len(data.get('broadcasts', [])))" 2>/dev/null)

echo "Found $BROADCAST_COUNT broadcasts for merchant"
echo ""

if [ "$BROADCAST_COUNT" -gt 0 ]; then
  echo "✓ SUCCESS: Merchant received broadcasts!"
else
  echo "❌ FAIL: Merchant did not receive any broadcasts"
  echo ""
  echo "Check backend logs for:"
  echo "  - 'Matched X merchants: [...]'"
  echo "  - '=== DYNAMODB SCAN RESULTS ==='"
fi

echo ""
echo "=================================================="
echo "Test complete. Check backend logs for details."
