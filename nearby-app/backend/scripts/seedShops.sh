#!/bin/bash

TABLE_NAME="nearby-backend-dev-shops"
REGION="ap-south-1"

echo "Seeding shops data to DynamoDB table: $TABLE_NAME"

# Shop 1: Fresh Mart Groceries
aws dynamodb put-item --table-name $TABLE_NAME --region $REGION --item '{
  "shopId": {"S": "shop-001"},
  "name": {"S": "Fresh Mart Groceries"},
  "category": {"S": "Groceries"},
  "description": {"S": "Your daily fresh vegetables, fruits, and groceries delivered to your doorstep"},
  "coverImage": {"S": "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800"},
  "logo": {"S": "https://images.unsplash.com/photo-1542838132-92c53300491e?w=200"},
  "rating": {"N": "4.5"},
  "totalReviews": {"N": "234"},
  "openTime": {"S": "08:00"},
  "closeTime": {"S": "22:00"},
  "location": {"M": {
    "lat": {"N": "12.9352"},
    "lng": {"N": "77.6245"},
    "address": {"S": "12th Main Road, Koramangala"},
    "area": {"S": "Koramangala"}
  }},
  "tags": {"L": [{"S": "fresh"}, {"S": "organic"}, {"S": "delivery"}, {"S": "vegetables"}]},
  "isVerified": {"BOOL": true}
}'
echo "✅ Seeded: Fresh Mart Groceries"

# Shop 2: MedPlus Pharmacy
aws dynamodb put-item --table-name $TABLE_NAME --region $REGION --item '{
  "shopId": {"S": "shop-002"},
  "name": {"S": "MedPlus Pharmacy"},
  "category": {"S": "Pharmacy"},
  "description": {"S": "24/7 pharmacy with prescription medicines and healthcare products"},
  "coverImage": {"S": "https://images.unsplash.com/photo-1576602976047-174e57a47881?w=800"},
  "logo": {"S": "https://images.unsplash.com/photo-1576602976047-174e57a47881?w=200"},
  "rating": {"N": "4.3"},
  "totalReviews": {"N": "156"},
  "openTime": {"S": "00:00"},
  "closeTime": {"S": "23:59"},
  "location": {"M": {
    "lat": {"N": "12.9716"},
    "lng": {"N": "77.5946"},
    "address": {"S": "MG Road, Central Bangalore"},
    "area": {"S": "MG Road"}
  }},
  "tags": {"L": [{"S": "24/7"}, {"S": "medicines"}, {"S": "healthcare"}, {"S": "prescription"}]},
  "isVerified": {"BOOL": true}
}'
echo "✅ Seeded: MedPlus Pharmacy"

# Shop 3: TechZone Electronics
aws dynamodb put-item --table-name $TABLE_NAME --region $REGION --item '{
  "shopId": {"S": "shop-003"},
  "name": {"S": "TechZone Electronics"},
  "category": {"S": "Electronics"},
  "description": {"S": "Latest gadgets, smartphones, laptops and electronic accessories"},
  "coverImage": {"S": "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800"},
  "logo": {"S": "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=200"},
  "rating": {"N": "4.7"},
  "totalReviews": {"N": "89"},
  "openTime": {"S": "10:00"},
  "closeTime": {"S": "21:00"},
  "location": {"M": {
    "lat": {"N": "12.9784"},
    "lng": {"N": "77.6408"},
    "address": {"S": "100 Feet Road, Indiranagar"},
    "area": {"S": "Indiranagar"}
  }},
  "tags": {"L": [{"S": "gadgets"}, {"S": "smartphones"}, {"S": "laptops"}, {"S": "warranty"}]},
  "isVerified": {"BOOL": true}
}'
echo "✅ Seeded: TechZone Electronics"

# Shop 4: Book Haven
aws dynamodb put-item --table-name $TABLE_NAME --region $REGION --item '{
  "shopId": {"S": "shop-004"},
  "name": {"S": "Book Haven"},
  "category": {"S": "Books"},
  "description": {"S": "Wide collection of books, stationery and educational materials"},
  "coverImage": {"S": "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=800"},
  "logo": {"S": "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=200"},
  "rating": {"N": "4.6"},
  "totalReviews": {"N": "67"},
  "openTime": {"S": "09:00"},
  "closeTime": {"S": "20:00"},
  "location": {"M": {
    "lat": {"N": "12.9698"},
    "lng": {"N": "77.7500"},
    "address": {"S": "Whitefield Main Road"},
    "area": {"S": "Whitefield"}
  }},
  "tags": {"L": [{"S": "books"}, {"S": "stationery"}, {"S": "education"}, {"S": "novels"}]},
  "isVerified": {"BOOL": true}
}'
echo "✅ Seeded: Book Haven"

