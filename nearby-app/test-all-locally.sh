#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   NearBy Local Testing Suite          ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo ""

# Function to check if port is in use
check_port() {
    lsof -ti:$1 > /dev/null 2>&1
    return $?
}

# Function to kill process on port
kill_port() {
    echo -e "${YELLOW}Killing process on port $1...${NC}"
    lsof -ti:$1 | xargs kill -9 2>/dev/null
    sleep 1
}

echo -e "${BLUE}Choose testing mode:${NC}"
echo "1. Frontend Only (Quickest - Mock Data)"
echo "2. Backend Only (API Testing)"
echo "3. Full Stack (Frontend + Backend)"
echo "4. All Apps (Customer + Merchant + Admin)"
echo "5. Check Installation Status"
echo ""
read -p "Enter choice (1-5): " choice

case $choice in
    1)
        echo -e "${GREEN}Starting Frontend Only...${NC}"
        cd frontend
        
        if [ ! -d "node_modules" ]; then
            echo -e "${YELLOW}Installing dependencies...${NC}"
            npm install
        fi
        
        if check_port 5173; then
            kill_port 5173
        fi
        
        echo -e "${GREEN}Starting frontend on http://localhost:5173${NC}"
        npm run dev
        ;;
        
    2)
        echo -e "${GREEN}Starting Backend Only...${NC}"
        cd backend
        
        if [ ! -d "node_modules" ]; then
            echo -e "${YELLOW}Installing dependencies...${NC}"
            npm install
            npm install -D serverless-offline
        fi
        
        echo -e "${YELLOW}Building backend...${NC}"
        npm run build
        
        if check_port 3000; then
            kill_port 3000
        fi
        
        echo -e "${GREEN}Starting backend on http://localhost:3000${NC}"
        serverless offline
        ;;
        
    3)
        echo -e "${GREEN}Starting Full Stack...${NC}"
        
        # Start backend in background
        echo -e "${YELLOW}Starting backend...${NC}"
        cd backend
        
        if [ ! -d "node_modules" ]; then
            npm install
            npm install -D serverless-offline
        fi
        
        npm run build
        
        if check_port 3000; then
            kill_port 3000
        fi
        
        serverless offline > ../backend.log 2>&1 &
        BACKEND_PID=$!
        
        echo -e "${GREEN}Backend started (PID: $BACKEND_PID)${NC}"
        sleep 5
        
        # Start frontend
        cd ../frontend
        
        if [ ! -d "node_modules" ]; then
            npm install
        fi
        
        # Create .env for local backend
        cat > .env << EOF
