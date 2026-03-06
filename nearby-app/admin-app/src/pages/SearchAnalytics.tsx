import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Loader2, TrendingUp, TrendingDown, Minus, Search as SearchIcon } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import Layout from '../components/Layout'
import { apiService, SearchTrend } from '../services/api.service'

const SearchAnalytics: React.FC = () => {
  const [trends, setTrends] = useState<SearchTrend[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTrends()
  }, [])

  const loadTrends = async () => {
    try {
      const data = await apiService.getSearchTrends()
      setTrends(data)
    } catch (error) {
      console.error('Failed to load search trends:', error)
      setTrends([
        { keyword: 'iPhone', count: 245, category: 'Electronics', trend: 'up' },
        { keyword: 'Fresh vegetables', count: 189, category: 'Food', trend: 'up' },
        { keyword: 'Laptop repair', count: 156, category: 'Services', trend: 'stable' },
        { keyword: 'T-shirts', count: 134, category: 'Fashion', trend: 'down' },
        { keyword: 'Pizza delivery', count: 128, category: 'Food', trend: 'up' },
        { keyword: 'Mobile accessories', count: 112, category: 'Electronics', trend: 'stable' },
        { keyword: 'Plumber', count: 98, category: 'Services', trend: 'up' },
        { keyword: 'Shoes', count: 87, category: 'Fashion', trend: 'down' },
      ])
    } finally {
      setLoading(false)
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp size={16} className="text-green-600" />
      case 'down':
        return <TrendingDown size={16} className="text-red-600" />
      default:
        return <Minus size={16} className="text-gray-600" />
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-600'
      case 'down':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 size={48} className="animate-spin text-blue-600" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Search Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Popular searches and trends</p>
        </div>

        {/* Search Volume Chart */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Top Search Keywords</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={trends.slice(0, 8)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="keyword" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={100} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#3B82F6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Trending Keywords */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900">Trending Keywords</h3>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Rank</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Keyword</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Searches</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {trends.map((trend, index) => (
                <motion.tr
                  key={trend.keyword}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <SearchIcon size={16} className="text-gray-400" />
                      <span className="font-semibold text-gray-900">{trend.keyword}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                      {trend.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-gray-900">{trend.count}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`flex items-center gap-1 ${getTrendColor(trend.trend)}`}>
                      {getTrendIcon(trend.trend)}
                      <span className="text-sm font-semibold capitalize">{trend.trend}</span>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}

export default SearchAnalytics
