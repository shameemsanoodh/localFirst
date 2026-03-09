#!/bin/bash

echo "🚀 Deploying Merchant App to AWS with HTTPS"
echo ""

# Configuration
BUCKET_NAME="nearby-merchant-app"
REGION="ap-south-1"

# Step 1: Build the app
echo "📦 Step 1: Building merchant app..."
cd merchant-app
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build successful!"
echo ""

# Step 2: Create S3 bucket if it doesn't exist
echo "🪣 Step 2: Creating S3 bucket..."
aws s3 mb s3://${BUCKET_NAME} --region ${REGION} 2>/dev/null || echo "Bucket already exists"

# Step 3: Configure bucket for static website hosting
echo "🌐 Step 3: Configuring static website hosting..."
aws s3 website s3://${BUCKET_NAME} \
    --index-document index.html \
    --error-document index.html

# Step 4: Set bucket policy for public access
echo "🔓 Step 4: Setting bucket policy..."
cat > /tmp/bucket-policy.json <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::${BUCKET_NAME}/*"
        }
    ]
}
EOF

aws s3api put-bucket-policy \
    --bucket ${BUCKET_NAME} \
    --policy file:///tmp/bucket-policy.json

# Step 5: Upload files to S3
echo "📤 Step 5: Uploading files to S3..."
aws s3 sync dist/ s3://${BUCKET_NAME}/ \
    --delete \
    --cache-control "public, max-age=31536000" \
    --exclude "index.html" \
    --region ${REGION}

# Upload index.html separately with no-cache
aws s3 cp dist/index.html s3://${BUCKET_NAME}/index.html \
    --cache-control "no-cache" \
    --region ${REGION}

echo ""
echo "✅ S3 deployment complete!"
echo ""

# Step 6: Create CloudFront distribution
echo "☁️ Step 6: Creating CloudFront distribution..."

# Create CloudFront distribution config
cat > /tmp/cloudfront-config.json <<EOF
{
    "CallerReference": "merchant-app-$(date +%s)",
    "Comment": "NearBy Merchant App Distribution",
    "Enabled": true,
    "DefaultRootObject": "index.html",
    "Origins": {
        "Quantity": 1,
        "Items": [
            {
                "Id": "S3-${BUCKET_NAME}",
                "DomainName": "${BUCKET_NAME}.s3-website.${REGION}.amazonaws.com",
                "CustomOriginConfig": {
                    "HTTPPort": 80,
                    "HTTPSPort": 443,
                    "OriginProtocolPolicy": "http-only"
                }
            }
        ]
    },
    "DefaultCacheBehavior": {
        "TargetOriginId": "S3-${BUCKET_NAME}",
        "ViewerProtocolPolicy": "redirect-to-https",
        "AllowedMethods": {
            "Quantity": 2,
            "Items": ["GET", "HEAD"],
            "CachedMethods": {
                "Quantity": 2,
                "Items": ["GET", "HEAD"]
            }
        },
        "ForwardedValues": {
            "QueryString": false,
            "Cookies": {
                "Forward": "none"
            }
        },
        "MinTTL": 0,
        "DefaultTTL": 86400,
        "MaxTTL": 31536000,
        "Compress": true
    },
    "CustomErrorResponses": {
        "Quantity": 1,
        "Items": [
            {
                "ErrorCode": 404,
                "ResponsePagePath": "/index.html",
                "ResponseCode": "200",
                "ErrorCachingMinTTL": 300
            }
        ]
    }
}
EOF

# Create the distribution
DISTRIBUTION_OUTPUT=$(aws cloudfront create-distribution --distribution-config file:///tmp/cloudfront-config.json 2>&1)

if [ $? -eq 0 ]; then
    CLOUDFRONT_DOMAIN=$(echo "$DISTRIBUTION_OUTPUT" | grep -o '"DomainName": "[^"]*"' | head -1 | cut -d'"' -f4)
    DISTRIBUTION_ID=$(echo "$DISTRIBUTION_OUTPUT" | grep -o '"Id": "[^"]*"' | head -1 | cut -d'"' -f4)
    
    echo "✅ CloudFront distribution created!"
    echo ""
    echo "================================"
    echo "🎉 DEPLOYMENT COMPLETE!"
    echo "================================"
    echo ""
    echo "📱 Merchant App URLs:"
    echo ""
    echo "🌐 HTTP (S3):"
    echo "   http://${BUCKET_NAME}.s3-website.${REGION}.amazonaws.com"
    echo ""
    echo "🔒 HTTPS (CloudFront):"
    echo "   https://${CLOUDFRONT_DOMAIN}"
    echo ""
    echo "📝 Signup page:"
    echo "   https://${CLOUDFRONT_DOMAIN}/signup"
    echo ""
    echo "⏳ Note: CloudFront distribution is being deployed."
    echo "   It may take 15-20 minutes to be fully available."
    echo ""
    echo "📋 Distribution ID: ${DISTRIBUTION_ID}"
    echo ""
    echo "💾 Saving URLs to file..."
    cd ..
    cat > merchant-app-urls.txt <<URLS
Merchant App Deployment URLs
============================

HTTP URL: http://${BUCKET_NAME}.s3-website.${REGION}.amazonaws.com
HTTPS URL: https://${CLOUDFRONT_DOMAIN}
Signup URL: https://${CLOUDFRONT_DOMAIN}/signup
Distribution ID: ${DISTRIBUTION_ID}

Deployed: $(date)
URLS
    echo "✅ URLs saved to merchant-app-urls.txt"
    echo ""
    
    # Export for next script
    echo "https://${CLOUDFRONT_DOMAIN}" > /tmp/merchant-https-url.txt
else
    echo "⚠️ CloudFront distribution creation failed or already exists"
    echo "Error: $DISTRIBUTION_OUTPUT"
    echo ""
    echo "You can still use the HTTP URL:"
    echo "http://${BUCKET_NAME}.s3-website.${REGION}.amazonaws.com"
    echo ""
    echo "https://${BUCKET_NAME}.s3-website.${REGION}.amazonaws.com" > /tmp/merchant-https-url.txt
fi

