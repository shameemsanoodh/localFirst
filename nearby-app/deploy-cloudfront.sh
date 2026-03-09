#!/bin/bash

set -e

echo "🚀 Deploying NearBy Apps to CloudFront"
echo "======================================"
echo ""

# Function to create CloudFront distribution
create_distribution() {
    local BUCKET_NAME=$1
    local APP_NAME=$2
    local CALLER_REF="${BUCKET_NAME}-$(date +%s)"
    
    echo "📦 Creating CloudFront for $APP_NAME..."
    echo "   Bucket: $BUCKET_NAME"
    
    # Create distribution config
    cat > /tmp/cf-${BUCKET_NAME}.json <<EOF
{
    "CallerReference": "${CALLER_REF}",
    "Comment": "${APP_NAME} Distribution",
    "Enabled": true,
    "DefaultRootObject": "index.html",
    "Origins": {
        "Quantity": 1,
        "Items": [{
            "Id": "S3-${BUCKET_NAME}",
            "DomainName": "${BUCKET_NAME}.s3-website.ap-south-1.amazonaws.com",
            "OriginPath": "",
            "CustomHeaders": {"Quantity": 0},
            "CustomOriginConfig": {
                "HTTPPort": 80,
                "HTTPSPort": 443,
                "OriginProtocolPolicy": "http-only",
                "OriginSslProtocols": {
                    "Quantity": 3,
                    "Items": ["TLSv1", "TLSv1.1", "TLSv1.2"]
                },
                "OriginReadTimeout": 30,
                "OriginKeepaliveTimeout": 5
            },
            "ConnectionAttempts": 3,
            "ConnectionTimeout": 10,
            "OriginShield": {"Enabled": false}
        }]
    },
    "DefaultCacheBehavior": {
        "TargetOriginId": "S3-${BUCKET_NAME}",
        "ViewerProtocolPolicy": "redirect-to-https",
        "AllowedMethods": {
            "Quantity": 2,
            "Items": ["HEAD", "GET"],
            "CachedMethods": {
                "Quantity": 2,
                "Items": ["HEAD", "GET"]
            }
        },
        "Compress": true,
        "ForwardedValues": {
            "QueryString": false,
            "Cookies": {"Forward": "none"},
            "Headers": {"Quantity": 0}
        },
        "MinTTL": 0,
        "DefaultTTL": 86400,
        "MaxTTL": 31536000,
        "TrustedSigners": {
            "Enabled": false,
            "Quantity": 0
        }
    },
    "CustomErrorResponses": {
        "Quantity": 2,
        "Items": [
            {
                "ErrorCode": 403,
                "ResponsePagePath": "/index.html",
                "ResponseCode": "200",
                "ErrorCachingMinTTL": 300
            },
            {
                "ErrorCode": 404,
                "ResponsePagePath": "/index.html",
                "ResponseCode": "200",
                "ErrorCachingMinTTL": 300
            }
        ]
    },
    "PriceClass": "PriceClass_All",
    "ViewerCertificate": {
        "CloudFrontDefaultCertificate": true,
        "MinimumProtocolVersion": "TLSv1"
    },
    "HttpVersion": "http2",
    "IsIPV6Enabled": true
}
EOF
    
    echo "   Creating distribution..."
    RESULT=$(aws cloudfront create-distribution \
        --distribution-config file:///tmp/cf-${BUCKET_NAME}.json \
        --output json 2>&1)
    
    if echo "$RESULT" | grep -q "AccessDenied"; then
        echo "   ❌ Access Denied - Account verification needed"
        echo ""
        echo "   Your AWS account needs verification to create CloudFront distributions."
        echo "   Contact AWS Support: https://console.aws.amazon.com/support/home#/"
        echo ""
        rm /tmp/cf-${BUCKET_NAME}.json
        return 1
    fi
    
    DISTRIBUTION_ID=$(echo "$RESULT" | python3 -c "import sys, json; print(json.load(sys.stdin)['Distribution']['Id'])" 2>/dev/null || echo "ERROR")
    CLOUDFRONT_URL=$(echo "$RESULT" | python3 -c "import sys, json; print(json.load(sys.stdin)['Distribution']['DomainName'])" 2>/dev/null || echo "ERROR")
    
    if [ "$DISTRIBUTION_ID" = "ERROR" ]; then
        echo "   ❌ Failed to create distribution"
        echo "$RESULT"
        rm /tmp/cf-${BUCKET_NAME}.json
        return 1
    fi
    
    echo "   ✅ Created!"
    echo "   Distribution ID: $DISTRIBUTION_ID"
    echo "   HTTPS URL: https://$CLOUDFRONT_URL"
    echo "   Status: InProgress (will take 15-20 minutes)"
    echo ""
    
    # Save to results
    echo "$APP_NAME,$DISTRIBUTION_ID,https://$CLOUDFRONT_URL,InProgress" >> cloudfront-distributions.csv
    
    rm /tmp/cf-${BUCKET_NAME}.json
    
    # Return the URL for use in next deployment
    echo "$CLOUDFRONT_URL"
}

