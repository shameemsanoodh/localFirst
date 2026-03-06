import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Store, Check, Clock, Phone, Navigation } from 'lucide-react'
import { shopsService } from '@/services/shops.service'

interface ShopResponse {
  shopId: string
  shopName: string
  status: 'pending' | 'accepted' | 'rejected'
  distance: number
  coverImage: string
  logo: string
  rating: number
  address: string
  phone?: string
  estimatedTime?: string
  price?: number
  notes?: string
}

const BroadcastRadar: React.FC = () => {
  const { broadcastId } = useParams<{ broadcastId: string }>()
  const navigate = useNavigate()

  const [broadcast, setBroadcast] = useState<any>(null)
  const [shops, setShops] = useState<ShopResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [acceptedCount, setAcceptedCount] = useState(0)
  const [rejectedCount, setRejectedCount] = useState(0)
  const [pendingCount, setPendingCount] = useState(0)

  // Fetch broadcast details and nearby shops
  useEffect(() => {
    const fetchData = async () => {
      if (!broadcastId) return

      try {
        setLoading(true)

        // Get nearby shops matching the category from localStorage (passed from search)
        const broadcastData = localStorage.getItem(`broadcast_${broadcastId}`)

        if (broadcastData) {
          const parsedData = JSON.parse(broadcastData)
          setBroadcast(parsedData.broadcast)

          // Get nearby shops matching the category
          const nearbyShops = await shopsService.getNearby(
            parsedData.broadcast.userLat,
            parsedData.broadcast.userLng,
            parsedData.broadcast.radius
          )

          // Filter shops by category
          const categoryShops = nearbyShops.filter((shop: any) =>
            shop.category === parsedData.broadcast.category
          )

          // Initialize shop responses
          const shopResponses: ShopResponse[] = categoryShops.map((shop: any) => ({
            shopId: shop.shopId,
            shopName: shop.name,
            status: 'pending',
            distance: shop.distanceKm,
            coverImage: shop.coverImage,
            logo: shop.logo,
            rating: shop.rating,
            address: shop.location.address,
            phone: shop.phone,
          }))

          setShops(shopResponses)
          setPendingCount(shopResponses.length)
          setLoading(false)

          // Start polling for responses (simulate real-time updates)
          if (shopResponses.length > 0) {
            startPolling(shopResponses)
          }
        } else {
          // Fallback: try to fetch from API (will fail if not authenticated)
          console.error('No broadcast data in localStorage')
          setLoading(false)
        }
      } catch (error) {
        console.error('Failed to fetch broadcast data:', error)
        setLoading(false)
      }
    }

    fetchData()
  }, [broadcastId])

  // Simulate shop responses (in production, use WebSocket or polling)
  const startPolling = (initialShops: ShopResponse[]) => {
    let currentShops = [...initialShops]
    let responseIndex = 0

    const interval = setInterval(() => {
      if (responseIndex >= currentShops.length) {
        clearInterval(interval)
        return
      }

      // Simulate random shop response
      const shop = currentShops[responseIndex]
      const randomResponse = Math.random()

      if (randomResponse > 0.7) {
        // 30% chance of acceptance
        shop.status = 'accepted'
        shop.estimatedTime = `${Math.floor(Math.random() * 20) + 10} mins`
        shop.price = Math.floor(Math.random() * 500) + 50
        setAcceptedCount(prev => prev + 1)
        setPendingCount(prev => Math.max(0, prev - 1))
      } else if (randomResponse > 0.4) {
        // 30% chance of rejection
        shop.status = 'rejected'
        setRejectedCount(prev => prev + 1)
        setPendingCount(prev => Math.max(0, prev - 1))
      }
      // 40% remain pending (busy) - don't decrement pending count

      setShops([...currentShops])
      responseIndex++
    }, 2000) // Response every 2 seconds

    // Cleanup after 30 seconds
    setTimeout(() => {
      clearInterval(interval)
    }, 30000)
  }

  const acceptedShops = shops.filter(s => s.status === 'accepted')

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nearby-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading broadcast...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
              <h1 className="text-lg font-semibold text-gray-900">
                {broadcast?.productName}
              </h1>
              <p className="text-sm text-gray-500">
                Broadcasting to {broadcast?.category} shops
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Radar Animation Section */}
      <div className="bg-gradient-to-br from-nearby-500 via-nearby-600 to-nearby-700 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            {/* Radar Circle */}
            <div className="relative w-64 h-64 mx-auto mb-6">
              {/* Outer rings */}
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-white/20"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <motion.div
                className="absolute inset-4 rounded-full border-2 border-white/30"
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
              />
              <motion.div
                className="absolute inset-8 rounded-full border-2 border-white/40"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
              />

              {/* Center dot */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-4 h-4 bg-white rounded-full shadow-lg" />
              </div>

              {/* Scanning line */}
              <motion.div
                className="absolute inset-0"
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              >
                <div className="w-full h-full relative">
                  <div className="absolute top-1/2 left-1/2 w-1/2 h-0.5 bg-gradient-to-r from-white to-transparent origin-left" />
                </div>
              </motion.div>

              {/* Shop dots */}
              {shops.slice(0, 8).map((shop, index) => {
                const angle = (index * 360) / 8
                const radius = 100
                const x = Math.cos((angle * Math.PI) / 180) * radius
                const y = Math.sin((angle * Math.PI) / 180) * radius

                return (
                  <motion.div
                    key={shop.shopId}
                    className="absolute top-1/2 left-1/2"
                    style={{
                      transform: `translate(${x}px, ${y}px)`,
                    }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div
                      className={`w-3 h-3 rounded-full ${shop.status === 'accepted'
                          ? 'bg-green-400'
                          : shop.status === 'rejected'
                            ? 'bg-red-400'
                            : 'bg-yellow-400 animate-pulse'
                        }`}
                    />
                  </motion.div>
                )
              })}
            </div>

            {/* Status Text */}
            <div className="text-center text-white">
              <h2 className="text-2xl font-bold mb-2">
                {pendingCount > 0
                  ? `Request sent to ${shops.length} nearby ${broadcast?.category || ''} shop${shops.length > 1 ? 's' : ''}`
                  : acceptedCount > 0
                    ? `${acceptedCount} shop${acceptedCount > 1 ? 's' : ''} accepted!`
                    : 'Shops are busy'}
              </h2>
              <p className="text-white/80">
                {pendingCount > 0
                  ? `Waiting for ${pendingCount} shop${pendingCount > 1 ? 's' : ''} to respond...`
                  : acceptedCount === 0
                    ? 'Try again after some time'
                    : 'Choose a shop below'}
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-white">{acceptedCount}</div>
                <div className="text-xs text-white/80">Accepted</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-white">{rejectedCount}</div>
                <div className="text-xs text-white/80">Rejected</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-white">{pendingCount}</div>
                <div className="text-xs text-white/80">Pending</div>
              </div>
            </div>

            {/* Shops Receiving Broadcast */}
            {shops.length > 0 && (
              <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-xs text-white/60 uppercase tracking-wide mb-2">
                  Broadcast sent to:
                </div>
                <div className="space-y-2">
                  {shops.map((shop) => (
                    <div key={shop.shopId} className="flex items-center gap-2 text-sm text-white">
                      <div
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${shop.status === 'accepted'
                            ? 'bg-green-400'
                            : shop.status === 'rejected'
                              ? 'bg-red-400'
                              : 'bg-yellow-400 animate-pulse'
                          }`}
                      />
                      <span className="flex-1 truncate">{shop.shopName}</span>
                      <span className="text-xs text-white/60">{shop.distance.toFixed(1)} km</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Accepted Shops */}
      {acceptedShops.length > 0 && (
        <div className="container mx-auto px-4 py-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Available Shops ({acceptedShops.length})
          </h3>
          <div className="space-y-4">
            <AnimatePresence>
              {acceptedShops.map((shop) => (
                <motion.div
                  key={shop.shopId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="flex gap-4 p-4">
                    {/* Shop Logo */}
                    <img
                      src={shop.logo}
                      alt={shop.shopName}
                      className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                    />

                    {/* Shop Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900 truncate">
                          {shop.shopName}
                        </h4>
                        <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-lg flex-shrink-0">
                          <Check size={14} />
                          <span className="text-xs font-medium">Accepted</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                        <span className="text-yellow-500">★</span>
                        <span>{shop.rating}</span>
                        <span className="text-gray-400">•</span>
                        <span>{shop.distance.toFixed(1)} km</span>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-1">
                          <Clock size={14} />
                          <span>{shop.estimatedTime}</span>
                        </div>
                        {shop.price && (
                          <div className="font-semibold text-nearby-600">
                            ₹{shop.price}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          className="flex-1 bg-nearby-500 hover:bg-nearby-600 text-white text-sm font-semibold py-2 px-4 rounded-xl transition-colors"
                          onClick={() => alert(`Order placed with ${shop.shopName}! They will confirm shortly.`)}
                        >
                          Order Now
                        </button>
                        {shop.phone && (
                          <button
                            className="p-2 border border-gray-300 hover:bg-gray-50 rounded-xl transition-colors"
                            onClick={() => window.open(`tel:${shop.phone}`)}
                            title="Call shop"
                          >
                            <Phone size={18} className="text-gray-600" />
                          </button>
                        )}
                        <button
                          className="p-2 border border-gray-300 hover:bg-gray-50 rounded-xl transition-colors"
                          onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(shop.address || shop.shopName)}`, '_blank')}
                          title="Navigate"
                        >
                          <Navigation size={18} className="text-gray-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* No Shops Available */}
      {pendingCount === 0 && acceptedCount === 0 && (
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Store size={40} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              All shops are busy
            </h3>
            <p className="text-gray-600 mb-6">
              No shops are available right now. Please try again after some time.
            </p>
            <button
              onClick={() => navigate('/')}
              className="bg-nearby-500 hover:bg-nearby-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      )}
    </div>
  )
}


export default BroadcastRadar
