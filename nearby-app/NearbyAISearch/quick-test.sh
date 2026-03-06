#!/bin/bash

# NearBy AI Search Agent - Quick Test Script
# This script tests the AI search agent with various queries

echo "🔍 NearBy AI Search Agent - Quick Test"
echo "======================================"
echo ""

# Check if dev server is running
if ! curl -s http://localhost:8080/health > /dev/null 2>&1; then
    echo "⚠️  Dev server is not running!"
    echo "Please start it in another terminal with: agentcore dev"
    echo ""
    exit 1
fi

echo "✅ Dev server is running"
echo ""

# Test 1: Product Search
echo "Test 1: Product Search Query"
echo "----------------------------"
echo "Query: 'I need fresh tomatoes'"
echo ""
agentcore invoke --dev '{"prompt": "I need fresh tomatoes"}'
echo ""
echo ""

# Test 2: Autocomplete
echo "Test 2: Autocomplete Suggestions"
echo "--------------------------------"
echo "Query: 'Give me suggestions for lap'"
echo ""
agentcore invoke --dev '{"prompt": "Give me suggestions for lap"}'
echo ""
echo ""

# Test 3: Category Detection
echo "Test 3: Category Detection"
echo "-------------------------"
echo "Query: 'Detect category for: laptop repair'"
echo ""
agentcore invoke --dev '{"prompt": "Detect category for: laptop repair"}'
echo ""
echo ""

# Test 4: Ambiguous Query
echo "Test 4: Ambiguous Query (Follow-up Questions)"
echo "--------------------------------------------"
echo "Query: 'I need repair'"
echo ""
agentcore invoke --dev '{"prompt": "I need repair"}'
echo ""
echo ""

# Test 5: Image Analysis
echo "Test 5: Image-Based Search"
echo "-------------------------"
echo "Query: 'Analyze this image: red round vegetables'"
echo ""
agentcore invoke --dev '{"prompt": "Analyze this image: red round vegetables"}'
echo ""
echo ""

echo "✅ All tests completed!"
echo ""
echo "Next steps:"
echo "1. Review the responses above"
echo "2. Try your own queries with: agentcore invoke --dev '{\"prompt\": \"your query\"}'"
echo "3. Check the dev server logs for tool usage"
echo "4. When ready, deploy with: agentcore launch"
