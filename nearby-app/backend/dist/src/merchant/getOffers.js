import { db, Tables } from '../shared/db.js';
import { response } from '../shared/response.js';
export const handler = async (event) => {
    try {
        const userId = event.requestContext.authorizer?.principalId;
        if (!userId) {
            return response.error('Unauthorized', 401, 'UNAUTHORIZED');
        }
        // Find the merchantId associated with the user
        const merchantQueryResult = await db.query({
            TableName: Tables.MERCHANTS,
            IndexName: 'ownerId-index',
            KeyConditionExpression: 'ownerId = :ownerId',
            ExpressionAttributeValues: { ':ownerId': userId },
        });
        if (!merchantQueryResult || merchantQueryResult.length === 0) {
            return response.error('Merchant profile not found for this user.', 404, 'NOT_FOUND');
        }
        const merchantId = merchantQueryResult[0].merchantId;
        // Fetch offers for that merchant
        const offers = await db.query({
            TableName: Tables.OFFERS,
            IndexName: 'merchantId-createdAt-index',
            KeyConditionExpression: 'merchantId = :merchantId',
            ExpressionAttributeValues: { ':merchantId': merchantId },
            ScanIndexForward: false, // Sort by newest first
        });
        return response.success({ offers });
    }
    catch (error) {
        console.error('Get merchant offers error:', error);
        return response.error('Failed to get merchant offers', 500, 'INTERNAL_ERROR');
    }
};
//# sourceMappingURL=getOffers.js.map