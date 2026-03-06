import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Bell, Send, X
} from 'lucide-react'
import { useMerchantAPI } from '@/hooks/useMerchantAPI'

// Types
interface MerchantBroadcast {
  broadcast_id: string
  query: string
  detected_capabilities: string[]
  location: { lat: number; lng: number }
  distance_km: number
  created_at: number
  expires_at: number
  status: 'new' | 'replied' | 'expired' | 'scheduled'
  urgency?: 'high' | 'medium' | 'low'
  price?: number
  customer_name?: string
  max_price?: number
}

interface Reservation {
  id: string
  customer_name: string
  item: string
  price: number
  token_paid: number
  hold_window: number
  created_at: number
  status: 'active' | 'picked_up' | 'expired'
  shop_name: string
}

interface BroadcastOffer {
  id: string
  title: string
  message: string
  validity_hours: number
  created_at: number
  ends_at: number
}

const MerchantHomeEnhanced: React.FC = () => {
  const navigate = useNavigate()
  const { getBroadcasts, replyToBroadcast } = useMerchantAPI()

  // State
  const [broadcasts, setBroadcasts] = useState<MerchantBroadcast[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [offers, setOffers] = useState<BroadcastOffer[]>([])
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [selectedBroadcast, setSelectedBroadcast] = useState<MerchantBroadcast | null>(null)
  const [showCloseReminder, setShowCloseReminder] = useState(false)

  // Stats
  const [stats, setStats] = useState({
    queriesReceived: 0,
    repliedCount: 0,
    missedCount: 0,
  })

  // Broadcast Discounts form state
  const [broadcastTitle, setBroadcastTitle] = useState('')
  const [broadcastMessage, setBroadcastMessage] = useState('')
  const [broadcastHours, setBroadcastHours] = useState('24')
  const [broadcastSent, setBroadcastSent] = useState(false)

  // Get merchant data
  const merchantData = JSON.parse(localStorage.getItem('merchant-data') || '{}')
  const shopName = merchantData.shopName || 'My Shop'
  const shopId = merchantData.userId || 'shop-123'

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 30000)

    // Show close reminder at configured time
    checkCloseTime()
    const closeInterval = setInterval(checkCloseTime, 60000)

    return () => {
      clearInterval(interval)
      clearInterval(closeInterval)
    }
  }, [])

  const checkCloseTime = () => {
    const now = new Date()
    const hour = now.getHours()
    // Show reminder at 21:00 (9 PM)
    if (hour === 21 && now.getMinutes() === 0) {
      setShowCloseReminder(true)
    }
  }

  const handleBroadcastOffer = () => {
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return
    const newOffer: BroadcastOffer = {
      id: `offer-${Date.now()}`,
      title: broadcastTitle,
      message: broadcastMessage,
      validity_hours: parseInt(broadcastHours) || 24,
      created_at: Date.now(),
      ends_at: Date.now() + (parseInt(broadcastHours) || 24) * 60 * 60 * 1000,
    }
    setOffers(prev => [newOffer, ...prev])
    setBroadcastTitle('')
    setBroadcastMessage('')
    setBroadcastHours('24')
    setBroadcastSent(true)
    setTimeout(() => setBroadcastSent(false), 2500)
  }

  const handleSnooze = () => {
    setShowCloseReminder(false)
    setTimeout(() => setShowCloseReminder(true), 15 * 60 * 1000)
  }

  const loadData = async () => {
    let broadcastsData: MerchantBroadcast[] = []

    try {
      // Try real API first
      const apiBroadcasts = await getBroadcasts(shopId)
      if (apiBroadcasts && Array.isArray(apiBroadcasts) && apiBroadcasts.length > 0) {
        broadcastsData = apiBroadcasts.map((b: any) => ({
          broadcast_id: b.broadcast_id || b.broadcastId,
          query: b.query || b.productName || '',
          detected_capabilities: b.detected_capabilities || [],
          location: b.location || { lat: 0, lng: 0 },
          distance_km: b.distance_km || 0,
          created_at: b.created_at || Date.now(),
          expires_at: b.expires_at || Date.now() + 60 * 60 * 1000,
          status: b.status || 'new',
          urgency: b.urgency || 'normal',
          customer_name: b.customer_name || b.query || '',
          max_price: b.max_price || 0,
        }))
      }
    } catch (error) {
      console.warn('Broadcasts API failed, using mock data:', error)
    }

    // Fallback to mock if API returned nothing
    if (broadcastsData.length === 0) {
      broadcastsData = [
        {
          broadcast_id: '1',
          query: 'harpic',
          detected_capabilities: ['cleaning_supplies'],
          location: { lat: 12.9716, lng: 77.5946 },
          distance_km: 0.1,
          created_at: Date.now() - 2 * 60 * 1000,
          expires_at: Date.now() + 58 * 60 * 1000,
          status: 'new',
          urgency: 'high',
          customer_name: 'harpic',
          max_price: 23,
        },
      ]
    }

    setBroadcasts(broadcastsData)
    setReservations([]) // reservations from API when endpoint is available
    setOffers([])

    // Calculate stats from data
    const today = new Date().setHours(0, 0, 0, 0)
    const todayBroadcasts = broadcastsData.filter(b => b.created_at >= today)
    setStats({
      queriesReceived: todayBroadcasts.length,
      repliedCount: todayBroadcasts.filter(b => b.status === 'replied').length,
      missedCount: todayBroadcasts.filter(b => b.status === 'expired').length,
    })
  }

  const getHoldWindow = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  const handleQuickReply = async (broadcast: MerchantBroadcast, type: 'yes' | 'no' | 'alternative' | 'schedule') => {
    if (type === 'schedule') {
      setSelectedBroadcast(broadcast)
      setShowScheduleModal(true)
      return
    }

    try {
      await replyToBroadcast(broadcast.broadcast_id, {
        shop_id: shopId,
        shop_name: shopName,
        response_type: type,
      })

      setBroadcasts(prev => prev.map(b =>
        b.broadcast_id === broadcast.broadcast_id
          ? { ...b, status: 'replied' as const }
          : b
      ))
    } catch (error) {
      console.error('Failed to reply:', error)
    }
  }

  const handleScheduleConfirm = async (tokenAmount: number) => {
    if (!selectedBroadcast) return

    try {
      await replyToBroadcast(selectedBroadcast.broadcast_id, {
        shop_id: shopId,
        shop_name: shopName,
        response_type: 'alternative',
        price: selectedBroadcast.price || selectedBroadcast.max_price,
        message: `Can arrange tonight / tomorrow morning. ₹${tokenAmount} token required.`,
      })

      // Add to reservations
      const newReservation: Reservation = {
        id: `res-${Date.now()}`,
        customer_name: selectedBroadcast.customer_name || 'Customer',
        item: selectedBroadcast.query,
        price: selectedBroadcast.price || selectedBroadcast.max_price || 0,
        token_paid: tokenAmount,
        hold_window: 24 * 60,
        created_at: Date.now(),
        status: 'active',
        shop_name: shopName,
      }

      setReservations(prev => [newReservation, ...prev])
      setBroadcasts(prev => prev.map(b =>
        b.broadcast_id === selectedBroadcast.broadcast_id
          ? { ...b, status: 'scheduled' as const }
          : b
      ))

      setShowScheduleModal(false)
      setSelectedBroadcast(null)
    } catch (error) {
      console.error('Failed to schedule:', error)
    }
  }

  const handleReservationAction = (id: string, action: 'picked_up' | 'expired') => {
    setReservations(prev => prev.map(r =>
      r.id === id ? { ...r, status: action } : r
    ))
  }

  const newBroadcasts = broadcasts.filter(b => b.status === 'new')
  const pendingCount = newBroadcasts.length

  return (
    <div className="min-h-screen pb-24" style={{ background: '#FAF8F5', fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div className="px-6 pt-14 pb-4" style={{ background: '#1A1A1A' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ background: '#F5C842' }}>
              🏪
            </div>
            <div>
              <h1 className="text-lg font-bold" style={{ color: '#FAF8F5' }}>{shopName}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="w-2 h-2 rounded-full" style={{ background: '#22C55E' }} />
                <span className="text-xs" style={{ color: '#9A9895' }}>Live · Visible within 2 km</span>
              </div>
            </div>
          </div>
          <button className="relative p-2.5 rounded-xl" style={{ background: '#2A2A2A' }}
            onClick={() => { const el = document.getElementById('broadcasts-section'); el?.scrollIntoView({ behavior: 'smooth' }) }}
          >
            <Bell size={20} style={{ color: '#F5C842' }} />
            {pendingCount > 0 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: '#FF5454', color: 'white' }}>
                {pendingCount}
              </div>
            )}
          </button>
        </div>

        {/* Today's Summary */}
        <div className="p-4 rounded-2xl" style={{ background: '#2A2A2A' }}>
          <p className="text-xs font-semibold mb-3" style={{ color: '#9A9895', letterSpacing: '0.06em' }}>
            TODAY'S SUMMARY
          </p>
          <div className="flex items-center justify-between">
            <div className="text-center">
              <p className="text-2xl font-bold" style={{ color: '#F5C842' }}>{stats.queriesReceived}</p>
              <p className="text-xs mt-1" style={{ color: '#9A9895' }}>Queries</p>
            </div>
            <div className="w-px h-10" style={{ background: '#3A3A3A' }} />
            <div className="text-center">
              <p className="text-2xl font-bold" style={{ color: '#22C55E' }}>{stats.repliedCount}</p>
              <p className="text-xs mt-1" style={{ color: '#9A9895' }}>Replied</p>
            </div>
            <div className="w-px h-10" style={{ background: '#3A3A3A' }} />
            <div className="text-center">
              <p className="text-2xl font-bold" style={{ color: '#FF5454' }}>{stats.missedCount}</p>
              <p className="text-xs mt-1" style={{ color: '#9A9895' }}>Missed</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Incoming Customer Requests */}
        {newBroadcasts.length > 0 && (
          <section id="broadcasts-section">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold" style={{ color: '#1A1A1A' }}>Incoming Customer Requests</h2>
              <span className="text-sm px-3 py-1 rounded-full" style={{ background: '#FF545420', color: '#FF5454', fontWeight: 600 }}>
                {pendingCount} pending
              </span>
            </div>

            <div className="space-y-3">
              {newBroadcasts.map((broadcast) => (
                <motion.div
                  key={broadcast.broadcast_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-4 rounded-2xl border-l-4"
                  style={{ background: '#FFFFFF', borderColor: '#3B82F6' }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold" style={{ color: '#1A1A1A' }}>{broadcast.query}</h3>
                      <p className="text-sm mt-1" style={{ color: '#6B6B6B' }}>
                        Customer is ~{Math.round(broadcast.distance_km * 1000)}m away • Needs grocery
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold" style={{ color: '#1A1A1A' }}>₹{broadcast.max_price}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleQuickReply(broadcast, 'no')}
                      className="flex-1 py-2.5 rounded-xl font-semibold text-sm transition-colors"
                      style={{ background: '#FEE2E2', color: '#DC2626' }}
                    >
                      No Stock
                    </button>
                    <button
                      onClick={() => handleQuickReply(broadcast, 'schedule')}
                      className="flex-1 py-2.5 rounded-xl font-semibold text-sm transition-colors"
                      style={{ background: '#FEF3C7', color: '#D97706' }}
                    >
                      Schedule
                    </button>
                    <button
                      onClick={() => handleQuickReply(broadcast, 'yes')}
                      className="flex-1 py-2.5 rounded-xl font-semibold text-sm transition-colors"
                      style={{ background: '#22C55E', color: '#FFFFFF' }}
                    >
                      I Have It
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Reservation Shelf */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold" style={{ color: '#1A1A1A' }}>Reservation Shelf</h2>
            <span className="text-sm" style={{ color: '#6B6B6B' }}>Token & 50% orders to keep aside</span>
          </div>

          {reservations.length === 0 ? (
            <div className="text-center py-12 rounded-2xl" style={{ background: '#FFFFFF' }}>
              <div className="text-5xl mb-3">📦</div>
              <p className="text-sm" style={{ color: '#6B6B6B' }}>No reserved items yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reservations.map((reservation) => (
                <div key={reservation.id} className="p-4 rounded-2xl" style={{ background: '#FFFFFF' }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-base font-bold" style={{ color: '#1A1A1A' }}>{reservation.item}</h3>
                      <p className="text-sm mt-1" style={{ color: '#6B6B6B' }}>
                        Token / Paid: ₹{reservation.token_paid}
                      </p>
                      <p className="text-sm mt-1" style={{ color: '#6B6B6B' }}>
                        Hold window: {getHoldWindow(reservation.hold_window)}
                      </p>
                      <p className="text-sm font-semibold mt-1" style={{ color: '#1A1A1A' }}>
                        Keep this in Reservation Shelf
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: '#22C55E20', color: '#22C55E' }}>
                      Active
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReservationAction(reservation.id, 'picked_up')}
                      className="flex-1 py-2 rounded-xl font-semibold text-sm"
                      style={{ background: '#22C55E20', color: '#22C55E', border: '2px solid #22C55E' }}
                    >
                      Picked Up
                    </button>
                    <button
                      onClick={() => handleReservationAction(reservation.id, 'expired')}
                      className="flex-1 py-2 rounded-xl font-semibold text-sm"
                      style={{ background: '#FFFFFF', color: '#6B6B6B', border: '2px solid #E5E3DF' }}
                    >
                      Mark Expired
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Broadcast Discounts */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold" style={{ color: '#1A1A1A' }}>Broadcast Discounts</h2>
            <span className="text-sm" style={{ color: '#6B6B6B' }}>Push to nearby users</span>
          </div>

          <div className="p-5 rounded-2xl space-y-4" style={{ background: '#FFFFFF' }}>
            {broadcastSent && (
              <div className="p-3 rounded-xl text-center font-semibold text-sm" style={{ background: '#D1FAE5', color: '#065F46' }}>
                ✓ Offer broadcast to nearby users!
              </div>
            )}
            <input
              type="text"
              placeholder="e.g. 20% off on Harpic Lemon"
              value={broadcastTitle}
              onChange={e => setBroadcastTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{ background: '#FAF8F5', border: '2px solid #E5E3DF' }}
            />

            <textarea
              placeholder="Short message customers will see"
              value={broadcastMessage}
              onChange={e => setBroadcastMessage(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
              style={{ background: '#FAF8F5', border: '2px solid #E5E3DF' }}
            />

            <div className="flex items-center gap-3">
              <input
                type="number"
                placeholder="24"
                value={broadcastHours}
                onChange={e => setBroadcastHours(e.target.value)}
                className="w-20 px-4 py-3 rounded-xl text-sm outline-none text-center font-bold"
                style={{ background: '#FAF8F5', border: '2px solid #E5E3DF' }}
              />
              <span className="text-sm" style={{ color: '#6B6B6B' }}>hours validity</span>
            </div>

            <button
              onClick={handleBroadcastOffer}
              disabled={!broadcastTitle.trim() || !broadcastMessage.trim()}
              className="w-full py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ background: '#22C55E', color: '#FFFFFF' }}
            >
              <Send size={18} />
              Broadcast Offer
            </button>
          </div>
        </section>

        {/* Local Search Analytics */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold" style={{ color: '#1A1A1A' }}>Local Search Analytics</h2>
            <span className="text-sm" style={{ color: '#6B6B6B' }}>See what people search</span>
          </div>

          <div className="p-6 rounded-2xl text-center" style={{ background: '#FFFFFF' }}>
            <p className="text-sm" style={{ color: '#9A9895' }}>
              No searches yet. When customers broadcast, trending items will appear here (e.g. Harpic, ice cream, pads, cake, bulb...).
            </p>
          </div>
        </section>

        {/* My Orders & Reservations (User View) */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold" style={{ color: '#1A1A1A' }}>My Orders & Reservations</h2>
            <span className="text-sm" style={{ color: '#6B6B6B' }}>Token, 50% holds & deliveries</span>
          </div>

          {reservations.filter(r => r.status === 'active').length === 0 ? (
            <div className="text-center py-12 rounded-2xl" style={{ background: '#FFFFFF' }}>
              <div className="text-5xl mb-3">📋</div>
              <p className="text-sm" style={{ color: '#9A9895' }}>
                No reservations yet. Reserve with ₹20 token or 50% downpayment when a shop responds.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {reservations.filter(r => r.status === 'active').map((reservation) => (
                <div key={reservation.id} className="p-4 rounded-2xl" style={{ background: '#FFFFFF' }}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="text-base font-bold" style={{ color: '#1A1A1A' }}>{reservation.item}</h3>
                      <p className="text-sm mt-1" style={{ color: '#6B6B6B' }}>
                        {reservation.shop_name} • ~{Math.round(0.1 * 1000)}m away
                      </p>
                      <p className="text-sm mt-1" style={{ color: '#6B6B6B' }}>
                        Hold window: {getHoldWindow(reservation.hold_window)}
                      </p>
                      <p className="text-sm mt-1" style={{ color: '#6B6B6B' }}>
                        Mode: ₹{reservation.token_paid} token
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: '#22C55E20', color: '#22C55E' }}>
                        Active
                      </span>
                      <p className="text-sm mt-2 font-bold" style={{ color: '#1A1A1A' }}>
                        Token / Paid: ₹{reservation.token_paid}
                      </p>
                      <p className="text-xs mt-1" style={{ color: '#6B6B6B' }}>
                        Created: {new Date(reservation.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Local Offers Near You */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold" style={{ color: '#1A1A1A' }}>Local Offers Near You</h2>
            <span className="text-sm" style={{ color: '#6B6B6B' }}>Broadcasted by nearby stores</span>
          </div>

          {offers.length === 0 ? (
            <div className="text-center py-12 rounded-2xl" style={{ background: '#FFFFFF' }}>
              <div className="text-5xl mb-3">🏷️</div>
              <p className="text-sm" style={{ color: '#9A9895' }}>No active offers nearby yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {offers.map((offer) => (
                <div key={offer.id} className="p-4 rounded-2xl" style={{ background: '#D1FAE5', border: '2px solid #10B981' }}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold" style={{ color: '#065F46' }}>{offer.title}</h3>
                      <p className="text-sm mt-1" style={{ color: '#047857' }}>first come first serve</p>
                      <p className="text-sm mt-1 font-semibold" style={{ color: '#065F46' }}>From: Kirana King</p>
                    </div>
                    <div className="text-right">
                      <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: '#FFFFFF', color: '#059669' }}>
                        Limited Time
                      </span>
                      <p className="text-sm mt-2" style={{ color: '#047857' }}>
                        Ends in {getHoldWindow(Math.floor((offer.ends_at - Date.now()) / 60000))}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Schedule Modal */}
      <AnimatePresence>
        {showScheduleModal && selectedBroadcast && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowScheduleModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md p-6 rounded-2xl"
              style={{ background: '#FFFFFF' }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold" style={{ color: '#1A1A1A' }}>CHECKOUT</h3>
                <button onClick={() => setShowScheduleModal(false)}>
                  <X size={24} style={{ color: '#6B6B6B' }} />
                </button>
              </div>

              <div className="mb-4">
                <h4 className="text-base font-bold" style={{ color: '#1A1A1A' }}>{selectedBroadcast.query}</h4>
                <p className="text-sm mt-1" style={{ color: '#9A9895' }}>
                  Scheduled item • You are ~{Math.round(selectedBroadcast.distance_km * 1000)}m away
                </p>
              </div>

              <div className="mb-4">
                <h3 className="text-xl font-bold mb-2" style={{ color: '#1A1A1A' }}>Schedule For Later</h3>
                <p className="text-sm mb-2" style={{ color: '#6B6B6B' }}>Store: {shopName}</p>
              </div>

              <div className="p-4 rounded-xl mb-4" style={{ background: '#FEF3C7' }}>
                <p className="text-sm" style={{ color: '#92400E' }}>
                  To schedule this item for tonight / tomorrow morning, a <span className="font-bold">₹20 token advance</span> is required.
                  If the merchant fails to keep it, you get a <span className="font-bold">₹20 money-back discount</span> to use at any other store in the app.
                </p>
              </div>

              <button
                onClick={() => handleScheduleConfirm(20)}
                className="w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2"
                style={{ background: '#1A1A1A', color: '#F5C842' }}
              >
                ₹ Pay ₹20 & Schedule
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auto Close Reminder */}
      <AnimatePresence>
        {showCloseReminder && (
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
              className="w-full max-w-md p-6 rounded-2xl"
              style={{ background: '#FFFFFF' }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold" style={{ color: '#1A1A1A' }}>AUTO STORE REMINDER</h3>
                  <h2 className="text-2xl font-bold mt-1" style={{ color: '#1A1A1A' }}>Are you CLOSING now?</h2>
                </div>
                <button onClick={() => setShowCloseReminder(false)}>
                  <X size={24} style={{ color: '#6B6B6B' }} />
                </button>
              </div>

              <p className="text-sm mb-4" style={{ color: '#6B6B6B' }}>
                Tap CLOSED if you are done for the day. If you are still serving, keep OPEN.
              </p>

              <p className="text-sm mb-6" style={{ color: '#9A9895' }}>
                This simulates the automatic notification you will get at your configured opening and closing times.
              </p>

              <div className="flex gap-3">
                <button onClick={handleSnooze}
                  className="flex-1 py-3 rounded-xl font-semibold text-sm"
                  style={{ background: '#F3F4F6', color: '#6B6B6B' }}
                >
                  Snooze 15 min
                </button>
                <button
                  onClick={() => {
                    setShowCloseReminder(false)
                    const merchantData = JSON.parse(localStorage.getItem('merchant-data') || '{}')
                    localStorage.setItem('merchant-data', JSON.stringify({ ...merchantData, status: 'closed' }))
                  }}
                  className="flex-1 py-3 rounded-xl font-semibold text-sm"
                  style={{ background: '#FEE2E2', color: '#DC2626' }}
                >
                  Mark Closed
                </button>
                <button
                  onClick={() => setShowCloseReminder(false)}
                  className="flex-1 py-3 rounded-xl font-semibold text-sm"
                  style={{ background: '#22C55E', color: '#FFFFFF' }}
                >
                  I am Open
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 px-6 py-4" style={{ background: '#FFFFFF', borderTop: '1px solid #E5E3DF' }}>
        <div className="flex items-center justify-around max-w-md mx-auto">
          {[
            { icon: '🏠', label: 'Home', active: true, path: '/merchant' },
            { icon: '📦', label: 'Products', active: false, path: '/merchant/products' },
            { icon: '📊', label: 'Stats', active: false, path: '/merchant/stats' },
            { icon: '👤', label: 'Profile', active: false, path: '/merchant/profile' },
          ].map((tab, i) => (
            <button
              key={i}
              className="flex flex-col items-center gap-1 transition-transform active:scale-95"
              onClick={() => navigate(tab.path)}
            >
              <div className={`text-2xl ${tab.active ? 'scale-110' : 'opacity-50'}`}>{tab.icon}</div>
              <span className={`text-xs font-medium ${tab.active ? 'text-black' : 'text-gray-400'}`}>
                {tab.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default MerchantHomeEnhanced
