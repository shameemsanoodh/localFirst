import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Bell, MapPin, Clock, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { useMerchantAPI } from '@/hooks/useMerchantAPI'

// Color palette: Banana Yellow #F5C842, Dark #1A1A1A, Cream #FAF8F5, Mid #6B6B6B

interface MerchantBroadcast {
  broadcast_id: string
  query: string
  detected_capabilities: string[]
  location: { lat: number; lng: number }
  distance_km: number
  created_at: number
  expires_at: number
  status: 'new' | 'replied' | 'expired'
  urgency?: 'high' | 'medium' | 'low'
}

const MerchantHome: React.FC = () => {
  const navigate = useNavigate()
  const { getBroadcasts } = useMerchantAPI()
  const [broadcasts, setBroadcasts] = useState<MerchantBroadcast[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    queriesReceived: 0,
    repliedCount: 0,
    missedCount: 0,
  })

  // Get merchant data from localStorage
  const merchantData = JSON.parse(localStorage.getItem('merchant-data') || '{}')
  const shopName = merchantData.shopName || 'My Shop'
  const shopId = merchantData.userId || 'shop-123'

  useEffect(() => {
    loadBroadcasts()
    // Poll for new broadcasts every 30 seconds
    const interval = setInterval(loadBroadcasts, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadBroadcasts = async () => {
    try {
      setLoading(true)
      const data = await getBroadcasts(shopId)
      
      // Mock data for demo if API returns empty or fails
      const mockBroadcasts: MerchantBroadcast[] = [
        {
          broadcast_id: '1',
          query: 'tempered glass for redmi note 10 pro',
          detected_capabilities: ['tempered_glass'],
          location: { lat: 12.9716, lng: 77.5946 },
          distance_km: 0.5,
          created_at: Date.now() - 2 * 60 * 1000,
          expires_at: Date.now() + 58 * 60 * 1000,
          status: 'new',
          urgency: 'high',
        },
        {
          broadcast_id: '2',
          query: 'mobile back cover',
          detected_capabilities: ['back_cover'],
          location: { lat: 12.9716, lng: 77.5946 },
          distance_km: 1.2,
          created_at: Date.now() - 15 * 60 * 1000,
          expires_at: Date.now() + 45 * 60 * 1000,
          status: 'new',
          urgency: 'medium',
        },
        {
          broadcast_id: '3',
          query: 'charger for samsung',
          detected_capabilities: ['chargers_cables'],
          location: { lat: 12.9716, lng: 77.5946 },
          distance_km: 0.8,
          created_at: Date.now() - 60 * 60 * 1000,
          expires_at: Date.now() - 5 * 60 * 1000,
          status: 'replied',
          urgency: 'low',
        },
      ]

      // Use API data if available, otherwise use mock data
      const broadcastsData = (data && Array.isArray(data) && data.length > 0) ? data : mockBroadcasts
      
      // Ensure all broadcasts have required fields with proper types
      const validBroadcasts: MerchantBroadcast[] = broadcastsData.map((b: any) => ({
        broadcast_id: b.broadcast_id || '',
        query: b.query || '',
        detected_capabilities: b.detected_capabilities || [],
        location: b.location || { lat: 0, lng: 0 },
        distance_km: b.distance_km || 0,
        created_at: b.created_at || Date.now(),
        expires_at: b.expires_at || Date.now(),
        status: (b.status === 'new' || b.status === 'replied' || b.status === 'expired') ? b.status : 'new',
        urgency: (b.urgency === 'high' || b.urgency === 'medium' || b.urgency === 'low') ? b.urgency : 'medium',
      }))

      setBroadcasts(validBroadcasts)
      
      // Calculate stats
      const today = new Date().setHours(0, 0, 0, 0)
      const todayBroadcasts = validBroadcasts.filter(b => b.created_at >= today)
      setStats({
        queriesReceived: todayBroadcasts.length,
        repliedCount: todayBroadcasts.filter(b => b.status === 'replied').length,
        missedCount: todayBroadcasts.filter(b => b.status === 'expired').length,
      })
    } catch (error) {
      console.error('Failed to load broadcasts:', error)
      // Set empty array on error
      setBroadcasts([])
    } finally {
      setLoading(false)
    }
  }

  const getTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000)
    if (seconds < 60) return `${seconds} sec ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes} min ago`
    const hours = Math.floor(minutes / 60)
    return `${hours} hour${hours > 1 ? 's' : ''} ago`
  }

  const getExpiresIn = (expiresAt: number) => {
    const seconds = Math.floor((expiresAt - Date.now()) / 1000)
    if (seconds < 0) return 'Expired'
    if (seconds < 60) return `${seconds} sec left`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes} min left`
    const hours = Math.floor(minutes / 60)
    return `${hours} hour${hours > 1 ? 's' : ''} left`
  }

  const handleReply = (broadcastId: string) => {
    navigate(`/merchant/broadcast/${broadcastId}`)
  }

  const newBroadcasts = broadcasts.filter(b => b.status === 'new')

  return (
    <div className="min-h-screen" style={{ background: '#FAF8F5', fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div className="px-6 pt-14 pb-4" style={{ background: '#1A1A1A' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ background: '#F5C842' }}>
              🏪
            </div>
            <div>
              <h1 className="text-lg font-bold" style={{ color: '#FAF8F5' }}>{shopName}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="w-2 h-2 rounded-full" style={{ background: '#22C55E' }} />
                <span className="text-xs" style={{ color: '#9A9895' }}>Live · Visible within 2 km</span>
              </div>
            </div>
          </div>
          <button className="relative p-2.5 rounded-xl" style={{ background: '#2A2A2A' }}>
            <Bell size={20} style={{ color: '#F5C842' }} />
            {newBroadcasts.length > 0 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: '#FF5454', color: 'white' }}>
                {newBroadcasts.length}
              </div>
            )}
          </button>
        </div>

        {/* Today's Summary */}
        <div className="p-4 rounded-2xl" style={{ background: '#2A2A2A' }}>
          <p className="text-xs font-semibold mb-3" style={{ color: '#9A9895', letterSpacing: '0.06em' }}>
            TODAY'S SUMMARY
          </p>
          <div className="flex items-center justify-between">
            <div className="text-center">
              <p className="text-2xl font-bold" style={{ color: '#F5C842' }}>{stats.queriesReceived}</p>
              <p className="text-xs mt-1" style={{ color: '#9A9895' }}>Queries</p>
            </div>
            <div className="w-px h-10" style={{ background: '#3A3A3A' }} />
            <div className="text-center">
              <p className="text-2xl font-bold" style={{ color: '#22C55E' }}>{stats.repliedCount}</p>
              <p className="text-xs mt-1" style={{ color: '#9A9895' }}>Replied</p>
            </div>
            <div className="w-px h-10" style={{ background: '#3A3A3A' }} />
            <div className="text-center">
              <p className="text-2xl font-bold" style={{ color: '#FF5454' }}>{stats.missedCount}</p>
              <p className="text-xs mt-1" style={{ color: '#9A9895' }}>Missed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Live Queries Section */}
      <div className="px-6 py-6">
        <h2 className="text-lg font-bold mb-4" style={{ color: '#1A1A1A' }}>Live Queries</h2>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="p-4 rounded-2xl animate-pulse" style={{ background: '#EFEFEB' }}>
                <div className="h-4 rounded" style={{ background: '#CFCDC9', width: '70%' }} />
                <div className="h-3 rounded mt-2" style={{ background: '#CFCDC9', width: '40%' }} />
              </div>
            ))}
          </div>
        ) : broadcasts.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>No queries yet</p>
            <p className="text-xs mt-1" style={{ color: '#6B6B6B' }}>
              You'll be notified when customers search for your products
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {broadcasts.map((broadcast, index) => {
                const isNew = broadcast.status === 'new'
                const isReplied = broadcast.status === 'replied'
                const isExpired = broadcast.status === 'expired' || broadcast.expires_at < Date.now()
                const expiresIn = getExpiresIn(broadcast.expires_at)
                const isUrgent = broadcast.urgency === 'high' || (broadcast.expires_at - Date.now()) < 60 * 60 * 1000

                return (
                  <motion.div
                    key={broadcast.broadcast_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 rounded-2xl relative overflow-hidden"
                    style={{
                      background: isNew ? '#FFFFFF' : '#EFEFEB',
                      border: '2px solid',
                      borderColor: isNew ? '#F5C842' : 'transparent',
                    }}
                  >
                    {/* Status Badge */}
                    <div className="flex items-center justify-between mb-3">
                      {isNew && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: '#FF545420' }}>
                          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#FF5454' }} />
                          <span className="text-xs font-bold" style={{ color: '#FF5454' }}>NEW</span>
                        </div>
                      )}
                      {isReplied && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: '#22C55E20' }}>
                          <CheckCircle size={12} style={{ color: '#22C55E' }} />
                          <span className="text-xs font-bold" style={{ color: '#22C55E' }}>REPLIED</span>
                        </div>
                      )}
                      {isExpired && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: '#6B6B6B20' }}>
                          <XCircle size={12} style={{ color: '#6B6B6B' }} />
                          <span className="text-xs font-bold" style={{ color: '#6B6B6B' }}>EXPIRED</span>
                        </div>
                      )}
                      {isUrgent && isNew && (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: '#FF545410' }}>
                          <AlertCircle size={10} style={{ color: '#FF5454' }} />
                          <span className="text-[10px] font-bold" style={{ color: '#FF5454' }}>URGENT</span>
                        </div>
                      )}
                    </div>

                    {/* Query Text */}
                    <p className="text-base font-semibold mb-3" style={{ color: '#1A1A1A' }}>
                      "{broadcast.query}"
                    </p>

                    {/* Meta Info */}
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex items-center gap-1.5">
                        <MapPin size={14} style={{ color: '#6B6B6B' }} />
                        <span className="text-xs" style={{ color: '#6B6B6B' }}>
                          {broadcast.distance_km?.toFixed(1) || '0.0'} km away
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock size={14} style={{ color: '#6B6B6B' }} />
                        <span className="text-xs" style={{ color: '#6B6B6B' }}>
                          {getTimeAgo(broadcast.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* Expiry Warning */}
                    {isNew && !isExpired && (
                      <div className="flex items-center gap-2 mb-3 p-2 rounded-lg" style={{ background: isUrgent ? '#FF545410' : '#F5C84220' }}>
                        <Clock size={12} style={{ color: isUrgent ? '#FF5454' : '#F5C842' }} />
                        <span className="text-xs font-semibold" style={{ color: isUrgent ? '#FF5454' : '#1A1A1A' }}>
                          Expires in {expiresIn}
                        </span>
                      </div>
                    )}

                    {/* Action Buttons */}
                    {isNew && !isExpired && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReply(broadcast.broadcast_id)}
                          className="flex-1 py-2.5 rounded-xl font-semibold text-sm transition-transform active:scale-95"
                          style={{ background: '#1A1A1A', color: '#F5C842' }}
                        >
                          Reply Now
                        </button>
                        <button
                          className="px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors"
                          style={{ background: '#EFEFEB', color: '#6B6B6B' }}
                        >
                          Skip
                        </button>
                      </div>
                    )}

                    {isReplied && (
                      <div className="p-3 rounded-xl" style={{ background: '#22C55E10' }}>
                        <p className="text-xs font-semibold" style={{ color: '#166534' }}>
                          You: "Available ₹350"
                        </p>
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Profile Completeness Nudge */}
      <div className="px-6 pb-6">
        <div className="p-4 rounded-2xl" style={{ background: '#F5C84220', border: '2px solid #F5C84240' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold" style={{ color: '#1A1A1A' }}>💡 Profile 60% Complete</p>
            <button className="text-xs font-semibold" style={{ color: '#6B6B6B' }}>Dismiss</button>
          </div>
          <div className="space-y-2">
            {[
              { label: 'Add shop timings', done: false },
              { label: 'Add WhatsApp number', done: false },
              { label: 'Upload shop photo', done: false },
              { label: 'Add brands you stock', done: false },
            ].map((item, i) => (
              <button
                key={i}
                className="w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors hover:bg-white/50"
              >
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${item.done ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                  {item.done && <CheckCircle size={12} color="white" />}
                </div>
                <span className="text-xs" style={{ color: '#1A1A1A' }}>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 px-6 py-4" style={{ background: '#FFFFFF', borderTop: '1px solid #E5E3DF' }}>
        <div className="flex items-center justify-around max-w-md mx-auto">
          {[
            { icon: '🏠', label: 'Home', active: true },
            { icon: '📦', label: 'Products', active: false },
            { icon: '📊', label: 'Stats', active: false },
            { icon: '👤', label: 'Profile', active: false },
          ].map((tab, i) => (
            <button
              key={i}
              className="flex flex-col items-center gap-1 transition-transform active:scale-95"
              onClick={() => tab.label !== 'Home' && navigate(`/merchant/${tab.label.toLowerCase()}`)}
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

export default MerchantHome
