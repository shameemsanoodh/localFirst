import React, { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search as SearchIcon, X, TrendingUp, Sparkles, ArrowLeft,
  Radio, MapPin, Copy, Check, Store,
  Loader2, ChevronRight
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useLocationStore } from '@/store/locationStore'
import { useAuthStore } from '@/store/authStore'
import { aiService } from '@/services/ai.service'
import { broadcastService } from '@/services/broadcast.service'
import { analyticsService } from '@/services/analytics.service'
import { VoiceSearchButton } from '@/components/search/VoiceSearchButton'
import { ImageSearchButton } from '@/components/search/ImageSearchButton'
import api from '@/services/api'

// ─── Types ────────────────────────────────────────────────────────────────────
interface NearbyMerchant {
  merchantId: string
  shopName: string
  ownerName: string
  category: string
  distance: number
  timing?: { open: number; close: number }
  brands?: string[]
}

type SearchState = 'idle' | 'broadcasting' | 'found' | 'not_found'

// ─── Merchant Onboarding Invite Link ─────────────────────────────────────────
const MERCHANT_INVITE_BASE = `http://localhost:5174/signup`

function buildInviteLink(query: string) {
  return `${MERCHANT_INVITE_BASE}?ref=user_invite&product=${encodeURIComponent(query)}`
}

// ─── No Shop Found Modal ──────────────────────────────────────────────────────
function NoShopModal({ query, onClose }: { query: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false)
  const link = buildInviteLink(query)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handleWhatsApp = () => {
    const msg = `Hey! I was looking for "${query}" on NearBy app but there are no shops near me for this. You should list your shop here — it's free and you get order notifications! Sign up here: ${link}`
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-0 bg-black/50 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ y: '100%', scale: 0.96 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        className="bg-white rounded-t-3xl sm:rounded-3xl p-7 w-full max-w-md shadow-2xl"
      >
        {/* Illustration */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🏪</span>
          </div>
          <h2 className="text-xl font-display font-bold text-gray-900 mb-1">
            No shops found nearby
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            We couldn't find any <span className="font-semibold text-gray-700">"{query}"</span> sellers within 3 km of your location.
          </p>
        </div>

        {/* Info card */}
        <div className="bg-nearby-50 border border-nearby-200 rounded-2xl p-4 mb-5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-nearby-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Store size={16} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-nearby-700">Know a shop that sells this?</p>
              <p className="text-xs text-nearby-600 mt-0.5 leading-relaxed">
                Share the NearBy merchant signup link with your local shop owner. Once they register, you'll get notified instantly!
              </p>
            </div>
          </div>
        </div>

        {/* Link box */}
        <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-2 mb-4">
          <span className="text-xs text-gray-600 flex-1 truncate font-mono">{link}</span>
          <button
            onClick={handleCopy}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${copied ? 'bg-green-100 text-green-700' : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300'}`}
          >
            {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
          </button>
        </div>

        {/* WhatsApp share */}
        <button
          onClick={handleWhatsApp}
          className="w-full py-3.5 bg-[#25D366] text-white font-bold rounded-2xl flex items-center justify-center gap-2.5 hover:bg-[#22c45e] transition-colors shadow-lg mb-3"
        >
          <span className="text-lg">📲</span>
          Share on WhatsApp
        </button>

        <button
          onClick={onClose}
          className="w-full py-3 text-gray-500 text-sm hover:text-gray-700 transition-colors"
        >
          Maybe later
        </button>
      </motion.div>
    </motion.div>
  )
}

// ─── Radar Broadcast UI ───────────────────────────────────────────────────────
function BroadcastingState({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="relative mb-8">
        {[1, 2, 3].map(i => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-full border-2 border-nearby-400 opacity-60"
            style={{ margin: -(i * 24) }}
            animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.55, ease: 'easeOut' }}
          />
        ))}
        <div className="w-20 h-20 bg-nearby-500 rounded-full flex items-center justify-center shadow-xl relative z-10">
          <Radio size={34} className="text-white" />
        </div>
      </div>
      <h3 className="font-display font-bold text-xl text-gray-800 mb-2">Broadcasting...</h3>
      <p className="text-gray-500 text-sm max-w-xs leading-relaxed">
        Looking for <span className="font-semibold text-gray-700">"{query}"</span> sellers within <span className="font-semibold">3 km</span> of your location
      </p>
    </div>
  )
}

