#!/bin/bash

echo "🚀 Deploying Merchant Backend with DynamoDB..."
echo ""

# Build TypeScript
echo "📦 Building TypeScript..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Build failed!"
  exit 1
fi

echo "✅ Build successful!"
echo ""

# Deploy to AWS
echo "☁️  Deploying to AWS..."
serverless deploy --stage prod --region ap-south-1

if [ $? -ne 0 ]; then
  echo "❌ Deployment failed!"
  exit 1
fi

echo ""
echo "✅ Deployment successful!"
echo ""
echo "📋 New API Endpoints:"
echo "  - GET  /check-phone/{phone}"
echo "  - POST /merchants/signup"
echo "  - POST /merchants/login"
echo "  - GET  /merchants/profile"
echo "  - PUT  /merchants/profile"
echo "  - PATCH /merchants/toggle-status"
echo "  - GET  /merchants/products"
echo "  - POST /merchants/products"
echo "  - PUT  /merchants/products/{productId}"
echo "  - DELETE /merchants/products/{productId}"
echo ""
echo "🗄️  DynamoDB Tables Created:"
echo "  - nearby-users (with phone & email GSIs)"
echo "  - nearby-merchants (with phone & email GSIs)"
echo "  - nearby-products (with merchantId GSI)"
echo ""
