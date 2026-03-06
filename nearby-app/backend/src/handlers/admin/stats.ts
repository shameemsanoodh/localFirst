import { APIGatewayProxyHandler } from 'aws-lambda';
import AWS from 'aws-sdk';

const dynamodb = new AWS.DynamoDB.DocumentClient();

const USERS_TABLE = process.env.USERS_TABLE || 'nearby-backend-dev-users';
const MERCHANTS_TABLE = process.env.MERCHANTS_TABLE || 'nearby-backend-dev-merchants';
const BROADCASTS_TABLE = process.env.BROADCASTS_TABLE || 'nearby-backend-dev-broadcasts';
const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE || 'nearby-backend-dev-products';

export const handler: APIGatewayProxyHandler = async (event) => {
  console.log('Admin stats request received');

  try {
    // Get counts from all tables
    const [usersResult, merchantsResult, broadcastsResult, productsResult] = await Promise.all([
      dynamodb.scan({ TableName: USERS_TABLE, Select: 'COUNT' }).promise(),
      dynamodb.scan({ TableName: MERCHANTS_TABLE, Select: 'COUNT' }).promise(),
      dynamodb.scan({ TableName: BROADCASTS_TABLE, Select: 'COUNT' }).promise(),
      dynamodb.scan({ TableName: PRODUCTS_TABLE, Select: 'COUNT' }).promise(),
    ]);

    // Get recent signups (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoISO = sevenDaysAgo.toISOString();

    const recentUsersResult = await dynamodb.scan({
      TableName: USERS_TABLE,
      FilterExpression: 'createdAt > :weekAgo',
      ExpressionAttributeValues: {
        ':weekAgo': sevenDaysAgoISO,
      },
      Select: 'COUNT',
    }).promise();

    // Get active merchants today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayStartISO = todayStart.toISOString();

    const activeMerchantsResult = await dynamodb.scan({
      TableName: MERCHANTS_TABLE,
      FilterExpression: 'attribute_exists(lastActiveAt) AND lastActiveAt > :today',
      ExpressionAttributeValues: {
        ':today': todayStartISO,
      },
      Select: 'COUNT',
    }).promise();

    // Get merchants by category
    const allMerchantsResult = await dynamodb.scan({
      TableName: MERCHANTS_TABLE,
      ProjectionExpression: 'majorCategory',
    }).promise();

    const categoryCount: Record<string, number> = {};
    allMerchantsResult.Items?.forEach((item: any) => {
      const category = item.majorCategory || 'Others';
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });

    const merchantsByCategory = Object.entries(categoryCount).map(([category, count]) => ({
      category,
      count,
    }));

    // Generate user growth data (last 7 days)
    const userGrowth = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // In production, you'd query actual data for each day
      // For now, we'll use the total count as a baseline
      const baseCount = usersResult.Count || 0;
      const dailyCount = Math.max(0, baseCount - (i * 5)); // Simulate growth
      
      userGrowth.push({
        date: dateStr,
        users: dailyCount,
      });
    }

    const stats = {
      totalUsers: usersResult.Count || 0,
      totalMerchants: merchantsResult.Count || 0,
      totalBroadcasts: broadcastsResult.Count || 0,
      totalProducts: productsResult.Count || 0,
      activeToday: activeMerchantsResult.Count || 0,
      recentSignups: recentUsersResult.Count || 0,
      merchantsByCategory,
      userGrowth,
    };

    console.log('Stats generated:', stats);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify(stats),
    };
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        error: 'Failed to fetch admin stats',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
