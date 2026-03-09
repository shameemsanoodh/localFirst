#!/bin/bash

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   NearBy Setup Verification            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

ISSUES=0

# Check Node.js
echo -e "${BLUE}Checking Node.js...${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    if [ "$MAJOR_VERSION" -ge 18 ]; then
        echo -e "${GREEN}✓${NC} Node.js $NODE_VERSION (OK)"
    else
        echo -e "${RED}✗${NC} Node.js $NODE_VERSION (Need v18 or higher)"
        ISSUES=$((ISSUES + 1))
    fi
else
    echo -e "${RED}✗${NC} Node.js not installed"
    ISSUES=$((ISSUES + 1))
fi

# Check npm
echo -e "${BLUE}Checking npm...${NC}"
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✓${NC} npm $NPM_VERSION"
else
    echo -e "${RED}✗${NC} npm not installed"
    ISSUES=$((ISSUES + 1))
fi

echo ""
echo -e "${BLUE}Checking project structure...${NC}"

# Check directories
DIRS=("frontend" "backend" "customer-app" "merchant-app" "admin-app")
for dir in "${DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo -e "${GREEN}✓${NC} $dir/ exists"
    else
        echo -e "${RED}✗${NC} $dir/ missing"
        ISSUES=$((ISSUES + 1))
    fi
done

echo ""
echo -e "${BLUE}Checking package.json files...${NC}"

for dir in "${DIRS[@]}"; do
    if [ -f "$dir/package.json" ]; then
        echo -e "${GREEN}✓${NC} $dir/package.json exists"
    else
        echo -e "${RED}✗${NC} $dir/package.json missing"
        ISSUES=$((ISSUES + 1))
    fi
done

echo ""
echo -e "${BLUE}Checking dependencies...${NC}"

for dir in "${DIRS[@]}"; do
    if [ -d "$dir/node_modules" ]; then
        echo -e "${GREEN}✓${NC} $dir dependencies installed"
    else
        echo -e "${YELLOW}⚠${NC} $dir dependencies not installed (run: cd $dir && npm install)"
    fi
done

echo ""
echo -e "${BLUE}Checking ports...${NC}"

check_port() {
    lsof -ti:$1 > /dev/null 2>&1
    return $?
}

PORTS=(3000 5173 5174 5175)
PORT_NAMES=("Backend" "Customer" "Merchant" "Admin")

for i in "${!PORTS[@]}"; do
    PORT=${PORTS[$i]}
    NAME=${PORT_NAMES[$i]}
    if check_port $PORT; then
        echo -e "${YELLOW}⚠${NC} Port $PORT ($NAME): In use"
    else
        echo -e "${GREEN}✓${NC} Port $PORT ($NAME): Available"
    fi
done

echo ""
echo -e "${BLUE}Checking configuration files...${NC}"

# Check backend serverless.yml
if [ -f "backend/serverless.yml" ]; then
    echo -e "${GREEN}✓${NC} backend/serverless.yml exists"
else
    echo -e "${RED}✗${NC} backend/serverless.yml missing"
    ISSUES=$((ISSUES + 1))
fi

# Check frontend vite.config
if [ -f "frontend/vite.config.ts" ] || [ -f "frontend/vite.config.js" ]; then
    echo -e "${GREEN}✓${NC} frontend/vite.config exists"
else
    echo -e "${RED}✗${NC} frontend/vite.config missing"
    ISSUES=$((ISSUES + 1))
fi

echo ""
echo -e "${BLUE}Checking TypeScript configuration...${NC}"

for dir in "${DIRS[@]}"; do
    if [ -f "$dir/tsconfig.json" ]; then
        echo -e "${GREEN}✓${NC} $dir/tsconfig.json exists"
    else
        echo -e "${YELLOW}⚠${NC} $dir/tsconfig.json missing"
    fi
done

echo ""
echo -e "${BLUE}═══════════════════════════════════════${NC}"

if [ $ISSUES -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo ""
    echo -e "${BLUE}You're ready to test!${NC}"
    echo ""
    echo "Run: ${GREEN}./test-all-locally.sh${NC}"
    echo ""
else
    echo -e "${RED}✗ Found $ISSUES issue(s)${NC}"
    echo ""
    echo -e "${YELLOW}Fix the issues above before testing${NC}"
    echo ""
fi

echo -e "${BLUE}═══════════════════════════════════════${NC}"
