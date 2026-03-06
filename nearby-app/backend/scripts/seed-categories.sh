#!/bin/bash
# Seed predefined categories into DynamoDB
# Run: chmod +x scripts/seed-categories.sh && ./scripts/seed-categories.sh

REGION="ap-south-1"
TABLE="nearby-backend-dev-categories"
NOW=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")

echo "🌱 Seeding categories into DynamoDB ($TABLE)..."

# 1. Groceries
aws dynamodb put-item --region $REGION --table-name $TABLE --item '{
  "categoryId": {"S": "groceries"},
  "name": {"S": "Groceries"},
  "icon": {"S": "/icons/groceries.png"},
  "emoji": {"S": "🛒"},
  "color": {"S": "bg-green-100"},
  "parentId": {"S": "root"},
  "level": {"N": "0"},
  "depth": {"N": "0"},
  "sortOrder": {"N": "1"},
  "isActive": {"BOOL": true},
  "createdAt": {"S": "'$NOW'"},
  "updatedAt": {"S": "'$NOW'"}
}' && echo "  ✅ Groceries"

# 2. Hardware
aws dynamodb put-item --region $REGION --table-name $TABLE --item '{
  "categoryId": {"S": "hardware"},
  "name": {"S": "Hardware"},
  "icon": {"S": "/icons/hardware.png"},
  "emoji": {"S": "🔧"},
  "color": {"S": "bg-orange-100"},
  "parentId": {"S": "root"},
  "level": {"N": "0"},
  "depth": {"N": "0"},
  "sortOrder": {"N": "2"},
  "isActive": {"BOOL": true},
  "createdAt": {"S": "'$NOW'"},
  "updatedAt": {"S": "'$NOW'"}
}' && echo "  ✅ Hardware"

# 3. Pharmacy
aws dynamodb put-item --region $REGION --table-name $TABLE --item '{
  "categoryId": {"S": "pharmacy"},
  "name": {"S": "Pharmacy"},
  "icon": {"S": "/icons/pharmacy.png"},
  "emoji": {"S": "💊"},
  "color": {"S": "bg-red-100"},
  "parentId": {"S": "root"},
  "level": {"N": "0"},
  "depth": {"N": "0"},
  "sortOrder": {"N": "3"},
  "isActive": {"BOOL": true},
  "createdAt": {"S": "'$NOW'"},
  "updatedAt": {"S": "'$NOW'"}
}' && echo "  ✅ Pharmacy"

# 4. Automobile
aws dynamodb put-item --region $REGION --table-name $TABLE --item '{
  "categoryId": {"S": "automobile"},
  "name": {"S": "Automobile"},
  "icon": {"S": "/icons/automobile.png"},
  "emoji": {"S": "🚗"},
  "color": {"S": "bg-gray-800"},
  "parentId": {"S": "root"},
  "level": {"N": "0"},
  "depth": {"N": "0"},
  "sortOrder": {"N": "4"},
  "isActive": {"BOOL": true},
  "createdAt": {"S": "'$NOW'"},
  "updatedAt": {"S": "'$NOW'"}
}' && echo "  ✅ Automobile"

# 5. Electronics
aws dynamodb put-item --region $REGION --table-name $TABLE --item '{
  "categoryId": {"S": "electronics"},
  "name": {"S": "Electronics"},
  "icon": {"S": "/icons/electronics.png"},
  "emoji": {"S": "📱"},
  "color": {"S": "bg-purple-100"},
  "parentId": {"S": "root"},
  "level": {"N": "0"},
  "depth": {"N": "0"},
  "sortOrder": {"N": "5"},
  "isActive": {"BOOL": true},
  "createdAt": {"S": "'$NOW'"},
  "updatedAt": {"S": "'$NOW'"}
}' && echo "  ✅ Electronics"

# 6. Mobile
aws dynamodb put-item --region $REGION --table-name $TABLE --item '{
  "categoryId": {"S": "mobile"},
  "name": {"S": "Mobile"},
  "icon": {"S": "/icons/mobile.png"},
  "emoji": {"S": "💻"},
  "color": {"S": "bg-yellow-100"},
  "parentId": {"S": "root"},
  "level": {"N": "0"},
  "depth": {"N": "0"},
  "sortOrder": {"N": "6"},
  "isActive": {"BOOL": true},
  "createdAt": {"S": "'$NOW'"},
  "updatedAt": {"S": "'$NOW'"}
}' && echo "  ✅ Mobile"

# 7. Home Essentials
aws dynamodb put-item --region $REGION --table-name $TABLE --item '{
  "categoryId": {"S": "home"},
  "name": {"S": "Home Essentials"},
  "icon": {"S": "/icons/home-essentials.png"},
  "emoji": {"S": "🏠"},
  "color": {"S": "bg-blue-100"},
  "parentId": {"S": "root"},
  "level": {"N": "0"},
  "depth": {"N": "0"},
  "sortOrder": {"N": "7"},
  "isActive": {"BOOL": true},
  "createdAt": {"S": "'$NOW'"},
  "updatedAt": {"S": "'$NOW'"}
}' && echo "  ✅ Home Essentials"

# 8. Pet Supplies
aws dynamodb put-item --region $REGION --table-name $TABLE --item '{
  "categoryId": {"S": "pets"},
  "name": {"S": "Pet Supplies"},
  "icon": {"S": "/icons/pet-supplies.png"},
  "emoji": {"S": "🐾"},
  "color": {"S": "bg-amber-100"},
  "parentId": {"S": "root"},
  "level": {"N": "0"},
  "depth": {"N": "0"},
  "sortOrder": {"N": "8"},
  "isActive": {"BOOL": true},
  "createdAt": {"S": "'$NOW'"},
  "updatedAt": {"S": "'$NOW'"}
}' && echo "  ✅ Pet Supplies"

echo ""
echo "🎉 All 8 categories seeded successfully!"
echo ""
echo "Verify: aws dynamodb scan --table-name $TABLE --region $REGION --select COUNT"
