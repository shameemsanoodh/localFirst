#!/bin/bash

# Setup CloudFront distributions for all three apps to enable HTTPS access
# This fixes mobile browser issues with HTTP-only S3 website URLs

set -e

echo "🚀 Setting up CloudFront distributions for HTTPS access..."
echo ""

# Function to create CloudFront distribution
create_distribution() {
    local BUCKET_NAME=$1
    local APP_NAME=$2
    
    echo "📦 Creating CloudFront distribution for $APP_NAME..."
    
    # Create distribution config
    DISTRIBUTION_CONFIG=$(cat <<EOF
{
  "CallerReference": "$BUCKET_NAME-$(date +%s)",
  "Comment": "$APP_NAME - HTTPS enabled",
  "Enabled": true,
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "$BUCKET_NAME-origin",
        "DomainName": "$BUCKET_NAME.s3-website.ap-south-1.amazonaws.com",
        "CustomOriginConfig": {
          "HTTPPort": 80,
          "HTTPSPort": 443,
          "OriginProtocolPolicy": "http-only",
          "OriginSslProtocols": {
            "Quantity": 1,
            "Items": ["TLSv1.2"]
          }
        }
      }
    ]
  },
  "DefaultRootObject": "index.html",
  "DefaultCacheBehavior": {
    "TargetOriginId": "$BUCKET_NAME-origin",
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
      }
    },
    "MinTTL": 0,
    "DefaultTTL": 86400,
    "MaxTTL": 31536000
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
)
    
    # Create the distribution
    RESULT=$(aws cloudfront create-distribution --distribution-config "$DISTRIBUTION_CONFIG" --output json)
    
    DISTRIBUTION_ID=$(echo "$RESULT" | jq -r '.Distribution.Id')
    CLOUDFRONT_URL=$(echo "$RESULT" | jq -r '.Distribution.DomainName')
    
    echo "✅ Created distribution: $DISTRIBUTION_ID"
    echo "🌐 CloudFront URL: https://$CLOUDFRONT_URL"
    echo ""
    
    # Save to file
    echo "$APP_NAME,$DISTRIBUTION_ID,https://$CLOUDFRONT_URL" >> cloudfront-urls.txt
}

# Clear previous results
rm -f cloudfront-urls.txt
echo "App,Distribution ID,HTTPS URL" > cloudfront-urls.txt

# Create distributions for all three apps
create_distribution "nearby-customer-app" "Customer App"
create_distribution "nearby-merchant-app" "Merchant App"
create_distribution "nearby-admin-app" "Admin App"

echo ""
echo "✅ All CloudFront distributions created!"
echo ""
echo "📋 URLs saved to: cloudfront-urls.txt"
echo ""
echo "⚠️  IMPORTANT:"
echo "1. CloudFront distributions take 15-20 minutes to deploy"
echo "2. Check status with: aws cloudfront get-distribution --id <DISTRIBUTION_ID>"
echo "3. Once deployed, update .env.production files with new HTTPS URLs"
echo "4. Rebuild and redeploy apps with updated URLs"
echo ""
echo "🔍 View all distributions:"
echo "aws cloudfront list-distributions --query 'DistributionList.Items[*].[Id,DomainName,Status]' --output table"
