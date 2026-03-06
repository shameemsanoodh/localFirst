#!/bin/bash

# Cleanup Test Phone Script
# This script helps remove test phone numbers from DynamoDB for testing

PHONE_NUMBER="${1:-9876543299}"
REGION="ap-south-1"
USERS_TABLE="nearby-users"
MERCHANTS_TABLE="nearby-merchants"

echo "🧹 Cleaning up test phone: $PHONE_NUMBER"
echo "================================"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Please install it first."
    exit 1
fi

# Check if running locally with DynamoDB Local
if [ -n "$DYNAMODB_ENDPOINT" ]; then
    ENDPOINT_FLAG="--endpoint-url $DYNAMODB_ENDPOINT"
    echo "📍 Using local DynamoDB endpoint: $DYNAMODB_ENDPOINT"
else
    ENDPOINT_FLAG=""
    echo "📍 Using AWS DynamoDB in region: $REGION"
fi

echo ""
echo "1️⃣  Searching for phone in users table..."

# Query users table by phone (using GSI)
USER_QUERY=$(aws dynamodb query \
    --table-name $USERS_TABLE \
    --index-name phone-index \
    --key-condition-expression "phone = :phone" \
    --expression-attribute-values '{":phone":{"S":"'$PHONE_NUMBER'"}}' \
    --region $REGION \
    $ENDPOINT_FLAG \
    2>&1)

if echo "$USER_QUERY" | grep -q "Count.*0"; then
    echo "   ℹ️  Phone not found in users table"
elif echo "$USER_QUERY" | grep -q "Items"; then
    echo "   ✅ Found phone in users table"
    
    # Extract the primary key (phone is the key)
    echo "   🗑️  Deleting from users table..."
    aws dynamodb delete-item \
        --table-name $USERS_TABLE \
        --key '{"phone":{"S":"'$PHONE_NUMBER'"}}' \
        --region $REGION \
        $ENDPOINT_FLAG
    
    if [ $? -eq 0 ]; then
        echo "   ✅ Deleted from users table"
    else
        echo "   ❌ Failed to delete from users table"
    fi
else
    echo "   ⚠️  Error querying users table:"
    echo "$USER_QUERY"
fi

echo ""
echo "2️⃣  Searching for phone in merchants table..."

# Scan merchants table for phone (since merchantId is the key)
MERCHANT_SCAN=$(aws dynamodb scan \
    --table-name $MERCHANTS_TABLE \
    --filter-expression "phone = :phone" \
    --expression-attribute-values '{":phone":{"S":"'$PHONE_NUMBER'"}}' \
    --region $REGION \
    $ENDPOINT_FLAG \
    2>&1)

if echo "$MERCHANT_SCAN" | grep -q "Count.*0"; then
    echo "   ℹ️  Phone not found in merchants table"
elif echo "$MERCHANT_SCAN" | grep -q "Items"; then
    echo "   ✅ Found phone in merchants table"
    
    # Extract merchantId from the result
    MERCHANT_ID=$(echo "$MERCHANT_SCAN" | grep -oP '"merchantId":\s*{\s*"S":\s*"\K[^"]+' | head -1)
    
    if [ -n "$MERCHANT_ID" ]; then
        echo "   📋 Merchant ID: $MERCHANT_ID"
        echo "   🗑️  Deleting from merchants table..."
        
        aws dynamodb delete-item \
            --table-name $MERCHANTS_TABLE \
            --key '{"merchantId":{"S":"'$MERCHANT_ID'"}}' \
            --region $REGION \
            $ENDPOINT_FLAG
        
        if [ $? -eq 0 ]; then
            echo "   ✅ Deleted from merchants table"
        else
            echo "   ❌ Failed to delete from merchants table"
        fi
    else
        echo "   ⚠️  Could not extract merchant ID"
    fi
else
    echo "   ⚠️  Error scanning merchants table:"
    echo "$MERCHANT_SCAN"
fi

echo ""
echo "================================"
echo "✅ Cleanup complete!"
echo ""
echo "💡 You can now test signup with phone: $PHONE_NUMBER"
echo ""
