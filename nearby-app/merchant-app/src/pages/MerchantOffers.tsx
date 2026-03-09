import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Tag, Clock, Pause, Play, Trash2, Plus, TrendingUp } from 'lucide-react'

interface Offer {
  offerId: string
  offer: string
  message: string
  shopName: string
  category: string
  validityHours: number
  createdAt: string
  expiresAt: number
  status: string
  views: number
  clicks: number
  isExpired: boolean
  isActive: boolean
}

const MerchantOffers: React.FC = () => {
  const navigate = useNavigate()
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchOffers()
  }, [])

  const fetchOffers = async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
      const token = localStorage.getItem('auth-token')
      
      if (!token) return

      const response = await fetch(`${API_BASE_URL}/merchant/broadcast-offers`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setOffers(data.data?.offers || data.offers || [])
      }
    } catch (error) {
      console.error('Error fetching offers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (offerId: string, action: string, extendHours?: number) => {
    setActionLoading(offerId)
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
      const token = localStorage.getItem('auth-token')
      
      if (!token) return

      const response = await fetch(`${API_BASE_URL}/merchant/broadcast-offers/${offerId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action, extendHours })
      })

      if (response.ok) {
        await fetchOffers()
        const actionText = action === 'extend' ? 'extended' : action + 'd'
        alert(`✅ Offer ${actionText} successfully!`)
      } else {
        throw new Error('Failed to update offer')
      }
    } catch (error) {
      console.error('Error updating offer:', error)
      alert('❌ Failed to update offer')
    } finally {
      setActionLoading(null)
    }
  }

  const getTimeRemaining = (expiresAt: number) => {
    const now = Date.now()
    const diff = expiresAt - now
    
    if (diff <= 0) return 'Expired'
    
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 24) {
      const days = Math.floor(hours / 24)
      return `${days}d ${hours % 24}h left`
    }
    if (hours > 0) return `${hours}h ${minutes}m left`
    return `${minutes}m left`
  }

  const activeOffers = offers.filter(o => o.isActive)
  const pausedOffers = offers.filter(o => o.status === 'paused')
  const expiredOffers = offers.filter(o => o.isExpired)

  return (
    <div className="min-h-screen pb-24" style={{ background: '#FAF8F5' }}>
      {/* Header */}
      <div className="px-4 sm:px-6 pt-6 pb-4" style={{ background: '#2C3E50' }}>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/')} className="p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <ArrowLeft size={20} className="text-white" />
              </button>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white">My Broadcast Offers</h1>
                <p className="text-sm text-gray-300">Manage your promotional offers</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 rounded-lg font-semibold flex items-center gap-2"
              style={{ background: '#22C55E', color: '#FFFFFF' }}
            >
              <Plus size={18} />
              <span className="hidden sm:inline">New Offer</span>
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <div className="text-2xl font-bold text-white">{activeOffers.length}</div>
              <div className="text-xs text-gray-300">Active</div>
            </div>
            <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <div className="text-2xl font-bold text-white">{pausedOffers.length}</div>
              <div className="text-xs text-gray-300">Paused</div>
            </div>
            <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <div className="text-2xl font-bold text-white">{offers.reduce((sum, o) => sum + (o.views || 0), 0)}</div>
              <div className="text-xs text-gray-300">Total Views</div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-6 max-w-4xl mx-auto space-y-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading offers...</p>
          </div>
        ) : offers.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <Tag size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Offers Yet</h3>
            <p className="text-gray-600 mb-6">Create your first broadcast offer to reach nearby customers</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 rounded-xl font-semibold"
              style={{ background: '#22C55E', color: '#FFFFFF' }}
            >
              Create Offer
            </button>
          </div>
        ) : (
          <>
            {/* Active Offers */}
            {activeOffers.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  Active Offers ({activeOffers.length})
                </h2>
                <div className="space-y-3">
                  {activeOffers.map((offer) => (
                    <OfferCard
                      key={offer.offerId}
                      offer={offer}
                      onAction={handleAction}
                      actionLoading={actionLoading}
                      getTimeRemaining={getTimeRemaining}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Paused Offers */}
            {pausedOffers.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  Paused Offers ({pausedOffers.length})
                </h2>
                <div className="space-y-3">
                  {pausedOffers.map((offer) => (
                    <OfferCard
                      key={offer.offerId}
                      offer={offer}
                      onAction={handleAction}
                      actionLoading={actionLoading}
                      getTimeRemaining={getTimeRemaining}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Expired Offers */}
            {expiredOffers.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                  Expired Offers ({expiredOffers.length})
                </h2>
                <div className="space-y-3">
                  {expiredOffers.map((offer) => (
                    <OfferCard
                      key={offer.offerId}
                      offer={offer}
                      onAction={handleAction}
                      actionLoading={actionLoading}
                      getTimeRemaining={getTimeRemaining}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

interface OfferCardProps {
  offer: Offer
  onAction: (offerId: string, action: string, extendHours?: number) => void
  actionLoading: string | null
  getTimeRemaining: (expiresAt: number) => string
}

const OfferCard: React.FC<OfferCardProps> = ({ offer, onAction, actionLoading, getTimeRemaining }) => {
  const isLoading = actionLoading === offer.offerId

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm p-4 border-l-4"
      style={{
        borderLeftColor: offer.isActive ? '#22C55E' : offer.status === 'paused' ? '#F59E0B' : '#9CA3AF'
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-gray-900">🎉 {offer.offer}</h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
              {offer.category}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-2">{offer.message}</p>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Clock size={14} />
              <span>{getTimeRemaining(offer.expiresAt)}</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp size={14} />
              <span>{offer.views || 0} views</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        {offer.isActive && (
          <>
            <button
              onClick={() => onAction(offer.offerId, 'pause')}
              disabled={isLoading}
              className="flex-1 py-2 rounded-lg text-sm font-semibold border-2 border-orange-500 text-orange-600 hover:bg-orange-50 disabled:opacity-50 flex items-center justify-center gap-1"
            >
              <Pause size={16} />
              Pause
            </button>
            <button
              onClick={() => {
                const hours = prompt('Extend by how many hours?', '12')
                if (hours) onAction(offer.offerId, 'extend', parseInt(hours))
              }}
              disabled={isLoading}
              className="flex-1 py-2 rounded-lg text-sm font-semibold border-2 border-blue-500 text-blue-600 hover:bg-blue-50 disabled:opacity-50 flex items-center justify-center gap-1"
            >
              <Clock size={16} />
              Extend
            </button>
          </>
        )}
        {offer.status === 'paused' && (
          <button
            onClick={() => onAction(offer.offerId, 'activate')}
            disabled={isLoading}
            className="flex-1 py-2 rounded-lg text-sm font-semibold bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-1"
          >
            <Play size={16} />
            Resume
          </button>
        )}
        <button
          onClick={() => {
            if (confirm('Are you sure you want to delete this offer?')) {
              onAction(offer.offerId, 'delete')
            }
          }}
          disabled={isLoading}
          className="px-4 py-2 rounded-lg text-sm font-semibold border-2 border-red-500 text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </motion.div>
  )
}

export default MerchantOffers
