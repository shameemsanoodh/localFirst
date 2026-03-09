#!/bin/bash

echo "🔍 Broadcast System Diagnostics"
echo "================================"
echo ""

# Check if backend is running
echo "1. Checking if backend is running..."
if curl -s http://localhost:3000/dev/api/capabilities > /dev/null 2>&1; then
    echo "   ✓ Backend is running"
else
    echo "   ❌ Backend is NOT running"
    echo "   → Start it with: cd backend && npm run offline"
    exit 1
fi
echo ""

# Check if serverless.yml has SHOPS_TABLE
echo "2. Checking serverless.yml configuration..."
if grep -A 5 "createBroadcastV2:" backend/serverless.yml | grep -q "SHOPS_TABLE"; then
    echo "   ✓ SHOPS_TABLE environment variable is configured"
else
    echo "   ❌ SHOPS_TABLE is missing from createBroadcastV2 function"
    echo "   → This has been fixed in the code, but backend needs restart"
fi
echo ""

# Check if TypeScript is compiled
echo "3. Checking if backend is compiled..."
if [ -f "backend/dist/src/broadcasts/createBroadcast.js" ]; then
    echo "   ✓ Backend is compiled"
    
    # Check if the compiled file has the local dev check
    if grep -q "isLocal" backend/dist/src/broadcasts/createBroadcast.js; then
        echo "   ✓ Local development mode is enabled (Bedrock skipped)"
    else
        echo "   ⚠ Local development mode not found - may try to call Bedrock"
    fi
else
    echo "   ❌ Backend is not compiled"
    echo "   → Run: cd backend && npm run build"
    exit 1
fi
echo ""

# Test broadcast creation
echo "4. Testing broadcast creation..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "http://localhost:3000/dev/api/broadcasts" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test-user-123",
    "query": "mobile case",
    "location": {"lat": 10.5742336, "lng": 76.1659392},
    "radius_km": 5
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "201" ]; then
    echo "   ✓ Broadcast created successfully!"
    echo ""
    echo "   Response:"
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
    
    BROADCAST_ID=$(echo "$BODY" | python3 -c "import sys, json; print(json.load(sys.stdin).get('broadcast_id', 'N/A'))" 2>/dev/null)
    MATCHED_COUNT=$(echo "$BODY" | python3 -c "import sys, json; print(json.load(sys.stdin).get('matched_count', 0))" 2>/dev/null)
    
    echo ""
    echo "   📊 Broadcast ID: $BROADCAST_ID"
    echo "   📊 Matched shops: $MATCHED_COUNT"
    
    if [ "$MATCHED_COUNT" = "0" ]; then
        echo ""
        echo "   ⚠ WARNING: No shops matched!"
        echo "   → Check if shops are seeded with: node seed-shops-dynamodb.js"
        echo "   → Verify shop locations are within 5km of search location"
    fi
else
    echo "   ❌ Broadcast creation failed (HTTP $HTTP_CODE)"
    echo ""
    echo "   Response:"
    echo "$BODY"
    echo ""
    echo "   🔧 SOLUTION:"
    echo "   1. Stop the backend (Ctrl+C)"
    echo "   2. Restart with: cd backend && npm run offline"
    echo "   3. Run this diagnostic again"
fi

echo ""
echo "================================"
echo "Diagnostic Complete"
