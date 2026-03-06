#!/bin/bash

API_URL="https://bbplthp3b8.execute-api.ap-south-1.amazonaws.com/dev"

echo "🧪 Testing 3-Layer AI Pipeline"
echo "================================"
echo ""

# Test 1: Intent-based query (headache)
echo "Test 1: 'my head is killing me'"
echo "Expected: Pharmacy, pain relief medicine"
curl -X POST "$API_URL/ai/detect-category" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "my head is killing me"
  }' | jq '.'
echo ""
echo "---"
echo ""

# Test 2: Mixed language (Tamil-English)
echo "Test 2: 'nandhi blue illai'"
echo "Expected: Groceries, Nandhi blue milk"
curl -X POST "$API_URL/ai/detect-category" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "nandhi blue illai"
  }' | jq '.'
echo ""
echo "---"
echo ""

# Test 3: Context-based query with user profile
echo "Test 3: 'something cool for my pixel' (with Pixel 7 profile)"
echo "Expected: Mobile, accessories for Pixel 7"
curl -X POST "$API_URL/ai/detect-category" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "something cool for my pixel",
    "userProfile": {
      "devices": {
        "phone": {
          "model": "Pixel 7",
          "brand": "Google"
        }
      }
    }
  }' | jq '.'
echo ""
echo "---"
echo ""

# Test 4: Ambiguous query
echo "Test 4: 'wife birthday tomorrow'"
echo "Expected: Could be flowers, cake, jewelry"
curl -X POST "$API_URL/ai/detect-category" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "wife birthday tomorrow"
  }' | jq '.'
echo ""
echo "---"
echo ""

# Test 5: Simple query (should still work)
echo "Test 5: 'tomato'"
echo "Expected: Groceries"
curl -X POST "$API_URL/ai/detect-category" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "tomato"
  }' | jq '.'
echo ""
echo "---"
echo ""

# Test 6: Bike context query
echo "Test 6: 'bike ka oil khatam' (with KTM Duke 390 profile)"
echo "Expected: Automobile, engine oil for KTM Duke 390"
curl -X POST "$API_URL/ai/detect-category" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "bike ka oil khatam",
    "userProfile": {
      "vehicles": {
        "bike": {
          "model": "Duke 390",
          "brand": "KTM"
        }
      }
    }
  }' | jq '.'
echo ""

echo "================================"
echo "✅ All tests completed!"
