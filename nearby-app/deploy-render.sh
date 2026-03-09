#!/bin/bash

echo "🚀 Deploy Backend to Render.com (FREE)"
echo "======================================"
echo ""

cd backend

# Create render.yaml
cat > render.yaml << 'EOF'
services:
  - type: web
    name: nearby-backend
    env: node
    region: singapore
    plan: free
    buildCommand: npm install && npm run build
    startCommand: node server.js
    envVars:
      - key: NODE_ENV
        value: production
      - key: AWS_REGION
        value: ap-south-1
      - key: MERCHANTS_TABLE
        value: merchants-dev
      - key: SHOPS_TABLE
        value: shops-dev
      - key: USERS_TABLE
        value: users-dev
      - key: BROADCASTS_TABLE
        value: broadcasts-dev
      - key: RESPONSES_TABLE
        value: responses-dev
      - key: OFFERS_TABLE
        value: offers-dev
      - key: INTERACTIONS_TABLE
        value: merchant-interactions-dev
      - key: ANALYTICS_TABLE
        value: analytics-dev
      - key: AWS_ACCESS_KEY_ID
        sync: false
      - key: AWS_SECRET_ACCESS_KEY
        sync: false
EOF

# Update package.json
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
echo "✅ Ready to deploy to Render!"
echo ""
echo "📋 Deployment Steps:"
echo ""
echo "1. Go to https://render.com"
echo "2. Sign up / Login (free)"
echo "3. Click 'New +' > 'Web Service'"
echo "4. Connect your GitHub repo"
echo "5. Select 'nearby-app/backend' directory"
echo "6. Render will auto-detect render.yaml"
echo "7. Add these secret environment variables:"
echo "   - AWS_ACCESS_KEY_ID"
echo "   - AWS_SECRET_ACCESS_KEY"
echo "8. Click 'Create Web Service'"
echo ""
echo "⚡ Your backend will be live in ~5 minutes!"
echo ""
echo "📱 You'll get a URL like:"
echo "   https://nearby-backend.onrender.com"
echo ""
echo "🔧 Update frontend .env.production files with this URL"
echo ""

cd ..
