#!/bin/bash

echo "🚀 Deploying NearBy Apps to AWS with HTTPS"
echo "=========================================="
echo ""

# Step 1: Deploy Merchant App with CloudFront
echo "📱 STEP 1: Deploying Merchant App with HTTPS..."
echo "-----------------------------------------------"
./deploy-merchant-https.sh

if [ $? -ne 0 ]; then
    echo "❌ Merchant app deployment failed!"
    exit 1
fi

echo ""
echo "⏳ Waiting 10 seconds before deploying customer app..."
sleep 10
echo ""

# Step 2: Deploy Customer App with CloudFront
echo "📱 STEP 2: Deploying Customer App with HTTPS..."
echo "-----------------------------------------------"
./deploy-customer-https.sh

if [ $? -ne 0 ]; then
    echo "❌ Customer app deployment failed!"
    exit 1
fi

# Read URLs from files
MERCHANT_URL=$(cat merchant-app-urls.txt | grep "HTTPS URL:" | cut -d' ' -f3)
CUSTOMER_URL=$(cat customer-app-urls.txt | grep "HTTPS URL:" | cut -d' ' -f3)

# Summary
echo ""
echo "=========================================="
echo "🎉 DEPLOYMENT COMPLETE!"
echo "=========================================="
echo ""
echo "📱 Merchant App (HTTPS):"
echo "   URL: ${MERCHANT_URL}"
echo "   Signup: ${MERCHANT_URL}/signup"
echo "   Login: ${MERCHANT_URL}/login"
echo ""
echo "📱 Customer App (HTTPS):"
echo "   URL: ${CUSTOMER_URL}"
echo ""
echo "🔗 The 'Register Your Shop' button in customer app"
echo "   now points to: ${MERCHANT_URL}/signup"
echo ""
echo "⏳ IMPORTANT: CloudFront distributions take 15-20 minutes"
echo "   to fully deploy. Please wait before testing."
echo ""
echo "📝 Next Steps:"
echo "   1. Wait 15-20 minutes for CloudFront deployment"
echo "   2. Test merchant signup/login at ${MERCHANT_URL}"
echo "   3. Test customer app at ${CUSTOMER_URL}"
echo "   4. Test 'Register Your Shop' button"
echo "   5. Create offers and verify they appear"
echo ""
echo "💾 URLs saved to:"
echo "   - merchant-app-urls.txt"
echo "   - customer-app-urls.txt"
echo ""
echo "📊 Check CloudFront deployment status:"
echo "   aws cloudfront list-distributions --query 'DistributionList.Items[*].[Id,Status,DomainName]' --output table"
echo ""

