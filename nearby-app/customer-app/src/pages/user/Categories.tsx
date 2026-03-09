import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, MapPin, AlertCircle } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Shop, shopsService } from '@/services/shops.service'
import { useLocationStore } from '@/store/locationStore'
import { ShopCard } from '@/components/shops/ShopCard'
import { ShopCardSkeleton } from '@/components/shops/ShopCardSkeleton'
import { useCategories } from '@/hooks/useCategories'

const Categories: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { lat, lng } = useLocationStore()
  const { categories } = useCategories()
  
  const [shops, setShops] = useState<Shop[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Get filter from URL params on mount
  useEffect(() => {
    const filterParam = searchParams.get('filter')
    if (filterParam) {
      setSelectedCategory(filterParam.toLowerCase())
    }
  }, [searchParams])

  useEffect(() => {
    if (lat && lng) {
      fetchAllShops()
    }
  }, [lat, lng])

  const fetchAllShops = async () => {
    if (!lat || !lng) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await shopsService.getNearbyShops(lat, lng, 5)
      setShops(response.shops)
    } catch (err) {
      console.error('Error fetching shops:', err)
      setError('Could not load shops. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Filter shops based on selected category
  const filteredShops = selectedCategory === 'all' 
    ? shops 
    : shops.filter(shop => shop.category.toLowerCase() === selectedCategory)

  // Get unique categories from shops
  const availableCategories = ['all', ...Array.from(new Set(shops.map(s => s.category.toLowerCase())))]

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
            <h1 className="text-lg font-display font-bold text-gray-900">Categories</h1>
            <p className="text-xs text-gray-500">
              {filteredShops.length} shops found
            </p>
          </div>
        </div>
      </div>

      <div className="premium-container py-6">
        {/* Category Filter Chips */}
        <div className="mb-6 -mx-4 px-4 md:mx-0 md:px-0">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
            {availableCategories.map((category) => {
              const isSelected = selectedCategory === category
              const displayName = category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)
              
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap snap-start transition-all ${
                    isSelected
                      ? 'bg-nearby-500 text-white shadow-md'
                      : 'bg-white text-gray-700 border border-gray-200 hover:border-nearby-300'
                  }`}
                >
                  {displayName}
                </button>
              )
            })}
          </div>
        </div>

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
              onClick={fetchAllShops}
              className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredShops.length === 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
            <MapPin size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No shops found
            </h3>
            <p className="text-gray-600">
              {selectedCategory === 'all' 
                ? 'Try enabling location or check back later'
                : `No ${selectedCategory} shops found nearby`
              }
            </p>
          </div>
        )}

        {/* Shops Grid */}
        {!isLoading && !error && filteredShops.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filteredShops.map((shop) => (
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

export default Categories
