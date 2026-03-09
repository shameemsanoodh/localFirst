import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, MapPin, AlertCircle, Tag } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Shop, shopsService } from '@/services/shops.service'
import { useLocationStore } from '@/store/locationStore'
import { ShopCard } from '@/components/shops/ShopCard'
import { ShopCardSkeleton } from '@/components/shops/ShopCardSkeleton'
import { OfferCard } from '@/components/offers/OfferCard'
import api from '@/services/api'

interface ActiveOffer {
  offerId: string
  shopName: string
  offer: string
  message: string
  category: string
  distance: number
  expiresAt: number
  location?: {
    lat: number
    lng: number
  }
}

const Nearby: React.FC = () => {
  const navigate = useNavigate()
  const { lat, lng, area } = useLocationStore()
  const [shops, setShops] = useState<Shop[]>([])
  const [offers, setOffers] = useState<ActiveOffer[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (lat && lng) {
      fetchAllNearbyShops()
      fetchActiveOffers()
    }
  }, [lat, lng])

  const fetchActiveOffers = async () => {
    if (!lat || !lng) return

    try {
      const response = await api.get<{ offers: ActiveOffer[] }>(`/offers/active?lat=${lat}&lng=${lng}&radius=10`)
      // Handle nested data structure from backend
      const offersData = (response.data as any)?.data?.offers || (response.data as any)?.offers || [];
      setOffers(offersData)
    } catch (err) {
      console.error('Error fetching offers:', err)
      // Don't show error for offers, just log it
    }
  }

  const fetchAllNearbyShops = async () => {
    if (!lat || !lng) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await shopsService.getNearbyShops(lat, lng, 10) // 10km radius for "all"
      setShops(response.shops)
    } catch (err) {
      console.error('Error fetching shops:', err)
      setError('Could not load shops. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen pb-24 md:pb-8 bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-700" />
          </button>
          <div>
            <h1 className="text-lg font-display font-bold text-gray-900">All Nearby Shops</h1>
            <p className="text-xs text-gray-500">
              {area || 'Your location'} • {shops.length} shops found
            </p>
          </div>
        </div>
      </div>

      <div className="premium-container py-6">
        {/* Active Offers Section */}
        {offers.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Tag size={20} className="text-green-600" />
              <h2 className="text-xl font-bold text-gray-900">Active Offers Near You</h2>
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                {offers.length}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {offers.map((offer) => (
                <OfferCard
                  key={offer.offerId}
                  offer={offer}
                  userLocation={lat && lng ? { lat, lng } : undefined}
                />
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <ShopCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{error}</h3>
            <button
              onClick={fetchAllNearbyShops}
              className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && shops.length === 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
            <MapPin size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No shops found nearby
            </h3>
            <p className="text-gray-600">
              Try enabling location or check back later
            </p>
          </div>
        )}

        {/* Shops Grid */}
        {!isLoading && !error && shops.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {shops.map((shop) => (
              <motion.div
                key={shop.shopId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <ShopCard
                  shop={shop}
                  onClick={() => navigate(`/shop/${shop.shopId}`)}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default Nearby
