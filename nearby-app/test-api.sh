#!/bin/bash

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

API_URL="http://localhost:3000/dev"

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   NearBy API Testing Suite            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Check if backend is running
echo -e "${YELLOW}Checking if backend is running...${NC}"
if curl -s "$API_URL/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend is running${NC}"
else
    echo -e "${RED}✗ Backend is not running${NC}"
    echo ""
    echo "Start backend first:"
    echo "  cd backend"
    echo "  serverless offline"
    exit 1
fi

echo ""
echo -e "${BLUE}Choose test:${NC}"
echo "1. Test Health Check"
echo "2. Test User Registration"
echo "3. Test User Login"
echo "4. Test Get Categories"
echo "5. Test Nearby Offers"
echo "6. Test Merchant Registration"
echo "7. Test Admin Registration"
echo "8. Run All Tests"
echo ""
read -p "Enter choice (1-8): " choice

test_health() {
    echo -e "${BLUE}Testing Health Check...${NC}"
    RESPONSE=$(curl -s "$API_URL/health")
    echo "Response: $RESPONSE"
    if echo "$RESPONSE" | grep -q "ok"; then
        echo -e "${GREEN}✓ Health check passed${NC}"
    else
        echo -e "${RED}✗ Health check failed${NC}"
    fi
    echo ""
}

test_register() {
    echo -e "${BLUE}Testing User Registration...${NC}"
    TIMESTAMP=$(date +%s)
    EMAIL="test$TIMESTAMP@example.com"
    
    echo "Registering user: $EMAIL"
    
    RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
        -H "Content-Type: application/json" \
        -d "{
            \"email\": \"$EMAIL\",
            \"password\": \"Test1234\",
            \"name\": \"Test User\",
            \"phone\": \"1234567890\",
            \"role\": \"customer\"
        }")
    
    echo "Response: $RESPONSE"
    
    if echo "$RESPONSE" | grep -q "userId"; then
        echo -e "${GREEN}✓ Registration successful${NC}"
        # Save credentials for login test
        echo "$EMAIL" > /tmp/nearby_test_email.txt
    else
        echo -e "${RED}✗ Registration failed${NC}"
    fi
    echo ""
}

test_login() {
    echo -e "${BLUE}Testing User Login...${NC}"
    
    # Check if we have a test email from registration
    if [ -f /tmp/nearby_test_email.txt ]; then
        EMAIL=$(cat /tmp/nearby_test_email.txt)
        echo "Using email from registration: $EMAIL"
    else
        echo "No test email found. Register a user first."
        return
    fi
    
    RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d "{
            \"email\": \"$EMAIL\",
            \"password\": \"Test1234\"
        }")
    
    echo "Response: $RESPONSE"
    
    if echo "$RESPONSE" | grep -q "token"; then
        echo -e "${GREEN}✓ Login successful${NC}"
        # Extract and save token
        TOKEN=$(echo "$RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
        echo "$TOKEN" > /tmp/nearby_test_token.txt
        echo "Token saved for authenticated requests"
    else
        echo -e "${RED}✗ Login failed${NC}"
    fi
    echo ""
}

test_categories() {
    echo -e "${BLUE}Testing Get Categories...${NC}"
    
    RESPONSE=$(curl -s "$API_URL/categories")
    
    echo "Response: $RESPONSE"
    
    if echo "$RESPONSE" | grep -q "categoryId\|id"; then
        echo -e "${GREEN}✓ Categories retrieved${NC}"
        COUNT=$(echo "$RESPONSE" | grep -o "categoryId\|\"id\"" | wc -l)
        echo "Found $COUNT categories"
    else
        echo -e "${RED}✗ Failed to get categories${NC}"
    fi
    echo ""
}

test_nearby_offers() {
    echo -e "${BLUE}Testing Nearby Offers...${NC}"
    
    # Bengaluru coordinates
    LAT="12.9716"
    LNG="77.5946"
    RADIUS="5"
    
    echo "Searching near: $LAT, $LNG (radius: ${RADIUS}km)"
    
    RESPONSE=$(curl -s "$API_URL/offers/nearby?lat=$LAT&lng=$LNG&radius=$RADIUS")
    
    echo "Response: $RESPONSE"
    
    if echo "$RESPONSE" | grep -q "offerId\|id\|\[\]"; then
        echo -e "${GREEN}✓ Nearby offers retrieved${NC}"
        if echo "$RESPONSE" | grep -q "\[\]"; then
            echo "No offers found (empty database)"
        else
            COUNT=$(echo "$RESPONSE" | grep -o "offerId\|\"id\"" | wc -l)
            echo "Found $COUNT offers"
        fi
    else
        echo -e "${RED}✗ Failed to get nearby offers${NC}"
    fi
    echo ""
}

test_merchant_register() {
    echo -e "${BLUE}Testing Merchant Registration...${NC}"
    TIMESTAMP=$(date +%s)
    EMAIL="merchant$TIMESTAMP@example.com"
    
    echo "Registering merchant: $EMAIL"
    
    RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
        -H "Content-Type: application/json" \
        -d "{
            \"email\": \"$EMAIL\",
            \"password\": \"Merchant1234\",
            \"name\": \"Test Merchant\",
            \"phone\": \"9876543210\",
            \"role\": \"merchant\"
        }")
    
    echo "Response: $RESPONSE"
    
    if echo "$RESPONSE" | grep -q "userId"; then
        echo -e "${GREEN}✓ Merchant registration successful${NC}"
    else
        echo -e "${RED}✗ Merchant registration failed${NC}"
    fi
    echo ""
}

test_admin_register() {
    echo -e "${BLUE}Testing Admin Registration...${NC}"
    TIMESTAMP=$(date +%s)
    EMAIL="admin$TIMESTAMP@example.com"
    
    echo "Registering admin: $EMAIL"
    
    RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
        -H "Content-Type: application/json" \
        -d "{
            \"email\": \"$EMAIL\",
            \"password\": \"Admin1234\",
            \"name\": \"Test Admin\",
            \"phone\": \"5555555555\",
            \"role\": \"admin\"
        }")
    
    echo "Response: $RESPONSE"
    
    if echo "$RESPONSE" | grep -q "userId"; then
        echo -e "${GREEN}✓ Admin registration successful${NC}"
    else
        echo -e "${RED}✗ Admin registration failed${NC}"
    fi
    echo ""
}

run_all_tests() {
    echo -e "${BLUE}Running all tests...${NC}"
    echo ""
    
    test_health
    sleep 1
    
    test_categories
    sleep 1
    
    test_register
    sleep 1
    
    test_login
    sleep 1
    
    test_nearby_offers
    sleep 1
    
    test_merchant_register
    sleep 1
    
    test_admin_register
    
    echo -e "${GREEN}All tests completed!${NC}"
}

case $choice in
    1) test_health ;;
    2) test_register ;;
    3) test_login ;;
    4) test_categories ;;
    5) test_nearby_offers ;;
    6) test_merchant_register ;;
    7) test_admin_register ;;
    8) run_all_tests ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac
