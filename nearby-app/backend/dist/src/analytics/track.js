import { db } from '../shared/db.js';
import { response } from '../shared/response.js';
export const handler = async (event) => {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'POST,OPTIONS',
            },
            body: '',
        };
    }
    try {
        const body = JSON.parse(event.body || '{}');
        const { eventId, eventType, timestamp, userId, sessionId, metadata } = body;
        if (!eventId || !eventType || !timestamp || !sessionId) {
            return response.error('Missing required fields', 400, 'INVALID_INPUT');
        }
        const analyticsEntry = {
            eventId,
            eventType,
            timestamp,
            userId: userId || 'anonymous',
            sessionId,
            metadata,
            createdAt: new Date().toISOString(),
        };
        // Save to DynamoDB analytics table
        const tableName = process.env.ANALYTICS_TABLE || 'nearby-backend-dev-analytics';
        await db.put(tableName, analyticsEntry);
        console.log(`Analytics tracked: ${eventType} for session ${sessionId}`);
        return response.success({
            message: 'Analytics tracked successfully',
            eventId,
        }, 201);
    }
    catch (error) {
        console.error('Track analytics error:', error);
        // Don't fail the request if analytics fails - it's a background operation
        return response.success({
            message: 'Request processed (analytics tracking failed)',
            error: 'TRACKING_FAILED',
        }, 200);
    }
};
//# sourceMappingURL=track.js.map