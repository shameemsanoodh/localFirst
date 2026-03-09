import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const SHOPS_TABLE = process.env.SHOPS_TABLE;
// Haversine formula to calculate distance between two coordinates
const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return Math.round(distance * 10) / 10; // Round to 1 decimal place
};
// Check if shop is currently open
const isShopOpen = (openTime, closeTime) => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes(); // Current time in minutes
    const [openHour, openMin] = openTime.split(':').map(Number);
    const [closeHour, closeMin] = closeTime.split(':').map(Number);
    const openMinutes = openHour * 60 + openMin;
    const closeMinutes = closeHour * 60 + closeMin;
    // Handle cases where closing time is past midnight
    if (closeMinutes < openMinutes) {
        return currentTime >= openMinutes || currentTime <= closeMinutes;
    }
    return currentTime >= openMinutes && currentTime <= closeMinutes;
};
export const handler = async (event) => {
    try {
        // Get query parameters
        const lat = parseFloat(event.queryStringParameters?.lat || '0');
        const lng = parseFloat(event.queryStringParameters?.lng || '0');
        const radius = parseFloat(event.queryStringParameters?.radius || '3');
        if (!lat || !lng) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                body: JSON.stringify({
                    error: 'Missing required parameters: lat and lng',
                }),
            };
        }
        // Scan all shops from DynamoDB
        const command = new ScanCommand({
            TableName: SHOPS_TABLE,
        });
        const response = await docClient.send(command);
        const shops = (response.Items || []);
        // Calculate distance for each shop and filter by radius
        const shopsWithDistance = shops
            .map((shop) => ({
            ...shop,
            distanceKm: calculateDistance(lat, lng, shop.location.lat, shop.location.lng),
            // Use the isOpen field from database if it exists (merchant can manually close),
            // otherwise calculate based on hours
            isOpen: shop.isOpen !== undefined ? shop.isOpen : isShopOpen(shop.openTime, shop.closeTime),
        }))
            .filter((shop) => shop.distanceKm <= radius)
            .sort((a, b) => a.distanceKm - b.distanceKm); // Sort by distance (nearest first)
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                shops: shopsWithDistance,
                count: shopsWithDistance.length,
                userLocation: { lat, lng },
                radius,
            }),
        };
    }
    catch (error) {
        console.error('Error fetching nearby shops:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                error: 'Failed to fetch nearby shops',
                message: error.message,
            }),
        };
    }
};
//# sourceMappingURL=getNearby.js.map