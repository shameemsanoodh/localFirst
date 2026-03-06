import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, MapPin, Clock, Users } from 'lucide-react'
import { useMerchantAPI } from '@/hooks/useMerchantAPI'

type ResponseType = 'yes' | 'alternative' | 'no' | null

const BroadcastDetail: React.FC = () => {
  const navigate = useNavigate()
  const { broadcastId } = useParams()
  const { replyToBroadcast } = useMerchantAPI()

  const [responseType, setResponseType] = useState<ResponseType>(null)
  const [price, setPrice] = useState('')
  const [availability, setAvailability] = useState<'in_stock' | 'order_available' | 'out_of_stock'>('in_stock')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [statusMsg, setStatusMsg] = useState<{ text: string; ok: boolean } | null>(null)

  // Mock broadcast data (in real app, fetch from API)
  const broadcast = {
    broadcast_id: broadcastId || '1',
    query: 'tempered glass for redmi note 10 pro',
    distance_km: 0.5,
    created_at: Date.now() - 2 * 60 * 1000,
    nearby_shops: 2,
  }

  const getTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000)
    if (seconds < 60) return `${seconds} seconds ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes} minutes ago`
    const hours = Math.floor(minutes / 60)
    return `${hours} hour${hours > 1 ? 's' : ''} ago`
  }

  const handleSendReply = async () => {
    if (!responseType) return

    setSending(true)
    try {
      const merchantData = JSON.parse(localStorage.getItem('merchant-data') || '{}')

      await replyToBroadcast(broadcast.broadcast_id, {
        shop_id: merchantData.userId || 'shop-123',
        shop_name: merchantData.shopName || 'My Shop',
        response_type: responseType,
        price: price ? parseFloat(price) : undefined,
        availability: responseType === 'yes' ? availability : undefined,
        message: message || undefined,
      })

      // Show success and navigate back
      setStatusMsg({ text: 'Reply sent! Redirecting…', ok: true })
      setTimeout(() => navigate('/merchant'), 1500)
    } catch (error) {
      console.error('Failed to send reply:', error)
      setStatusMsg({ text: 'Failed to send reply. Please try again.', ok: false })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: '#FAF8F5', fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div className="px-6 pt-14 pb-4" style={{ background: '#1A1A1A' }}>
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate('/merchant')}
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: '#2A2A2A' }}
          >
            <ArrowLeft size={20} style={{ color: '#F5C842' }} />
          </button>
          <h1 className="text-lg font-bold" style={{ color: '#FAF8F5' }}>Customer Query</h1>
        </div>
      </div>

      {/* Query Card */}
      <div className="px-6 py-6">
        <div className="p-5 rounded-2xl mb-6" style={{ background: '#FFFFFF', border: '2px solid #F5C842' }}>
          <p className="text-xl font-bold mb-4" style={{ color: '#1A1A1A' }}>
            "{broadcast.query}"
          </p>

          <div className="flex items-center gap-4 mb-3">
            <div className="flex items-center gap-1.5">
              <MapPin size={16} style={{ color: '#6B6B6B' }} />
              <span className="text-sm" style={{ color: '#6B6B6B' }}>
                {broadcast.distance_km.toFixed(1)} km away
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={16} style={{ color: '#6B6B6B' }} />
              <span className="text-sm" style={{ color: '#6B6B6B' }}>
                {getTimeAgo(broadcast.created_at)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: '#FF545410' }}>
            <Users size={16} style={{ color: '#FF5454' }} />
            <span className="text-sm font-semibold" style={{ color: '#FF5454' }}>
              {broadcast.nearby_shops} other shops nearby can help
            </span>
          </div>
        </div>

        {/* Response Options */}
        <h2 className="text-lg font-bold mb-4" style={{ color: '#1A1A1A' }}>Do you have this?</h2>

        <div className="space-y-3 mb-6">
          {/* Yes Option */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setResponseType('yes')}
            className="w-full p-4 rounded-2xl text-left transition-all"
            style={{
              background: responseType === 'yes' ? '#22C55E' : '#FFFFFF',
              border: '2px solid',
              borderColor: responseType === 'yes' ? '#22C55E' : '#E5E3DF',
              color: responseType === 'yes' ? '#FFFFFF' : '#1A1A1A',
            }}
          >
            <div className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${responseType === 'yes' ? 'border-white bg-white' : 'border-gray-300'}`}>
                {responseType === 'yes' && <div className="w-3 h-3 rounded-full" style={{ background: '#22C55E' }} />}
              </div>
              <div>
                <p className="font-bold">✓ Yes, I have it</p>
                <p className="text-sm opacity-80">Available now</p>
              </div>
            </div>
          </motion.button>

          {/* Alternative Option */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setResponseType('alternative')}
            className="w-full p-4 rounded-2xl text-left transition-all"
            style={{
              background: responseType === 'alternative' ? '#F5C842' : '#FFFFFF',
              border: '2px solid',
              borderColor: responseType === 'alternative' ? '#F5C842' : '#E5E3DF',
              color: responseType === 'alternative' ? '#1A1A1A' : '#1A1A1A',
            }}
          >
            <div className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${responseType === 'alternative' ? 'border-black bg-black' : 'border-gray-300'}`}>
                {responseType === 'alternative' && <div className="w-3 h-3 rounded-full" style={{ background: '#F5C842' }} />}
              </div>
              <div>
                <p className="font-bold">~ Alternative available</p>
                <p className="text-sm opacity-80">I have something similar</p>
              </div>
            </div>
          </motion.button>

          {/* No Option */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setResponseType('no')}
            className="w-full p-4 rounded-2xl text-left transition-all"
            style={{
              background: responseType === 'no' ? '#6B6B6B' : '#FFFFFF',
              border: '2px solid',
              borderColor: responseType === 'no' ? '#6B6B6B' : '#E5E3DF',
              color: responseType === 'no' ? '#FFFFFF' : '#1A1A1A',
            }}
          >
            <div className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${responseType === 'no' ? 'border-white bg-white' : 'border-gray-300'}`}>
                {responseType === 'no' && <div className="w-3 h-3 rounded-full" style={{ background: '#6B6B6B' }} />}
              </div>
              <div>
                <p className="font-bold">✗ No, I don't have it</p>
                <p className="text-sm opacity-80">Not in stock</p>
              </div>
            </div>
          </motion.button>
        </div>

        {/* Details Form (shown when Yes or Alternative selected) */}
        {(responseType === 'yes' || responseType === 'alternative') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 mb-6"
          >
            <div>
              <label className="text-sm font-semibold mb-2 block" style={{ color: '#6B6B6B' }}>
                Price (optional)
              </label>
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl" style={{ background: '#FFFFFF', border: '2px solid #E5E3DF' }}>
                <span className="text-lg font-semibold" style={{ color: '#6B6B6B' }}>₹</span>
                <input
                  type="number"
                  placeholder="299"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  className="flex-1 text-lg font-semibold bg-transparent outline-none"
                  style={{ color: '#1A1A1A' }}
                />
              </div>
            </div>

            {responseType === 'yes' && (
              <div>
                <label className="text-sm font-semibold mb-2 block" style={{ color: '#6B6B6B' }}>
                  Availability
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'in_stock', label: 'In stock now', icon: '✓' },
                    { value: 'order_available', label: 'Can order (2-3 days)', icon: '📦' },
                    { value: 'out_of_stock', label: 'Out of stock', icon: '✗' },
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => setAvailability(option.value as any)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all"
                      style={{
                        background: availability === option.value ? '#F5C84220' : '#FFFFFF',
                        border: '2px solid',
                        borderColor: availability === option.value ? '#F5C842' : '#E5E3DF',
                      }}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${availability === option.value ? 'border-black bg-black' : 'border-gray-300'}`}>
                        {availability === option.value && <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#F5C842' }} />}
                      </div>
                      <span className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>
                        {option.icon} {option.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-semibold mb-2 block" style={{ color: '#6B6B6B' }}>
                Message to customer (optional)
              </label>
              <textarea
                placeholder="Available for Redmi Note 10 Pro. Original quality"
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
                style={{ background: '#FFFFFF', border: '2px solid #E5E3DF', color: '#1A1A1A' }}
              />
            </div>
          </motion.div>
        )}

        {/* Status Message */}
        {statusMsg && (
          <div
            className="mb-4 p-3 rounded-xl text-center font-semibold text-sm"
            style={{
              background: statusMsg.ok ? '#D1FAE5' : '#FEE2E2',
              color: statusMsg.ok ? '#065F46' : '#DC2626',
            }}
          >
            {statusMsg.ok ? '✓ ' : '✗ '}{statusMsg.text}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleSendReply}
            disabled={!responseType || sending}
            className="w-full py-4 rounded-2xl font-bold text-lg transition-all disabled:opacity-50"
            style={{
              background: responseType ? '#1A1A1A' : '#CFCDC9',
              color: responseType ? '#F5C842' : '#9A9895',
            }}
          >
            {sending ? 'Sending...' : 'Send Reply →'}
          </button>

          <button
            onClick={() => navigate('/merchant')}
            className="w-full py-3 rounded-2xl font-semibold text-sm"
            style={{ background: '#EFEFEB', color: '#6B6B6B' }}
          >
            Skip for Now
          </button>
        </div>
      </div>
    </div>
  )
}

export default BroadcastDetail