VITE_API_BASE_URL=http://localhost:3000/dev
VITE_WS_BASE_URL=ws://localhost:3000/dev
EOF
        
        if check_port 5173; then
            kill_port 5173
        fi
        
        echo -e "${GREEN}Frontend starting on http://localhost:5173${NC}"
        echo -e "${YELLOW}Backend logs: nearby-app/backend.log${NC}"
        echo -e "${RED}Press Ctrl+C to stop both servers${NC}"
        
        # Trap Ctrl+C to kill backend
        trap "kill $BACKEND_PID 2>/dev/null; exit" INT TERM
        
        npm run dev
        ;;
        
    4)
        echo -e "${GREEN}Starting All Apps...${NC}"
        
        # Start backend
        echo -e "${YELLOW}1/4 Starting backend...${NC}"
        cd backend
        
        if [ ! -d "node_modules" ]; then
            npm install
            npm install -D serverless-offline
        fi
        
        npm run build
        
        if check_port 3000; then
            kill_port 3000
        fi
        
        serverless offline > ../backend.log 2>&1 &
        BACKEND_PID=$!
        sleep 5
        
        # Start customer app
        echo -e "${YELLOW}2/4 Starting customer app...${NC}"
        cd ../customer-app
        
        if [ ! -d "node_modules" ]; then
            npm install
        fi
        
        if check_port 5173; then
            kill_port 5173
        fi
        
        npm run dev > ../customer.log 2>&1 &
        CUSTOMER_PID=$!
        sleep 3
        
        # Start merchant app
        echo -e "${YELLOW}3/4 Starting merchant app...${NC}"
        cd ../merchant-app
        
        if [ ! -d "node_modules" ]; then
            npm install
        fi
        
        if check_port 5174; then
            kill_port 5174
        fi
        
        npm run dev -- --port 5174 > ../merchant.log 2>&1 &
        MERCHANT_PID=$!
        sleep 3
        
        # Start admin app
        echo -e "${YELLOW}4/4 Starting admin app...${NC}"
        cd ../admin-app
        
        if [ ! -d "node_modules" ]; then
            npm install
        fi
        
        if check_port 5175; then
            kill_port 5175
        fi
        
        npm run dev -- --port 5175 > ../admin.log 2>&1 &
        ADMIN_PID=$!
        
        echo ""
        echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║   All Apps Running!                    ║${NC}"
        echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
        echo ""
        echo -e "${BLUE}Backend API:${NC}     http://localhost:3000"
        echo -e "${BLUE}Customer App:${NC}    http://localhost:5173"
        echo -e "${BLUE}Merchant App:${NC}    http://localhost:5174"
        echo -e "${BLUE}Admin App:${NC}       http://localhost:5175"
        echo ""
        echo -e "${YELLOW}Logs:${NC}"
        echo "  Backend:  nearby-app/backend.log"
        echo "  Customer: nearby-app/customer.log"
        echo "  Merchant: nearby-app/merchant.log"
        echo "  Admin:    nearby-app/admin.log"
        echo ""
        echo -e "${RED}Press Ctrl+C to stop all servers${NC}"
        
        # Trap Ctrl+C to kill all processes
        trap "kill $BACKEND_PID $CUSTOMER_PID $MERCHANT_PID $ADMIN_PID 2>/dev/null; exit" INT TERM
        
        # Wait
        wait
        ;;
        
    5)
        echo -e "${GREEN}Checking Installation Status...${NC}"
        echo ""
        
        # Check Node.js
        if command -v node &> /dev/null; then
            NODE_VERSION=$(node --version)
            echo -e "${GREEN}✓${NC} Node.js: $NODE_VERSION"
        else
            echo -e "${RED}✗${NC} Node.js: Not installed"
        fi
        
        # Check npm
        if command -v npm &> /dev/null; then
            NPM_VERSION=$(npm --version)
            echo -e "${GREEN}✓${NC} npm: $NPM_VERSION"
        else
            echo -e "${RED}✗${NC} npm: Not installed"
        fi
        
        # Check serverless
        if command -v serverless &> /dev/null; then
            SLS_VERSION=$(serverless --version | head -n1)
            echo -e "${GREEN}✓${NC} Serverless: $SLS_VERSION"
        else
            echo -e "${YELLOW}⚠${NC} Serverless: Not installed globally (will use local)"
        fi
        
        echo ""
        echo -e "${BLUE}Checking app dependencies:${NC}"
        
        # Check frontend
        if [ -d "frontend/node_modules" ]; then
            echo -e "${GREEN}✓${NC} Frontend dependencies installed"
        else
            echo -e "${YELLOW}⚠${NC} Frontend dependencies not installed"
        fi
        
        # Check backend
        if [ -d "backend/node_modules" ]; then
            echo -e "${GREEN}✓${NC} Backend dependencies installed"
        else
            echo -e "${YELLOW}⚠${NC} Backend dependencies not installed"
        fi
        
        # Check customer-app
        if [ -d "customer-app/node_modules" ]; then
            echo -e "${GREEN}✓${NC} Customer app dependencies installed"
        else
            echo -e "${YELLOW}⚠${NC} Customer app dependencies not installed"
        fi
        
        # Check merchant-app
        if [ -d "merchant-app/node_modules" ]; then
            echo -e "${GREEN}✓${NC} Merchant app dependencies installed"
        else
            echo -e "${YELLOW}⚠${NC} Merchant app dependencies not installed"
        fi
        
        # Check admin-app
        if [ -d "admin-app/node_modules" ]; then
            echo -e "${GREEN}✓${NC} Admin app dependencies installed"
        else
            echo -e "${YELLOW}⚠${NC} Admin app dependencies not installed"
        fi
        
        echo ""
        echo -e "${BLUE}Port Status:${NC}"
        
        if check_port 3000; then
            echo -e "${YELLOW}⚠${NC} Port 3000 (Backend): In use"
        else
            echo -e "${GREEN}✓${NC} Port 3000 (Backend): Available"
        fi
        
        if check_port 5173; then
            echo -e "${YELLOW}⚠${NC} Port 5173 (Customer): In use"
        else
            echo -e "${GREEN}✓${NC} Port 5173 (Customer): Available"
        fi
        
        if check_port 5174; then
            echo -e "${YELLOW}⚠${NC} Port 5174 (Merchant): In use"
        else
            echo -e "${GREEN}✓${NC} Port 5174 (Merchant): Available"
        fi
        
        if check_port 5175; then
            echo -e "${YELLOW}⚠${NC} Port 5175 (Admin): In use"
        else
            echo -e "${GREEN}✓${NC} Port 5175 (Admin): Available"
        fi
        ;;
        
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac
