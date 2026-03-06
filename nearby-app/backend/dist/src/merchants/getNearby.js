import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, Tables } from '../shared/db.js';
import { response } from '../shared/response.js';
import { calculateDistance } from '../shared/distance.js';
import ngeohash from 'ngeohash';
const getGeohashPrecision = (radius) => {
    if (radius <= 0.6)
        return 6;
    if (radius <= 2.5)
        return 5;
    if (radius <= 20)
        return 4;
    return 3;
};
export const handler = async (event) => {
    try {
        const lat = parseFloat(event.queryStringParameters?.lat || '');
        const lng = parseFloat(event.queryStringParameters?.lng || '');
        const radius = parseFloat(event.queryStringParameters?.radius || '5'); // in km
        const categoryId = event.queryStringParameters?.categoryId;
        if (isNaN(lat) || isNaN(lng)) {
            return response.error('Valid latitude and longitude are required', 400, 'INVALID_INPUT');
        }
        const precision = getGeohashPrecision(radius);
        const userGeohash = ngeohash.encode(lat, lng, precision);
        const neighbors = ngeohash.neighbors(userGeohash);
        const queryGeohashes = [userGeohash, ...neighbors];
        const queryPromises = queryGeohashes.map(hash => {
            const command = new QueryCommand({
                TableName: Tables.MERCHANTS,
                IndexName: 'geohash-index',
                KeyConditionExpression: 'geohash = :geohash',
                // Optionally filter by category on the backend
                FilterExpression: categoryId ? 'contains(categoryIds, :categoryId)' : undefined,
                ExpressionAttributeValues: categoryId ? { ':geohash': hash, ':categoryId': categoryId } : { ':geohash': hash },
            });
            return docClient.send(command);
        });
        const queryResults = await Promise.all(queryPromises);
        const uniqueMerchants = new Map();
        for (const result of queryResults) {
            if (result.Items) {
                for (const item of result.Items) {
                    uniqueMerchants.set(item.merchantId, item);
                }
            }
        }
        const merchants = Array.from(uniqueMerchants.values());
        if (merchants.length === 0) {
            return response.success({ merchants: [] });
        }
        const nearbyMerchants = merchants
            .map((merchant) => {
            const distance = calculateDistance(lat, lng, merchant.lat, merchant.lng);
            if (distance > radius)
                return null;
            return {
                ...merchant,
                distance: distance.toFixed(1),
            };
        })
            .filter((m) => m !== null);
        nearbyMerchants.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
        return response.success({ merchants: nearbyMerchants });
    }
    catch (error) {
        console.error('Get nearby merchants error:', error);
        return response.error('Failed to get nearby merchants', 500, 'INTERNAL_ERROR');
    }
};
//# sourceMappingURL=getNearby.js.map