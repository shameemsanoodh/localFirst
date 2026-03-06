import React from 'react'
import { motion } from 'framer-motion'
import { MapPin, Clock, Heart, ArrowLeft, Filter } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useLocationStore } from '@/store/locationStore'
import { useOffers } from '@/hooks/useOffers'
import { OfferCardSkeleton } from '@/components/home/OfferCardSkeleton'
import { FeaturedOfferBanner } from '@/components/offers/FeaturedOfferBanner'
import { getActiveFeaturedOffers } from '@/config/featuredOffers'

const filters = ['All', 'Groceries', 'Electronics', 'Pharmacy', 'Hardware', 'Home']

const getTimeLeft = (isoString: string) => {
  const now = new Date();
  const expiry = new Date(isoString);
  const diffMs = expiry.getTime() - now.getTime();
  if (diffMs <= 0) return 'Expired';
  const diffHours = diffMs / (1000 * 60 * 60);
  if (diffHours < 1) {
    const diffMinutes = Math.round(diffHours * 60);
    return `${diffMinutes}m left`;
  }
  return `${Math.round(diffHours)}h left`;
};

const getDiscountPercent = (price: number, originalPrice?: number) => {
  if (!originalPrice || originalPrice <= price) return null;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
};

const Offers: React.FC = () => {
  const navigate = useNavigate()
  const [activeFilter, setActiveFilter] = React.useState('All')
  const [savedOfferIds, setSavedOfferIds] = React.useState<Set<string>>(new Set())
  const [filterToast, setFilterToast] = React.useState('')
  const { lat, lng } = useLocationStore()

  const showToast = (msg: string) => {
    setFilterToast(msg)
    setTimeout(() => setFilterToast(''), 2000)
  }

  // Fetch real offers from API
  const { offers, isLoading } = useOffers({
    lat,
    lng,
    radius: 5,
  })

  // Get active featured offers
  const activeFeaturedOffers = getActiveFeaturedOffers()

  const filteredOffers = activeFilter === 'All'
    ? offers
    : offers.filter(o => (o as any).category?.toLowerCase() === activeFilter.toLowerCase())

  return (
    <div className="min-h-screen pb-24 md:pb-8 bg-gray-50">
      {/* Header — mobile only */}
      <div className="md:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-700" />
          </button>
          <h1 className="text-lg font-display font-bold text-gray-900">Nearby Offers</h1>
        </div>
      </div>

      <div className="premium-container">
        {/* Desktop title */}
        <div className="hidden md:block pt-8 mb-6">
          <h1 className="text-2xl font-display font-bold text-gray-900">Nearby Offers</h1>
          <p className="text-sm text-gray-500 mt-1">Exclusive deals from local merchants near you</p>
        </div>

        {/* Featured Offer Banner */}
        {activeFeaturedOffers.length > 0 && (
          <div className="px-4 md:px-0 mb-6 space-y-4">
            {activeFeaturedOffers.map((offer) => (
              <FeaturedOfferBanner key={offer.id} offer={offer} />
            ))}
          </div>
        )}

        {/* Filter Chips */}
        <div className="flex gap-2 overflow-x-auto py-4 md:py-2 md:pb-6 px-4 md:px-0 scrollbar-hide">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${activeFilter === filter
                ? 'chip-active'
                : 'chip-inactive'
                }`}
            >
              {filter}
            </button>
          ))}
          <button
            className="p-2 rounded-full chip-inactive flex-shrink-0"
            onClick={() => showToast('Advanced filters — coming soon')}
          >
            <Filter size={16} />
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="px-4 md:px-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <OfferCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Offers Grid */}
        {!isLoading && filteredOffers.length > 0 && (
          <div className="px-4 md:px-0 space-y-4 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6 md:space-y-0">
            {filteredOffers.map((offer, index) => {
              const discount = getDiscountPercent(offer.price, offer.originalPrice)

              return (
                <motion.div
                  key={offer.offerId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08, duration: 0.4 }}
                  className="group cursor-pointer"
                >
                  <div className="bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 group-hover:-translate-y-1">
                    <div className="flex md:flex-col gap-4 md:gap-0 p-4 md:p-0">
                      {/* Image */}
                      <div className="w-24 h-24 md:w-full md:h-[200px] flex-shrink-0 rounded-xl md:rounded-none overflow-hidden bg-gray-100 relative">
                        <img
                          src={offer.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400'}
                          alt={offer.productName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {/* Gradient overlay */}
                        <div className="hidden md:block absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/40 to-transparent" />
                        {/* Discount badge */}
                        {discount && (
                          <div className="absolute bottom-2 left-2 md:bottom-3 md:left-3 discount-badge text-[10px] md:text-xs">
                            {discount}% OFF
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 md:p-4">
                        <h3 className="font-semibold text-gray-900 text-sm mb-1 truncate">{offer.productName}</h3>
                        <p className="text-xs text-gray-500 mb-2">{offer.merchant?.shopName || 'Nearby Shop'}</p>

                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <MapPin size={12} />
                            {offer.merchant?.distance ? `${offer.merchant.distance.toFixed(1)} km` : `Within ${offer.radius} km`}
                          </span>
                          <span className="text-xs text-nearby-500 font-medium flex items-center gap-1">
                            <Clock size={12} />
                            {getTimeLeft(offer.validUntil)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-base font-bold text-gray-900">₹{offer.price}</span>
                            {offer.originalPrice && (
                              <span className="text-xs text-gray-400 line-through">
                                ₹{offer.originalPrice}
                              </span>
                            )}
                          </div>
                          <button
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            onClick={() => {
                              setSavedOfferIds(prev => {
                                const next = new Set(prev)
                                if (next.has(offer.offerId)) next.delete(offer.offerId)
                                else { next.add(offer.offerId); showToast('Saved to wishlist') }
                                return next
                              })
                            }}
                          >
                            <Heart
                              size={16}
                              className="transition-colors"
                              fill={savedOfferIds.has(offer.offerId) ? '#ef4444' : 'none'}
                              stroke={savedOfferIds.has(offer.offerId) ? '#ef4444' : 'currentColor'}
                              style={{ color: savedOfferIds.has(offer.offerId) ? '#ef4444' : '#9ca3af' }}
                            />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Reserve button */}
                    <div className="p-4 pt-0 md:pt-0">
                      <button
                        className="w-full bg-nearby-500 hover:bg-nearby-600 text-white font-semibold text-sm py-3 rounded-xl transition-colors"
                        onClick={() => navigate('/broadcast')}
                      >
                        Reserve Now
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredOffers.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-12 h-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No offers available right now</h3>
            <p className="text-sm text-gray-500 mb-6">Check back later for exclusive deals from nearby shops</p>
            <button
              onClick={() => navigate('/')}
              className="bg-nearby-500 hover:bg-nearby-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              Back to Home
            </button>
          </motion.div>
        )}
      </div>

      {/* Toast */}
      {filterToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl text-sm font-semibold shadow-lg bg-gray-900 text-white whitespace-nowrap">
          {filterToast}
        </div>
      )}
    </div>
  )
}


export default Offers
