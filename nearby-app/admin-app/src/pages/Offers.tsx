import React, { useState, useEffect } from 'react'
import { Loader2, Plus, Pause, Play, Trash2, X } from 'lucide-react'
import Layout from '../components/Layout'
import { apiService, Offer } from '../services/api.service'

const Offers: React.FC = () => {
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newOffer, setNewOffer] = useState({
    title: '',
    description: '',
    expiresAt: '',
  })

  useEffect(() => {
    loadOffers()
  }, [])

  const loadOffers = async () => {
    try {
      const data = await apiService.getOffers()
      setOffers(data)
    } catch (error) {
      console.error('Failed to load offers:', error)
      setOffers([
        {
          offerId: 'O001',
          title: '20% Off on Electronics',
          description: 'Get 20% discount on all electronics',
          status: 'active',
          createdAt: '2026-03-01',
          isGlobal: true,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!newOffer.title || !newOffer.description) {
      alert('Please fill in all fields')
      return
    }

    setCreating(true)
    try {
      await apiService.createOffer({
        ...newOffer,
        status: 'active',
        isGlobal: true,
      })
      await loadOffers()
      setShowCreateModal(false)
      setNewOffer({ title: '', description: '', expiresAt: '' })
    } catch (error) {
      console.error('Failed to create offer:', error)
      alert('Failed to create offer')
    } finally {
      setCreating(false)
    }
  }

  const handleToggleStatus = async (offerId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active'
    try {
      await apiService.updateOfferStatus(offerId, newStatus)
      setOffers(prev => prev.map(o => o.offerId === offerId ? { ...o, status: newStatus } : o))
    } catch (error) {
      console.error('Failed to update offer status:', error)
    }
  }

  const handleDelete = async (offerId: string) => {
    if (!confirm('Are you sure you want to delete this offer?')) return
    try {
      await apiService.deleteOffer(offerId)
      setOffers(prev => prev.filter(o => o.offerId !== offerId))
    } catch (error) {
      console.error('Failed to delete offer:', error)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 size={48} className="animate-spin text-green-600" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Offers</h1>
            <p className="text-sm text-gray-500 mt-1">Manage global and merchant offers</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            <Plus size={18} />
            Add Global Offer
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Title</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Merchant</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Expires</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {offers.map((offer) => (
                <tr key={offer.offerId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{offer.title}</p>
                      <p className="text-sm text-gray-500">{offer.description}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                        offer.isGlobal
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {offer.isGlobal ? 'Global' : offer.merchantName || 'Merchant'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                        offer.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {offer.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {offer.expiresAt ? new Date(offer.expiresAt).toLocaleDateString() : 'No expiry'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleToggleStatus(offer.offerId, offer.status)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title={offer.status === 'active' ? 'Pause' : 'Activate'}
                      >
                        {offer.status === 'active' ? (
                          <Pause size={16} className="text-gray-600" />
                        ) : (
                          <Play size={16} className="text-green-600" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(offer.offerId)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} className="text-gray-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Create Offer Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Add Global Offer</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Title</label>
                  <input
                    type="text"
                    value={newOffer.title}
                    onChange={(e) => setNewOffer({ ...newOffer, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-green-600"
                    placeholder="e.g., 20% Off on Electronics"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Description</label>
                  <textarea
                    value={newOffer.description}
                    onChange={(e) => setNewOffer({ ...newOffer, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-green-600"
                    rows={3}
                    placeholder="Offer details..."
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Expires At (Optional)</label>
                  <input
                    type="date"
                    value={newOffer.expiresAt}
                    onChange={(e) => setNewOffer({ ...newOffer, expiresAt: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-green-600"
                  />
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 flex gap-3">
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
                >
                  {creating ? <Loader2 size={18} className="animate-spin mx-auto" /> : 'Create Offer'}
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default Offers
