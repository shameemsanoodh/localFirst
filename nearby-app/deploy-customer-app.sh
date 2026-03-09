#!/bin/bash

echo "🚀 Deploying Customer App to AWS S3"
echo ""

# Configuration
BUCKET_NAME="nearby-customer-app"
REGION="ap-south-1"
MERCHANT_APP_URL="${1:-http://nearby-merchant-app.s3-website.ap-south-1.amazonaws.com}"

# Step 1: Update merchant URL in customer app
echo "🔗 Step 1: Updating merchant app URL..."
cd customer-app

# Update the .env file or create it
cat > .env.production <<EOF
VITE_API_BASE_URL=https://your-api-gateway-url.execute-api.ap-south-1.amazonaws.com/dev
VITE_MERCHANT_URL=${MERCHANT_APP_URL}
EOF

echo "✅ Merchant URL set to: ${MERCHANT_APP_URL}"
echo ""

# Step 2: Build the app
echo "📦 Step 2: Building customer app..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build successful!"
echo ""

# Step 3: Create S3 bucket if it doesn't exist
echo "🪣 Step 3: Creating S3 bucket..."
aws s3 mb s3://${BUCKET_NAME} --region ${REGION} 2>/dev/null || echo "Bucket already exists"

# Step 4: Configure bucket for static website hosting
echo "🌐 Step 4: Configuring static website hosting..."
aws s3 website s3://${BUCKET_NAME} \
    --index-document index.html \
    --error-document index.html

# Step 5: Set bucket policy for public access
echo "🔓 Step 5: Setting bucket policy..."
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

# Step 6: Upload files to S3
echo "📤 Step 6: Uploading files to S3..."
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
echo "✅ Deployment complete!"
echo ""
echo "🌍 Your customer app is live at:"
echo "http://${BUCKET_NAME}.s3-website.${REGION}.amazonaws.com"
echo ""
echo "Note: For HTTPS, you'll need to set up CloudFront distribution"
echo ""
