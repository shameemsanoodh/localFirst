import AWS from 'aws-sdk';
const dynamodb = new AWS.DynamoDB.DocumentClient();
const MERCHANTS_TABLE = process.env.MERCHANTS_TABLE || 'nearby-backend-dev-merchants';
const USERS_TABLE = process.env.USERS_TABLE || 'nearby-backend-dev-users';
const BROADCASTS_TABLE = process.env.BROADCASTS_TABLE || 'nearby-backend-dev-broadcasts';
const ANALYTICS_TABLE = process.env.ANALYTICS_TABLE || 'nearby-backend-dev-analytics';
// Get location insights
export const getLocationInsights = async (event) => {
    console.log('Get location insights request received');
    try {
        // Get all merchants with location data
        const merchantsResult = await dynamodb.scan({
            TableName: MERCHANTS_TABLE,
            ProjectionExpression: 'merchantId, majorCategory, #loc',
            ExpressionAttributeNames: {
                '#loc': 'location',
            },
        }).promise();
        // Get all users with location data
        const usersResult = await dynamodb.scan({
            TableName: USERS_TABLE,
            ProjectionExpression: 'userId, #loc',
            ExpressionAttributeNames: {
                '#loc': 'location',
            },
        }).promise();
        // Get all broadcasts with location data
        const broadcastsResult = await dynamodb.scan({
            TableName: BROADCASTS_TABLE,
            ProjectionExpression: 'broadcastId, #loc',
            ExpressionAttributeNames: {
                '#loc': 'location',
            },
        }).promise();
        // Group by area
        const areaData = {};
        // Process merchants
        merchantsResult.Items?.forEach((merchant) => {
            const area = merchant.location?.area || 'Unknown';
            if (!areaData[area]) {
                areaData[area] = {
                    area,
                    merchantCount: 0,
                    userCount: 0,
                    broadcastCount: 0,
                    topCategories: {},
                };
            }
            areaData[area].merchantCount++;
            const category = merchant.majorCategory || 'Others';
            areaData[area].topCategories[category] = (areaData[area].topCategories[category] || 0) + 1;
        });
        // Process users
        usersResult.Items?.forEach((user) => {
            const area = user.location?.area || 'Unknown';
            if (!areaData[area]) {
                areaData[area] = {
                    area,
                    merchantCount: 0,
                    userCount: 0,
                    broadcastCount: 0,
                    topCategories: {},
                };
            }
            areaData[area].userCount++;
        });
        // Process broadcasts
        broadcastsResult.Items?.forEach((broadcast) => {
            const area = broadcast.location?.area || 'Unknown';
            if (!areaData[area]) {
                areaData[area] = {
                    area,
                    merchantCount: 0,
                    userCount: 0,
                    broadcastCount: 0,
                    topCategories: {},
                };
            }
            areaData[area].broadcastCount++;
        });
        // Convert to array and format top categories
        const insights = Object.values(areaData).map((data) => {
            const topCategories = Object.entries(data.topCategories)
                .map(([category, count]) => ({ category, count: count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 3);
            return {
                area: data.area,
                merchantCount: data.merchantCount,
                userCount: data.userCount,
                broadcastCount: data.broadcastCount,
                topCategories,
            };
        });
        // Sort by merchant count
        insights.sort((a, b) => b.merchantCount - a.merchantCount);
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
            },
            body: JSON.stringify(insights),
        };
    }
    catch (error) {
        console.error('Error fetching location insights:', error);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
            },
            body: JSON.stringify({
                error: 'Failed to fetch location insights',
                details: error instanceof Error ? error.message : 'Unknown error',
            }),
        };
    }
};
// Get search trends
export const getSearchTrends = async (event) => {
    console.log('Get search trends request received');
    try {
        // Query analytics table for search events
        const result = await dynamodb.scan({
            TableName: ANALYTICS_TABLE,
        }).promise();
        // Aggregate data
        const queryCount = {};
        const categoryCount = {};
        const capabilityCount = {};
        const supplyGaps = [];
        const searchesByDay = {};
        result.Items?.forEach((item) => {
            // Count queries
            if (item.queryText) {
                queryCount[item.queryText] = (queryCount[item.queryText] || 0) + 1;
            }
            // Count categories
            if (item.majorCategory) {
                categoryCount[item.majorCategory] = (categoryCount[item.majorCategory] || 0) + 1;
            }
            // Count capabilities
            if (item.capabilityId) {
                capabilityCount[item.capabilityId] = (capabilityCount[item.capabilityId] || 0) + 1;
            }
            // Track supply gaps (matchCount = 0)
            if (item.matchCount === 0) {
                supplyGaps.push({
                    queryText: item.queryText,
                    category: item.majorCategory,
                    timestamp: item.timestamp,
                    city: item.city,
                    area: item.area
                });
            }
            // Count searches by day
            if (item.timestamp) {
                const day = item.timestamp.split('T')[0];
                searchesByDay[day] = (searchesByDay[day] || 0) + 1;
            }
        });
        // Top 20 queries
        const topQueries = Object.entries(queryCount)
            .map(([query, count]) => ({ query, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 20);
        // Top categories
        const topCategories = Object.entries(categoryCount)
            .map(([category, count]) => ({ category, count }))
            .sort((a, b) => b.count - a.count);
        // Top capabilities
        const topCapabilities = Object.entries(capabilityCount)
            .map(([capabilityId, count]) => ({ capabilityId, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 20);
        // Searches per day (last 30 days)
        const last30Days = Object.entries(searchesByDay)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => a.date.localeCompare(b.date))
            .slice(-30);
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
            },
            body: JSON.stringify({
                topQueries,
                topCategories,
                topCapabilities,
                supplyGaps: supplyGaps.slice(0, 50),
                searchesByDay: last30Days,
                totalSearches: result.Items?.length || 0
            }),
        };
    }
    catch (error) {
        console.error('Error fetching search trends:', error);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
            },
            body: JSON.stringify({
                error: 'Failed to fetch search trends',
                details: error instanceof Error ? error.message : 'Unknown error',
            }),
        };
    }
};
//# sourceMappingURL=analytics.js.map