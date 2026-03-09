#!/bin/bash

echo "╔════════════════════════════════════════════════════════════╗"
echo "║     Deploy to Railway.app (5 minutes)                      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "📦 Installing Railway CLI..."
    npm install -g @railway/cli
    echo "✅ Railway CLI installed"
else
    echo "✅ Railway CLI already installed"
fi

echo ""
echo "Step 1: Login to Railway"
echo "========================"
echo ""
echo "This will open your browser. Sign up with GitHub (free)."
echo ""
read -p "Press Enter to login..."

railway login

if [ $? -ne 0 ]; then
    echo "❌ Login failed. Please try again."
    exit 1
fi

echo "✅ Logged in"
echo ""

echo "Step 2: Initialize Railway Project"
echo "==================================="
echo ""

railway init

if [ $? -ne 0 ]; then
    echo "❌ Failed to initialize project."
    exit 1
fi

echo "✅ Project initialized"
echo ""

echo "Step 3: Set Environment Variables"
echo "=================================="
echo ""

echo "Setting AWS region..."
railway variables set AWS_REGION=ap-south-1

echo "Setting DynamoDB table names..."
railway variables set MERCHANTS_TABLE=merchants-dev
railway variables set SHOPS_TABLE=shops-dev
railway variables set USERS_TABLE=users-dev
railway variables set BROADCASTS_TABLE=broadcasts-dev
railway variables set RESPONSES_TABLE=responses-dev
railway variables set OFFERS_TABLE=offers-dev
railway variables set INTERACTIONS_TABLE=merchant-interactions-dev
railway variables set ANALYTICS_TABLE=analytics-dev

echo ""
echo "⚠️  Now we need your AWS credentials"
echo ""
echo "Getting your AWS credentials..."

AWS_KEY=$(aws configure get aws_access_key_id)
AWS_SECRET=$(aws configure get aws_secret_access_key)

if [ -z "$AWS_KEY" ] || [ -z "$AWS_SECRET" ]; then
    echo "❌ Could not get AWS credentials automatically."
    echo ""
    echo "Please set them manually:"
    echo ""
    echo "railway variables set AWS_ACCESS_KEY_ID=your-key"
    echo "railway variables set AWS_SECRET_ACCESS_KEY=your-secret"
    echo ""
    read -p "Press Enter after setting credentials..."
else
    echo "Setting AWS credentials..."
    railway variables set AWS_ACCESS_KEY_ID=$AWS_KEY
    railway variables set AWS_SECRET_ACCESS_KEY=$AWS_SECRET
    echo "✅ AWS credentials set"
fi

echo ""
echo "Step 4: Deploy to Railway"
echo "=========================="
echo ""
echo "Deploying your backend..."
echo ""

railway up

if [ $? -ne 0 ]; then
    echo "❌ Deployment failed."
    exit 1
fi

echo ""
echo "✅ Deployed successfully!"
echo ""

echo "Step 5: Get Your Backend URL"
echo "============================="
echo ""

# Try to get domain
DOMAIN=$(railway domain 2>&1)

if echo "$DOMAIN" | grep -q "No domain"; then
    echo "⚠️  No domain assigned yet."
    echo ""
    echo "To assign a domain:"
    echo "1. Go to https://railway.app/dashboard"
    echo "2. Select your project"
    echo "3. Go to Settings → Generate Domain"
    echo ""
    echo "Or run: railway domain"
else
    echo "🎉 Your backend URL:"
    echo "$DOMAIN"
    echo ""
fi

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                  Deployment Complete!                      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Get your domain (if not shown above):"
echo "   railway domain"
echo ""
echo "2. Test your backend:"
echo "   curl https://your-railway-url/health"
echo ""
echo "3. Update frontend apps:"
echo "   cd ../merchant-app"
echo "   echo 'VITE_API_BASE_URL=https://your-railway-url/dev' > .env.production"
echo "   npm run build"
echo "   aws s3 sync dist/ s3://nearby-merchant-app --delete"
echo ""
echo "4. View logs:"
echo "   railway logs"
echo ""
echo "5. Open dashboard:"
echo "   https://railway.app/dashboard"
echo ""
