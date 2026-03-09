#!/bin/bash

echo "🚀 Deploy Backend to Railway.app (FASTEST)"
echo "=========================================="
echo ""

cd backend

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "📦 Installing Railway CLI..."
    npm install -g @railway/cli
fi

echo "✅ Railway CLI ready"
echo ""

# Create railway.json config
cat > railway.json << 'EOF'
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "node server.js",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
EOF

# Create Procfile
cat > Procfile << 'EOF'
web: node server.js
EOF

# Update package.json to add start script
cat > package.json.tmp << 'EOF'
{
  "name": "nearby-backend",
  "version": "1.0.0",
  "description": "NearBy Backend",
  "type": "module",
  "scripts": {
    "start": "node server.js",
    "build": "tsc",
    "offline": "serverless offline start",
    "deploy": "npm run build && serverless deploy",
    "test": "jest"
  },
  "dependencies": {
    "@aws-sdk/client-bedrock-runtime": "^3.967.0",
    "@aws-sdk/client-cognito-identity-provider": "^3.700.0",
    "@aws-sdk/client-dynamodb": "^3.700.0",
    "@aws-sdk/client-location": "^3.700.0",
    "@aws-sdk/client-s3": "^3.700.0",
    "@aws-sdk/client-sns": "^3.700.0",
    "@aws-sdk/lib-dynamodb": "^3.700.0",
    "@aws-sdk/s3-request-presigner": "^3.700.0",
    "aws-sdk": "^2.1693.0",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.2",
    "ngeohash": "^0.6.3",
    "serverless-http": "^3.2.0",
    "uuid": "^11.0.5",
    "zod": "^3.25.76"
  },
  "devDependencies": {
    "@types/aws-lambda": "^8.10.145",
    "@types/bcryptjs": "^2.4.6",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/jsonwebtoken": "^9.0.7",
    "@types/ngeohash": "^0.6.8",
    "@types/node": "^22.13.5",
    "serverless": "^4.7.0",
    "serverless-dynamodb-local": "^0.2.40",
    "serverless-offline": "^14.4.0",
    "typescript": "^5.6.2"
  }
}
EOF

mv package.json.tmp package.json

echo "📦 Installing dependencies..."
npm install express cors serverless-http

echo "🔨 Building TypeScript..."
npm run build

echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Login to Railway:"
echo "   railway login"
echo ""
echo "2. Create new project:"
echo "   railway init"
echo ""
echo "3. Add environment variables:"
echo "   railway variables set AWS_REGION=ap-south-1"
echo "   railway variables set AWS_ACCESS_KEY_ID=your-key"
echo "   railway variables set AWS_SECRET_ACCESS_KEY=your-secret"
echo "   railway variables set MERCHANTS_TABLE=merchants-dev"
echo "   railway variables set SHOPS_TABLE=shops-dev"
echo "   railway variables set USERS_TABLE=users-dev"
echo "   railway variables set BROADCASTS_TABLE=broadcasts-dev"
echo "   railway variables set RESPONSES_TABLE=responses-dev"
echo "   railway variables set OFFERS_TABLE=offers-dev"
echo "   railway variables set INTERACTIONS_TABLE=merchant-interactions-dev"
echo "   railway variables set ANALYTICS_TABLE=analytics-dev"
echo ""
echo "4. Deploy:"
echo "   railway up"
echo ""
echo "5. Get your URL:"
echo "   railway domain"
echo ""
echo "⚡ Your backend will be live in ~2 minutes!"
echo ""
echo "Alternative: Use Railway Dashboard"
echo "1. Go to https://railway.app"
echo "2. Click 'New Project' > 'Deploy from GitHub'"
echo "3. Connect your repo"
echo "4. Add environment variables in Settings"
echo "5. Deploy!"
echo ""

cd ..
