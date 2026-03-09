#!/bin/bash

echo "🚀 Deploying NearBy Apps to AWS"
echo "================================"
echo ""

# Step 1: Deploy Merchant App
echo "📱 STEP 1: Deploying Merchant App..."
echo "-----------------------------------"
./deploy-merchant-app.sh

if [ $? -ne 0 ]; then
    echo "❌ Merchant app deployment failed!"
    exit 1
fi

# Get merchant app URL
MERCHANT_URL="http://nearby-merchant-app.s3-website.ap-south-1.amazonaws.com"

echo ""
echo "⏳ Waiting 5 seconds before deploying customer app..."
sleep 5
echo ""

# Step 2: Deploy Customer App
echo "📱 STEP 2: Deploying Customer App..."
echo "-----------------------------------"
./deploy-customer-app.sh "${MERCHANT_URL}"

if [ $? -ne 0 ]; then
    echo "❌ Customer app deployment failed!"
    exit 1
fi

# Summary
echo ""
echo "================================"
echo "🎉 DEPLOYMENT COMPLETE!"
echo "================================"
echo ""
echo "📱 Merchant App:"
echo "   URL: ${MERCHANT_URL}"
echo "   Signup: ${MERCHANT_URL}/signup"
echo "   Login: ${MERCHANT_URL}/login"
echo ""
echo "📱 Customer App:"
echo "   URL: http://nearby-customer-app.s3-website.ap-south-1.amazonaws.com"
echo ""
echo "🔗 The 'Register Your Shop' button in customer app"
echo "   now points to: ${MERCHANT_URL}/signup"
echo ""
echo "📝 Next Steps:"
echo "   1. Test merchant signup/login"
echo "   2. Test customer app"
echo "   3. Test 'Register Your Shop' button"
echo "   4. Create offers and verify they appear"
echo ""
echo "💡 For HTTPS, set up CloudFront distributions"
echo "   See DEPLOYMENT_GUIDE.md for instructions"
echo ""
