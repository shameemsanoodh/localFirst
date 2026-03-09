import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, Loader2, MapPin, Phone, Ban, CheckCircle, Trash2, Eye, X } from 'lucide-react'
import Layout from '../components/Layout'
import { apiService, Merchant } from '../services/api.service'

const Merchants: React.FC = () => {
  const [merchants, setMerchants] = useState<Merchant[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [cityFilter, setCityFilter] = useState('all')
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null)

  useEffect(() => {
    loadMerchants()
  }, [])

  const loadMerchants = async () => {
    try {
      const data = await apiService.getMerchants()
      setMerchants(data)
    } catch (error) {
      console.error('Failed to load merchants:', error)
      // Mock data fallback
      setMerchants([
        {
          merchantId: 'M001',
          shopName: 'Ram Mobile Centre',
          ownerName: 'Ram Kumar',
          email: 'ram@example.com',
          phone: '9876543210',
          majorCategory: 'Electronics',
          subCategory: 'Mobile Phones',
          location: { lat: 12.9716, lng: 77.5946 },
          address: '123 MG Road, Bangalore',
          status: 'active',
          createdAt: '2026-02-15',
          onboardingCompleted: true,
        },
        {
          merchantId: 'M002',
          shopName: 'Fresh Fruits Store',
          ownerName: 'Priya Sharma',
          email: 'priya@example.com',
          phone: '9876543211',
          majorCategory: 'Food',
          subCategory: 'Fruits & Vegetables',
          location: { lat: 12.9716, lng: 77.5946 },
          address: '456 Brigade Road, Bangalore',
          status: 'active',
          createdAt: '2026-02-20',
          onboardingCompleted: true,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleSuspend = async (merchantId: string) => {
    try {
      await apiService.suspendMerchant(merchantId)
      setMerchants(prev =>
        prev.map(m => (m.merchantId === merchantId ? { ...m, status: 'suspended' as const } : m))
      )
    } catch (error) {
      console.error('Failed to suspend merchant:', error)
    }
  }

  const handleActivate = async (merchantId: string) => {
    try {
      await apiService.activateMerchant(merchantId)
      setMerchants(prev =>
        prev.map(m => (m.merchantId === merchantId ? { ...m, status: 'active' as const } : m))
      )
    } catch (error) {
      console.error('Failed to activate merchant:', error)
    }
  }

  const handleApprove = async (merchantId: string) => {
    try {
      await apiService.approveMerchant(merchantId)
      setMerchants(prev =>
        prev.map(m => (m.merchantId === merchantId ? { ...m, status: 'active' as const } : m))
      )
    } catch (error) {
      console.error('Failed to approve merchant:', error)
    }
  }

  const handleDelete = async (merchantId: string) => {
    if (!confirm('Are you sure you want to delete this merchant?')) return
    try {
      await apiService.deleteMerchant(merchantId)
      setMerchants(prev => prev.filter(m => m.merchantId !== merchantId))
    } catch (error) {
      console.error('Failed to delete merchant:', error)
    }
  }

  const filteredMerchants = merchants.filter(m => {
    const matchesSearch =
      m.shopName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.phone.includes(searchQuery)
    const matchesCategory = categoryFilter === 'all' || m.majorCategory === categoryFilter
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter
    const matchesCity = cityFilter === 'all' || m.city === cityFilter
    return matchesSearch && matchesCategory && matchesStatus && matchesCity
  })

  const categories = Array.from(new Set(merchants.map(m => m.majorCategory)))
  const cities = Array.from(new Set(merchants.map(m => m.city).filter(Boolean)))

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 size={48} className="animate-spin text-blue-600" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Merchants</h1>
          <p className="text-sm text-gray-500 mt-1">Manage merchant accounts</p>
        </div>

        {/* Search and Filter */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Cities</option>
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Merchants Grid */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Shop Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Owner</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">City</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Response Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredMerchants.map((merchant, index) => (
                  <motion.tr
                    key={merchant.merchantId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{merchant.shopName}</div>
                      <div className="text-xs text-gray-500">{merchant.subCategory}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{merchant.ownerName}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone size={14} />
                        {merchant.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                        {merchant.majorCategory}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <MapPin size={14} />
                        {merchant.city || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[80px]">
                          <div
                            className={`h-2 rounded-full ${
                              (merchant.responseRate || 0) >= 80
                                ? 'bg-green-500'
                                : (merchant.responseRate || 0) >= 50
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${merchant.responseRate || 0}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-gray-900 min-w-[40px]">
                          {merchant.responseRate || 0}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          merchant.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : merchant.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {merchant.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedMerchant(merchant)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        {merchant.status === 'pending' ? (
                          <button
                            onClick={() => handleApprove(merchant.merchantId)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Approve"
                          >
                            <CheckCircle size={16} />
                          </button>
                        ) : merchant.status === 'active' ? (
                          <button
                            onClick={() => handleSuspend(merchant.merchantId)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Suspend"
                          >
                            <Ban size={16} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleActivate(merchant.merchantId)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Activate"
                          >
                            <CheckCircle size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(merchant.merchantId)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredMerchants.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No merchants found</p>
          </div>
        )}

        {/* Merchant Detail Drawer */}
        {selectedMerchant && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-end">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="bg-white h-full w-full max-w-2xl overflow-y-auto shadow-2xl"
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Merchant Details</h2>
                <button
                  onClick={() => setSelectedMerchant(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Basic Info */}
                <div className="bg-gray-50 p-4 rounded-xl">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Basic Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-gray-500">Shop Name</label>
                      <p className="text-base font-semibold text-gray-900">{selectedMerchant.shopName}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Owner Name</label>
                      <p className="text-base font-semibold text-gray-900">{selectedMerchant.ownerName}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Phone</label>
                      <p className="text-base font-semibold text-gray-900">{selectedMerchant.phone}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Email</label>
                      <p className="text-base font-semibold text-gray-900">{selectedMerchant.email}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Address</label>
                      <p className="text-base font-semibold text-gray-900">{selectedMerchant.address}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">City</label>
                      <p className="text-base font-semibold text-gray-900">{selectedMerchant.city || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Category Info */}
                <div className="bg-gray-50 p-4 rounded-xl">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Category</h3>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-700">
                      {selectedMerchant.majorCategory}
                    </span>
                    <span className="px-3 py-1 rounded-full text-sm font-semibold bg-gray-100 text-gray-700">
                      {selectedMerchant.subCategory}
                    </span>
                  </div>
                </div>

                {/* Capabilities */}
                <div className="bg-gray-50 p-4 rounded-xl">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Capabilities</h3>
                  {selectedMerchant.capabilitiesEnabled && selectedMerchant.capabilitiesEnabled.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedMerchant.capabilitiesEnabled.map((cap, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700"
                        >
                          {cap}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No capabilities configured</p>
                  )}
                </div>

                {/* Response Rate */}
                <div className="bg-gray-50 p-4 rounded-xl">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Performance</h3>
                  <div>
                    <label className="text-sm text-gray-500">Response Rate</label>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full ${
                            (selectedMerchant.responseRate || 0) >= 80
                              ? 'bg-green-500'
                              : (selectedMerchant.responseRate || 0) >= 50
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${selectedMerchant.responseRate || 0}%` }}
                        />
                      </div>
                      <span className="text-lg font-bold text-gray-900">
                        {selectedMerchant.responseRate || 0}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Broadcast History */}
                <div className="bg-gray-50 p-4 rounded-xl">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Broadcasts</h3>
                  {selectedMerchant.broadcastHistory && selectedMerchant.broadcastHistory.length > 0 ? (
                    <div className="space-y-3">
                      {selectedMerchant.broadcastHistory.slice(0, 5).map((broadcast, idx) => (
                        <div key={idx} className="bg-white p-3 rounded-lg border border-gray-200">
                          <p className="text-sm font-semibold text-gray-900">{broadcast.query}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span
                              className={`px-2 py-1 rounded text-xs font-semibold ${
                                broadcast.responseType === 'YES'
                                  ? 'bg-green-100 text-green-700'
                                  : broadcast.responseType === 'NO'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}
                            >
                              {broadcast.responseType}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(broadcast.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No broadcast history</p>
                  )}
                </div>

                {/* Status */}
                <div className="bg-gray-50 p-4 rounded-xl">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Status</h3>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-4 py-2 rounded-full text-sm font-semibold ${
                        selectedMerchant.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : selectedMerchant.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {selectedMerchant.status.toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-500">
                      Joined {new Date(selectedMerchant.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default Merchants
