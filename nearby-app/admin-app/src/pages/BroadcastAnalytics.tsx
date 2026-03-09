import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, MessageSquare, CheckCircle, XCircle, Clock, Activity } from 'lucide-react';

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

const BroadcastAnalytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly' | 'all'>('weekly');
  const [stats, setStats] = useState<BroadcastStats | null>(null);
  const [allTimeStats, setAllTimeStats] = useState<TimeRangeStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [timeRange]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/dev';
      const token = localStorage.getItem('admin-token');

      const response = await fetch(`${API_BASE_URL}/analytics/broadcasts?range=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (timeRange === 'all') {
          setAllTimeStats(data.stats);
          setStats(data.allTime);
        } else {
          setStats(data.stats);
        }
      }
    } catch (error) {
      console.error('Failed to fetch broadcast stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6">
        <p className="text-gray-600">No data available</p>
      </div>
    );
  }

  // Prepare data for charts
  const responseTypeData = [
    { name: 'Accepted', value: stats.acceptedCount, color: '#22C55E' },
    { name: 'Scheduled', value: stats.scheduledCount, color: '#F59E0B' },
    { name: 'Rejected', value: stats.rejectedCount, color: '#EF4444' }
  ];

  const timeRangeData = allTimeStats ? [
    { period: 'Daily', broadcasts: allTimeStats.daily.totalBroadcasts, responses: allTimeStats.daily.totalResponses },
    { period: 'Weekly', broadcasts: allTimeStats.weekly.totalBroadcasts, responses: allTimeStats.weekly.totalResponses },
    { period: 'Monthly', broadcasts: allTimeStats.monthly.totalBroadcasts, responses: allTimeStats.monthly.totalResponses }
  ] : [];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Broadcast Analytics</h1>
          <p className="text-gray-600">Track broadcast performance and merchant responses</p>
        </div>

        {/* Time Range Selector */}
        <div className="mb-6 flex gap-2">
          {(['daily', 'weekly', 'monthly', 'all'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<MessageSquare className="text-blue-600" />}
            title="Total Broadcasts"
            value={stats.totalBroadcasts}
            color="blue"
          />
          <StatCard
            icon={<Activity className="text-purple-600" />}
            title="Total Responses"
            value={stats.totalResponses}
            color="purple"
          />
          <StatCard
            icon={<TrendingUp className="text-green-600" />}
            title="Response Rate"
            value={`${stats.responseRate}%`}
            color="green"
          />
          <StatCard
            icon={<Clock className="text-orange-600" />}
            title="Avg Response Time"
            value={`${Math.floor(stats.averageResponseTime / 60)}m ${stats.averageResponseTime % 60}s`}
            color="orange"
          />
        </div>

        {/* Response Breakdown Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <ResponseCard
            icon={<CheckCircle className="text-green-600" />}
            title="Accepted"
            count={stats.acceptedCount}
            percentage={stats.totalResponses > 0 ? Math.round((stats.acceptedCount / stats.totalResponses) * 100) : 0}
            color="green"
          />
          <ResponseCard
            icon={<Clock className="text-orange-600" />}
            title="Scheduled"
            count={stats.scheduledCount}
            percentage={stats.totalResponses > 0 ? Math.round((stats.scheduledCount / stats.totalResponses) * 100) : 0}
            color="orange"
          />
          <ResponseCard
            icon={<XCircle className="text-red-600" />}
            title="Rejected"
            count={stats.rejectedCount}
            percentage={stats.totalResponses > 0 ? Math.round((stats.rejectedCount / stats.totalResponses) * 100) : 0}
            color="red"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Response Type Distribution */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Response Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={responseTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {responseTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Top Categories */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Top Categories</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.topCategories.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Time Range Comparison (only for 'all' view) */}
        {timeRange === 'all' && timeRangeData.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Time Range Comparison</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeRangeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="broadcasts" stroke="#3B82F6" strokeWidth={2} name="Broadcasts" />
                <Line type="monotone" dataKey="responses" stroke="#22C55E" strokeWidth={2} name="Responses" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Category List */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">All Categories</h3>
          <div className="space-y-2">
            {stats.topCategories.map((cat, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-900">{cat.category}</span>
                <span className="text-gray-600">{cat.count} broadcasts</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50',
    purple: 'bg-purple-50',
    green: 'bg-green-50',
    orange: 'bg-orange-50'
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className={`w-12 h-12 rounded-lg ${colorClasses[color as keyof typeof colorClasses]} flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <p className="text-sm text-gray-600 mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
};

interface ResponseCardProps {
  icon: React.ReactNode;
  title: string;
  count: number;
  percentage: number;
  color: string;
}

const ResponseCard: React.FC<ResponseCardProps> = ({ icon, title, count, percentage, color }) => {
  const colorClasses = {
    green: 'bg-green-50 border-green-200',
    orange: 'bg-orange-50 border-orange-200',
    red: 'bg-red-50 border-red-200'
  };

  return (
    <div className={`rounded-xl border-2 p-6 ${colorClasses[color as keyof typeof colorClasses]}`}>
      <div className="flex items-center justify-between mb-4">
        {icon}
        <span className="text-2xl font-bold text-gray-900">{count}</span>
      </div>
      <p className="text-sm font-semibold text-gray-700 mb-1">{title}</p>
      <p className="text-xs text-gray-600">{percentage}% of total responses</p>
    </div>
  );
};

export default BroadcastAnalytics;