# Shop 5: Fashion Hub
aws dynamodb put-item --table-name $TABLE_NAME --region $REGION --item '{
  "shopId": {"S": "shop-005"},
  "name": {"S": "Fashion Hub"},
  "category": {"S": "Clothing"},
  "description": {"S": "Trendy clothing, accessories and footwear for men and women"},
  "coverImage": {"S": "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800"},
  "logo": {"S": "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200"},
  "rating": {"N": "4.4"},
  "totalReviews": {"N": "128"},
  "openTime": {"S": "10:30"},
  "closeTime": {"S": "21:30"},
  "location": {"M": {
    "lat": {"N": "12.9279"},
    "lng": {"N": "77.6271"},
    "address": {"S": "BTM Layout 2nd Stage"},
    "area": {"S": "BTM Layout"}
  }},
  "tags": {"L": [{"S": "fashion"}, {"S": "clothing"}, {"S": "accessories"}, {"S": "trendy"}]},
  "isVerified": {"BOOL": true}
}'
echo "✅ Seeded: Fashion Hub"

# Shop 6: Fitness First Gym
aws dynamodb put-item --table-name $TABLE_NAME --region $REGION --item '{
  "shopId": {"S": "shop-006"},
  "name": {"S": "Fitness First Gym"},
  "category": {"S": "Fitness"},
  "description": {"S": "Modern gym with personal trainers and fitness equipment"},
  "coverImage": {"S": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800"},
  "logo": {"S": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200"},
  "rating": {"N": "4.8"},
  "totalReviews": {"N": "92"},
  "openTime": {"S": "06:00"},
  "closeTime": {"S": "22:00"},
  "location": {"M": {
    "lat": {"N": "12.9141"},
    "lng": {"N": "77.6411"},
    "address": {"S": "HSR Layout Sector 1"},
    "area": {"S": "HSR Layout"}
  }},
  "tags": {"L": [{"S": "gym"}, {"S": "fitness"}, {"S": "trainer"}, {"S": "equipment"}]},
  "isVerified": {"BOOL": true}
}'
echo "✅ Seeded: Fitness First Gym"

# Shop 7: Pet Paradise
aws dynamodb put-item --table-name $TABLE_NAME --region $REGION --item '{
  "shopId": {"S": "shop-007"},
  "name": {"S": "Pet Paradise"},
  "category": {"S": "Pet Store"},
  "description": {"S": "Pet food, accessories and grooming services for your furry friends"},
  "coverImage": {"S": "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800"},
  "logo": {"S": "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=200"},
  "rating": {"N": "4.2"},
  "totalReviews": {"N": "45"},
  "openTime": {"S": "09:00"},
  "closeTime": {"S": "19:00"},
  "location": {"M": {
    "lat": {"N": "12.9591"},
    "lng": {"N": "77.6974"},
    "address": {"S": "Marathahalli Bridge"},
    "area": {"S": "Marathahalli"}
  }},
  "tags": {"L": [{"S": "pets"}, {"S": "grooming"}, {"S": "food"}, {"S": "accessories"}]},
  "isVerified": {"BOOL": false}
}'
echo "✅ Seeded: Pet Paradise"

# Shop 8: Cafe Delight
aws dynamodb put-item --table-name $TABLE_NAME --region $REGION --item '{
  "shopId": {"S": "shop-008"},
  "name": {"S": "Cafe Delight"},
  "category": {"S": "Cafe"},
  "description": {"S": "Cozy cafe with coffee, snacks and free WiFi"},
  "coverImage": {"S": "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800"},
  "logo": {"S": "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=200"},
  "rating": {"N": "4.5"},
  "totalReviews": {"N": "178"},
  "openTime": {"S": "08:00"},
  "closeTime": {"S": "23:00"},
  "location": {"M": {
    "lat": {"N": "12.9343"},
    "lng": {"N": "77.6060"},
    "address": {"S": "Jayanagar 4th Block"},
    "area": {"S": "Jayanagar"}
  }},
  "tags": {"L": [{"S": "coffee"}, {"S": "wifi"}, {"S": "snacks"}, {"S": "cozy"}]},
  "isVerified": {"BOOL": true}
}'
echo "✅ Seeded: Cafe Delight"

echo ""
echo "✅ All shops seeded successfully!"
