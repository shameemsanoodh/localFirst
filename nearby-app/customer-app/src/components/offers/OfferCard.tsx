import React from 'react'
import { motion } from 'framer-motion'
import { MapPin, Clock, Navigation } from 'lucide-react'

interface OfferCardProps {
  offer: {
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
  userLocation?: {
    lat: number
    lng: number
  }
}

export const OfferCard: React.FC<OfferCardProps> = ({ offer, userLocation }) => {
  const timeRemaining = Math.max(0, offer.expiresAt - Date.now())
  const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60))
  const minutesRemaining = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60))

  const handleGetDirections = () => {
    if (offer.location && userLocation) {
      const origin = `${userLocation.lat},${userLocation.lng}`
      const destination = `${offer.location.lat},${offer.location.lng}`
      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`
      window.open(googleMapsUrl, '_blank')
    } else {
      // Fallback: search for shop name
      const destination = offer.shopName.replace(/\s+/g, '+')
      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${destination}`
      window.open(googleMapsUrl, '_blank')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 text-lg mb-1">{offer.shopName}</h3>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin size={14} />
            <span>{offer.distance} km away</span>
            <span className="text-gray-400">•</span>
            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
              {offer.category}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-orange-600 bg-orange-100 px-3 py-1 rounded-lg">
          <Clock size={14} />
          <span className="text-xs font-semibold">
            {hoursRemaining > 0 ? `${hoursRemaining}h` : `${minutesRemaining}m`} left
          </span>
        </div>
      </div>

      {/* Offer */}
      <div className="bg-white rounded-xl p-3 mb-3 border border-green-200">
        <p className="text-xl font-bold text-green-600 mb-1">🎉 {offer.offer}</p>
        {offer.message && (
          <p className="text-sm text-gray-700">{offer.message}</p>
        )}
      </div>

      {/* Action Button */}
      <button
        onClick={handleGetDirections}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        <Navigation size={18} />
        Get Directions
      </button>
    </motion.div>
  )
}
