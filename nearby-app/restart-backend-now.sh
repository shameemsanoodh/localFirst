#!/bin/bash

echo "=== Restart Backend to Fix Response Buttons ==="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Checking if backend is running on port 3000...${NC}"
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${RED}Backend is running. Please stop it first:${NC}"
    echo "1. Go to the terminal running the backend"
    echo "2. Press Ctrl+C to stop it"
    echo "3. Then run this script again"
    echo ""
    echo -e "${YELLOW}Or force kill:${NC}"
    echo "lsof -ti:3000 | xargs kill -9"
    exit 1
else
    echo -e "${GREEN}✓ Port 3000 is available${NC}"
fi

echo ""
echo -e "${YELLOW}Building backend...${NC}"
cd backend
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Build failed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Build successful${NC}"
echo ""
echo -e "${GREEN}=== Ready to Start Backend ===${NC}"
echo ""
echo "Run this command in a separate terminal:"
echo -e "${GREEN}cd nearby-app/backend && npm run offline${NC}"
echo ""
echo "This will:"
echo "  ✓ Create INTERACTIONS_TABLE"
echo "  ✓ Create RESPONSES_TABLE (if not exists)"
echo "  ✓ Deploy updated code"
echo "  ✓ Fix response button errors"
echo ""
echo "After backend starts, test the response buttons in merchant app!"
