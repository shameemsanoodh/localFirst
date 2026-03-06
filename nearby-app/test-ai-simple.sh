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
  -d '{"query": "my head is killing me"}'
echo ""
echo "---"
echo ""

# Test 2: Mixed language (Tamil-English)
echo "Test 2: 'nandhi blue illai'"
echo "Expected: Groceries, Nandhi blue milk"
curl -X POST "$API_URL/ai/detect-category" \
  -H "Content-Type: application/json" \
  -d '{"query": "nandhi blue illai"}'
echo ""
echo "---"
echo ""

# Test 3: Simple query
echo "Test 3: 'tomato'"
echo "Expected: Groceries"
curl -X POST "$API_URL/ai/detect-category" \
  -H "Content-Type: application/json" \
  -d '{"query": "tomato"}'
echo ""
echo "---"
echo ""

# Test 4: Ambiguous query
echo "Test 4: 'wife birthday tomorrow'"
echo "Expected: Could be flowers, cake, jewelry"
curl -X POST "$API_URL/ai/detect-category" \
  -H "Content-Type: application/json" \
  -d '{"query": "wife birthday tomorrow"}'
echo ""

echo "================================"
echo "✅ All tests completed!"
