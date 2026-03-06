#!/bin/bash

echo "🔄 Redeploying Frontend to AWS..."
echo ""

cd frontend

# Build
echo "📦 Building frontend..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo ""
echo "✅ Build complete!"
echo ""

# Sync to S3
echo "☁️  Uploading to S3..."
aws s3 sync dist/ s3://nearby-app-frontend/ --delete

if [ $? -ne 0 ]; then
    echo "❌ S3 sync failed!"
    exit 1
fi

echo ""
echo "✅ Files uploaded to S3!"
echo ""

# Invalidate CloudFront cache
echo "🔄 Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
  --distribution-id E18LK80ADX38TT \
  --paths "/*"

if [ $? -ne 0 ]; then
    echo "⚠️  CloudFront invalidation failed (but files are uploaded)"
    exit 1
fi

echo ""
echo "✅ CloudFront cache invalidated!"
echo ""
echo "============================================"
echo "✅ DEPLOYMENT COMPLETE!"
echo "============================================"
echo ""
echo "Frontend URL: https://d3j65m5o80vf8x.cloudfront.net"
echo "Backend API: https://4cwdqd7sz4.execute-api.ap-south-1.amazonaws.com/prod"
echo ""
echo "Note: CloudFront invalidation takes 1-5 minutes to propagate."
echo ""
