import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, CheckCircle, XCircle, Clock, Store } from 'lucide-react'
import api from '@/services/api'

interface ActivityItem {
  broadcastId: string
  query: string
  merchantName: string
  timestamp: string
  status: 'accepted' | 'rejected'
  price?: number
  scheduledTime?: string
}

const MyActivity: React.FC = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'accepted' | 'rejected'>('accepted')
  const [accepted, setAccepted] = useState<ActivityItem[]>([])
  const [rejected, setRejected] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchActivity()
  }, [])

  const fetchActivity = async () => {
    try {
      const response = await api.get('/user/activity')
      setAccepted(response.data.accepted || [])
      setRejected(response.data.rejected || [])
    } catch (error) {
      console.error('Failed to fetch activity:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const currentItems = activeTab === 'accepted' ? accepted : rejected

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nearby-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading activity...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-gray-900">My Activity</h1>
              <p className="text-sm text-gray-500">
                {accepted.length + rejected.length} total activities
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('accepted')}
              className={`flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm transition-colors ${
                activeTab === 'accepted'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Accepted ({accepted.length})
            </button>
            <button
              onClick={() => setActiveTab('rejected')}
              className={`flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm transition-colors ${
                activeTab === 'rejected'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Rejected ({rejected.length})
            </button>
          </div>
        </div>
      </div>

      {/* Activity List */}
      <div className="container mx-auto px-4 py-6">
        {currentItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {activeTab === 'accepted' ? (
                <CheckCircle size={40} className="text-gray-400" />
              ) : (
                <XCircle size={40} className="text-gray-400" />
              )}
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No {activeTab} orders
            </h3>
            <p className="text-gray-600 mb-6">
              Your {activeTab} orders will appear here
            </p>
            <button
              onClick={() => navigate('/')}
              className="bg-nearby-500 hover:bg-nearby-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {currentItems.map((item) => (
              <motion.div
                key={item.broadcastId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => navigate(`/broadcast/radar/${item.broadcastId}`)}
                className={`rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer ${
                  activeTab === 'accepted'
                    ? 'bg-green-50 border-2 border-green-200'
                    : 'bg-red-50 border-2 border-red-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      activeTab === 'accepted'
                        ? 'bg-green-100'
                        : 'bg-red-100'
                    }`}
                  >
                    <Store
                      size={20}
                      className={activeTab === 'accepted' ? 'text-green-600' : 'text-red-600'}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {item.query}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {item.merchantName}
                    </p>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="flex items-center gap-1 text-gray-500">
                        <Clock size={14} />
                        <span>{formatTimestamp(item.timestamp)}</span>
                      </div>
                      {item.price && (
                        <div className="font-semibold text-green-600">
                          ₹{item.price}
                        </div>
                      )}
                    </div>
                    {item.scheduledTime && (
                      <div className="mt-2 text-sm text-amber-700 bg-amber-100 px-3 py-1.5 rounded-lg inline-flex items-center gap-1">
                        <Clock size={14} />
                        <span>Scheduled: {new Date(item.scheduledTime).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                  <div
                    className={`flex-shrink-0 ${
                      activeTab === 'accepted' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {activeTab === 'accepted' ? (
                      <CheckCircle size={24} />
                    ) : (
                      <XCircle size={24} />
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default MyActivity
