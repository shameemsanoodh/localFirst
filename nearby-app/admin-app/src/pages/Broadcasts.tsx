import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, Loader2, MapPin, MessageSquare, Trash2, Clock } from 'lucide-react'
import Layout from '../components/Layout'
import { apiService, Broadcast } from '../services/api.service'

const Broadcasts: React.FC = () => {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadBroadcasts()
  }, [])

  const loadBroadcasts = async () => {
    try {
      const data = await apiService.getBroadcasts()
      setBroadcasts(data)
    } catch (error) {
      console.error('Failed to load broadcasts:', error)
      setBroadcasts([
        {
          broadcastId: 'B001',
          userId: 'U001',
          userName: 'John Doe',
          message: 'Looking for iPhone 15 Pro Max in good condition',
          category: 'Electronics',
          location: { lat: 12.9716, lng: 77.5946, area: 'Koramangala' },
          createdAt: '2026-03-05T10:30:00Z',
          status: 'active',
          responseCount: 5,
        },
        {
          broadcastId: 'B002',
          userId: 'U002',
          userName: 'Jane Smith',
          message: 'Need fresh vegetables delivery today',
          category: 'Food',
          location: { lat: 12.9716, lng: 77.5946, area: 'Indiranagar' },
          createdAt: '2026-03-05T09:15:00Z',
          status: 'active',
          responseCount: 3,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (broadcastId: string) => {
    if (!confirm('Are you sure you want to delete this broadcast?')) return
    try {
      await apiService.deleteBroadcast(broadcastId)
      setBroadcasts(prev => prev.filter(b => b.broadcastId !== broadcastId))
    } catch (error) {
      console.error('Failed to delete broadcast:', error)
    }
  }

  const filteredBroadcasts = broadcasts.filter(b =>
    b.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.userName?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours < 1) return 'Just now'
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
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
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Broadcasts</h1>
          <p className="text-sm text-gray-500 mt-1">Monitor user broadcasts</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 mb-6">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search broadcasts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>

        <div className="space-y-4">
          {filteredBroadcasts.map((broadcast, index) => (
            <motion.div
              key={broadcast.broadcastId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white p-6 rounded-xl border border-gray-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                    {broadcast.userName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{broadcast.userName || 'User'}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock size={12} />
                      {formatTime(broadcast.createdAt)}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(broadcast.broadcastId)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Trash2 size={16} className="text-gray-600" />
                </button>
              </div>

              <p className="text-gray-900 mb-4">{broadcast.message}</p>

              <div className="flex items-center gap-3 flex-wrap">
                {broadcast.category && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                    {broadcast.category}
                  </span>
                )}
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <MapPin size={14} />
                  {broadcast.location.area || 'Unknown'}
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <MessageSquare size={14} />
                  {broadcast.responseCount} responses
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredBroadcasts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No broadcasts found</p>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default Broadcasts
