import React from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, MapPin } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { shopsService } from '@/services/shops.service'
import { useLocation } from '@/hooks/useLocation'

const CategoryShops: React.FC = () => {
  const navigate = useNavigate()
  const { categoryId } = useParams<{ categoryId: string }>()
  const { lat, lng } = useLocation()

  // Capitalize category name for display
  const categoryName = categoryId 
    ? categoryId.charAt(0).toUpperCase() + categoryId.slice(1)
    : 'Category'

  // Fetch nearby shops filtered by category
  const { data: shops, isLoading } = useQuery({
    queryKey: ['shops', 'category', categoryId, lat, lng],
    queryFn: async () => {
      console.log('🔍 CategoryShops - Fetching shops for category:', categoryId)
      console.log('📍 Location:', { lat, lng })
      
      if (!lat || !lng) {
        console.log('❌ No location available')
        return []
      }
      
      if (!categoryId) {
        console.log('❌ No category ID provided')
        return []
      }
      
      // Fetch all nearby shops
      const allShops = await shopsService.getNearby(lat, lng, 5)
      
      console.log('📦 Total shops fetched from API:', allShops?.length || 0)
      console.log('📦 All shops:', allShops)
      
      // Filter by category on frontend (case-insensitive)
      const filtered = allShops.filter((shop) => {
        const shopCategory = (shop.category || '').toLowerCase()
        const targetCategory = categoryId.toLowerCase()
        const matches = shopCategory === targetCategory
        
        console.log(`  Shop: ${shop.name}, Category: "${shop.category}", Target: "${categoryId}", Matches: ${matches}`)
        
        return matches
      })
      
      console.log('✅ Filtered shops count:', filtered.length)
      console.log('✅ Filtered shops:', filtered)
      
      return filtered
    },
    enabled: !!lat && !!lng && !!categoryId
  })

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
            <h1 className="text-lg font-display font-bold text-gray-900">{categoryName}</h1>
            <p className="text-xs text-gray-500">
              {shops?.length || 0} shops nearby
            </p>
          </div>
        </div>
      </div>

      <div className="premium-container py-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-card animate-pulse">
                <div className="h-32 bg-gray-200 rounded-xl mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : shops && shops.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {shops.map((shop: any) => (
              <motion.div
                key={shop.shopId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 cursor-pointer"
                onClick={() => navigate(`/shop/${shop.shopId}`)}
              >
                {/* Shop Image */}
                <div className="relative h-40 bg-gradient-to-br from-nearby-100 to-nearby-50">
                  {shop.coverImage ? (
                    <img
                      src={shop.coverImage}
                      alt={shop.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-4xl font-bold text-nearby-300">
                        {shop.name?.charAt(0)}
                      </span>
                    </div>
                  )}
                  
                  {/* Open/Closed Badge */}
                  <div className="absolute top-3 right-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      shop.isOpen 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-500 text-white'
                    }`}>
                      {shop.isOpen ? 'Open' : 'Closed'}
                    </span>
                  </div>
                </div>

                {/* Shop Info */}
                <div className="p-4">
                  <h3 className="font-display font-bold text-gray-900 text-lg mb-1">
                    {shop.name}
                  </h3>
                  
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {shop.description || 'No description available'}
                  </p>

                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <MapPin size={14} />
                    <span>
                      {shop.distanceKm 
                        ? `${shop.distanceKm.toFixed(1)} km away` 
                        : shop.location?.area || 'Nearby'}
                    </span>
                  </div>

                  {shop.rating && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-500">★</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {shop.rating}
                        </span>
                      </div>
                      {shop.totalReviews && (
                        <span className="text-xs text-gray-500">
                          ({shop.totalReviews} reviews)
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <MapPin size={40} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No shops found
            </h3>
            <p className="text-sm text-gray-500">
              No {categoryName.toLowerCase()} shops found nearby. Try expanding your search radius.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default CategoryShops
