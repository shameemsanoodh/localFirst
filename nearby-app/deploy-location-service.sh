#!/bin/bash

echo "=========================================="
echo "Amazon Location Service Deployment"
echo "=========================================="
echo ""

# Check if Place Index exists
echo "Step 1: Checking if Place Index exists..."
PLACE_INDEX_CHECK=$(aws location describe-place-index --index-name NearByPlaceIndex --region ap-south-1 2>&1)

if echo "$PLACE_INDEX_CHECK" | grep -q "ResourceNotFoundException"; then
    echo "❌ Place Index 'NearByPlaceIndex' not found!"
    echo ""
    echo "Please create it in AWS Console:"
    echo "1. Go to: https://ap-south-1.console.aws.amazon.com/location/home?region=ap-south-1#/place-indexes"
    echo "2. Click 'Create place index'"
    echo "3. Name: NearByPlaceIndex"
    echo "4. Data provider: Esri"
    echo "5. Click 'Create place index'"
    echo ""
    echo "After creating, run this script again."
    exit 1
else
    echo "✅ Place Index 'NearByPlaceIndex' found!"
fi

echo ""
echo "Step 2: Building backend..."
cd backend
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Backend build failed!"
    exit 1
fi

echo "✅ Backend built successfully!"
echo ""

echo "Step 3: Deploying backend to AWS..."
serverless deploy --region ap-south-1

if [ $? -ne 0 ]; then
    echo "❌ Deployment failed!"
    exit 1
fi

echo ""
echo "=========================================="
echo "✅ Deployment Complete!"
echo "=========================================="
echo ""
echo "New endpoint available:"
echo "POST /location/reverse-geocode"
echo ""
echo "Test it with:"
echo 'curl -X POST https://bbplthp3b8.execute-api.ap-south-1.amazonaws.com/dev/location/reverse-geocode \'
echo '  -H "Content-Type: application/json" \'
echo '  -d '"'"'{"lat": 12.9352, "lng": 77.6245}'"'"
echo ""
