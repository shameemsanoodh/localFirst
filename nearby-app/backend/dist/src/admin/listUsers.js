import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, Tables } from '../shared/db.js';
import { response } from '../shared/response.js';
export const handler = async (event) => {
    try {
        const result = await docClient.send(new ScanCommand({
            TableName: Tables.USERS,
            ProjectionExpression: 'userId, email, #n, phone, #r, createdAt, updatedAt',
            ExpressionAttributeNames: { '#n': 'name', '#r': 'role' },
        }));
        const users = (result.Items || []).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return response.success({ users, total: users.length });
    }
    catch (error) {
        console.error('Admin list users error:', error);
        return response.error('Failed to list users', 500, 'INTERNAL_ERROR');
    }
};
//# sourceMappingURL=listUsers.js.map