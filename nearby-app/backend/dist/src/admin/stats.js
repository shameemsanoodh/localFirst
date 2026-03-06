import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, Tables } from '../shared/db.js';
import { response } from '../shared/response.js';
export const handler = async (event) => {
    try {
        // Get counts from all tables in parallel
        const [usersResult, merchantsResult, categoriesResult, ordersResult, broadcastsResult, offersResult] = await Promise.all([
            docClient.send(new ScanCommand({ TableName: Tables.USERS, Select: 'COUNT' })),
            docClient.send(new ScanCommand({ TableName: Tables.MERCHANTS, Select: 'COUNT' })),
            docClient.send(new ScanCommand({ TableName: Tables.CATEGORIES, Select: 'COUNT' })),
            docClient.send(new ScanCommand({ TableName: Tables.ORDERS, Select: 'COUNT' })),
            docClient.send(new ScanCommand({ TableName: Tables.BROADCASTS, Select: 'COUNT' })),
            docClient.send(new ScanCommand({ TableName: Tables.OFFERS, Select: 'COUNT' })),
        ]);
        // Get user breakdown by role
        const usersData = await docClient.send(new ScanCommand({
            TableName: Tables.USERS,
            ProjectionExpression: '#r, createdAt',
            ExpressionAttributeNames: { '#r': 'role' },
        }));
        const users = usersData.Items || [];
        const roleBreakdown = {
            users: users.filter((u) => u.role === 'user').length,
            merchants: users.filter((u) => u.role === 'merchant').length,
            admins: users.filter((u) => u.role === 'admin').length,
        };
        // Get recent signups (last 7 days)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const recentSignups = users.filter((u) => u.createdAt > sevenDaysAgo).length;
        return response.success({
            stats: {
                totalUsers: usersResult.Count || 0,
                totalMerchants: merchantsResult.Count || 0,
                totalCategories: categoriesResult.Count || 0,
                totalOrders: ordersResult.Count || 0,
                totalBroadcasts: broadcastsResult.Count || 0,
                totalOffers: offersResult.Count || 0,
                recentSignups,
                roleBreakdown,
            },
        });
    }
    catch (error) {
        console.error('Admin stats error:', error);
        return response.error('Failed to get admin stats', 500, 'INTERNAL_ERROR');
    }
};
//# sourceMappingURL=stats.js.map