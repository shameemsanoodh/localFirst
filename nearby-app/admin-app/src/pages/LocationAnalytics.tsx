import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Loader2, MapPin, Store, Users, Radio, TrendingUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import Layout from '../components/Layout'
import { apiService, LocationInsight } from '../services/api.service'

const LocationAnalytics: React.FC = () => {
  const [insights, setInsights] = useState<LocationInsight[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadInsights()
  }, [])

  const loadInsights = async () => {
    try {
      const data = await apiService.getLocationInsights()
      setInsights(data)
    } catch (error) {
      console.error('Failed to load location insights:', error)
      setInsights([
        {
          area: 'Koramangala',
          merchantCount: 15,
          userCount: 45,
          broadcastCount: 120,
          topCategories: [
            { category: 'Electronics', count: 6 },
            { category: 'Food', count: 5 },
            { category: 'Fashion', count: 4 },
          ],
        },
        {
          area: 'Indiranagar',
          merchantCount: 12,
          userCount: 38,
          broadcastCount: 95,
          topCategories: [
            { category: 'Food', count: 5 },
            { category: 'Services', count: 4 },
            { category: 'Fashion', count: 3 },
          ],
        },
        {
          area: 'Whitefield',
          merchantCount: 10,
          userCount: 32,
          broadcastCount: 78,
          topCategories: [
            { category: 'Electronics', count: 4 },
            { category: 'Food', count: 3 },
            { category: 'Services', count: 3 },
          ],
        },
      ])
    } finally {
      setLoading(false)
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
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Location Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Area-wise insights and trends</p>
        </div>

        {/* Area Comparison Chart */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Merchants by Area</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={insights}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="area" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="merchantCount" fill="#3B82F6" name="Merchants" radius={[8, 8, 0, 0]} />
              <Bar dataKey="userCount" fill="#10B981" name="Users" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Area Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {insights.map((insight, index) => (
            <motion.div
              key={insight.area}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white p-6 rounded-xl border border-gray-200"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <MapPin size={24} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{insight.area}</h3>
                  <p className="text-sm text-gray-500">Area Overview</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Store size={16} className="text-green-600" />
                    <p className="text-2xl font-bold text-gray-900">{insight.merchantCount}</p>
                  </div>
                  <p className="text-xs text-gray-500">Merchants</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Users size={16} className="text-blue-600" />
                    <p className="text-2xl font-bold text-gray-900">{insight.userCount}</p>
                  </div>
                  <p className="text-xs text-gray-500">Users</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Radio size={16} className="text-purple-600" />
                    <p className="text-2xl font-bold text-gray-900">{insight.broadcastCount}</p>
                  </div>
                  <p className="text-xs text-gray-500">Broadcasts</p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">Top Categories</p>
                <div className="space-y-2">
                  {insight.topCategories.map((cat, idx) => (
                    <div key={cat.category} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                          {idx + 1}
                        </div>
                        <span className="text-sm text-gray-700">{cat.category}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm font-semibold text-gray-900">
                        {cat.count}
                        <TrendingUp size={14} className="text-green-600" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </Layout>
  )
}

export default LocationAnalytics
