import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Store, Check, Clock, Phone, Navigation, X, Calendar } from 'lucide-react'
import { broadcastService } from '@/services/broadcast.service'
import type { BroadcastResponse } from '@/types/broadcast.types'

interface MerchantResponse {
  responseId: string
  merchantId: string
  shopName: string
  responseType: 'YES' | 'ALTERNATIVE' | 'NO'
  distance: number
  price?: number
  scheduledTime?: string
  notes?: string
  timestamp: string
  shopLocation?: {
    lat: number
    lng: number
  }
}

const BroadcastRadar: React.FC = () => {
  const { broadcastId } = useParams<{ broadcastId: string }>()
  const navigate = useNavigate()

  const [broadcast, setBroadcast] = useState<any>(null)
  const [responses, setResponses] = useState<MerchantResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [polling, setPolling] = useState(true)

  // Fetch broadcast details and poll for responses
  useEffect(() => {
    if (!broadcastId) return

    const fetchBroadcastData = async () => {
      try {
        const data = await broadcastService.getById(broadcastId)
        
        console.log('=== BROADCAST DATA RECEIVED ===');
        console.log('Full data:', data);
        console.log('Broadcast:', data?.broadcast);
        console.log('Responses:', data?.responses);
        
        // Guard against undefined data
        if (!data) {
          console.error('No data returned from broadcast service')
          setLoading(false)
          return
        }
        
        setBroadcast(data.broadcast || null)
        
        // Safely handle responses array - ensure it's always an array
        const responsesArray = data.responses ?? []
        
        console.log('Responses array length:', responsesArray.length);
        console.log('Responses array:', responsesArray);
        
        // Transform responses to match our interface
        const transformedResponses = responsesArray.map((r: BroadcastResponse) => {
          console.log('Processing response:', r);
          console.log('Response type:', r.response);
          console.log('Merchant:', r.merchant);
          
          const responseType = r.response === 'accept' ? 'YES' : r.response === 'schedule' ? 'ALTERNATIVE' : 'NO';
          
          const transformed = {
            responseId: r.responseId,
            merchantId: r.merchantId,
            shopName: r.merchant?.shopName || 'Unknown Shop',
            responseType: responseType as 'YES' | 'ALTERNATIVE' | 'NO',
            distance: r.merchant?.distance || 0,
            scheduledTime: r.scheduledTime,
            notes: r.message,
            timestamp: r.timestamp
          };
          
          console.log('Transformed response:', transformed);
          return transformed;
        })
        
        console.log('Final transformed responses:', transformedResponses);
        setResponses(transformedResponses as MerchantResponse[])
        setLoading(false)
      } catch (error) {
        console.error('Failed to fetch broadcast:', error)
        setLoading(false)
      }
    }

    // Initial fetch
    fetchBroadcastData()

    // Poll every 10 seconds
    const pollInterval = setInterval(() => {
      if (polling) {
        fetchBroadcastData()
      }
    }, 10000)

    // Stop polling after 5 minutes
    const stopPollingTimeout = setTimeout(() => {
      setPolling(false)
    }, 300000)

    return () => {
      clearInterval(pollInterval)
      clearTimeout(stopPollingTimeout)
    }
  }, [broadcastId, polling])

  const yesResponses = responses.filter(r => r.responseType === 'YES')
  const alternativeResponses = responses.filter(r => r.responseType === 'ALTERNATIVE')
  const noResponses = responses.filter(r => r.responseType === 'NO')
  
  // Get matched merchants from broadcast
  const matchedMerchants = broadcast?.matched_merchants || []

  const handleReserve = (response: MerchantResponse) => {
    alert(`Reservation request sent to ${response.shopName}! They will confirm shortly.`)
  }

  const handleGetDirections = (response: MerchantResponse) => {
    // Get shop location from matched merchants
    const shop = matchedMerchants.find((m: any) => m.shopName === response.shopName)
    
    if (shop && broadcast) {
      // Open Google Maps with directions from user location to shop
      const origin = `${broadcast.userLat},${broadcast.userLng}`
      const destination = `${shop.location?.lat || 0},${shop.location?.lng || 0}`
      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`
      
      window.open(googleMapsUrl, '_blank')
    } else {
      // Fallback: just open shop location
      const destination = response.shopName.replace(/\s+/g, '+')
      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${destination}`
      window.open(googleMapsUrl, '_blank')
    }
  }

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
    <div className="min-h-screen bg-gray-50 pb-24">
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
                {broadcast?.productName || 'Broadcast'}
              </h1>
              <p className="text-sm text-gray-500">
                {responses.length} response{responses.length !== 1 ? 's' : ''} received
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Radar Animation Section */}
      <div className="bg-gradient-to-br from-nearby-500 via-nearby-600 to-nearby-700 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto text-center text-white">
            <h2 className="text-2xl font-bold mb-2">
              {yesResponses.length > 0
                ? `${yesResponses.length} shop${yesResponses.length > 1 ? 's' : ''} have it!`
                : polling
                ? 'Waiting for responses...'
                : 'No responses yet'}
            </h2>
            <p className="text-white/80 mb-6">
              {polling ? 'Checking for new responses every 10 seconds' : 'Polling stopped'}
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-white">{yesResponses.length}</div>
                <div className="text-xs text-white/80">In Stock</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-white">{alternativeResponses.length}</div>
                <div className="text-xs text-white/80">Alternative</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-white">{noResponses.length}</div>
                <div className="text-xs text-white/80">Not Available</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Matched Shops Section */}
      {matchedMerchants.length > 0 && (
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="container mx-auto px-4 py-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Broadcast sent to {matchedMerchants.length} nearby shop{matchedMerchants.length > 1 ? 's' : ''}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {matchedMerchants.map((shop: any) => (
                <div key={shop.merchantId} className="bg-white rounded-xl shadow-sm p-3 border border-gray-200">
                  <p className="font-medium text-gray-900">{shop.shopName}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                    <span>{shop.distance} km away</span>
                    {shop.category && (
                      <>
                        <span>•</span>
                        <span>{shop.category}</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Response Cards */}
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* YES Responses (Green) */}
        {yesResponses.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Available Now ({yesResponses.length})
            </h3>
            <div className="space-y-3">
              <AnimatePresence>
                {yesResponses.map((response) => (
                  <motion.div
                    key={response.responseId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-green-50 border-2 border-green-200 rounded-2xl p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">{response.shopName}</h4>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span>{response.distance.toFixed(1)} km away</span>
                          {response.price && (
                            <>
                              <span className="text-gray-400">•</span>
                              <span className="font-semibold text-green-600">₹{response.price}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-green-600 bg-green-100 px-3 py-1 rounded-lg">
                        <Check size={16} />
                        <span className="text-sm font-medium">In Stock</span>
                      </div>
                    </div>
                    {response.notes && (
                      <p className="text-sm text-gray-600 mb-3">{response.notes}</p>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleGetDirections(response)}
                        className="flex-1 bg-white border-2 border-green-600 text-green-600 hover:bg-green-50 font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                      >
                        <Navigation size={18} />
                        Directions
                      </button>
                      <button
                        onClick={() => handleReserve(response)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-xl transition-colors"
                      >
                        Reserve Now
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* ALTERNATIVE Responses (Amber) */}
        {alternativeResponses.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Available Later ({alternativeResponses.length})
            </h3>
            <div className="space-y-3">
              <AnimatePresence>
                {alternativeResponses.map((response) => (
                  <motion.div
                    key={response.responseId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">{response.shopName}</h4>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span>{response.distance.toFixed(1)} km away</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-amber-600 bg-amber-100 px-3 py-1 rounded-lg">
                        <Calendar size={16} />
                        <span className="text-sm font-medium">Schedule</span>
                      </div>
                    </div>
                    {response.scheduledTime && (
                      <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-100 px-3 py-2 rounded-lg mb-3">
                        <Clock size={16} />
                        <span>Available: {new Date(response.scheduledTime).toLocaleString()}</span>
                      </div>
                    )}
                    {response.notes && (
                      <p className="text-sm text-gray-600 mb-3">{response.notes}</p>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleGetDirections(response)}
                        className="flex-1 bg-white border-2 border-amber-600 text-amber-600 hover:bg-amber-50 font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                      >
                        <Navigation size={18} />
                        Directions
                      </button>
                      <button
                        onClick={() => handleReserve(response)}
                        className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2.5 rounded-xl transition-colors"
                      >
                        Schedule Order
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* NO Responses (Grey) */}
        {noResponses.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Not Available ({noResponses.length})
            </h3>
            <div className="space-y-3">
              <AnimatePresence>
                {noResponses.map((response) => (
                  <motion.div
                    key={response.responseId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">{response.shopName}</h4>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span>{response.distance.toFixed(1)} km away</span>
                        </div>
                        {response.notes && (
                          <p className="text-sm text-gray-600 mt-2">{response.notes}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-gray-500 bg-gray-200 px-3 py-1 rounded-lg">
                        <X size={16} />
                        <span className="text-sm font-medium">No Stock</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleGetDirections(response)}
                      className="w-full bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      <Navigation size={18} />
                      Get Directions
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* No Responses Yet */}
        {responses.length === 0 && !polling && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Store size={40} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No responses yet
            </h3>
            <p className="text-gray-600 mb-6">
              Merchants haven't responded to your request. Try again later.
            </p>
            <button
              onClick={() => navigate('/')}
              className="bg-nearby-500 hover:bg-nearby-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              Back to Home
            </button>
          </div>
        )}
      </div>
    </div>
  )
}


export default BroadcastRadar
