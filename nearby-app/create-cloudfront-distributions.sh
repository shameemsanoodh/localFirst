#!/bin/bash

# Create CloudFront distributions for HTTPS access
# Points to S3 bucket (not website endpoint) for proper HTTPS support

set -e

echo "🚀 Creating CloudFront distributions for HTTPS access..."
echo ""

# Function to create CloudFront distribution pointing to S3 bucket
create_cloudfront_distribution() {
    local BUCKET_NAME=$1
    local APP_NAME=$2
    
    echo "📦 Creating CloudFront distribution for $APP_NAME..."
    echo "   Bucket: $BUCKET_NAME"
    
    # Create distribution config JSON
    cat > /tmp/cf-config-${BUCKET_NAME}.json <<EOF
{
  "CallerReference": "${BUCKET_NAME}-$(date +%s)",
  "Comment": "${APP_NAME} - HTTPS enabled",
  "Enabled": true,
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "${BUCKET_NAME}-origin",
        "DomainName": "${BUCKET_NAME}.s3.ap-south-1.amazonaws.com",
        "S3OriginConfig": {
          "OriginAccessIdentity": ""
        }
      }
    ]
  },
  "DefaultRootObject": "index.html",
  "DefaultCacheBehavior": {
    "TargetOriginId": "${BUCKET_NAME}-origin",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 2,
      "Items": ["GET", "HEAD"],
      "CachedMethods": {
        "Quantity": 2,
        "Items": ["GET", "HEAD"]
      }
    },
    "Compress": true,
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": {
        "Forward": "none"
      },
      "Headers": {
        "Quantity": 0
      }
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
    "Quantity": 1,
    "Items": [
      {
        "ErrorCode": 404,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 300
      }
    ]
  },
  "PriceClass": "PriceClass_All"
}
EOF
    
    # Create the distribution
    echo "   Creating distribution..."
    RESULT=$(aws cloudfront create-distribution \
        --distribution-config file:///tmp/cf-config-${BUCKET_NAME}.json \
        --output json 2>&1)
    
    if echo "$RESULT" | grep -q "AccessDenied"; then
        echo "   ❌ Access Denied - Account needs verification"
        echo "   Contact AWS Support: https://console.aws.amazon.com/support/home#/"
        return 1
    fi
    
    DISTRIBUTION_ID=$(echo "$RESULT" | jq -r '.Distribution.Id')
    CLOUDFRONT_URL=$(echo "$RESULT" | jq -r '.Distribution.DomainName')
    STATUS=$(echo "$RESULT" | jq -r '.Distribution.Status')
    
    echo "   ✅ Created!"
    echo "   Distribution ID: $DISTRIBUTION_ID"
    echo "   HTTPS URL: https://$CLOUDFRONT_URL"
    echo "   Status: $STATUS (will take 15-20 minutes to deploy)"
    echo ""
    
    # Save to results file
    echo "$APP_NAME,$DISTRIBUTION_ID,https://$CLOUDFRONT_URL,$STATUS" >> cloudfront-distributions.csv
    
    # Clean up temp file
    rm /tmp/cf-config-${BUCKET_NAME}.json
}

# Initialize results file
echo "App Name,Distribution ID,HTTPS URL,Status" > cloudfront-distributions.csv

# Create distributions for all three apps
echo "Creating CloudFront distributions..."
echo ""

create_cloudfront_distribution "nearby-customer-app" "Customer App"
create_cloudfront_distribution "nearby-merchant-app" "Merchant App"
create_cloudfront_distribution "nearby-admin-app" "Admin App"

echo ""
echo "✅ CloudFront distributions created!"
echo ""
echo "📋 Results saved to: cloudfront-distributions.csv"
echo ""
cat cloudfront-distributions.csv
echo ""
echo "⏳ IMPORTANT: Distributions take 15-20 minutes to deploy"
echo ""
echo "🔍 Check deployment status:"
echo "   aws cloudfront list-distributions --query 'DistributionList.Items[*].[Id,DomainName,Status]' --output table"
echo ""
echo "📱 Once Status = 'Deployed', use the HTTPS URLs on mobile!"