// ─── Found Merchants ──────────────────────────────────────────────────────────
function FoundMerchants({ merchants, query }: { merchants: NearbyMerchant[]; query: string }) {
  return (
    <div className="py-6 px-4">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
        <h3 className="font-bold text-gray-900">
          {merchants.length} shop{merchants.length !== 1 ? 's' : ''} found for "{query}"
        </h3>
      </div>
      <div className="space-y-3">
        {merchants.map((m, i) => (
          <motion.div
            key={m.merchantId}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-nearby-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Store size={22} className="text-nearby-600" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">{m.shopName}</h4>
                  <p className="text-xs text-gray-500">{m.category}</p>
                  {m.brands && m.brands.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {m.brands.slice(0, 3).map(b => (
                        <span key={b} className="px-2 py-0.5 bg-nearby-50 text-nearby-600 rounded-full text-[10px] font-medium">{b}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <MapPin size={11} />
                  {m.distance < 1 ? `${(m.distance * 1000).toFixed(0)}m` : `${m.distance.toFixed(1)} km`}
                </div>
                <div className="flex items-center justify-end gap-1 text-xs text-green-600 mt-1">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  Open now
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// ─── Recent Searches ──────────────────────────────────────────────────────────
const RECENT_STORAGE_KEY = 'nearby_recent_searches'
function getRecent(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_STORAGE_KEY) || '[]') } catch { return [] }
}
function addRecent(q: string) {
  const prev = getRecent().filter(s => s.toLowerCase() !== q.toLowerCase())
  localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify([q, ...prev].slice(0, 8)))
}

// ─── Main Search Component ────────────────────────────────────────────────────
const Search: React.FC = () => {
  const navigate = useNavigate()
  const { lat, lng, area, city } = useLocationStore()
  const { user } = useAuthStore()
  const [query, setQuery] = useState('')
  const [searchState, setSearchState] = useState<SearchState>('idle')
  const [foundMerchants, setFoundMerchants] = useState<NearbyMerchant[]>([])
  const [showNoShopModal, setShowNoShopModal] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>(getRecent)
  const [searchStatus, setSearchStatus] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSearch = useCallback(async () => {
    const q = query.trim()
    if (!q || !lat || !lng) return

    // Track text search
    analyticsService.trackTextSearch({
      userId: user?.userId,
      query: q,
      location: { lat, lng, area, city },
    })

    addRecent(q)
    setRecentSearches(getRecent())
    setSearchState('broadcasting')
    setFoundMerchants([])
    setSearchStatus('Analyzing your search...')

    try {
      // Step 1: AI Category Detection
      const categoryResult = await aiService.detectCategory(q)
      const detectedCategory = categoryResult.category
      
      setSearchStatus(`Detected category: ${detectedCategory}`)

      // Step 2: Save to Local Demand Database
      await aiService.saveLocalDemand({
        query: q,
        detected_category: detectedCategory,
        locality: area || city || 'Unknown',
        coordinates: { lat, lng },
        timestamp: new Date(),
        user_id: user?.userId || 'anonymous'
      })

      // Step 3: Create Category-Filtered Broadcast
      setSearchStatus(`Searching nearby ${detectedCategory} shops...`)
      
      const broadcastResult = await broadcastService.createCategoryFiltered({
        query: q,
        detectedCategory: detectedCategory,
        userLat: lat,
        userLng: lng,
        radius: 3,
        locality: area || city || 'Unknown'
      })

      const matchedCount = broadcastResult.matchedShopsCount

      if (matchedCount === 0) {
        setSearchStatus(`No ${detectedCategory} shops found within 3km`)
        await new Promise(r => setTimeout(r, 2000))
        setSearchState('not_found')
        setShowNoShopModal(true)
      } else {
        const broadcastMessage = categoryResult.broadcast_message || 
          `Broadcasting to ${matchedCount} nearby ${detectedCategory} shops...`
        
        setSearchStatus(broadcastMessage)
        
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
        setSearchState('idle')
      }, 3000)
    }
  }, [query, lat, lng, area, city, user, navigate])

  const handleVoiceTranscript = (transcript: string) => {
    setQuery(transcript)
    sessionStorage.setItem('last_voice_search', transcript)
    setTimeout(() => {
      if (lat && lng && transcript.trim()) {
        handleSearch()
      }
    }, 500)
  }

  const handleImageSelected = async (imageData: string, file: File) => {
    if (!lat || !lng) {
      setSearchStatus('Please enable location to search')
      return
    }

    analyticsService.trackImageSearchInitiated({
      userId: user?.userId,
      location: { lat, lng, area, city },
    })

    setSearchState('broadcasting')
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
      
      // Update search input
      setQuery(detectedProduct)
      addRecent(detectedProduct)
      setRecentSearches(getRecent())
      
      setSearchStatus(`Detected: ${detectedProduct} (${detectedCategory})`)
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Step 2: Save to Local Demand
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
        
        analyticsService.trackImageSearchFailed({
          userId: user?.userId,
          errorCode: 'no-shops-found',
          errorMessage: `No ${detectedCategory} shops found`,
          location: { lat, lng, area, city },
        })
        
        setTimeout(() => {
          setSearchState('not_found')
          setShowNoShopModal(true)
        }, 2000)
      } else {
        const broadcastMessage = `Broadcasting to ${matchedCount} nearby ${detectedCategory} shops...`
        setSearchStatus(broadcastMessage)
        
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
      
      analyticsService.trackImageSearchFailed({
        userId: user?.userId,
        errorCode: 'analysis-error',
        errorMessage,
        location: { lat, lng, area, city },
      })
      
      setTimeout(() => {
        setSearchStatus('')
        setSearchState('idle')
      }, 3000)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  const resetSearch = () => {
    setSearchState('idle')
    setFoundMerchants([])
    setQuery('')
    setSearchStatus('')
    inputRef.current?.focus()
  }

  return (
    <div className="min-h-screen pb-20 bg-gray-50">
      {/* Search Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm px-4 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-700" />
          </button>
          <div className="relative flex-1">
            <SearchIcon size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); setSearchState('idle'); setSearchStatus('') }}
              onKeyDown={handleKeyDown}
              placeholder="Search for products, shops, categories..."
              className="w-full pl-12 pr-24 py-3 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-nearby-500 transition-all text-sm"
              autoFocus
              disabled={searchState === 'broadcasting'}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {/* Voice Search Button */}
              <VoiceSearchButton
                onTranscript={handleVoiceTranscript}
                disabled={searchState === 'broadcasting' || !lat || !lng}
                className="flex-shrink-0"
              />
              
              {/* Image Search Button */}
              <ImageSearchButton
                onImageSelected={handleImageSelected}
                disabled={searchState === 'broadcasting' || !lat || !lng}
                className="flex-shrink-0"
              />
              
              {query && (
                <button
                  onClick={resetSearch}
                  className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X size={18} className="text-gray-500" />
                </button>
              )}
            </div>
          </div>
          <button
            onClick={handleSearch}
            disabled={!query.trim() || searchState === 'broadcasting' || !lat || !lng}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-nearby-500 text-white rounded-xl font-semibold text-sm disabled:opacity-50 hover:bg-nearby-600 transition-colors shadow-sm"
          >
            {searchState === 'broadcasting' ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Radio size={16} />
            )}
            <span className="hidden sm:inline">
              {searchState === 'broadcasting' ? 'Searching...' : 'Search'}
            </span>
          </button>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2 mt-3">
          <Sparkles size={14} className="text-purple-500" />
          <span className="text-xs text-purple-600 font-medium">
            {searchStatus || (!lat || !lng ? 'Please enable location to search' : 'AI-powered search with voice & image support')}
          </span>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {/* Broadcasting state */}
        {searchState === 'broadcasting' && (
          <motion.div key="broadcasting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <BroadcastingState query={query} />
          </motion.div>
        )}

        {/* Found merchants */}
        {searchState === 'found' && (
          <motion.div key="found" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <FoundMerchants merchants={foundMerchants} query={query} />
          </motion.div>
        )}

        {/* Idle state */}
        {searchState === 'idle' && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 py-6 space-y-6">
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp size={16} className="text-gray-500" />
                  <h3 className="text-sm font-semibold text-gray-700">Recent Searches</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((search, i) => (
                    <button
                      key={i}
                      onClick={() => { setQuery(search); setTimeout(handleSearch, 50) }}
                      className="px-4 py-2 bg-white rounded-full text-sm text-gray-700 hover:bg-gray-100 transition-colors shadow-sm border border-gray-100"
                    >
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* How it works */}
            <div className="bg-nearby-50 border border-nearby-100 rounded-2xl p-5">
              <h4 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
                <Radio size={15} className="text-nearby-500" /> How Broadcast Search works
              </h4>
              <div className="space-y-2.5">
                {[
                  ['📍', 'We detect your current location'],
                  ['📡', 'We broadcast your search to all shops within 3 km'],
                  ['🏪', 'Matching shops respond with their offers'],
                  ['🛍️', 'You pick the best deal and order!'],
                ].map(([icon, text], i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-lg">{icon}</span>
                    <span className="text-sm text-gray-600">{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Trending searches */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">🔥 Trending Now</h3>
              <div className="grid grid-cols-2 gap-2">
                {['Pixel 6a case', 'Samsung charger', 'Tomatoes 1kg', 'Paracetamol', 'Drill machine', 'Laptop bag'].map(s => (
                  <button
                    key={s}
                    onClick={() => { setQuery(s); setTimeout(handleSearch, 100) }}
                    className="text-left px-4 py-3 bg-white rounded-xl border border-gray-100 text-sm text-gray-700 font-medium hover:border-nearby-200 hover:bg-nearby-50 transition-all flex items-center justify-between group"
                  >
                    <span>{s}</span>
                    <ChevronRight size={14} className="text-gray-300 group-hover:text-nearby-500 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* No Shop Modal */}
      <AnimatePresence>
        {showNoShopModal && (
          <NoShopModal query={query} onClose={() => { setShowNoShopModal(false); setSearchState('idle') }} />
        )}
      </AnimatePresence>
    </div>
  )
}

export default Search
