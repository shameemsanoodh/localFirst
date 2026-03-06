#!/bin/bash

# Simple test without jq dependency
API_URL="https://bbplthp3b8.execute-api.ap-south-1.amazonaws.com/dev"

echo "========================================="
echo "Testing Broadcast Flow for 'milk'"
echo "========================================="
echo ""

# Step 1: Detect category
echo "Step 1: Detecting category for 'milk'..."
curl -X POST "${API_URL}/ai/detect-category" \
  -H "Content-Type: application/json" \
  -d '{"query": "milk"}'
echo ""
echo ""

# Step 2: Create category-filtered broadcast (assuming Groceries category)
echo "Step 2: Creating category-filtered broadcast..."
curl -X POST "${API_URL}/broadcasts/category-filtered" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{
    "query": "milk",
    "detectedCategory": "Groceries",
    "userLat": 12.9352,
    "userLng": 77.6245,
    "radius": 3,
    "locality": "Koramangala"
  }'
echo ""
echo ""

echo "========================================="
echo "Test completed!"
echo "========================================="
