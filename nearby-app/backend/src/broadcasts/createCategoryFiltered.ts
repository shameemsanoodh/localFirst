import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { db, Tables } from '../shared/db.js';
import { response } from '../shared/response.js';
import { calculateDistance } from '../shared/distance.js';
import ngeohash from 'ngeohash';

interface CategoryFilteredBroadcastRequest {
  query: string;
  detectedCategory: string;
  userLat: number;
  userLng: number;
  radius: number;
  locality: string;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.requestContext.authorizer?.userId || 'anonymous';

    const body: CategoryFilteredBroadcastRequest = JSON.parse(event.body || '{}');
    const { query, detectedCategory, userLat, userLng, radius, locality } = body;

    if (!query || !detectedCategory || !userLat || !userLng || !radius) {
      return response.error('Missing required fields', 400, 'INVALID_INPUT');
    }

    // Step 1: Find shops within radius that match the category
    const allShops = await db.scan(Tables.SHOPS!);
    
    const matchedShops = allShops.filter((shop: any) => {
      // Check if shop is verified
      if (!shop.isVerified) return false;

      // Check if shop category matches the detected category
      const shopCategory = shop.category || '';
      const categoryMatch = 
        shopCategory.toLowerCase() === detectedCategory.toLowerCase() ||
        shopCategory.toLowerCase().includes(detectedCategory.toLowerCase()) ||
        detectedCategory.toLowerCase().includes(shopCategory.toLowerCase());
      
      if (!categoryMatch) return false;

      // Check distance
      const distance = calculateDistance(
        userLat,
        userLng,
        shop.location.lat,
        shop.location.lng
      );

      return distance <= radius;
    });

    const matchedShopsCount = matchedShops.length;

    console.log(`Found ${matchedShopsCount} shops matching category "${detectedCategory}" within ${radius}km`);
    console.log('Matched shops:', matchedShops.map((s: any) => ({ name: s.name, category: s.category })));

    // Step 2: Create broadcast
    const broadcastId = uuidv4();
    const now = new Date().toISOString();
    const created_at = Date.now();
    const expiresAt = Math.floor(Date.now() / 1000) + 1800; // 30 minutes TTL
    const geohash = ngeohash.encode(userLat, userLng, 7);

    // Get merchant IDs for matched shops
    const MERCHANTS_TABLE = process.env.MERCHANTS_TABLE || 'nearby-backend-dev-merchants';
    const merchantIds: string[] = [];
    
    for (const shop of matchedShops) {
      try {
        const merchants = await db.scan(MERCHANTS_TABLE);
        const merchant = merchants.find((m: any) => m.shopId === shop.shopId);
        if (merchant) {
          // Double-check merchant category matches
          const merchantCategory = merchant.majorCategory || merchant.category || '';
          const merchantCategoryMatch = 
            merchantCategory.toLowerCase() === detectedCategory.toLowerCase() ||
            merchantCategory.toLowerCase().includes(detectedCategory.toLowerCase()) ||
            detectedCategory.toLowerCase().includes(merchantCategory.toLowerCase());
          
          if (merchantCategoryMatch) {
            merchantIds.push(merchant.merchantId);
            console.log(`✅ Matched merchant: ${merchant.shopName} (${merchantCategory})`);
          } else {
            console.log(`❌ Skipped merchant: ${merchant.shopName} (${merchantCategory}) - doesn't match ${detectedCategory}`);
          }
        }
      } catch (err) {
        console.error(`Error finding merchant for shop ${shop.shopId}:`, err);
      }
    }
    
    console.log(`Matched ${merchantIds.length} merchants for category "${detectedCategory}":`, merchantIds);

    const broadcast = {
      broadcastId,
      userId,
      productId: `search-${Date.now()}`,
      productName: query,
      query: query,
      category: detectedCategory,
      userLat,
      userLng,
      geohash,
      radius,
      status: 'active',
      expiresAt,
      createdAt: now,
      created_at, // Add timestamp for filtering
      matchedMerchantsCount: matchedShopsCount,
      matched_merchant_ids: merchantIds, // Store merchant IDs
      matched_shops_count: matchedShopsCount,
      locality,
    };

    await db.put(Tables.BROADCASTS!, broadcast);

    // Step 3: Write analytics record
    const analyticsId = uuidv4();
    const analyticsRecord = {
      eventId: analyticsId, // Add required primary key
      analyticsId,
      queryText: query,
      majorCategory: detectedCategory,
      subCategory: detectedCategory,
      capabilityId: detectedCategory,
      matchCount: matchedShopsCount,
      timestamp: now,
      eventType: 'broadcast_created', // Add event type
      city: locality || 'Unknown',
      area: locality || 'Unknown',
      userId
    };

    try {
      await db.put(Tables.ANALYTICS!, analyticsRecord);
      console.log('Analytics record created:', analyticsId);
    } catch (analyticsError) {
      console.error('Failed to write analytics:', analyticsError);
      // Don't fail the broadcast if analytics fails
    }

    // Step 4: Store matched shop IDs for the broadcast
    // This will be used by the radar page to show which shops received the broadcast
    const matchedShopIds = matchedShops.map((shop: any) => shop.shopId);
    
    // In production, send notifications to these shops via SNS/WebSocket
    console.log(`Broadcasting to ${matchedShopsCount} shops in category: ${detectedCategory}`);
    console.log('Shop IDs:', matchedShopIds);

    return response.success({
      broadcast,
      matchedShopsCount,
      matchedShopIds, // Include shop IDs in response
      message: `Broadcasting to ${matchedShopsCount} nearby ${detectedCategory} shops`
    }, 201);
  } catch (error) {
    console.error('Create category-filtered broadcast error:', error);
    return response.error('Failed to create broadcast', 500, 'INTERNAL_ERROR');
  }
};
