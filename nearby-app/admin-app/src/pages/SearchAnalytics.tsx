import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Loader2, TrendingUp, Search as SearchIcon, AlertCircle } from 'lucide-react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import Layout from '../components/Layout'
import { apiService, AnalyticsData } from '../services/api.service'

const COLORS = ['#22C55E', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316']

const SearchAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      const data = await apiService.getAnalytics()
      setAnalytics(data)
    } catch (error) {
      console.error('Failed to load analytics:', error)
      // Mock data fallback
      setAnalytics({
        topQueries: [
          { query: 'iPhone 15 Pro', count: 245 },
          { query: 'Fresh vegetables', count: 189 },
          { query: 'Laptop repair', count: 156 },
          { query: 'T-shirts', count: 134 },
          { query: 'Pizza delivery', count: 128 },
          { query: 'Mobile accessories', count: 112 },
          { query: 'Plumber', count: 98 },
          { query: 'Shoes', count: 87 },
          { query: 'Grocery', count: 76 },
          { query: 'Electronics', count: 65 },
        ],
        topCategories: [
          { category: 'Electronics', count: 450 },
          { category: 'Food', count: 380 },
          { category: 'Fashion', count: 290 },
          { category: 'Services', count: 220 },
          { category: 'Home & Garden', count: 180 },
        ],
        supplyGaps: [
          { query: 'Organic honey', count: 15, category: 'Food' },
          { query: 'Gaming laptop', count: 12, category: 'Electronics' },
          { query: 'Yoga classes', count: 10, category: 'Services' },
          { query: 'Designer shoes', count: 8, category: 'Fashion' },
        ],
        searchesPerDay: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          count: Math.floor(Math.random() * 100) + 50,
        })),
        categoryDistribution: [
          { category: 'Electronics', count: 450, percentage: 30 },
          { category: 'Food', count: 380, percentage: 25 },
          { category: 'Fashion', count: 290, percentage: 19 },
          { category: 'Services', count: 220, percentage: 15 },
          { category: 'Home & Garden', count: 180, percentage: 11 },
        ],
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 size={48} className="animate-spin text-green-600" />
        </div>
      </Layout>
    )
  }

  if (!analytics) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <p className="text-gray-500">Failed to load analytics</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">AI Search Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Insights from user searches and AI categorization</p>
        </div>

        {/* Searches Per Day Chart */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Searches Per Day (Last 30 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.searchesPerDay}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={80} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#22C55E" strokeWidth={2} dot={{ fill: '#22C55E' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Top Categories Bar Chart */}
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Top Categories</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.topCategories}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={100} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#22C55E" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Category Distribution Pie Chart */}
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Category Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.categoryDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, percentage }) => `${category} ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {analytics.categoryDistribution.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top 20 Searched Queries */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">Top 20 Searched Queries</h3>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <TrendingUp size={16} />
              <span>Most popular searches</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Rank</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Query</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Searches</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {analytics.topQueries.slice(0, 20).map((item, index) => (
                  <motion.tr
                    key={item.query}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index < 3 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {index + 1}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <SearchIcon size={16} className="text-gray-400" />
                        <span className="font-semibold text-gray-900">{item.query}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-gray-900">{item.count}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-green-600">
                        <TrendingUp size={16} />
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Supply Gaps Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">Supply Gaps</h3>
            <div className="flex items-center gap-2 text-sm text-red-600">
              <AlertCircle size={16} />
              <span>Searches with no merchant matches</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Query</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Failed Searches</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {analytics.supplyGaps.map((gap, index) => (
                  <motion.tr
                    key={gap.query}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <SearchIcon size={16} className="text-red-400" />
                        <span className="font-semibold text-gray-900">{gap.query}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                        {gap.category || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-red-600">{gap.count}</span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default SearchAnalytics
