#!/bin/bash

echo "🚀 Deploying Merchant App to AWS S3"
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
echo "✅ Deployment complete!"
echo ""
echo "🌍 Your merchant app is live at:"
echo "http://${BUCKET_NAME}.s3-website.${REGION}.amazonaws.com"
echo ""
echo "📝 Signup page URL:"
echo "http://${BUCKET_NAME}.s3-website.${REGION}.amazonaws.com/signup"
echo ""
echo "Note: For HTTPS, you'll need to set up CloudFront distribution"
echo ""
