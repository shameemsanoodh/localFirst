import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, TrendingUp, Users, DollarSign, Package } from 'lucide-react'
import { motion } from 'framer-motion'

interface Stats {
  queries: number
  orders: number
  revenue: number
  topProducts: Array<{ name: string; sales: number; revenue: number }>
  recentActivity: Array<{ type: string; item: string; time: string }>
}

const MerchantStats: React.FC = () => {
  const navigate = useNavigate()
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats>({
    queries: 0,
    orders: 0,
    revenue: 0,
    topProducts: [],
    recentActivity: []
  })

  useEffect(() => {
    fetchStats()
  }, [period])

  const fetchStats = async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
      const token = localStorage.getItem('auth-token')
      
      if (!token) {
        setLoading(false)
        return
      }

      // Fetch broadcasts (queries)
      const broadcastsResponse = await fetch(`${API_BASE_URL}/merchant/broadcasts?since=0`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      // Fetch products
      const productsResponse = await fetch(`${API_BASE_URL}/merchant/products`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      let queries = 0
      let recentActivity: Array<{ type: string; item: string; time: string }> = []

      if (broadcastsResponse.ok) {
        const broadcastData = await broadcastsResponse.json()
        const broadcasts = broadcastData.broadcasts || []
        
        // Filter by period
        const now = Date.now()
        const periodMs = period === 'today' ? 24 * 60 * 60 * 1000 :
                        period === 'week' ? 7 * 24 * 60 * 60 * 1000 :
                        30 * 24 * 60 * 60 * 1000

        const filteredBroadcasts = broadcasts.filter((b: any) => {
          const createdAt = new Date(b.createdAt).getTime()
          return (now - createdAt) <= periodMs
        })

        queries = filteredBroadcasts.length

        // Recent activity from broadcasts
        recentActivity = filteredBroadcasts.slice(0, 3).map((b: any) => ({
          type: 'broadcast',
          item: b.query || b.productName || 'Query',
          time: getTimeAgo(new Date(b.createdAt).getTime())
        }))
      }

      let topProducts: Array<{ name: string; sales: number; revenue: number }> = []

      if (productsResponse.ok) {
        const productData = await productsResponse.json()
        const products = productData.data?.products || []
        
        // Don't show mock sales - only show if there are actual orders
        // For now, leave empty until we have real order data
        topProducts = []
      }

      setStats({
        queries,
        orders: 0, // Only show real orders, not estimated
        revenue: 0, // Only show real revenue from actual orders
        topProducts,
        recentActivity
      })

      setLoading(false)
    } catch (error) {
      console.error('Error fetching stats:', error)
      setLoading(false)
    }
  }

  const getTimeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    return 'Just now'
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: '#FAF8F5' }}>
      {/* Header */}
      <div className="px-4 sm:px-6 pt-6 pb-4" style={{ background: '#2C3E50' }}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => navigate('/')} className="p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <ArrowLeft size={20} className="text-white" />
            </button>
            <h1 className="text-xl font-bold text-white">Statistics</h1>
          </div>

          {/* Period Selector */}
          <div className="flex gap-2">
            {(['today', 'week', 'month'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className="flex-1 py-2 rounded-lg text-sm font-semibold transition-colors"
                style={{
                  background: period === p ? '#FFFFFF' : 'rgba(255,255,255,0.1)',
                  color: period === p ? '#2C3E50' : '#FFFFFF'
                }}
              >
                {p === 'today' ? 'Today' : p === 'week' ? 'This Week' : 'This Month'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-4 max-w-2xl mx-auto space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl shadow-sm"
            style={{ background: '#FFFFFF' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Users size={20} className="text-blue-600" />
              <span className="text-xs text-gray-600">Queries</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.queries}</div>
            <div className="text-xs text-gray-500 mt-1">from nearby users</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-4 rounded-xl shadow-sm"
            style={{ background: '#FFFFFF' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Package size={20} className="text-green-600" />
              <span className="text-xs text-gray-600">Orders</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.orders}</div>
            <div className="text-xs text-gray-500 mt-1">completed orders</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-4 rounded-xl shadow-sm col-span-2"
            style={{ background: '#22C55E' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={20} className="text-white" />
              <span className="text-xs text-white/80">Revenue</span>
            </div>
            <div className="text-3xl font-bold text-white">₹{stats.revenue}</div>
            <div className="text-xs text-white/80 mt-1">total earnings</div>
          </motion.div>
        </div>

        {/* Top Products */}
        <div className="p-4 rounded-xl shadow-sm" style={{ background: '#FFFFFF' }}>
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <TrendingUp size={18} className="text-orange-600" />
            Top Products
          </h3>
          <div className="space-y-3">
            {stats.topProducts.map((product, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-sm">{product.name}</p>
                  <p className="text-xs text-gray-600">{product.sales} sales</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">₹{product.revenue}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="p-4 rounded-xl shadow-sm" style={{ background: '#FFFFFF' }}>
          <h3 className="font-bold text-gray-900 mb-3">Recent Activity</h3>
          <div className="space-y-3">
            {stats.recentActivity.map((activity, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                  activity.type === 'broadcast' ? 'bg-orange-100' : 'bg-green-100'
                }`}>
                  {activity.type === 'broadcast' ? '📡' : '✅'}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">
                    {activity.type === 'broadcast' ? 'Responded to broadcast' : 'Order completed'}
                  </p>
                  <p className="text-xs text-gray-600">{activity.item}</p>
                  <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 px-4 sm:px-6 py-3 sm:py-4" style={{ background: '#FFFFFF', borderTop: '1px solid #E5E7EB' }}>
        <div className="flex items-center justify-around max-w-2xl mx-auto">
          {[
            { icon: '🏠', label: 'Home', path: '/' },
            { icon: '📦', label: 'Products', path: '/products' },
            { icon: '📊', label: 'Stats', path: '/stats', active: true },
            { icon: '👤', label: 'Profile', path: '/profile' },
          ].map((tab, i) => (
            <button
              key={i}
              className="flex flex-col items-center gap-0.5 sm:gap-1 transition-transform active:scale-95"
              onClick={() => navigate(tab.path)}
            >
              <div className={`text-xl sm:text-2xl ${tab.active ? 'scale-110' : 'opacity-50'}`}>{tab.icon}</div>
              <span className={`text-[10px] sm:text-xs font-medium ${tab.active ? 'text-black' : 'text-gray-400'}`}>
                {tab.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default MerchantStats
