import React from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { CategoryGrid } from '@/components/home/CategoryGrid'

const Categories: React.FC = () => {
  const navigate = useNavigate()

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
          <h1 className="text-lg font-display font-bold text-gray-900">All Categories</h1>
        </div>
      </div>

      <div className="premium-container">
        {/* Desktop title */}
        <div className="hidden md:block pt-8 mb-6">
          <h1 className="text-2xl font-display font-bold text-gray-900">All Categories</h1>
          <p className="text-sm text-gray-500 mt-1">Browse products and services near you</p>
        </div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="py-6 md:py-4"
        >
          <CategoryGrid />
        </motion.div>
      </div>
    </div>
  )
}

export default Categories
