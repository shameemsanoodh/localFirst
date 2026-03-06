import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(client);

const SHOPS_TABLE = 'nearby-backend-dev-shops';

const seedShops = [
  {
    shopId: 'shop-001',
    name: 'Fresh Mart Groceries',
    category: 'Groceries',
    description: 'Your daily fresh vegetables, fruits, and groceries delivered to your doorstep',
    coverImage: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800',
    logo: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200',
    rating: 4.5,
    totalReviews: 234,
    openTime: '08:00',
    closeTime: '22:00',
    location: {
      lat: 12.9352,
      lng: 77.6245,
      address: '12th Main Road, Koramangala',
      area: 'Koramangala',
    },
    tags: ['fresh', 'organic', 'delivery', 'vegetables'],
    isVerified: true,
  },
  {
    shopId: 'shop-002',
    name: 'MedPlus Pharmacy',
    category: 'Pharmacy',
    description: '24/7 pharmacy with prescription medicines and healthcare products',
    coverImage: 'https://images.unsplash.com/photo-1576602976047-174e57a47881?w=800',
    logo: 'https://images.unsplash.com/photo-1576602976047-174e57a47881?w=200',
    rating: 4.3,
    totalReviews: 156,
    openTime: '00:00',
    closeTime: '23:59',
    location: {
      lat: 12.9716,
      lng: 77.5946,
      address: 'MG Road, Central Bangalore',
      area: 'MG Road',
    },
    tags: ['24/7', 'medicines', 'healthcare', 'prescription'],
    isVerified: true,
  },
  {
    shopId: 'shop-003',
    name: 'TechZone Electronics',
    category: 'Electronics',
    description: 'Latest gadgets, smartphones, laptops and electronic accessories',
    coverImage: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800',
    logo: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=200',
    rating: 4.7,
    totalReviews: 89,
    openTime: '10:00',
    closeTime: '21:00',
    location: {
      lat: 12.9784,
      lng: 77.6408,
      address: '100 Feet Road, Indiranagar',
      area: 'Indiranagar',
    },
    tags: ['gadgets', 'smartphones', 'laptops', 'warranty'],
    isVerified: true,
  },
  {
    shopId: 'shop-004',
    name: 'Book Haven',
    category: 'Books',
    description: 'Wide collection of books, stationery and educational materials',
    coverImage: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=800',
    logo: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=200',
    rating: 4.6,
    totalReviews: 67,
    openTime: '09:00',
    closeTime: '20:00',
    location: {
      lat: 12.9698,
      lng: 77.7500,
      address: 'Whitefield Main Road',
      area: 'Whitefield',
    },
    tags: ['books', 'stationery', 'education', 'novels'],
    isVerified: true,
  },
  {
    shopId: 'shop-005',
    name: 'Fashion Hub',
    category: 'Clothing',
    description: 'Trendy clothing, accessories and footwear for men and women',
    coverImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800',
    logo: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200',
    rating: 4.4,
    totalReviews: 128,
    openTime: '10:30',
    closeTime: '21:30',
    location: {
      lat: 12.9279,
      lng: 77.6271,
      address: 'BTM Layout 2nd Stage',
      area: 'BTM Layout',
    },
    tags: ['fashion', 'clothing', 'accessories', 'trendy'],
    isVerified: true,
  },
  {
    shopId: 'shop-006',
    name: 'Fitness First Gym',
    category: 'Fitness',
    description: 'Modern gym with personal trainers and fitness equipment',
    coverImage: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800',
    logo: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200',
    rating: 4.8,
    totalReviews: 92,
    openTime: '06:00',
    closeTime: '22:00',
    location: {
      lat: 12.9141,
      lng: 77.6411,
      address: 'HSR Layout Sector 1',
      area: 'HSR Layout',
    },
    tags: ['gym', 'fitness', 'trainer', 'equipment'],
    isVerified: true,
  },
  {
    shopId: 'shop-007',
    name: 'Pet Paradise',
    category: 'Pet Store',
    description: 'Pet food, accessories and grooming services for your furry friends',
    coverImage: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800',
    logo: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=200',
    rating: 4.2,
    totalReviews: 45,
    openTime: '09:00',
    closeTime: '19:00',
    location: {
      lat: 12.9591,
      lng: 77.6974,
      address: 'Marathahalli Bridge',
      area: 'Marathahalli',
    },
    tags: ['pets', 'grooming', 'food', 'accessories'],
    isVerified: false,
  },
  {
    shopId: 'shop-008',
    name: 'Cafe Delight',
    category: 'Cafe',
    description: 'Cozy cafe with coffee, snacks and free WiFi',
    coverImage: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800',
    logo: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=200',
    rating: 4.5,
    totalReviews: 178,
    openTime: '08:00',
    closeTime: '23:00',
    location: {
      lat: 12.9343,
      lng: 77.6060,
      address: 'Jayanagar 4th Block',
      area: 'Jayanagar',
    },
    tags: ['coffee', 'wifi', 'snacks', 'cozy'],
    isVerified: true,
  },
];

async function seedData() {
  console.log('Starting to seed shops data...');
  
  for (const shop of seedShops) {
    try {
      const command = new PutCommand({
        TableName: SHOPS_TABLE,
        Item: shop,
      });
      
      await docClient.send(command);
      console.log(`✅ Seeded shop: ${shop.name}`);
    } catch (error) {
      console.error(`❌ Failed to seed shop: ${shop.name}`, error);
    }
  }
  
  console.log('✅ Seeding completed!');
}

seedData();
