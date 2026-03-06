import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, TrendingUp, Users, ShoppingBag, Radio } from 'lucide-react'

const MerchantStats: React.FC = () => {
  const navigate = useNavigate()
  const [period, setPeriod] = React.useState<'today' | 'week' | 'month'>('today')

  const stats = {
    today: {
      queries: 12,
      responses: 8,
      orders: 3,
      revenue: 450,
    },
    week: {
      queries: 89,
      responses: 67,
      orders: 24,
      revenue: 3200,
    },
    month: {
      queries: 356,
      responses: 278,
      orders: 98,
      revenue: 12500,
    },
  }

  const topProducts = [
    { name: 'Harpic Toilet Cleaner', sales: 15, revenue: 1800 },
    { name: 'Colgate Toothpaste', sales: 12, revenue: 1020 },
    { name: 'Maggi Noodles', sales: 45, revenue: 540 },
  ]

  const recentActivity = [
    { time: '2 hours ago', action: 'Responded to broadcast', item: 'Harpic' },
    { time: '5 hours ago', action: 'Order completed', item: 'Colgate' },
    { time: '1 day ago', action: 'Broadcast sent', item: '20% off cleaning supplies' },
  ]

  const currentStats = stats[period]

  return (
    <div className="min-h-screen pb-24" style={{ background: '#FAF8F5' }}>
      {/* Header */}
      <div className="px-6 pt-14 pb-4" style={{ background: '#1A1A1A' }}>
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate('/merchant')}
            className="p-2 rounded-xl hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft size={24} style={{ color: '#FAF8F5' }} />
          </button>
          <h1 className="text-xl font-bold" style={{ color: '#FAF8F5' }}>Statistics</h1>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Period Selector */}
        <div className="flex gap-2">
          {([['today', 'Today'], ['week', 'This Week'], ['month', 'This Month']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              className={`flex-1 py-2 rounded-xl font-semibold text-sm transition-colors ${period === key ? 'bg-gray-900 text-white' : 'bg-white text-gray-600'
                }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Today's Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-xl" style={{ background: '#FFFFFF' }}>
            <div className="flex items-center gap-2 mb-2">
              <Radio size={20} className="text-blue-600" />
              <p className="text-sm" style={{ color: '#6B6B6B' }}>Queries</p>
            </div>
            <p className="text-2xl font-bold" style={{ color: '#1A1A1A' }}>{currentStats.queries}</p>
            <p className="text-xs mt-1" style={{ color: '#22C55E' }}>+3 from yesterday</p>
          </div>

          <div className="p-4 rounded-xl" style={{ background: '#FFFFFF' }}>
            <div className="flex items-center gap-2 mb-2">
              <Users size={20} className="text-green-600" />
              <p className="text-sm" style={{ color: '#6B6B6B' }}>Responses</p>
            </div>
            <p className="text-2xl font-bold" style={{ color: '#1A1A1A' }}>{currentStats.responses}</p>
            <p className="text-xs mt-1" style={{ color: '#22C55E' }}>67% response rate</p>
          </div>

          <div className="p-4 rounded-xl" style={{ background: '#FFFFFF' }}>
            <div className="flex items-center gap-2 mb-2">
              <ShoppingBag size={20} className="text-purple-600" />
              <p className="text-sm" style={{ color: '#6B6B6B' }}>Orders</p>
            </div>
            <p className="text-2xl font-bold" style={{ color: '#1A1A1A' }}>{currentStats.orders}</p>
            <p className="text-xs mt-1" style={{ color: '#22C55E' }}>+1 from yesterday</p>
          </div>

          <div className="p-4 rounded-xl" style={{ background: '#FFFFFF' }}>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={20} className="text-orange-600" />
              <p className="text-sm" style={{ color: '#6B6B6B' }}>Revenue</p>
            </div>
            <p className="text-2xl font-bold" style={{ color: '#1A1A1A' }}>₹{currentStats.revenue}</p>
            <p className="text-xs mt-1" style={{ color: '#22C55E' }}>+12% from yesterday</p>
          </div>
        </div>

        {/* Top Products */}
        <div>
          <h2 className="text-lg font-bold mb-3" style={{ color: '#1A1A1A' }}>Top Products</h2>
          <div className="space-y-3">
            {topProducts.map((product, i) => (
              <div key={i} className="p-4 rounded-xl" style={{ background: '#FFFFFF' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold" style={{ color: '#1A1A1A' }}>{product.name}</p>
                    <p className="text-sm" style={{ color: '#6B6B6B' }}>{product.sales} sales</p>
                  </div>
                  <p className="text-lg font-bold" style={{ color: '#22C55E' }}>₹{product.revenue}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-lg font-bold mb-3" style={{ color: '#1A1A1A' }}>Recent Activity</h2>
          <div className="space-y-3">
            {recentActivity.map((activity, i) => (
              <div key={i} className="p-4 rounded-xl" style={{ background: '#FFFFFF' }}>
                <p className="font-semibold mb-1" style={{ color: '#1A1A1A' }}>{activity.action}</p>
                <p className="text-sm" style={{ color: '#6B6B6B' }}>{activity.item}</p>
                <p className="text-xs mt-2" style={{ color: '#9A9895' }}>{activity.time}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 px-6 py-4" style={{ background: '#FFFFFF', borderTop: '1px solid #E5E3DF' }}>
        <div className="flex items-center justify-around max-w-md mx-auto">
          {[
            { icon: '🏠', label: 'Home', active: false, path: '/merchant' },
            { icon: '📦', label: 'Products', active: false, path: '/merchant/products' },
            { icon: '📊', label: 'Stats', active: true, path: '/merchant/stats' },
            { icon: '👤', label: 'Profile', active: false, path: '/merchant/profile' },
          ].map((tab, i) => (
            <button
              key={i}
              className="flex flex-col items-center gap-1 transition-transform active:scale-95"
              onClick={() => navigate(tab.path)}
            >
              <div className={`text-2xl ${tab.active ? 'scale-110' : 'opacity-50'}`}>{tab.icon}</div>
              <span className={`text-xs font-medium ${tab.active ? 'text-black' : 'text-gray-400'}`}>
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
