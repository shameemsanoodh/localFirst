import { v4 as uuidv4 } from 'uuid';
import { db, Tables } from '../shared/db.js';
import { response } from '../shared/response.js';
export const handler = async (event) => {
    try {
        const userId = event.requestContext.authorizer?.principalId;
        if (!userId) {
            return response.error('Unauthorized', 401, 'UNAUTHORIZED');
        }
        const body = JSON.parse(event.body || '{}');
        const { offerId, quantity } = body;
        if (!offerId || !quantity || quantity <= 0) {
            return response.error('Valid offerId and quantity > 0 are required', 400, 'INVALID_INPUT');
        }
        const offer = await db.get(Tables.OFFERS, { offerId });
        if (!offer) {
            return response.error('Offer not found', 404, 'NOT_FOUND');
        }
        const orderId = uuidv4();
        const now = new Date().toISOString();
        const order = {
            orderId,
            userId,
            offerId,
            merchantId: offer.merchantId,
            quantity,
            totalPrice: (offer.price || 0) * quantity,
            status: 'placed',
            createdAt: now,
            updatedAt: now,
        };
        await db.put(Tables.ORDERS, order);
        return response.success(order, 201);
    }
    catch (error) {
        console.error('Create order error:', error);
        return response.error('Failed to create order', 500, 'INTERNAL_ERROR');
    }
};
//# sourceMappingURL=create.js.map