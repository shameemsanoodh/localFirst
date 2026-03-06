#!/bin/bash

# Get the role ARN
ROLE_ARN=$(aws iam get-role --role-name NearbyBedrockKBRole --query 'Role.Arn' --output text)
echo "Using IAM Role: $ROLE_ARN"

# Wait for role to propagate
echo "Waiting 10 seconds for IAM role to propagate..."
sleep 10

# Create Knowledge Base
echo "Creating Knowledge Base..."
KB_RESPONSE=$(aws bedrock-agent create-knowledge-base \
  --name "NearbyMerchantCapabilities" \
  --description "Merchant capabilities for NearBy app - maps user queries to capability IDs" \
  --role-arn "$ROLE_ARN" \
  --knowledge-base-configuration '{
    "type": "VECTOR",
    "vectorKnowledgeBaseConfiguration": {
      "embeddingModelArn": "arn:aws:bedrock:ap-south-1::foundation-model/amazon.titan-embed-text-v2:0"
    }
  }' \
  --storage-configuration '{
    "type": "OPENSEARCH_SERVERLESS",
    "opensearchServerlessConfiguration": {
      "collectionArn": "arn:aws:aoss:ap-south-1:202963740563:collection/nearby-kb",
      "vectorIndexName": "nearby-capabilities",
      "fieldMapping": {
        "vectorField": "embedding",
        "textField": "text",
        "metadataField": "metadata"
      }
    }
  }' \
  --region ap-south-1 2>&1)

echo "$KB_RESPONSE"

# Extract KB ID
KB_ID=$(echo "$KB_RESPONSE" | grep -o '"knowledgeBaseId": "[^"]*"' | cut -d'"' -f4)

if [ -n "$KB_ID" ]; then
  echo ""
  echo "✅ Knowledge Base created successfully!"
  echo "Knowledge Base ID: $KB_ID"
  echo ""
  echo "Next steps:"
  echo "1. Create data source pointing to s3://nearby-kb/categories/"
  echo "2. Ingest the data"
  echo "3. Test query: 'tempered glass for redmi'"
else
  echo "❌ Failed to create Knowledge Base"
  echo "Error: $KB_RESPONSE"
fi
