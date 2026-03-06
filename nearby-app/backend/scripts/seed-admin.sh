#!/bin/bash
# Seed admin user into DynamoDB + Cognito
# Run: chmod +x scripts/seed-admin.sh && ./scripts/seed-admin.sh

REGION="ap-south-1"
TABLE="nearby-backend-dev-users"
COGNITO_POOL_ID="ap-south-1_JBBrnRrQG"
NOW=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")
ADMIN_EMAIL="admin@nearby.com"
ADMIN_PASSWORD="Admin@1234"
ADMIN_NAME="Admin"
ADMIN_PHONE="9999999999"

echo "👤 Seeding admin user..."

# Hash password using node (bcrypt)
HASHED_PASSWORD=$(node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('$ADMIN_PASSWORD', 10).then(h => console.log(h));" 2>/dev/null)

if [ -z "$HASHED_PASSWORD" ]; then
  echo "⚠️  bcryptjs not available globally, using backend node_modules..."
  HASHED_PASSWORD=$(cd /home/shameem/Documents/Kiro/localfirst/nearby-app/backend && node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('$ADMIN_PASSWORD', 10).then(h => console.log(h));")
fi

echo "  Password hashed: ${HASHED_PASSWORD:0:20}..."

# Insert admin into DynamoDB
aws dynamodb put-item --region $REGION --table-name $TABLE --item '{
  "userId": {"S": "admin-001"},
  "email": {"S": "'$ADMIN_EMAIL'"},
  "password": {"S": "'$HASHED_PASSWORD'"},
  "name": {"S": "'$ADMIN_NAME'"},
  "phone": {"S": "'$ADMIN_PHONE'"},
  "role": {"S": "admin"},
  "createdAt": {"S": "'$NOW'"},
  "updatedAt": {"S": "'$NOW'"}
}' && echo "  ✅ Admin user created in DynamoDB"

# Also create a merchant user
MERCHANT_EMAIL="merchant@nearby.com"
MERCHANT_PASSWORD="Merchant@1234"
HASHED_MERCHANT_PW=$(cd /home/shameem/Documents/Kiro/localfirst/nearby-app/backend && node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('$MERCHANT_PASSWORD', 10).then(h => console.log(h));")

aws dynamodb put-item --region $REGION --table-name $TABLE --item '{
  "userId": {"S": "merchant-001"},
  "email": {"S": "'$MERCHANT_EMAIL'"},
  "password": {"S": "'$HASHED_MERCHANT_PW'"},
  "name": {"S": "Fresh Mart"},
  "phone": {"S": "9888888888"},
  "role": {"S": "merchant"},
  "createdAt": {"S": "'$NOW'"},
  "updatedAt": {"S": "'$NOW'"}
}' && echo "  ✅ Merchant user created in DynamoDB"

# Try creating admin in Cognito (optional)
echo ""
echo "🔐 Creating users in Cognito..."
aws cognito-idp admin-create-user \
  --user-pool-id $COGNITO_POOL_ID \
  --username "$ADMIN_EMAIL" \
  --user-attributes Name=email,Value="$ADMIN_EMAIL" Name=name,Value="$ADMIN_NAME" Name=phone_number,Value="+91$ADMIN_PHONE" \
  --temporary-password "$ADMIN_PASSWORD" \
  --message-action SUPPRESS \
  --region $REGION 2>/dev/null && echo "  ✅ Admin created in Cognito" || echo "  ⚠️  Admin may already exist in Cognito"

aws cognito-idp admin-create-user \
  --user-pool-id $COGNITO_POOL_ID \
  --username "$MERCHANT_EMAIL" \
  --user-attributes Name=email,Value="$MERCHANT_EMAIL" Name=name,Value="Fresh Mart" Name=phone_number,Value="+919888888888" \
  --temporary-password "$MERCHANT_PASSWORD" \
  --message-action SUPPRESS \
  --region $REGION 2>/dev/null && echo "  ✅ Merchant created in Cognito" || echo "  ⚠️  Merchant may already exist in Cognito"

echo ""
echo "🎉 Users seeded successfully!"
echo ""
echo "📋 Login Credentials:"
echo "  Admin:    $ADMIN_EMAIL / $ADMIN_PASSWORD"
echo "  Merchant: $MERCHANT_EMAIL / $MERCHANT_PASSWORD"
echo "  User:     shameem@example.com / (existing password)"