# Initialize results file
echo "App,Distribution ID,HTTPS URL,Status" > cloudfront-distributions.csv

# Create Merchant App CloudFront
echo "1️⃣  DEPLOYING MERCHANT APP TO CLOUDFRONT"
echo "========================================="
echo ""
MERCHANT_URL=$(create_distribution "nearby-merchant-app" "Merchant App")

if [ $? -eq 0 ]; then
    MERCHANT_HTTPS="https://$MERCHANT_URL"
    echo "✅ Merchant app CloudFront created: $MERCHANT_HTTPS"
else
    echo "⚠️  Using S3 URL for merchant app"
    MERCHANT_HTTPS="http://nearby-merchant-app.s3-website.ap-south-1.amazonaws.com"
fi

echo ""
echo "2️⃣  UPDATING CUSTOMER APP WITH MERCHANT URL"
echo "=========================================="
echo ""

# Update customer app .env.production with merchant CloudFront URL
cat > customer-app/.env.production <<EOF
VITE_API_BASE_URL=https://bbplthp3b8.execute-api.ap-south-1.amazonaws.com/dev
VITE_MERCHANT_URL=$MERCHANT_HTTPS
EOF

echo "✅ Updated customer app with merchant URL: $MERCHANT_HTTPS"
echo ""

# Rebuild customer app with new merchant URL
echo "📦 Rebuilding customer app..."
cd customer-app
npm run build > /dev/null 2>&1
cd ..
echo "✅ Customer app rebuilt"
echo ""

# Upload customer app to S3
echo "📤 Uploading customer app to S3..."
aws s3 sync customer-app/dist/ s3://nearby-customer-app/ \
    --delete \
    --cache-control "public, max-age=31536000" \
    --exclude "index.html" > /dev/null 2>&1

aws s3 cp customer-app/dist/index.html s3://nearby-customer-app/index.html \
    --cache-control "no-cache" > /dev/null 2>&1
echo "✅ Customer app uploaded"
echo ""

# Create Customer App CloudFront
echo "3️⃣  DEPLOYING CUSTOMER APP TO CLOUDFRONT"
echo "========================================="
echo ""
CUSTOMER_URL=$(create_distribution "nearby-customer-app" "Customer App")

if [ $? -eq 0 ]; then
    CUSTOMER_HTTPS="https://$CUSTOMER_URL"
    echo "✅ Customer app CloudFront created: $CUSTOMER_HTTPS"
else
    echo "⚠️  Using S3 URL for customer app"
    CUSTOMER_HTTPS="http://nearby-customer-app.s3-website.ap-south-1.amazonaws.com"
fi

echo ""
echo "======================================"
echo "🎉 DEPLOYMENT COMPLETE!"
echo "======================================"
echo ""
echo "📱 MERCHANT APP:"
echo "   HTTPS: $MERCHANT_HTTPS"
echo "   Signup: $MERCHANT_HTTPS/signup"
echo ""
echo "📱 CUSTOMER APP:"
echo "   HTTPS: $CUSTOMER_HTTPS"
echo ""
echo "🔗 'Register Your Shop' button points to:"
echo "   $MERCHANT_HTTPS/signup"
echo ""
echo "📊 Distribution Status:"
cat cloudfront-distributions.csv | column -t -s,
echo ""
echo "⏳ CloudFront distributions take 15-20 minutes to deploy"
echo ""
echo "🔍 Check status:"
echo "   aws cloudfront list-distributions --query 'DistributionList.Items[*].[Id,DomainName,Status]' --output table"
echo ""
echo "📝 URLs saved to: cloudfront-distributions.csv"
echo ""

# Save final URLs
cat > CLOUDFRONT_URLS.txt <<EOF
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║        🎉 NearBy Apps - CloudFront Deployment 🎉             ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝

✅ DEPLOYMENT COMPLETE!

📱 MERCHANT APP (HTTPS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
URL: $MERCHANT_HTTPS
Signup: $MERCHANT_HTTPS/signup
Login: $MERCHANT_HTTPS/login

📱 CUSTOMER APP (HTTPS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
URL: $CUSTOMER_HTTPS

🔗 INTEGRATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"Register Your Shop" button → $MERCHANT_HTTPS/signup

⏳ STATUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CloudFront distributions are being deployed (15-20 minutes)

Check status:
aws cloudfront list-distributions --query 'DistributionList.Items[*].[Id,DomainName,Status]' --output table

📝 TESTING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Wait 15-20 minutes for CloudFront deployment
2. Open merchant app and login
3. Create broadcast offer
4. Open customer app
5. Click "Register Your Shop"
6. View offers page
7. Test directions button

Deployed: $(date)
EOF

cat CLOUDFRONT_URLS.txt
