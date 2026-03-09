#!/bin/bash

echo "╔════════════════════════════════════════════════════════════╗"
echo "║     Deploying to AWS Elastic Beanstalk                     ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Step 1: Initialize
echo "Step 1: Initializing Elastic Beanstalk..."
eb init -p "64bit Amazon Linux 2023 v6.8.0 running Node.js 20" nearby-backend --region ap-south-1

if [ $? -ne 0 ]; then
    echo "❌ Failed to initialize. Check AWS credentials."
    exit 1
fi

echo "✅ Initialized"
echo ""

# Step 2: Create environment
echo "Step 2: Creating environment (this takes ~5-10 minutes)..."
echo "Creating t2.micro instance..."
eb create nearby-backend-env --instance-type t2.micro

if [ $? -ne 0 ]; then
    echo "❌ Failed to create environment."
    echo "Check IAM permissions for EC2 and Elastic Beanstalk."
    exit 1
fi

echo "✅ Environment created"
echo ""

# Step 3: Set environment variables
echo "Step 3: Setting environment variables..."
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

if [ $? -ne 0 ]; then
    echo "❌ Failed to set environment variables."
    exit 1
fi

echo "✅ Environment variables set"
echo ""

# Step 4: Deploy
echo "Step 4: Deploying application..."
eb deploy

if [ $? -ne 0 ]; then
    echo "❌ Deployment failed."
    echo "Check logs with: eb logs"
    exit 1
fi

echo "✅ Deployed successfully"
echo ""

# Step 5: Get URL
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                  Deployment Complete!                      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Getting your backend URL..."
echo ""

eb status | grep CNAME

echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Test your backend:"
echo "   eb open"
echo "   Or visit the CNAME URL above"
echo ""
echo "2. Test health endpoint:"
echo "   curl http://your-cname-url/health"
echo ""
echo "3. Update frontend apps:"
echo "   cd ../merchant-app"
echo "   echo 'VITE_API_BASE_URL=http://your-cname-url/dev' > .env.production"
echo "   npm run build"
echo "   aws s3 sync dist/ s3://nearby-merchant-app --delete"
echo ""
echo "4. View logs:"
echo "   eb logs"
echo ""
echo "5. Monitor:"
echo "   eb status"
echo ""
