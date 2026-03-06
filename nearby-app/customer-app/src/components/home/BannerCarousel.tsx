import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, MapPin, ChevronDown, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useLocationStore } from '@/store/locationStore'

const heroSlides = [
  {
    id: 1,
    headline: 'Discover What\'s',
    highlightWord: 'Near You',
    subtitle: 'Browse categories, find products & connect with local merchants instantly',
  },
  {
    id: 2,
    headline: 'Best Deals From',
    highlightWord: 'Local Shops',
    subtitle: 'Exclusive offers from merchants right around the corner',
  },
  {
    id: 3,
    headline: 'Broadcast &',
    highlightWord: 'Get Found',
    subtitle: 'Let nearby merchants know what you\'re looking for in real-time',
  },
]

export const BannerCarousel: React.FC = () => {
  const [current, setCurrent] = useState(0)
  const navigate = useNavigate()
  const { city } = useLocationStore()

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % heroSlides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <section className="relative overflow-hidden">
      {/* Blue gradient background */}
      <div className="relative bg-gradient-to-br from-nearby-500 via-nearby-600 to-nearby-700">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3" />
        <div className="absolute top-1/2 right-1/4 w-40 h-40 bg-white/5 rounded-full" />

        <div className="premium-container">
          <div className="relative z-10 pt-8 pb-16 md:pt-14 md:pb-24">
            {/* Mobile location bar */}
            <div className="md:hidden flex items-center justify-between mb-6">
              <button className="flex items-center gap-2 text-white/90 hover:text-white transition-colors">
                <MapPin size={18} />
                <span className="text-sm font-semibold">{city || 'Bengaluru'}</span>
                <ChevronDown size={14} />
              </button>
              <div className="flex items-center gap-2">
                <button className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors">
                  <Sparkles size={18} className="text-white" />
                </button>
              </div>
            </div>

            {/* Hero Content */}
            <div className="max-w-2xl">
              <AnimatePresence mode="wait">
                <motion.div
                  key={current}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                >
                  <h1 className="font-display font-bold text-white leading-tight mb-4">
                    <span className="text-3xl md:text-5xl lg:text-6xl">
                      {heroSlides[current].headline}
                    </span>
                    <br />
                    <span className="text-4xl md:text-6xl lg:text-7xl text-blue-200">
                      {heroSlides[current].highlightWord}
                    </span>
                  </h1>
                  <p className="text-white/80 text-sm md:text-lg max-w-lg mb-8">
                    {heroSlides[current].subtitle}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Search bar inside hero */}
              <div
                onClick={() => navigate('/search')}
                className="flex items-center gap-3 bg-white rounded-2xl px-5 py-4 cursor-pointer shadow-hero hover:shadow-xl transition-shadow max-w-xl"
              >
                <Search size={20} className="text-gray-400 flex-shrink-0" />
                <span className="text-gray-400 text-sm md:text-base flex-1">
                  Search for products, shops...
                </span>
                <div className="hidden sm:flex items-center gap-2">
                  <span className="text-xs text-gray-300">|</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate('/search')
                    }}
                    className="bg-nearby-500 hover:bg-nearby-600 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors"
                  >
                    Search
                  </button>
                </div>
              </div>
            </div>

            {/* Slide indicators */}
            <div className="flex items-center gap-2 mt-8">
              {heroSlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrent(index)}
                  className={`h-1.5 rounded-full transition-all duration-500 ${index === current
                    ? 'w-8 bg-white'
                    : 'w-2 bg-white/40 hover:bg-white/60'
                    }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
