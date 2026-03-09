import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { db } from '../shared/db.js';
import { response } from '../shared/response.js';

interface BroadcastStats {
  totalBroadcasts: number;
  totalResponses: number;
  acceptedCount: number;
  rejectedCount: number;
  scheduledCount: number;
  averageResponseTime: number;
  topCategories: Array<{ category: string; count: number }>;
  responseRate: number;
}

interface TimeRangeStats {
  daily: BroadcastStats;
  weekly: BroadcastStats;
  monthly: BroadcastStats;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const queryParams = event.queryStringParameters || {};
    const timeRange = queryParams.range || 'all'; // daily, weekly, monthly, all
    const startDate = queryParams.startDate;
    const endDate = queryParams.endDate;

    const BROADCASTS_TABLE = process.env.BROADCASTS_TABLE || 'nearby-backend-dev-broadcasts';
    const RESPONSES_TABLE = process.env.RESPONSES_TABLE || 'nearby-backend-dev-responses';

    // Get all broadcasts
    const allBroadcasts = await db.scan(BROADCASTS_TABLE);
    
    // Get all responses
    const allResponses = await db.scan(RESPONSES_TABLE);

    // Calculate time ranges
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;

    // Filter by time range
    let filteredBroadcasts = allBroadcasts;
    let filteredResponses = allResponses;

    if (startDate && endDate) {
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();
      filteredBroadcasts = allBroadcasts.filter((b: any) => {
        const timestamp = b.created_at || new Date(b.createdAt).getTime();
        return timestamp >= start && timestamp <= end;
      });
      filteredResponses = allResponses.filter((r: any) => {
        const timestamp = r.created_at || new Date(r.createdAt).getTime();
        return timestamp >= start && timestamp <= end;
      });
    } else if (timeRange === 'daily') {
      filteredBroadcasts = allBroadcasts.filter((b: any) => {
        const timestamp = b.created_at || new Date(b.createdAt).getTime();
        return timestamp >= oneDayAgo;
      });
      filteredResponses = allResponses.filter((r: any) => {
        const timestamp = r.created_at || new Date(r.createdAt).getTime();
        return timestamp >= oneDayAgo;
      });
    } else if (timeRange === 'weekly') {
      filteredBroadcasts = allBroadcasts.filter((b: any) => {
        const timestamp = b.created_at || new Date(b.createdAt).getTime();
        return timestamp >= oneWeekAgo;
      });
      filteredResponses = allResponses.filter((r: any) => {
        const timestamp = r.created_at || new Date(r.createdAt).getTime();
        return timestamp >= oneWeekAgo;
      });
    } else if (timeRange === 'monthly') {
      filteredBroadcasts = allBroadcasts.filter((b: any) => {
        const timestamp = b.created_at || new Date(b.createdAt).getTime();
        return timestamp >= oneMonthAgo;
      });
      filteredResponses = allResponses.filter((r: any) => {
        const timestamp = r.created_at || new Date(r.createdAt).getTime();
        return timestamp >= oneMonthAgo;
      });
    }

    // Calculate stats
    const stats = calculateStats(filteredBroadcasts, filteredResponses);

    // If requesting all time ranges
    if (timeRange === 'all') {
      const dailyBroadcasts = allBroadcasts.filter((b: any) => {
        const timestamp = b.created_at || new Date(b.createdAt).getTime();
        return timestamp >= oneDayAgo;
      });
      const dailyResponses = allResponses.filter((r: any) => {
        const timestamp = r.created_at || new Date(r.createdAt).getTime();
        return timestamp >= oneDayAgo;
      });

      const weeklyBroadcasts = allBroadcasts.filter((b: any) => {
        const timestamp = b.created_at || new Date(b.createdAt).getTime();
        return timestamp >= oneWeekAgo;
      });
      const weeklyResponses = allResponses.filter((r: any) => {
        const timestamp = r.created_at || new Date(r.createdAt).getTime();
        return timestamp >= oneWeekAgo;
      });

      const monthlyBroadcasts = allBroadcasts.filter((b: any) => {
        const timestamp = b.created_at || new Date(b.createdAt).getTime();
        return timestamp >= oneMonthAgo;
      });
      const monthlyResponses = allResponses.filter((r: any) => {
        const timestamp = r.created_at || new Date(r.createdAt).getTime();
        return timestamp >= oneMonthAgo;
      });

      const timeRangeStats: TimeRangeStats = {
        daily: calculateStats(dailyBroadcasts, dailyResponses),
        weekly: calculateStats(weeklyBroadcasts, weeklyResponses),
        monthly: calculateStats(monthlyBroadcasts, monthlyResponses)
      };

      return response.success({
        timeRange: 'all',
        stats: timeRangeStats,
        allTime: stats
      });
    }

    return response.success({
      timeRange,
      stats,
      startDate: startDate || null,
      endDate: endDate || null
    });
  } catch (error) {
    console.error('Get broadcast stats error:', error);
    return response.error('Failed to get broadcast stats', 500, 'INTERNAL_ERROR');
  }
};

function calculateStats(broadcasts: any[], responses: any[]): BroadcastStats {
  const totalBroadcasts = broadcasts.length;
  const totalResponses = responses.length;

  // Count response types
  const acceptedCount = responses.filter(r => r.responseType === 'YES').length;
  const rejectedCount = responses.filter(r => r.responseType === 'NO').length;
  const scheduledCount = responses.filter(r => r.responseType === 'ALTERNATIVE').length;

  // Calculate average response time
  let totalResponseTime = 0;
  let responseTimeCount = 0;

  responses.forEach((r: any) => {
    const broadcast = broadcasts.find((b: any) => b.broadcastId === r.broadcastId);
    if (broadcast) {
      const broadcastTime = broadcast.created_at || new Date(broadcast.createdAt).getTime();
      const responseTime = r.created_at || new Date(r.createdAt).getTime();
      totalResponseTime += (responseTime - broadcastTime);
      responseTimeCount++;
    }
  });

  const averageResponseTime = responseTimeCount > 0 
    ? Math.round(totalResponseTime / responseTimeCount / 1000) // Convert to seconds
    : 0;

  // Calculate top categories
  const categoryCount: Record<string, number> = {};
  broadcasts.forEach((b: any) => {
    const category = b.category || b.detectedCategory || 'Unknown';
    categoryCount[category] = (categoryCount[category] || 0) + 1;
  });

  const topCategories = Object.entries(categoryCount)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Calculate response rate
  const responseRate = totalBroadcasts > 0 
    ? Math.round((totalResponses / totalBroadcasts) * 100) 
    : 0;

  return {
    totalBroadcasts,
    totalResponses,
    acceptedCount,
    rejectedCount,
    scheduledCount,
    averageResponseTime,
    topCategories,
    responseRate
  };
}
