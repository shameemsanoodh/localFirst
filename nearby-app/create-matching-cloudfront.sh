#!/bin/bash

# Create CloudFront distributions matching the existing one
# Uses S3 website endpoint with CustomOriginConfig (same as d3j65m5o80vf8x.cloudfront.net)

set -e

echo "🚀 Creating CloudFront distributions (matching existing setup)..."
echo ""

# Function to create distribution matching the existing pattern
create_distribution() {
    local BUCKET_NAME=$1
    local APP_NAME=$2
    local CALLER_REF="${BUCKET_NAME}-$(date +%s)"
    
    echo "📦 Creating CloudFront for $APP_NAME..."
    echo "   Bucket: $BUCKET_NAME"
    
    # Create distribution config matching existing setup
    cat > /tmp/cf-${BUCKET_NAME}.json <<EOF
{
  "CallerReference": "${CALLER_REF}",
  "Comment": "${APP_NAME} Distribution",
  "Enabled": true,
  "DefaultRootObject": "index.html",
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-${BUCKET_NAME}",
        "DomainName": "${BUCKET_NAME}.s3-website.ap-south-1.amazonaws.com",
        "OriginPath": "",
        "CustomHeaders": {
          "Quantity": 0
        },
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
        "OriginShield": {
          "Enabled": false
        }
      }
    ]
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
    echo "$APP_NAME,$DISTRIBUTION_ID,https://$CLOUDFRONT_URL,InProgress" >> cloudfront-results.csv
    
    rm /tmp/cf-${BUCKET_NAME}.json
}

# Initialize results file
echo "App,Distribution ID,HTTPS URL,Status" > cloudfront-results.csv

# Add existing distribution
echo "Customer App (existing),E18LK80ADX38TT,https://d3j65m5o80vf8x.cloudfront.net,Deployed" >> cloudfront-results.csv

echo "📋 Existing CloudFront Distribution:"
echo "   Customer App: https://d3j65m5o80vf8x.cloudfront.net (already deployed)"
echo ""

# Create new distributions
echo "Creating new distributions..."
echo ""

create_distribution "nearby-merchant-app" "Merchant App"
create_distribution "nearby-admin-app" "Admin App"

echo ""
echo "📊 Summary:"
echo ""
cat cloudfront-results.csv | column -t -s,
echo ""
echo "⏳ New distributions will take 15-20 minutes to deploy"
echo ""
echo "🔍 Check status:"
echo "   aws cloudfront list-distributions --query 'DistributionList.Items[*].[Id,DomainName,Status]' --output table"
echo ""
echo "📱 Test on mobile once Status = 'Deployed'"
