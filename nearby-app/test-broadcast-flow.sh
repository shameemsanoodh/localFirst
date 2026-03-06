#!/bin/bash

# Test the complete broadcast flow
# 1. Detect category for "milk"
# 2. Create category-filtered broadcast
# 3. Verify shops are matched

API_URL="https://aqvvvvvvvv.execute-api.ap-south-1.amazonaws.com/dev"

echo "========================================="
echo "Testing Broadcast Flow for 'milk'"
echo "========================================="
echo ""

# Step 1: Detect category
echo "Step 1: Detecting category for 'milk'..."
CATEGORY_RESPONSE=$(curl -s -X POST "${API_URL}/ai/detect-category" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "milk"
  }')

echo "Category Detection Response:"
echo "$CATEGORY_RESPONSE" | jq '.'
echo ""

DETECTED_CATEGORY=$(echo "$CATEGORY_RESPONSE" | jq -r '.data.category')
echo "Detected Category: $DETECTED_CATEGORY"
echo ""

# Step 2: Create category-filtered broadcast
echo "Step 2: Creating category-filtered broadcast..."
BROADCAST_RESPONSE=$(curl -s -X POST "${API_URL}/broadcasts/category-filtered" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{
    "query": "milk",
    "detectedCategory": "'"$DETECTED_CATEGORY"'",
    "userLat": 12.9352,
    "userLng": 77.6245,
    "radius": 3,
    "locality": "Koramangala"
  }')

echo "Broadcast Response:"
echo "$BROADCAST_RESPONSE" | jq '.'
echo ""

MATCHED_COUNT=$(echo "$BROADCAST_RESPONSE" | jq -r '.data.matchedShopsCount')
BROADCAST_ID=$(echo "$BROADCAST_RESPONSE" | jq -r '.data.broadcast.broadcastId')

echo "========================================="
echo "Summary:"
echo "========================================="
echo "Query: milk"
echo "Detected Category: $DETECTED_CATEGORY"
echo "Matched Shops: $MATCHED_COUNT"
echo "Broadcast ID: $BROADCAST_ID"
echo ""

if [ "$MATCHED_COUNT" -gt 0 ]; then
  echo "✅ SUCCESS: Found $MATCHED_COUNT shops matching category '$DETECTED_CATEGORY'"
  echo ""
  echo "Matched Shop IDs:"
  echo "$BROADCAST_RESPONSE" | jq -r '.data.matchedShopIds[]'
else
  echo "❌ FAILED: No shops found matching category '$DETECTED_CATEGORY'"
  echo ""
  echo "This might be because:"
  echo "1. No shops in the SHOPS table match the category"
  echo "2. No shops within 3km radius"
  echo "3. Shops are not verified"
fi
