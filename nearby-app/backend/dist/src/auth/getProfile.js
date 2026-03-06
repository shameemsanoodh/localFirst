import { db, Tables } from '../shared/db.js';
import { response } from '../shared/response.js';
export const handler = async (event) => {
    try {
        // User ID comes from the authorizer
        const userId = event.requestContext.authorizer?.userId;
        if (!userId) {
            return response.error('Unauthorized', 401, 'UNAUTHORIZED');
        }
        const user = await db.get(Tables.USERS, { userId });
        if (!user) {
            return response.error('User not found', 404, 'USER_NOT_FOUND');
        }
        // Remove password from response
        const { password, ...userWithoutPassword } = user;
        return response.success({
            user: userWithoutPassword,
        });
    }
    catch (error) {
        console.error('Get profile error:', error);
        return response.error('Failed to get profile', 500, 'INTERNAL_ERROR');
    }
};
//# sourceMappingURL=getProfile.js.map