import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Search, Clock, CheckCircle, XCircle, ChevronRight } from 'lucide-react'
import api from '@/services/api'

interface SearchHistoryItem {
  broadcastId: string
  query: string
  category?: string
  timestamp: string
  status: 'responses' | 'no_match'
  responseCount: number
}

const SearchHistory: React.FC = () => {
  const navigate = useNavigate()
  const [history, setHistory] = useState<SearchHistoryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      const response = await api.get('/user/history')
      setHistory(response.data.history || [])
    } catch (error) {
      console.error('Failed to fetch search history:', error)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nearby-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading history...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-gray-900">Search History</h1>
              <p className="text-sm text-gray-500">{history.length} searches</p>
            </div>
          </div>
        </div>
      </div>

      {/* History List */}
      <div className="container mx-auto px-4 py-6">
        {history.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search size={40} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No search history
            </h3>
            <p className="text-gray-600 mb-6">
              Your search history will appear here
            </p>
            <button
              onClick={() => navigate('/')}
              className="bg-nearby-500 hover:bg-nearby-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              Start Searching
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((item) => (
              <motion.div
                key={item.broadcastId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => navigate(`/broadcast/radar/${item.broadcastId}`)}
                className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-nearby-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Search size={20} className="text-nearby-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 mb-1 truncate">
                      {item.query}
                    </h3>
                    {item.category && (
                      <p className="text-sm text-gray-500 mb-2">{item.category}</p>
                    )}
                    <div className="flex items-center gap-3 text-sm">
                      <div className="flex items-center gap-1 text-gray-500">
                        <Clock size={14} />
                        <span>{formatTimestamp(item.timestamp)}</span>
                      </div>
                      {item.status === 'responses' ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle size={14} />
                          <span>{item.responseCount} response{item.responseCount !== 1 ? 's' : ''}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-gray-400">
                          <XCircle size={14} />
                          <span>No matches</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-gray-300 flex-shrink-0" />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default SearchHistory
