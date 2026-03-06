import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { db, Tables } from '../shared/db.js';
import { response } from '../shared/response.js';

/**
 * Admin user management — suspend/approve/change role  
 * PATCH /admin/users/{userId}
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        const userId = event.pathParameters?.userId;
        if (!userId) {
            return response.error('User ID is required', 400, 'INVALID_INPUT');
        }

        const body = JSON.parse(event.body || '{}');
        const { action, role } = body;

        // Get existing user
        const user = await db.get(Tables.USERS!, { userId });
        if (!user) {
            return response.error('User not found', 404, 'USER_NOT_FOUND');
        }

        const updates: Record<string, unknown> = {
            updatedAt: new Date().toISOString(),
        };

        switch (action) {
            case 'suspend':
                updates.status = 'suspended';
                break;
            case 'approve':
                updates.status = 'approved';
                break;
            case 'activate':
                updates.status = 'active';
                break;
            case 'changeRole':
                if (!role || !['user', 'merchant', 'admin'].includes(role)) {
                    return response.error('Valid role is required', 400, 'INVALID_INPUT');
                }
                updates.role = role;
                break;
            default:
                return response.error('Invalid action. Use: suspend, approve, activate, changeRole', 400, 'INVALID_ACTION');
        }

        const updatedUser = await db.update(Tables.USERS!, { userId }, updates);

        // Remove sensitive data
        if (updatedUser) {
            delete updatedUser.password;
        }

        return response.success({ user: updatedUser });
    } catch (error) {
        console.error('Admin manage user error:', error);
        return response.error('User management failed', 500, 'INTERNAL_ERROR');
    }
};
