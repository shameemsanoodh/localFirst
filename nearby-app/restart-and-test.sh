#!/bin/bash

echo "=== Merchant Response System - Restart & Test ==="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Step 1: Checking if backend is running...${NC}"
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${RED}Backend is running on port 3000${NC}"
    echo "Please stop it first (Ctrl+C in the backend terminal)"
    echo "Or run: lsof -ti:3000 | xargs kill -9"
    exit 1
else
    echo -e "${GREEN}✓ Port 3000 is available${NC}"
fi

echo ""
echo -e "${YELLOW}Step 2: Building backend...${NC}"
cd backend
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Build failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Build successful${NC}"

echo ""
echo -e "${YELLOW}Step 3: Starting backend...${NC}"
echo "This will create the RESPONSES_TABLE and deploy new endpoints"
echo ""
echo -e "${GREEN}Run this command in a separate terminal:${NC}"
echo -e "${GREEN}cd nearby-app/backend && npm run offline${NC}"
echo ""

echo -e "${YELLOW}Step 4: After backend starts, verify tables:${NC}"
echo "aws dynamodb list-tables --endpoint-url http://localhost:8000"
echo ""

echo -e "${YELLOW}Step 5: Test the system:${NC}"
echo "1. Customer app: http://localhost:5173"
echo "2. Merchant app: http://localhost:5174"
echo "3. Create a broadcast from customer app"
echo "4. Login to merchant app (mobile@example.com, passcode: 123456)"
echo "5. Wait 15 seconds for broadcast to appear"
echo "6. Click a response button"
echo "7. Check customer app for response"
echo ""

echo -e "${GREEN}=== Setup Complete ===${NC}"
echo "See QUICK_TEST_GUIDE.md for detailed testing instructions"
