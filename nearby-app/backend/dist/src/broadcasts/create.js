import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { db, Tables } from '../shared/db.js';
import { response } from '../shared/response.js';
import ngeohash from 'ngeohash';
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
export const handler = async (event) => {
    try {
        const userId = event.requestContext.authorizer?.userId;
        if (!userId) {
            return response.error('Unauthorized', 401, 'UNAUTHORIZED');
        }
        const body = JSON.parse(event.body || '{}');
        // Support both payload shapes from shell scripts and React app
        const userLat = body.userLat ?? body.location?.lat;
        const userLng = body.userLng ?? body.location?.lng;
        const radius = body.radius ?? body.radiusKm ?? 5;
        const productName = body.productName ?? body.query ?? body.productId ?? 'Unknown';
        const productId = body.productId ?? `query-${Date.now()}`;
        const query = body.query ?? body.productName ?? productId;
        const priority = body.priority ?? 'general';
        console.log('Creating broadcast with:', { userLat, userLng, radius, productName, productId, query, priority });
        if (!userLat || !userLng || !radius) {
            return response.error('Missing required fields: userLat/userLng or location.lat/location.lng, and radius', 400, 'INVALID_INPUT');
        }
        const broadcastId = uuidv4();
        const now = new Date().toISOString();
        const created_at = Date.now();
        const expiresAt = Math.floor(Date.now() / 1000) + 1800; // 30 minutes TTL
        const geohash = ngeohash.encode(userLat, userLng, 7); // Precision 7 for ~150m area
        const broadcastPriority = priority || 'general'; // Default to general
        // Find nearby merchants within radius
        const SHOPS_TABLE = process.env.SHOPS_TABLE || 'nearby-backend-dev-shops';
        const MERCHANTS_TABLE = process.env.MERCHANTS_TABLE || 'nearby-backend-dev-merchants';
        console.log('Finding nearby shops for broadcast...');
        console.log('Query:', query || productName || productId);
        console.log('Priority:', broadcastPriority);
        // Get all shops
        const shopsResult = await db.scan(SHOPS_TABLE);
        const shops = shopsResult || [];
        // Calculate distances and filter by radius
        const nearbyShops = shops
            .map((shop) => {
            if (!shop.location?.lat || !shop.location?.lng)
                return null;
            const distance = calculateDistance(userLat, userLng, shop.location.lat, shop.location.lng);
            return { ...shop, distance_km: distance };
        })
            .filter((shop) => shop && shop.distance_km <= radius)
            .sort((a, b) => a.distance_km - b.distance_km);
        console.log(`Found ${nearbyShops.length} shops within ${radius}km`);
        // Get merchant IDs for these shops
        const merchantIds = [];
        for (const shop of nearbyShops) {
            try {
                const scanCommand = new ScanCommand({
                    TableName: MERCHANTS_TABLE,
                    FilterExpression: 'shopId = :shopId',
                    ExpressionAttributeValues: { ':shopId': shop.shopId }
                });
                const merchantResult = await docClient.send(scanCommand);
                if (merchantResult.Items && merchantResult.Items.length > 0) {
                    merchantIds.push(merchantResult.Items[0].merchantId);
                }
            }
            catch (err) {
                console.error(`Error finding merchant for shop ${shop.shopId}:`, err);
            }
        }
        console.log(`Matched ${merchantIds.length} merchants:`, merchantIds);
        const broadcast = {
            broadcastId,
            userId,
            productId,
            productName, // Store human-readable name
            query, // Store query text
            priority: broadcastPriority, // Store priority level
            userLat,
            userLng,
            geohash,
            radius,
            status: 'active',
            expiresAt,
            createdAt: now,
            created_at, // Add timestamp for filtering
            matched_merchant_ids: merchantIds, // Store matched merchant IDs
            matched_shops_count: nearbyShops.length,
        };
        await db.put(Tables.BROADCASTS, broadcast);
        console.log('Broadcast created successfully:', {
            broadcastId,
            productName,
            matched_merchant_ids: merchantIds,
            matched_shops_count: nearbyShops.length
        });
        return response.success(broadcast, 201);
    }
    catch (error) {
        console.error('Create broadcast error:', error);
        return response.error('Failed to create broadcast', 500, 'INTERNAL_ERROR');
    }
};
// Helper function to calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
function toRad(degrees) {
    return degrees * (Math.PI / 180);
}
//# sourceMappingURL=create.js.map