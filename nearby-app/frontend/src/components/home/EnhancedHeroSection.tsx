import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, MapPin, ChevronDown, Loader2, Navigation, AlertCircle } from 'lucide-react'
import { useLocationStore } from '@/store/locationStore'
import { useAuthStore } from '@/store/authStore'
import { aiService } from '@/services/ai.service'
import { broadcastService } from '@/services/broadcast.service'
import { locationService } from '@/services/location.service'
import { analyticsService } from '@/services/analytics.service'
import { useNavigate } from 'react-router-dom'
import { VoiceSearchButton } from '@/components/search/VoiceSearchButton'
import { ImageSearchButton } from '@/components/search/ImageSearchButton'
import { featureFlags } from '@/config/featureFlags'

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

// Mock recent areas - in production, load from localStorage
const recentAreas = [
  { name: 'Koramangala', city: 'Bengaluru' },
  { name: 'Indiranagar', city: 'Bengaluru' },
  { name: 'Whitefield', city: 'Bengaluru' },
]

export const EnhancedHeroSection: React.FC = () => {
  const [current, setCurrent] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchStatus, setSearchStatus] = useState('')
  const [showLocationDropdown, setShowLocationDropdown] = useState(false)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [locationError, setLocationError] = useState('')
  
  const { city, lat, lng, area, setLocation } = useLocationStore()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const locationDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % heroSlides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!showLocationDropdown) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target as Node)) {
        setShowLocationDropdown(false)
      }
    }

    // Add a small delay to prevent immediate closing
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 0)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showLocationDropdown])

  const handleSelectRecentArea = (recentArea: { name: string; city: string }) => {
    // In production, load coordinates for this area
    setLocation(12.9352, 77.6245, recentArea.city, recentArea.name)
    setShowLocationDropdown(false)
    setLocationError('')
  }

  const handleLocationButtonClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowLocationDropdown(!showLocationDropdown)
  }

  const handleUseCurrentLocation = async () => {
    setIsGettingLocation(true)
    setLocationError('')

    try {
      const locationData = await locationService.getCurrentLocationWithAddress()
      setLocation(locationData.lat, locationData.lng, locationData.city, locationData.area)
      setShowLocationDropdown(false)
      setLocationError('')
    } catch (error: any) {
      if (error.code === 1) { // PERMISSION_DENIED
        setLocationError('Location access denied. Please select area manually')
      } else if (error.code === 2) { // POSITION_UNAVAILABLE
        setLocationError('Location information unavailable')
      } else if (error.code === 3) { // TIMEOUT
        setLocationError('Location request timed out')
      } else {
        setLocationError('Failed to get location')
      }
    } finally {
      setIsGettingLocation(false)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!searchQuery.trim()) return
    
    if (!lat || !lng) {
      setSearchStatus('Please enable location to search')
      return
    }

    // Track text search (only if not triggered by voice)
    // Voice search tracking is handled in VoiceSearchButton
    const isVoiceSearch = sessionStorage.getItem('last_voice_search') === searchQuery;
    if (!isVoiceSearch) {
      analyticsService.trackTextSearch({
        userId: user?.userId,
        query: searchQuery,
        location: { lat, lng, area, city },
      });
    }
    // Clear the voice search flag
    sessionStorage.removeItem('last_voice_search');

    setIsSearching(true)
    setSearchStatus('Analyzing your search...')

    try {
      // Step 1: AI Category Detection
      const categoryResult = await aiService.detectCategory(searchQuery)
      const detectedCategory = categoryResult.category
      
      setSearchStatus(`Detected category: ${detectedCategory}`)

      // Step 2: Save to Local Demand Database (Short Memory)
      await aiService.saveLocalDemand({
        query: searchQuery,
        detected_category: detectedCategory,
        locality: area || city || 'Unknown',
        coordinates: { lat, lng },
        timestamp: new Date(),
        user_id: user?.userId || 'anonymous'
      })

      // Step 3: Create Category-Filtered Broadcast (3km radius)
      setSearchStatus(`Searching nearby ${detectedCategory} shops...`)
      
      const broadcastResult = await broadcastService.createCategoryFiltered({
        query: searchQuery,
        detectedCategory: detectedCategory,
        userLat: lat,
        userLng: lng,
        radius: 3, // 3km radius
        locality: area || city || 'Unknown'
      })

      const matchedCount = broadcastResult.matchedShopsCount

      if (matchedCount === 0) {
        setSearchStatus(`No ${detectedCategory} shops found within 3km`)
        setTimeout(() => {
          setSearchStatus('')
          setIsSearching(false)
        }, 3000)
      } else {
        // Use AI-generated broadcast message if available
        const broadcastMessage = categoryResult.broadcast_message || 
          `Broadcasting to ${matchedCount} nearby ${detectedCategory} shops...`
        
        setSearchStatus(broadcastMessage)
        
        // Store broadcast data in localStorage for radar page
        localStorage.setItem(
          `broadcast_${broadcastResult.broadcast.broadcastId}`,
          JSON.stringify({
            broadcast: broadcastResult.broadcast,
            matchedShopsCount: matchedCount,
            aiMessage: broadcastMessage,
            categoryResult: categoryResult
          })
        )
        
        // Navigate to radar page
        setTimeout(() => {
          navigate(`/broadcast/radar/${broadcastResult.broadcast.broadcastId}`)
        }, 1500)
      }

    } catch (error) {
      console.error('Search error:', error)
      setSearchStatus('Search failed. Please try again.')
      setTimeout(() => {
        setSearchStatus('')
        setIsSearching(false)
      }, 3000)
    }
  }

  const handleVoiceTranscript = (transcript: string) => {
    // Set the search query from voice transcript
    setSearchQuery(transcript)
    
    // Mark this as a voice search to avoid double-tracking
    sessionStorage.setItem('last_voice_search', transcript);
    
    // Automatically trigger search after a short delay
    setTimeout(() => {
      if (lat && lng && transcript.trim()) {
        handleSearch({ preventDefault: () => {} } as React.FormEvent)
      }
    }, 500)
  }

  const handleImageSelected = async (imageData: string, file: File) => {
    if (!lat || !lng) {
      setSearchStatus('Please enable location to search')
      return
    }

    // Track image search
    analyticsService.trackImageSearchInitiated({
      userId: user?.userId,
      location: { lat, lng, area, city },
    })

    setIsSearching(true)
    setSearchStatus('Analyzing image with AI...')

    try {
      // Step 1: AI Image Analysis
      const analysisResult = await aiService.analyzeImage(file)
      
      // Defensive checks for AI response
      if (!analysisResult || !analysisResult.primaryProduct) {
        throw new Error('Could not identify product in image. Please try a clearer photo.')
      }
      
      const detectedProduct = analysisResult.primaryProduct.name
      const detectedCategory = analysisResult.primaryProduct.category
      const searchQuery = analysisResult.searchQuery || detectedProduct
      
      if (!detectedProduct || !detectedCategory) {
        throw new Error('Could not identify product clearly. Please try again.')
      }
      
      // Update search input with detected product
      setSearchQuery(detectedProduct)
      
      setSearchStatus(`Detected: ${detectedProduct} (${detectedCategory})`)
      
      // Wait a moment to show the detection
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Step 2: Save to Local Demand Database
      await aiService.saveLocalDemand({
        query: detectedProduct,
        detected_category: detectedCategory,
        locality: area || city || 'Unknown',
        coordinates: { lat, lng },
        timestamp: new Date(),
        user_id: user?.userId || 'anonymous'
      })

      // Step 3: Create Category-Filtered Broadcast
      setSearchStatus(`Searching nearby ${detectedCategory} shops...`)
      
      const broadcastResult = await broadcastService.createCategoryFiltered({
        query: searchQuery,
        detectedCategory: detectedCategory,
        userLat: lat,
        userLng: lng,
        radius: 3,
        locality: area || city || 'Unknown'
      })

      const matchedCount = broadcastResult.matchedShopsCount

      if (matchedCount === 0) {
        setSearchStatus(`No ${detectedCategory} shops found within 3km`)
        
        // Track failed search
        analyticsService.trackImageSearchFailed({
          userId: user?.userId,
          errorCode: 'no-shops-found',
          errorMessage: `No ${detectedCategory} shops found`,
          location: { lat, lng, area, city },
        })
        
        setTimeout(() => {
          setSearchStatus('')
          setIsSearching(false)
        }, 3000)
      } else {
        const broadcastMessage = `Broadcasting to ${matchedCount} nearby ${detectedCategory} shops...`
        setSearchStatus(broadcastMessage)
        
        // Store broadcast data
        localStorage.setItem(
          `broadcast_${broadcastResult.broadcast.broadcastId}`,
          JSON.stringify({
            broadcast: broadcastResult.broadcast,
            matchedShopsCount: matchedCount,
            aiMessage: broadcastMessage,
            imageAnalysis: analysisResult,
            searchMethod: 'image'
          })
        )
        
        // Track successful image search
        analyticsService.trackImageSearchCompleted({
          userId: user?.userId,
          fileSize: file.size,
          fileType: file.type,
          location: { lat, lng, area, city },
        })
        
        // Navigate to radar page
        setTimeout(() => {
          navigate(`/broadcast/radar/${broadcastResult.broadcast.broadcastId}`)
        }, 1500)
      }

    } catch (error) {
      console.error('Image search error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Image analysis failed'
      setSearchStatus(errorMessage)
      
      // Track error
      analyticsService.trackImageSearchFailed({
        userId: user?.userId,
        errorCode: 'analysis-error',
        errorMessage,
        location: { lat, lng, area, city },
      })
      
      setTimeout(() => {
        setSearchStatus('')
        setIsSearching(false)
      }, 3000)
    }
  }

  return (
    <section className="relative overflow-hidden">
      {/* Blue gradient background */}
      <div className="relative bg-gradient-to-br from-nearby-500 via-nearby-600 to-nearby-700">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3" />
        <div className="absolute top-1/2 right-1/4 w-40 h-40 bg-white/5 rounded-full" />

        <div className="container mx-auto px-4">
          <div className="relative z-10 pt-8 pb-16 md:pt-14 md:pb-24">
            {/* Hero Content */}
            <div className="max-w-3xl mx-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={current}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="text-center mb-8"
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
                  <p className="text-white/80 text-sm md:text-lg max-w-2xl mx-auto">
                    {heroSlides[current].subtitle}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Swiggy-Style Location + Search Bar */}
              <form onSubmit={handleSearch} className="max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl shadow-hero overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    {/* LEFT PART: Location Selector */}
                    <div className="relative md:w-1/3 border-b md:border-b-0 md:border-r border-gray-200 overflow-visible" ref={locationDropdownRef}>
                      <button
                        type="button"
                        onClick={handleLocationButtonClick}
                        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
                      >
                        <MapPin size={20} className="text-nearby-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-gray-500 mb-0.5">Location</div>
                          <div className="text-sm font-semibold text-gray-900 truncate">
                            {area || city || 'Select location'}
                          </div>
                        </div>
                        <ChevronDown 
                          size={16} 
                          className={`text-gray-400 transition-transform ${showLocationDropdown ? 'rotate-180' : ''}`}
                        />
                      </button>

                      {/* Location Dropdown */}
                      {showLocationDropdown && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-[100]"
                        >
                          {/* Use Current Location */}
                          <button
                            type="button"
                            onClick={handleUseCurrentLocation}
                            disabled={isGettingLocation}
                            className="w-full flex items-center gap-3 px-5 py-4 hover:bg-blue-50 transition-colors border-b border-gray-100 disabled:opacity-50"
                          >
                            {isGettingLocation ? (
                              <Loader2 size={20} className="text-nearby-500 animate-spin" />
                            ) : (
                              <Navigation size={20} className="text-nearby-500" />
                            )}
                            <div className="flex-1 text-left">
                              <div className="text-sm font-semibold text-nearby-600">
                                {isGettingLocation ? 'Getting location...' : 'Use my current location'}
                              </div>
                              <div className="text-xs text-gray-500">
                                Enable GPS for accurate results
                              </div>
                            </div>
                          </button>

                          {/* Location Error */}
                          {locationError && (
                            <div className="px-5 py-3 bg-red-50 border-b border-red-100">
                              <div className="flex items-start gap-2">
                                <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-red-600">{locationError}</p>
                              </div>
                            </div>
                          )}

                          {/* Recent Areas */}
                          {recentAreas.length > 0 && (
                            <div>
                              <div className="px-5 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                Recent Areas
                              </div>
                              {recentAreas.map((recentArea, index) => (
                                <button
                                  key={index}
                                  type="button"
                                  onClick={() => handleSelectRecentArea(recentArea)}
                                  className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors text-left"
                                >
                                  <MapPin size={16} className="text-gray-400" />
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">{recentArea.name}</div>
                                    <div className="text-xs text-gray-500">{recentArea.city}</div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </div>

                    {/* RIGHT PART: Search Input */}
                    <div className="flex-1 flex items-center gap-3 px-5 py-4">
                      <Search size={20} className="text-gray-400 flex-shrink-0" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search for products, shops, categories..."
                        className="flex-1 text-gray-700 text-sm md:text-base outline-none placeholder-gray-400"
                        disabled={isSearching}
                      />
                      
                      {/* Voice Search Button */}
                      {featureFlags.voiceSearch && (
                        <VoiceSearchButton
                          onTranscript={handleVoiceTranscript}
                          disabled={isSearching || !lat || !lng}
                          className="flex-shrink-0"
                        />
                      )}
                      
                      {/* Image Search Button */}
                      {featureFlags.imageSearch && (
                        <ImageSearchButton
                          onImageSelected={handleImageSelected}
                          disabled={isSearching || !lat || !lng}
                          className="flex-shrink-0"
                        />
                      )}
                      
                      <button
                        type="submit"
                        disabled={isSearching || !searchQuery.trim() || !lat || !lng}
                        className="bg-nearby-500 hover:bg-nearby-600 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 flex-shrink-0"
                      >
                        {isSearching ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            <span className="hidden sm:inline">Searching</span>
                          </>
                        ) : (
                          <>
                            <Search size={16} />
                            <span className="hidden sm:inline">Search</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Location Required Message */}
                  {(!lat || !lng) ? (
                    <div className="px-5 py-3 bg-amber-50 border-t border-amber-100">
                      <div className="flex items-center gap-2 text-xs text-amber-700">
                        <AlertCircle size={14} />
                        <span>Please select your location to search</span>
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* Search Status */}
                {searchStatus && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 text-white/90 text-sm flex items-center justify-center gap-2"
                  >
                    {isSearching && <Loader2 size={16} className="animate-spin" />}
                    <span>{searchStatus}</span>
                  </motion.div>
                )}
              </form>
            </div>

            {/* Slide indicators */}
            <div className="flex items-center justify-center gap-2 mt-8">
              {heroSlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrent(index)}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    index === current
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
