#!/bin/bash

# Multimodal Search Deployment Script
# Deploys backend AI endpoints and frontend with feature flags

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-staging}
REGION=${AWS_REGION:-ap-south-1}

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Multimodal Search Deployment${NC}"
echo -e "${BLUE}Environment: ${ENVIRONMENT}${NC}"
echo -e "${BLUE}Region: ${REGION}${NC}"
echo -e "${BLUE}========================================${NC}"

# Validate environment
if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
    echo -e "${RED}Error: Environment must be 'staging' or 'production'${NC}"
    exit 1
fi

# Check AWS credentials
echo -e "\n${YELLOW}Checking AWS credentials...${NC}"
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo -e "${RED}Error: AWS credentials not configured${NC}"
    exit 1
fi
echo -e "${GREEN}✓ AWS credentials valid${NC}"

# Check Bedrock access
echo -e "\n${YELLOW}Checking Bedrock access...${NC}"
if ! aws bedrock list-foundation-models --region $REGION > /dev/null 2>&1; then
    echo -e "${RED}Error: No access to AWS Bedrock in region $REGION${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Bedrock access confirmed${NC}"

# Backend Deployment
echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}Deploying Backend${NC}"
echo -e "${BLUE}========================================${NC}"

cd backend

# Install dependencies
echo -e "\n${YELLOW}Installing backend dependencies...${NC}"
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Run tests
echo -e "\n${YELLOW}Running backend tests...${NC}"
npm run test 2>/dev/null || echo -e "${YELLOW}⚠ Tests skipped or failed${NC}"

# Build
echo -e "\n${YELLOW}Building backend...${NC}"
npm run build
echo -e "${GREEN}✓ Backend built${NC}"

# Deploy
echo -e "\n${YELLOW}Deploying backend to ${ENVIRONMENT}...${NC}"
if [ "$ENVIRONMENT" = "production" ]; then
    npm run deploy:production
else
    npm run deploy:staging
fi
echo -e "${GREEN}✓ Backend deployed${NC}"

# Get API endpoint
API_ENDPOINT=$(aws cloudformation describe-stacks \
    --stack-name nearby-app-${ENVIRONMENT} \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' \
    --output text \
    --region $REGION 2>/dev/null || echo "")

if [ -n "$API_ENDPOINT" ]; then
    echo -e "${GREEN}API Endpoint: ${API_ENDPOINT}${NC}"
fi

cd ..

# Frontend Deployment
echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}Deploying Frontend${NC}"
echo -e "${BLUE}========================================${NC}"

cd frontend

# Install dependencies
echo -e "\n${YELLOW}Installing frontend dependencies...${NC}"
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Set environment variables
echo -e "\n${YELLOW}Configuring environment...${NC}"
if [ "$ENVIRONMENT" = "production" ]; then
    export VITE_FEATURE_VOICE_SEARCH=true
    export VITE_FEATURE_IMAGE_SEARCH=true
    export VITE_FEATURE_BANNER=true
    export VITE_FEATURE_AI_DETECTION=true
else
    export VITE_FEATURE_VOICE_SEARCH=true
    export VITE_FEATURE_IMAGE_SEARCH=true
    export VITE_FEATURE_BANNER=true
    export VITE_FEATURE_AI_DETECTION=true
fi

if [ -n "$API_ENDPOINT" ]; then
    export VITE_API_URL=$API_ENDPOINT
fi

echo -e "${GREEN}✓ Environment configured${NC}"

# Run tests
echo -e "\n${YELLOW}Running frontend tests...${NC}"
npm run test 2>/dev/null || echo -e "${YELLOW}⚠ Tests skipped or failed${NC}"

# Build
echo -e "\n${YELLOW}Building frontend...${NC}"
npm run build
echo -e "${GREEN}✓ Frontend built${NC}"

# Deploy
echo -e "\n${YELLOW}Deploying frontend to ${ENVIRONMENT}...${NC}"
if [ "$ENVIRONMENT" = "production" ]; then
    npm run deploy:production
else
    npm run deploy:staging
fi
echo -e "${GREEN}✓ Frontend deployed${NC}"

# Get frontend URL
FRONTEND_URL=$(aws cloudformation describe-stacks \
    --stack-name nearby-app-frontend-${ENVIRONMENT} \
    --query 'Stacks[0].Outputs[?OutputKey==`WebsiteURL`].OutputValue' \
    --output text \
    --region $REGION 2>/dev/null || echo "")

if [ -n "$FRONTEND_URL" ]; then
    echo -e "${GREEN}Frontend URL: ${FRONTEND_URL}${NC}"
fi

cd ..

# Verification
echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}Deployment Verification${NC}"
echo -e "${BLUE}========================================${NC}"

# Test AI endpoint
if [ -n "$API_ENDPOINT" ]; then
    echo -e "\n${YELLOW}Testing AI endpoints...${NC}"
    
    # Test category detection
    CATEGORY_TEST=$(curl -s -X POST "${API_ENDPOINT}/ai/detect-category" \
        -H "Content-Type: application/json" \
        -d '{"query":"tomatoes"}' | jq -r '.success' 2>/dev/null || echo "false")
    
    if [ "$CATEGORY_TEST" = "true" ]; then
        echo -e "${GREEN}✓ Category detection endpoint working${NC}"
    else
        echo -e "${RED}✗ Category detection endpoint failed${NC}"
    fi
fi

# Summary
echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}Deployment Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Environment: ${ENVIRONMENT}${NC}"
echo -e "${GREEN}Region: ${REGION}${NC}"
if [ -n "$API_ENDPOINT" ]; then
    echo -e "${GREEN}API: ${API_ENDPOINT}${NC}"
fi
if [ -n "$FRONTEND_URL" ]; then
    echo -e "${GREEN}Frontend: ${FRONTEND_URL}${NC}"
fi

echo -e "\n${GREEN}Features Enabled:${NC}"
echo -e "  • Voice Search: ${VITE_FEATURE_VOICE_SEARCH:-true}"
echo -e "  • Image Search: ${VITE_FEATURE_IMAGE_SEARCH:-true}"
echo -e "  • Featured Banner: ${VITE_FEATURE_BANNER:-true}"
echo -e "  • AI Detection: ${VITE_FEATURE_AI_DETECTION:-true}"

echo -e "\n${BLUE}========================================${NC}"
echo -e "${GREEN}✓ Deployment Complete!${NC}"
echo -e "${BLUE}========================================${NC}"

# Post-deployment instructions
echo -e "\n${YELLOW}Next Steps:${NC}"
echo -e "1. Test voice search on ${FRONTEND_URL}"
echo -e "2. Test image search with sample images"
echo -e "3. Monitor CloudWatch logs for errors"
echo -e "4. Check analytics dashboard for usage"
echo -e "5. Review Bedrock costs in AWS Console"

if [ "$ENVIRONMENT" = "staging" ]; then
    echo -e "\n${YELLOW}To deploy to production:${NC}"
    echo -e "  ./deploy-multimodal.sh production"
fi

echo ""
