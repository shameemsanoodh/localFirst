#!/bin/bash

REGION="ap-south-1"

# Configure buckets
for BUCKET in nearby-merchant-app nearby-customer-app nearby-admin-app; do
  echo "Configuring $BUCKET..."
  
  # Enable static website hosting
  aws s3 website s3://$BUCKET --index-document index.html --error-document index.html
  
  # Set bucket policy for public read
  aws s3api put-bucket-policy --bucket $BUCKET --policy "{
    \"Version\": \"2012-10-17\",
    \"Statement\": [{
      \"Sid\": \"PublicReadGetObject\",
      \"Effect\": \"Allow\",
      \"Principal\": \"*\",
      \"Action\": \"s3:GetObject\",
      \"Resource\": \"arn:aws:s3:::$BUCKET/*\"
    }]
  }"
  
  # Disable public access block
  aws s3api put-public-access-block --bucket $BUCKET \
    --public-access-block-configuration \
    "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"
done

# Upload files
echo "Uploading merchant-app..."
aws s3 sync merchant-app/dist/ s3://nearby-merchant-app/ --delete

echo "Uploading customer-app..."
aws s3 sync customer-app/dist/ s3://nearby-customer-app/ --delete

echo "Uploading admin-app..."
aws s3 sync admin-app/dist/ s3://nearby-admin-app/ --delete

echo ""
echo "✅ Deployment Complete!"
echo ""
echo "📱 Production URLs:"
echo ""
echo "Merchant App: http://nearby-merchant-app.s3-website.ap-south-1.amazonaws.com"
echo "Customer App: http://nearby-customer-app.s3-website.ap-south-1.amazonaws.com"
echo "Admin App: http://nearby-admin-app.s3-website.ap-south-1.amazonaws.com"
echo ""
