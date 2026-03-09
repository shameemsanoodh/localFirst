#!/bin/bash

echo "=== DynamoDB Tables Diagnostic ==="
echo ""

# Check if DynamoDB Local is accessible
echo "1. Checking DynamoDB Local connection..."
if curl -s http://localhost:8000 > /dev/null 2>&1; then
    echo "✓ DynamoDB Local is running"
else
    echo "✗ DynamoDB Local is NOT running"
    echo "  Backend needs to be started: cd backend && npm run offline"
    exit 1
fi

echo ""
echo "2. Listing all tables..."
TABLES=$(aws dynamodb list-tables --endpoint-url http://localhost:8000 2>/dev/null | jq -r '.TableNames[]' 2>/dev/null)

if [ -z "$TABLES" ]; then
    echo "✗ No tables found!"
    echo ""
    echo "This means:"
    echo "  - Backend was never started, OR"
    echo "  - Backend crashed during table creation, OR"
    echo "  - Tables were deleted"
    echo ""
    echo "Solution: Restart backend to create tables"
    echo "  cd nearby-app/backend"
    echo "  npm run offline"
    exit 1
fi

echo "Found tables:"
echo "$TABLES" | while read table; do
    echo "  ✓ $table"
done

echo ""
echo "3. Checking required tables..."

REQUIRED_TABLES=(
    "nearby-backend-dev-broadcasts"
    "nearby-backend-dev-merchants"
    "nearby-backend-dev-shops"
    "nearby-backend-dev-responses"
)

for table in "${REQUIRED_TABLES[@]}"; do
    if echo "$TABLES" | grep -q "^$table$"; then
        echo "  ✓ $table exists"
    else
        echo "  ✗ $table MISSING"
    fi
done

echo ""
echo "4. Checking broadcasts table structure..."
BROADCASTS_TABLE="nearby-backend-dev-broadcasts"

if echo "$TABLES" | grep -q "^$BROADCASTS_TABLE$"; then
    echo "Describing $BROADCASTS_TABLE..."
    aws dynamodb describe-table \
        --table-name "$BROADCASTS_TABLE" \
        --endpoint-url http://localhost:8000 \
        2>/dev/null | jq -r '.Table | {
            TableName,
            KeySchema,
            AttributeDefinitions,
            GlobalSecondaryIndexes: [.GlobalSecondaryIndexes[]? | {IndexName, KeySchema}]
        }'
    
    echo ""
    echo "5. Scanning for broadcast items..."
    ITEM_COUNT=$(aws dynamodb scan \
        --table-name "$BROADCASTS_TABLE" \
        --select "COUNT" \
        --endpoint-url http://localhost:8000 \
        2>/dev/null | jq -r '.Count')
    
    echo "Total broadcasts in table: $ITEM_COUNT"
    
    if [ "$ITEM_COUNT" -gt 0 ]; then
        echo ""
        echo "Sample broadcast item:"
        aws dynamodb scan \
            --table-name "$BROADCASTS_TABLE" \
            --limit 1 \
            --endpoint-url http://localhost:8000 \
            2>/dev/null | jq -r '.Items[0]'
    fi
else
    echo "✗ Broadcasts table does not exist!"
fi

echo ""
echo "=== Diagnostic Complete ==="
