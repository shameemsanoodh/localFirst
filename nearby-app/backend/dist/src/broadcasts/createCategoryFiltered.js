import { v4 as uuidv4 } from 'uuid';
import { db, Tables } from '../shared/db.js';
import { response } from '../shared/response.js';
import { calculateDistance } from '../shared/distance.js';
import ngeohash from 'ngeohash';
export const handler = async (event) => {
    try {
        const userId = event.requestContext.authorizer?.userId || 'anonymous';
        const body = JSON.parse(event.body || '{}');
        const { query, detectedCategory, userLat, userLng, radius, locality } = body;
        if (!query || !detectedCategory || !userLat || !userLng || !radius) {
            return response.error('Missing required fields', 400, 'INVALID_INPUT');
        }
        // Step 1: Find shops within radius that match the category
        const allShops = await db.scan(Tables.SHOPS);
        const matchedShops = allShops.filter((shop) => {
            // Check if shop is verified
            if (!shop.isVerified)
                return false;
            // Check if shop category matches the detected category
            const shopCategory = shop.category || '';
            const categoryMatch = shopCategory.toLowerCase() === detectedCategory.toLowerCase() ||
                shopCategory.toLowerCase().includes(detectedCategory.toLowerCase()) ||
                detectedCategory.toLowerCase().includes(shopCategory.toLowerCase());
            if (!categoryMatch)
                return false;
            // Check distance
            const distance = calculateDistance(userLat, userLng, shop.location.lat, shop.location.lng);
            return distance <= radius;
        });
        const matchedShopsCount = matchedShops.length;
        console.log(`Found ${matchedShopsCount} shops matching category "${detectedCategory}" within ${radius}km`);
        console.log('Matched shops:', matchedShops.map((s) => ({ name: s.name, category: s.category })));
        // Step 2: Create broadcast
        const broadcastId = uuidv4();
        const now = new Date().toISOString();
        const expiresAt = Math.floor(Date.now() / 1000) + 1800; // 30 minutes TTL
        const geohash = ngeohash.encode(userLat, userLng, 7);
        const broadcast = {
            broadcastId,
            userId,
            productId: `search-${Date.now()}`,
            productName: query,
            category: detectedCategory,
            userLat,
            userLng,
            geohash,
            radius,
            status: 'active',
            expiresAt,
            createdAt: now,
            matchedMerchantsCount: matchedShopsCount,
            locality,
        };
        await db.put(Tables.BROADCASTS, broadcast);
        // Step 3: Store matched shop IDs for the broadcast
        // This will be used by the radar page to show which shops received the broadcast
        const matchedShopIds = matchedShops.map((shop) => shop.shopId);
        // In production, send notifications to these shops via SNS/WebSocket
        console.log(`Broadcasting to ${matchedShopsCount} shops in category: ${detectedCategory}`);
        console.log('Shop IDs:', matchedShopIds);
        return response.success({
            broadcast,
            matchedShopsCount,
            matchedShopIds, // Include shop IDs in response
            message: `Broadcasting to ${matchedShopsCount} nearby ${detectedCategory} shops`
        }, 201);
    }
    catch (error) {
        console.error('Create category-filtered broadcast error:', error);
        return response.error('Failed to create broadcast', 500, 'INTERNAL_ERROR');
    }
};
//# sourceMappingURL=createCategoryFiltered.js.map