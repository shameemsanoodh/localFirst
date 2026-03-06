#!/bin/bash

API_URL="https://bbplthp3b8.execute-api.ap-south-1.amazonaws.com/dev/ai/detect-category"

echo "=========================================="
echo "Testing AI Category Detection"
echo "=========================================="
echo ""

test_query() {
  local query=$1
  local expected=$2
  
  echo "Testing: \"$query\""
  result=$(curl -s -X POST $API_URL \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"$query\"}" | jq -r '.data.category')
  
  if [ "$result" == "$expected" ]; then
    echo "✅ PASS: $result"
  else
    echo "❌ FAIL: Expected $expected, got $result"
  fi
  echo ""
}

echo "=== Groceries Tests ==="
test_query "tomato" "Groceries"
test_query "onion" "Groceries"
test_query "milk" "Groceries"
test_query "rice" "Groceries"
test_query "dal" "Groceries"
test_query "atta" "Groceries"
test_query "banana" "Groceries"
test_query "egg" "Groceries"

echo "=== Pharmacy Tests ==="
test_query "paracetamol" "Pharmacy"
test_query "medicine" "Pharmacy"
test_query "tablet" "Pharmacy"
test_query "bandage" "Pharmacy"

echo "=== Electronics Tests ==="
test_query "laptop" "Electronics"
test_query "charger" "Electronics"
test_query "tv" "Electronics"
test_query "fridge" "Electronics"

echo "=== Mobile Tests ==="
test_query "phone case" "Mobile"
test_query "screen protector" "Mobile"
test_query "tempered glass" "Mobile"

echo "=== Hardware Tests ==="
test_query "paint" "Hardware"
test_query "cement" "Hardware"
test_query "drill" "Hardware"

echo "=== Automobile Tests ==="
test_query "helmet" "Automobile"
test_query "engine oil" "Automobile"
test_query "tyre" "Automobile"

echo "=== Home Essentials Tests ==="
test_query "sofa" "Home Essentials"
test_query "curtain" "Home Essentials"
test_query "bedsheet" "Home Essentials"

echo "=== Pet Supplies Tests ==="
test_query "dog food" "Pet Supplies"
test_query "cat food" "Pet Supplies"

echo "=== Cafe & Restaurant Tests ==="
test_query "coffee" "Cafe & Restaurant"
test_query "burger" "Cafe & Restaurant"
test_query "biryani" "Cafe & Restaurant"

echo "=========================================="
echo "Testing Complete!"
echo "=========================================="
