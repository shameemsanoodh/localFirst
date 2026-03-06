import { APIGatewayProxyHandler } from 'aws-lambda';
import AWS from 'aws-sdk';

const dynamodb = new AWS.DynamoDB.DocumentClient();
const MERCHANTS_TABLE = process.env.MERCHANTS_TABLE || 'nearby-backend-dev-merchants';
const USERS_TABLE = process.env.USERS_TABLE || 'nearby-backend-dev-users';
const BROADCASTS_TABLE = process.env.BROADCASTS_TABLE || 'nearby-backend-dev-broadcasts';
const ANALYTICS_TABLE = process.env.ANALYTICS_TABLE || 'nearby-backend-dev-analytics';

// Get location insights
export const getLocationInsights: APIGatewayProxyHandler = async (event) => {
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
    const areaData: Record<string, any> = {};

    // Process merchants
    merchantsResult.Items?.forEach((merchant: any) => {
      const area = merchant.location?.area || 'Unknown';
      if (!areaData[area]) {
        areaData[area] = {
          area,
          merchantCount: 0,
          userCount: 0,
          broadcastCount: 0,
          topCategories: {} as Record<string, number>,
        };
      }
      areaData[area].merchantCount++;
      
      const category = merchant.majorCategory || 'Others';
      areaData[area].topCategories[category] = (areaData[area].topCategories[category] || 0) + 1;
    });

    // Process users
    usersResult.Items?.forEach((user: any) => {
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
    broadcastsResult.Items?.forEach((broadcast: any) => {
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
    const insights = Object.values(areaData).map((data: any) => {
      const topCategories = Object.entries(data.topCategories)
        .map(([category, count]) => ({ category, count: count as number }))
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
  } catch (error) {
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
export const getSearchTrends: APIGatewayProxyHandler = async (event) => {
  console.log('Get search trends request received');

  try {
    // Query analytics table for search events
    const result = await dynamodb.scan({
      TableName: ANALYTICS_TABLE,
      FilterExpression: 'eventType = :searchEvent',
      ExpressionAttributeValues: {
        ':searchEvent': 'search',
      },
    }).promise();

    // Aggregate search keywords
    const keywordCount: Record<string, { count: number; category?: string }> = {};

    result.Items?.forEach((item: any) => {
      const keyword = item.searchQuery || item.keyword;
      if (keyword) {
        if (!keywordCount[keyword]) {
          keywordCount[keyword] = { count: 0, category: item.category };
        }
        keywordCount[keyword].count++;
      }
    });

    // Convert to array and add trend indicators
    const trends = Object.entries(keywordCount).map(([keyword, data]) => {
      // Simple trend calculation (in production, compare with previous period)
      const trend = data.count > 50 ? 'up' : data.count > 20 ? 'stable' : 'down';

      return {
        keyword,
        count: data.count,
        category: data.category || 'General',
        trend,
      };
    });

    // Sort by count descending
    trends.sort((a, b) => b.count - a.count);

    // Return top 20
    const topTrends = trends.slice(0, 20);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify(topTrends),
    };
  } catch (error) {
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
