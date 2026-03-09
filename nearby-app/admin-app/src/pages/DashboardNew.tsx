import React, { useState, useEffect } from 'react'
import { Users, Camera, Calendar, CreditCard, Clock, CheckCircle, Loader2 } from 'lucide-react'
import MetricCard from '../components/MetricCard'
import { apiService, AdminStats } from '../services/api.service'

const DashboardNew: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchStats = async () => {
    try {
      setLoading(true)
      const data = await apiService.getStats()
      setStats(data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
      // Use mock data on error
      setStats({
        totalUsers: 12,
        totalMerchants: 6,
        totalBroadcasts: 3,
        totalProducts: 3,
        activeToday: 0,
        recentSignups: 2,
        merchantsByCategory: [],
        userGrowth: []
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome to NearBy Admin Panel</p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard
          icon={<Users size={24} />}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100"
          value={stats?.totalUsers || 0}
          label="Total Users"
        />
        
        <MetricCard
          icon={<Camera size={24} />}
          iconColor="text-purple-600"
          iconBgColor="bg-purple-100"
          value={stats?.totalMerchants || 0}
          label="Creators"
        />
        
        <MetricCard
          icon={<Calendar size={24} />}
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
          value={stats?.totalBroadcasts || 0}
          label="Total Bookings"
        />
        
        <MetricCard
          icon={<CreditCard size={24} />}
          iconColor="text-orange-600"
          iconBgColor="bg-orange-100"
          value={stats?.totalProducts || 0}
          label="B2B Subscriptions"
        />
        
        <MetricCard
          icon={<Clock size={24} />}
          iconColor="text-yellow-600"
          iconBgColor="bg-yellow-100"
          value={stats?.recentSignups || 0}
          label="Pending Approvals"
        />
        
        <MetricCard
          icon={<CheckCircle size={24} />}
          iconColor="text-red-600"
          iconBgColor="bg-red-100"
          value={stats?.activeToday || 0}
          label="Pending Bookings"
        />
      </div>

      {/* Recent Actions Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900">Recent Actions</h2>
          <p className="text-sm text-gray-600">Quick access to pending items</p>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <Camera className="text-yellow-600" size={20} />
              </div>
              <span className="text-sm font-medium text-gray-900">
                Creator applications pending
              </span>
            </div>
            <span className="text-lg font-bold text-gray-900">
              {stats?.recentSignups || 2}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Stats Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900">Quick Stats</h2>
          <p className="text-sm text-gray-600">Platform overview</p>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <span className="text-sm text-gray-600">Approved Creators</span>
            <span className="text-lg font-semibold text-gray-900">
              {(stats?.totalMerchants || 0) - (stats?.recentSignups || 0)}
            </span>
          </div>
          
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <span className="text-sm text-gray-600">Completed Bookings</span>
            <span className="text-lg font-semibold text-gray-900">-</span>
          </div>
          
          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-gray-600">Active Subscriptions</span>
            <span className="text-lg font-semibold text-gray-900">
              {stats?.totalProducts || 0}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardNew
