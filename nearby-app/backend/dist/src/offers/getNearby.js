import { QueryCommand, BatchGetCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, Tables } from '../shared/db.js';
import { response } from '../shared/response.js';
import { calculateDistance } from '../shared/distance.js';
import ngeohash from 'ngeohash';
const getGeohashPrecision = (radius) => {
    if (radius <= 0.075)
        return 7; // Up to 75m
    if (radius <= 0.6)
        return 6; // Up to 600m
    if (radius <= 2.5)
        return 5; // Up to 2.5km
    if (radius <= 20)
        return 4; // Up to 20km
    if (radius <= 78)
        return 3; // Up to 78km
    return 2; // Wider areas
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
        const now = new Date().toISOString();
        const queryPromises = queryGeohashes.map(hash => {
            const command = new QueryCommand({
                TableName: Tables.OFFERS,
                IndexName: 'geohash-index',
                KeyConditionExpression: 'geohash = :geohash',
                FilterExpression: 'isActive = :isActive AND validUntil > :now',
                ExpressionAttributeValues: {
                    ':geohash': hash,
                    ':isActive': true,
                    ':now': now,
                },
            });
            return docClient.send(command);
        });
        const queryResults = await Promise.all(queryPromises);
        const uniqueOffers = new Map();
        for (const result of queryResults) {
            if (result.Items) {
                for (const item of result.Items) {
                    uniqueOffers.set(item.offerId, item);
                }
            }
        }
        const offers = Array.from(uniqueOffers.values());
        if (offers.length === 0) {
            return response.success({ offers: [] });
        }
        const merchantIds = [...new Set(offers.map((offer) => offer.merchantId))];
        if (merchantIds.length === 0) {
            return response.success({ offers: [] });
        }
        const batchGetResult = await docClient.send(new BatchGetCommand({
            RequestItems: {
                [Tables.MERCHANTS]: {
                    Keys: merchantIds.map((merchantId) => ({ merchantId })),
                },
            },
        }));
        const merchants = batchGetResult.Responses?.[Tables.MERCHANTS] || [];
        const merchantMap = new Map(merchants.map((m) => [m.merchantId, m]));
        const nearbyOffers = offers
            .map((offer) => {
            const merchant = merchantMap.get(offer.merchantId);
            if (!merchant?.lat || !merchant?.lng)
                return null;
            const distance = calculateDistance(lat, lng, merchant.lat, merchant.lng);
            if (distance > radius)
                return null;
            if (categoryId && offer.categoryId !== categoryId)
                return null;
            return {
                ...offer,
                distance: distance.toFixed(1),
                merchant,
            };
        })
            .filter((o) => o !== null);
        nearbyOffers.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
        return response.success({ offers: nearbyOffers });
    }
    catch (error) {
        console.error('Get nearby offers error:', error);
        return response.error('Failed to get nearby offers', 500, 'INTERNAL_ERROR');
    }
};
//# sourceMappingURL=getNearby.js.map