#!/bin/bash

echo "🎨 TESTING PRIORITY BROADCASTS"
echo "==============================="
echo ""

read -p "Enter USER token: " USER_TOKEN
echo ""

if [ -z "$USER_TOKEN" ]; then
  echo "❌ User token required"
  exit 1
fi

API_URL="http://localhost:3000/dev"

# Create URGENT broadcast (RED)
echo "1️⃣ Creating URGENT broadcast (RED card)..."
curl -s -X POST "$API_URL/broadcasts" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{
    "productId": "urgent-001",
    "productName": "Emergency medicine needed",
    "query": "Need paracetamol urgently - fever 103°F",
    "priority": "urgent",
    "userLat": 12.9662976,
    "userLng": 77.5192576,
    "radius": 5
  }' | python3 -m json.tool
echo ""
echo "✓ URGENT broadcast created"
echo ""

sleep 1

# Create GENERAL broadcast (GREEN)
echo "2️⃣ Creating GENERAL broadcast (GREEN card)..."
curl -s -X POST "$API_URL/broadcasts" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{
    "productId": "general-001",
    "productName": "Mobile phone case",
    "query": "Looking for iPhone 14 Pro case - any color",
    "priority": "general",
    "userLat": 12.9662976,
    "userLng": 77.5192576,
    "radius": 5
  }' | python3 -m json.tool
echo ""
echo "✓ GENERAL broadcast created"
echo ""

sleep 1

# Create INFO broadcast (YELLOW)
echo "3️⃣ Creating INFO broadcast (YELLOW card)..."
curl -s -X POST "$API_URL/broadcasts" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{
    "productId": "info-001",
    "productName": "Product inquiry",
    "query": "Do you have wireless earbuds? Just checking availability",
    "priority": "info",
    "userLat": 12.9662976,
    "userLng": 77.5192576,
    "radius": 5
  }' | python3 -m json.tool
echo ""
echo "✓ INFO broadcast created"
echo ""

echo "==============================="
echo "✅ All 3 priority broadcasts created!"
echo ""
echo "Check merchant app to see:"
echo "  🔴 RED card - URGENT: Emergency medicine"
echo "  🟢 GREEN card - GENERAL: iPhone case"
echo "  🟡 YELLOW card - INFO: Wireless earbuds"
echo ""
echo "Cards should be sorted: URGENT → GENERAL → INFO"
