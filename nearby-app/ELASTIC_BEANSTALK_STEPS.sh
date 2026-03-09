#!/bin/bash

echo "╔════════════════════════════════════════════════════════════╗"
echo "║     AWS Elastic Beanstalk Deployment Steps                ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

cd backend

echo "Step 1: Initialize Elastic Beanstalk Application"
echo "=================================================="
echo ""
echo "Run this command:"
echo ""
echo "  eb init -p node.js-18 nearby-backend --region ap-south-1"
echo ""
read -p "Press Enter after running the above command..."

echo ""
echo "Step 2: Create Environment"
echo "=========================="
echo ""
echo "Run this command:"
echo ""
echo "  eb create nearby-backend-env --instance-type t2.micro"
echo ""
echo "This will take ~5-10 minutes. Wait for it to complete."
echo ""
read -p "Press Enter after environment is created..."

echo ""
echo "Step 3: Set Environment Variables"
echo "=================================="
echo ""
echo "Run this command (all on one line):"
echo ""
cat << 'EOF'
eb setenv \
  AWS_REGION=ap-south-1 \
  MERCHANTS_TABLE=merchants-dev \
  SHOPS_TABLE=shops-dev \
  USERS_TABLE=users-dev \
  BROADCASTS_TABLE=broadcasts-dev \
  RESPONSES_TABLE=responses-dev \
  OFFERS_TABLE=offers-dev \
  INTERACTIONS_TABLE=merchant-interactions-dev \
  ANALYTICS_TABLE=analytics-dev
EOF
echo ""
read -p "Press Enter after setting environment variables..."

echo ""
echo "Step 4: Deploy Application"
echo "=========================="
echo ""
echo "Run this command:"
echo ""
echo "  eb deploy"
echo ""
read -p "Press Enter after deployment completes..."

echo ""
echo "Step 5: Get Your Backend URL"
echo "============================="
echo ""
echo "Run this command:"
echo ""
echo "  eb status"
echo ""
echo "Look for the 'CNAME' field - that's your backend URL"
echo ""
read -p "Press Enter to continue..."

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    Deployment Complete!                    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Your backend URL will be something like:"
echo "  http://nearby-backend-env.ap-south-1.elasticbeanstalk.com"
echo ""
echo "Next Steps:"
echo "1. Test your backend:"
echo "   curl http://your-url/health"
echo ""
echo "2. Update frontend apps with new backend URL"
echo "3. Rebuild and redeploy frontend apps"
echo ""

cd ..
