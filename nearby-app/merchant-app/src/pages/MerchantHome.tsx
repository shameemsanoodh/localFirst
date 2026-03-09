import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X, Share2, LogOut, Clock, Send } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

interface IncomingRequest {
  id: string
  query: string
  customer: string
  distance: number
  category: string
  maxPrice: number
  timestamp: number
  status: 'new' | 'responded'
  responseType?: 'available' | 'schedule'
  confidence?: number
  priority?: 'urgent' | 'general' | 'info' // Add priority
}

interface Reservation {
  id: string
  item: string
  customer: string
  tokenPaid: number
  holdWindow: number
  createdAt: number
  status: 'active' | 'picked_up' | 'expired'
}

const MerchantHome: React.FC = () => {
  const navigate = useNavigate()
  const { logout } = useAuthStore()
  const [isOpen, setIsOpen] = useState(true)
  const [showAutoReminder, setShowAutoReminder] = useState(false)
  const [showHoursModal, setShowHoursModal] = useState(false)
  const [showBroadcastModal, setShowBroadcastModal] = useState(false)
  const [openHour, setOpenHour] = useState(9)
  const [closeHour, setCloseHour] = useState(21)
  const [broadcastOffer, setBroadcastOffer] = useState('')
  const [broadcastMessage, setBroadcastMessage] = useState('')
  const [broadcastValidity, setBroadcastValidity] = useState(24)
  const [requests, setRequests] = useState<IncomingRequest[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [searchTrends, setSearchTrends] = useState<Array<{ query: string; count: number }>>([])
  const [lastFetchTimestamp, setLastFetchTimestamp] = useState<number>(Date.now())
  const [showFeatureRequestModal, setShowFeatureRequestModal] = useState(false)
  const [featureRequestMessage, setFeatureRequestMessage] = useState('')
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [scheduleRequestId, setScheduleRequestId] = useState<string | null>(null)
  const [scheduleDate, setScheduleDate] = useState<'today' | 'tomorrow'>('today')
  const [scheduleTime, setScheduleTime] = useState('12:00')

  const merchantData = JSON.parse(localStorage.getItem('merchant-data') || '{}')
  const shopName = merchantData.shopName || merchantData.name || 'dd'
  const category = merchantData.category || 'Grocery'
  const radius = merchantData.radius || '1km'

  // Broadcast polling - fetch new broadcasts every 15 seconds
  useEffect(() => {
    const fetchBroadcasts = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
        const token = localStorage.getItem('auth-token')
        
        if (!token) return

        const response = await fetch(`${API_BASE_URL}/merchant/broadcasts?since=${lastFetchTimestamp}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const data = await response.json()
          const broadcasts = data.broadcasts || []
          
          // DEBUG: Log what we received from backend
          console.log('🔍 Merchant broadcasts API response:', data)
          console.log('📦 Broadcasts array:', broadcasts)
          console.log('📊 Broadcast count:', broadcasts.length)
          
          // Transform backend broadcasts to IncomingRequest format
          const newRequests = broadcasts.map((broadcast: any) => ({
            id: broadcast.broadcastId || broadcast.id,
            query: broadcast.query || broadcast.productName || broadcast.productId || 'Product request',
            customer: 'Customer',
            distance: Math.round(broadcast.distance || 0),
            category: broadcast.detectedCategory || broadcast.category || 'General',
            maxPrice: broadcast.maxPrice || 0,
            timestamp: broadcast.created_at || new Date(broadcast.createdAt).getTime(),
            status: broadcast.merchantResponse ? 'responded' : 'new',
            responseType: broadcast.merchantResponse?.response === 'accept' ? 'available' : 
                         broadcast.merchantResponse?.response === 'schedule' ? 'schedule' : undefined,
            confidence: broadcast.confidence,
            priority: broadcast.priority || 'general' // Add priority with default
          }))
          
          console.log('🎯 Transformed requests:', newRequests)

          // Merge with existing requests, avoiding duplicates
          setRequests(prev => {
            const existingIds = new Set(prev.map(r => r.id))
            const uniqueNew = newRequests.filter((r: IncomingRequest) => !existingIds.has(r.id))
            
            if (uniqueNew.length > 0) {
              // Show toast notification for new requests
              console.log(`✅ ${uniqueNew.length} new request(s) received`)
            }
            
            return [...prev, ...uniqueNew]
          })

          setLastFetchTimestamp(Date.now())
        }
      } catch (error) {
        console.error('Error fetching broadcasts:', error)
      }
    }

    // Initial fetch
    fetchBroadcasts()

    // Poll every 15 seconds
    const interval = setInterval(fetchBroadcasts, 15000)

    return () => clearInterval(interval)
  }, []) // Empty dependency array - only run once on mount

  useEffect(() => {
    // Check if it's time to show auto reminder (e.g., at 9 AM or 9 PM)
    const checkAutoReminder = () => {
      const hour = new Date().getHours()
      if (hour === 9 || hour === 21) {
        setShowAutoReminder(true)
      }
    }
    checkAutoReminder()
  }, [])

  const handleQuickAction = async (requestId: string, action: 'no_stock' | 'schedule' | 'available') => {
    const request = requests.find(r => r.id === requestId)
    
    // For schedule action, show modal first
    if (action === 'schedule') {
      setScheduleRequestId(requestId)
      setShowScheduleModal(true)
      return
    }
    
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
      const token = localStorage.getItem('auth-token')
      
      if (!token) {
        console.error('No auth token found')
        return
      }

      // Map action to backend response type
      const responseType = action === 'available' ? 'YES' : 'NO'

      // Call backend API
      const response = await fetch(`${API_BASE_URL}/broadcasts/${requestId}/respond`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          responseType,
          ...(action === 'available' && { price: request?.maxPrice })
        })
      })

      if (!response.ok) {
        throw new Error('Failed to respond to broadcast')
      }

      if (action === 'no_stock') {
        // Remove request from list
        setRequests(prev => prev.filter(r => r.id !== requestId))
      } else {
        // Mark as responded
        setRequests(prev => prev.map(req => {
          if (req.id === requestId) {
            return {
              ...req,
              status: 'responded',
              responseType: 'available'
            }
          }
          return req
        }))
      }
    } catch (error) {
      console.error('Error responding to broadcast:', error)
      alert('Failed to respond. Please try again.')
    }
  }

  const handleScheduleSubmit = async () => {
    if (!scheduleRequestId) return
    
    const request = requests.find(r => r.id === scheduleRequestId)
    
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
      const token = localStorage.getItem('auth-token')
      
      if (!token) {
        console.error('No auth token found')
        return
      }

      // Calculate scheduled time
      const now = new Date()
      const scheduledDate = scheduleDate === 'today' ? now : new Date(now.getTime() + 24 * 60 * 60 * 1000)
      const [hours, minutes] = scheduleTime.split(':')
      scheduledDate.setHours(parseInt(hours), parseInt(minutes), 0, 0)

      // Call backend API
      const response = await fetch(`${API_BASE_URL}/broadcasts/${scheduleRequestId}/respond`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          responseType: 'ALTERNATIVE',
          scheduledTime: scheduledDate.toISOString(),
          notes: `Available ${scheduleDate} at ${scheduleTime}`
        })
      })

      if (!response.ok) {
        throw new Error('Failed to respond to broadcast')
      }

      // Mark as responded and add to reservations
      setRequests(prev => prev.map(req => {
        if (req.id === scheduleRequestId) {
          return {
            ...req,
            status: 'responded',
            responseType: 'schedule'
          }
        }
        return req
      }))

      if (request) {
        setReservations(prev => [...prev, {
          id: `res-${Date.now()}`,
          item: request.query,
          customer: request.customer,
          tokenPaid: 20,
          holdWindow: 24 * 60,
          createdAt: Date.now(),
          status: 'active'
        }])
      }

      // Close modal and reset
      setShowScheduleModal(false)
      setScheduleRequestId(null)
      setScheduleDate('today')
      setScheduleTime('12:00')
    } catch (error) {
      console.error('Error responding to broadcast:', error)
      alert('Failed to respond. Please try again.')
    }
  }

  const handleReservationAction = (reservationId: string, action: 'picked_up' | 'expired') => {
    setReservations(prev => prev.map(res => {
      if (res.id === reservationId) {
        return { ...res, status: action as 'picked_up' | 'expired' }
      }
      return res
    }).filter(res => res.status === 'active'))
  }

  const handleClearAll = () => {
    setRequests(prev => prev.filter(r => r.status !== 'new'))
  }

  const handleSaveHours = () => {
    localStorage.setItem('merchant-hours', JSON.stringify({ openHour, closeHour }))
    setShowHoursModal(false)
  }

  const handleBroadcastOffer = async () => {
    if (!broadcastOffer.trim()) {
      alert('Please enter an offer (e.g., "20% off on mobile cases")')
      return
    }
    
    if (!broadcastMessage.trim()) {
      alert('Please enter a message for customers')
      return
    }

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
      const token = localStorage.getItem('auth-token')
      
      if (!token) {
        alert('Please login first')
        return
      }

      console.log('Broadcasting offer:', {
        offer: broadcastOffer,
        message: broadcastMessage,
        validityHours: broadcastValidity
      })

      const response = await fetch(`${API_BASE_URL}/merchant/broadcast-offers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          offer: broadcastOffer,
          message: broadcastMessage,
          validityHours: broadcastValidity
        })
      })

      const data = await response.json()
      console.log('Response:', data)

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to broadcast offer')
      }
      
      alert(`✅ Offer broadcast successfully! Valid for ${broadcastValidity} hours.`)
      setShowBroadcastModal(false)
      setBroadcastOffer('')
      setBroadcastMessage('')
      setBroadcastValidity(24)
    } catch (error: any) {
      console.error('Error broadcasting offer:', error)
      alert(`❌ Failed to broadcast offer: ${error.message}`)
    }
  }

  const handleFeatureRequest = async () => {
    if (!featureRequestMessage.trim()) return

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
      const token = localStorage.getItem('auth-token')
      
      if (!token) {
        console.error('No auth token found')
        return
      }

      const response = await fetch(`${API_BASE_URL}/queries`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'merchant',
          message: featureRequestMessage
        })
      })

      if (!response.ok) {
        throw new Error('Failed to submit feature request')
      }

      alert('Feature request submitted successfully!')
      setShowFeatureRequestModal(false)
      setFeatureRequestMessage('')
    } catch (error) {
      console.error('Error submitting feature request:', error)
      alert('Failed to submit request. Please try again.')
    }
  }

  const handleLogout = () => {
    logout()
    localStorage.removeItem('auth-token')
    localStorage.removeItem('merchant-data')
    localStorage.removeItem('auth-storage')
    navigate('/login')
  }

  const handleShare = () => {
    const shareUrl = `http://localhost:5173/shop/${merchantData.merchantId || 'shop'}`
    if (navigator.share) {
      navigator.share({
        title: shopName,
        text: `Check out ${shopName} on NearBy!`,
        url: shareUrl
      })
    } else {
      navigator.clipboard.writeText(shareUrl)
      alert('Link copied to clipboard!')
    }
  }

  const handleToggleOpen = async () => {
    const newStatus = !isOpen
    setIsOpen(newStatus)
    
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
      const token = localStorage.getItem('auth-token')
      
      if (!token) return

      // Update merchant status in backend
      const response = await fetch(`${API_BASE_URL}/merchant/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          isOpen: newStatus
        })
      })

      if (!response.ok) {
        console.error('Failed to update status')
        // Revert on error
        setIsOpen(!newStatus)
      }
    } catch (error) {
      console.error('Error updating status:', error)
      // Revert on error
      setIsOpen(!newStatus)
    }
  }

  const handleStoreStatus = async (status: 'open' | 'closed' | 'snooze') => {
    const newStatus = status === 'open'
    setIsOpen(newStatus)
    setShowAutoReminder(false)
    
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
      const token = localStorage.getItem('auth-token')
      
      if (!token) return

      // Update merchant status in backend
      await fetch(`${API_BASE_URL}/merchant/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          isOpen: newStatus
        })
      })
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const newRequestsCount = requests.filter(r => r.status === 'new').length

  return (
    <div className="min-h-screen pb-24" style={{ background: '#FAF8F5' }}>
      {/* Header */}
      <div className="px-4 sm:px-6 pt-6 pb-4" style={{ background: '#2C3E50' }}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-xl sm:text-2xl" style={{ background: '#FFFFFF' }}>
                🏪
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-white">{shopName}</h1>
                <p className="text-xs sm:text-sm text-gray-300">{category} • ~{radius} radius</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="relative p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <Bell size={18} className="text-white sm:w-5 sm:h-5" />
                {newRequestsCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-red-500 flex items-center justify-center text-[10px] sm:text-xs font-bold text-white">
                    {newRequestsCount}
                  </div>
                )}
              </button>
              <button onClick={handleLogout} className="p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <LogOut size={18} className="text-white sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          {/* Store Status */}
          <div className="flex items-center justify-between p-3 sm:p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${isOpen ? 'bg-green-400' : 'bg-red-400'}`} />
              <span className="text-white font-semibold text-sm sm:text-base">{isOpen ? 'OPEN' : 'CLOSED'}</span>
            </div>
            <button
              onClick={handleToggleOpen}
              className="px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors"
              style={{ background: isOpen ? '#EF4444' : '#22C55E', color: '#FFFFFF' }}
            >
              {isOpen ? 'Mark Closed' : 'Mark Open'}
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-4 sm:py-6 max-w-2xl mx-auto space-y-4 sm:space-y-6">
        {/* Reminders */}
        <div className="p-3 sm:p-4 rounded-xl shadow-sm" style={{ background: '#FFFFFF', border: '1px solid #FEF3C7' }}>
          <div className="flex items-start sm:items-center justify-between gap-2">
            <div className="flex items-start sm:items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <Clock size={20} className="text-orange-500 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                  Reminders at {String(openHour).padStart(2, '0')}:00 – {String(closeHour).padStart(2, '0')}:00
                </p>
                <p className="text-xs sm:text-sm text-gray-600">Auto notifications at store hours</p>
              </div>
            </div>
            <button 
              onClick={() => setShowHoursModal(true)}
              className="text-orange-600 text-xs sm:text-sm font-semibold whitespace-nowrap"
            >
              Set hours
            </button>
          </div>
        </div>

        {/* Grow Your Reach */}
        <div className="p-3 sm:p-4 rounded-xl shadow-sm" style={{ background: '#FFFFFF' }}>
          <div className="flex items-start sm:items-center justify-between gap-2">
            <div className="flex items-start sm:items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <span className="text-xl sm:text-2xl flex-shrink-0">⚡</span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900 text-sm sm:text-base">Grow Your Reach</p>
                <p className="text-xs sm:text-sm text-gray-600">Share your referral link with customers</p>
              </div>
            </div>
            <button 
              onClick={handleShare}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg whitespace-nowrap" 
              style={{ background: '#F3F4F6' }}
            >
              <Share2 size={14} className="sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm font-semibold">Share</span>
            </button>
          </div>
        </div>

        {/* Broadcast Offer */}
        <div className="p-3 sm:p-4 rounded-xl shadow-sm" style={{ background: '#FFFFFF', border: '1px solid #22C55E' }}>
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 text-sm sm:text-base mb-1">Broadcast Offer</h3>
              <p className="text-xs sm:text-sm text-gray-600">Push special offers to nearby customers</p>
            </div>
            <button 
              onClick={() => setShowBroadcastModal(true)}
              className="px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap"
              style={{ background: '#22C55E', color: '#FFFFFF' }}
            >
              Push to nearby
            </button>
          </div>
        </div>

        {/* Feature Request */}
        <div className="p-3 sm:p-4 rounded-xl shadow-sm" style={{ background: '#FFFFFF', border: '1px solid #3B82F6' }}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 text-sm sm:text-base mb-1">Feature Request</h3>
              <p className="text-xs sm:text-sm text-gray-600">Suggest improvements or report issues</p>
            </div>
            <button 
              onClick={() => setShowFeatureRequestModal(true)}
              className="px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap"
              style={{ background: '#3B82F6', color: '#FFFFFF' }}
            >
              Send Feedback
            </button>
          </div>
        </div>

        {/* Search Trends */}
        {searchTrends.length > 0 && (
          <div className="p-3 sm:p-4 rounded-xl shadow-sm" style={{ background: '#FFFFFF' }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900 text-sm sm:text-base flex items-center gap-2">
                📈 Search Trends
              </h3>
              <span className="text-xs text-gray-500">What people want</span>
            </div>
            <div className="space-y-2">
              {searchTrends.map((trend, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg" style={{ background: '#FAF8F5' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: '#F59E0B' }}>
                      {idx + 1}
                    </div>
                    <span className="font-semibold text-gray-900">{trend.query}</span>
                  </div>
                  <span className="text-xs text-gray-600">{trend.count} searches</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Incoming Requests */}
        <div>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg font-bold text-gray-900">Incoming Requests</h2>
            {newRequestsCount > 0 && (
              <button 
                onClick={handleClearAll}
                className="text-xs sm:text-sm text-gray-600 hover:text-gray-900"
              >
                All clear
              </button>
            )}
          </div>

          {requests.length === 0 ? (
            <div className="text-center py-10 sm:py-12 rounded-xl shadow-sm" style={{ background: '#FFFFFF' }}>
              <span className="text-4xl sm:text-5xl mb-3 block">📭</span>
              <p className="text-xs sm:text-sm text-gray-600">No incoming requests yet</p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {requests
                .sort((a, b) => {
                  // Sort by priority first (urgent > general > info)
                  const priorityOrder = { urgent: 0, general: 1, info: 2 };
                  const aPriority = priorityOrder[a.priority || 'general'];
                  const bPriority = priorityOrder[b.priority || 'general'];
                  if (aPriority !== bPriority) return aPriority - bPriority;
                  
                  // Then sort: new requests first, then responded requests
                  if (a.status === 'new' && b.status === 'responded') return -1
                  if (a.status === 'responded' && b.status === 'new') return 1
                  // Within same status, sort by timestamp (newest first)
                  return b.timestamp - a.timestamp
                })
                .map((request) => {
                  // Priority colors
                  const priorityColors = {
                    urgent: { bg: '#FEE2E2', border: '#DC2626', badge: 'bg-red-100 text-red-700' },
                    general: { bg: '#DCFCE7', border: '#16A34A', badge: 'bg-green-100 text-green-700' },
                    info: { bg: '#FEF3C7', border: '#EAB308', badge: 'bg-yellow-100 text-yellow-700' }
                  };
                  const colors = priorityColors[request.priority || 'general'];
                  
                  return (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-3 sm:p-4 rounded-xl shadow-sm"
                  style={{
                    background: colors.bg,
                    borderLeft: `4px solid ${colors.border}`
                  }}
                >
                  <div className="flex items-start justify-between mb-2 sm:mb-3 gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">{request.query}</h3>
                      <div className="flex items-center gap-2 flex-wrap mt-1">
                        <p className="text-xs sm:text-sm text-gray-600">
                          Customer ~{request.distance}m away
                        </p>
                        <span className="text-gray-400">•</span>
                        <p className="text-xs sm:text-sm font-semibold text-gray-900">
                          {request.category}
                        </p>
                        {/* Priority badge */}
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${colors.badge}`}>
                          {request.priority || 'general'}
                        </span>
                        {request.confidence && (
                          <>
                            <span className="text-gray-400">•</span>
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                              {Math.round(request.confidence * 100)}% match
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {request.status === 'new' ? (
                        <span className="px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold bg-orange-100 text-orange-700">
                          NEW
                        </span>
                      ) : (
                        <span className={`px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold ${
                          request.responseType === 'available'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-orange-100 text-orange-700'
                        }`}>
                          {request.responseType === 'available' ? 'AVAILABLE' : 'SCHEDULE'}
                        </span>
                      )}
                      <p className="text-xs sm:text-sm font-bold text-gray-900 mt-1 sm:mt-2">₹{request.maxPrice}</p>
                    </div>
                  </div>

                  {request.status === 'new' ? (
                    <div className="flex gap-1.5 sm:gap-2">
                      <button
                        onClick={() => handleQuickAction(request.id, 'no_stock')}
                        className="flex-1 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold border-2"
                        style={{ 
                          background: '#FFFFFF', 
                          color: '#DC2626',
                          borderColor: '#DC2626'
                        }}
                      >
                        No Stock
                      </button>
                      <button
                        onClick={() => handleQuickAction(request.id, 'schedule')}
                        className="flex-1 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold border-2"
                        style={{ 
                          background: '#FFFFFF', 
                          color: '#D97706',
                          borderColor: '#D97706'
                        }}
                      >
                        Schedule
                      </button>
                      <button
                        onClick={() => handleQuickAction(request.id, 'available')}
                        className="flex-1 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold"
                        style={{ background: '#22C55E', color: '#FFFFFF' }}
                      >
                        I Have It
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-2 text-xs sm:text-sm font-semibold text-gray-600">
                      You responded: {request.responseType === 'available' ? 'AVAILABLE' : 'SCHEDULE'}
                    </div>
                  )}
                </motion.div>
              )})}
            </div>
          )}
        </div>

        {/* Reservation Shelf */}
        <div>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg font-bold text-gray-900">Reservation Shelf</h2>
            <span className="text-xs sm:text-sm text-gray-600">Keep aside</span>
          </div>

          {reservations.length === 0 ? (
            <div className="text-center py-10 sm:py-12 rounded-xl shadow-sm" style={{ background: '#FFFFFF' }}>
              <span className="text-4xl sm:text-5xl mb-3 block">📦</span>
              <p className="text-xs sm:text-sm text-gray-600">No reservations yet</p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {reservations.map((reservation) => (
                <div key={reservation.id} className="p-3 sm:p-4 rounded-xl shadow-sm" style={{ background: '#FFFFFF' }}>
                  <div className="flex items-start justify-between mb-2 sm:mb-3 gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-sm sm:text-base truncate">{reservation.item}</h3>
                      <p className="text-xs sm:text-sm text-gray-600">Token / Paid: ₹{reservation.tokenPaid}</p>
                      <p className="text-xs sm:text-sm text-gray-600">Hold window: {Math.floor(reservation.holdWindow / 60)}h</p>
                      <p className="text-xs sm:text-sm font-semibold text-gray-900 mt-1">
                        Keep this in Reservation Shelf
                      </p>
                    </div>
                    <span className="px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold bg-green-100 text-green-700 flex-shrink-0">
                      Active
                    </span>
                  </div>
                  <div className="flex gap-1.5 sm:gap-2">
                    <button
                      onClick={() => handleReservationAction(reservation.id, 'picked_up')}
                      className="flex-1 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold"
                      style={{ background: '#22C55E20', color: '#22C55E', border: '2px solid #22C55E' }}
                    >
                      Picked Up
                    </button>
                    <button
                      onClick={() => handleReservationAction(reservation.id, 'expired')}
                      className="flex-1 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold"
                      style={{ background: '#FFFFFF', color: '#6B6B6B', border: '2px solid #E5E7EB' }}
                    >
                      Mark Expired
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Set Hours Modal */}
      <AnimatePresence>
        {showHoursModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowHoursModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md p-4 sm:p-6 rounded-2xl"
              style={{ background: '#FFFFFF' }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Set Store Hours</h3>
                <button onClick={() => setShowHoursModal(false)}>
                  <X size={24} className="text-gray-600" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Opening Time</label>
                  <select
                    value={openHour}
                    onChange={(e) => setOpenHour(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 outline-none focus:border-gray-900"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Closing Time</label>
                  <select
                    value={closeHour}
                    onChange={(e) => setCloseHour(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 outline-none focus:border-gray-900"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleSaveHours}
                  className="w-full py-3 rounded-xl font-bold text-white"
                  style={{ background: '#22C55E' }}
                >
                  Save Hours
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Broadcast Offer Modal */}
      <AnimatePresence>
        {showBroadcastModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowBroadcastModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md p-4 sm:p-6 rounded-2xl"
              style={{ background: '#FFFFFF' }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Broadcast Offer</h3>
                <button onClick={() => setShowBroadcastModal(false)}>
                  <X size={24} className="text-gray-600" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <input
                    type="text"
                    placeholder="e.g. 20% off on Harpic Lemon"
                    value={broadcastOffer}
                    onChange={(e) => setBroadcastOffer(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 outline-none focus:border-gray-900"
                  />
                </div>

                <div>
                  <textarea
                    placeholder="Message customers will see"
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 outline-none focus:border-gray-900 resize-none"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={broadcastValidity}
                    onChange={(e) => setBroadcastValidity(Number(e.target.value))}
                    className="w-24 px-4 py-3 rounded-xl border-2 border-gray-200 outline-none focus:border-gray-900"
                  />
                  <span className="text-gray-600">hours validity</span>
                </div>

                <button
                  onClick={handleBroadcastOffer}
                  disabled={!broadcastOffer || !broadcastMessage}
                  className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ background: '#22C55E' }}
                >
                  <Send size={18} />
                  Broadcast Offer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auto Store Reminder Modal */}
      <AnimatePresence>
        {showAutoReminder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md p-4 sm:p-6 rounded-2xl"
              style={{ background: '#FFFFFF' }}
            >
              <div className="flex items-start justify-between mb-3 sm:mb-4 gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-gray-600">AUTO STORE REMINDER</p>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">Are you OPEN now?</h3>
                </div>
                <button onClick={() => setShowAutoReminder(false)} className="flex-shrink-0">
                  <X size={20} className="text-gray-600 sm:w-6 sm:h-6" />
                </button>
              </div>

              <p className="text-xs sm:text-sm text-gray-700 mb-4 sm:mb-6">
                Tap OPEN if you're ready to serve customers. If you are still serving, keep OPEN.
              </p>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={() => handleStoreStatus('snooze')}
                  className="w-full sm:flex-1 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold"
                  style={{ background: '#F3F4F6', color: '#6B7280' }}
                >
                  Snooze 15 min
                </button>
                <button
                  onClick={() => handleStoreStatus('closed')}
                  className="w-full sm:flex-1 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold"
                  style={{ background: '#FEE2E2', color: '#DC2626' }}
                >
                  Mark Closed
                </button>
                <button
                  onClick={() => handleStoreStatus('open')}
                  className="w-full sm:flex-1 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold"
                  style={{ background: '#22C55E', color: '#FFFFFF' }}
                >
                  I am Open
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feature Request Modal */}
      <AnimatePresence>
        {showFeatureRequestModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowFeatureRequestModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md p-4 sm:p-6 rounded-2xl"
              style={{ background: '#FFFFFF' }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Feature Request</h3>
                <button onClick={() => setShowFeatureRequestModal(false)}>
                  <X size={24} className="text-gray-600" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">
                    What would you like to see improved?
                  </label>
                  <textarea
                    placeholder="Describe your feature request or issue (max 100 words)"
                    value={featureRequestMessage}
                    onChange={(e) => setFeatureRequestMessage(e.target.value)}
                    rows={5}
                    maxLength={500}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 outline-none focus:border-gray-900 resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {featureRequestMessage.length}/500 characters
                  </p>
                </div>

                <button
                  onClick={handleFeatureRequest}
                  disabled={!featureRequestMessage.trim()}
                  className="w-full py-3 rounded-xl font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: '#3B82F6' }}
                >
                  Submit Request
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Schedule Modal */}
      <AnimatePresence>
        {showScheduleModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowScheduleModal(false)
              setScheduleRequestId(null)
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md p-4 sm:p-6 rounded-2xl"
              style={{ background: '#FFFFFF' }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Schedule Availability</h3>
                <button onClick={() => {
                  setShowScheduleModal(false)
                  setScheduleRequestId(null)
                }}>
                  <X size={24} className="text-gray-600" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">When will it be available?</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setScheduleDate('today')}
                      className={`py-3 rounded-xl text-sm font-semibold border-2 transition-colors ${
                        scheduleDate === 'today'
                          ? 'bg-orange-500 text-white border-orange-500'
                          : 'bg-white text-gray-700 border-gray-200'
                      }`}
                    >
                      Today
                    </button>
                    <button
                      onClick={() => setScheduleDate('tomorrow')}
                      className={`py-3 rounded-xl text-sm font-semibold border-2 transition-colors ${
                        scheduleDate === 'tomorrow'
                          ? 'bg-orange-500 text-white border-orange-500'
                          : 'bg-white text-gray-700 border-gray-200'
                      }`}
                    >
                      Tomorrow
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Select Time</label>
                  <input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 outline-none focus:border-gray-900"
                  />
                </div>

                <button
                  onClick={handleScheduleSubmit}
                  className="w-full py-3 rounded-xl font-bold text-white"
                  style={{ background: '#D97706' }}
                >
                  Confirm Schedule
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 px-4 sm:px-6 py-3 sm:py-4" style={{ background: '#FFFFFF', borderTop: '1px solid #E5E7EB' }}>
        <div className="flex items-center justify-around max-w-2xl mx-auto">
          {[
            { icon: '🏠', label: 'Home', active: true, path: '/' },
            { icon: '🎉', label: 'Offers', active: false, path: '/offers' },
            { icon: '📊', label: 'Stats', active: false, path: '/stats' },
            { icon: '👤', label: 'Profile', active: false, path: '/profile' },
          ].map((tab, i) => (
            <button
              key={i}
              className="flex flex-col items-center gap-0.5 sm:gap-1 transition-transform active:scale-95 min-w-0"
              onClick={() => {
                if (tab.path !== '/') {
                  navigate(tab.path)
                }
              }}
            >
              <div className={`text-xl sm:text-2xl ${tab.active ? 'scale-110' : 'opacity-50'}`}>{tab.icon}</div>
              <span className={`text-[10px] sm:text-xs font-medium truncate max-w-full ${tab.active ? 'text-black' : 'text-gray-400'}`}>
                {tab.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default MerchantHome
