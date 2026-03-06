import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, Loader2, MapPin, Mail, Phone, Ban, CheckCircle, Trash2 } from 'lucide-react'
import Layout from '../components/Layout'
import { apiService, Merchant } from '../services/api.service'

const Merchants: React.FC = () => {
  const [merchants, setMerchants] = useState<Merchant[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

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
    return matchesSearch && matchesCategory
  })

  const categories = Array.from(new Set(merchants.map(m => m.majorCategory)))

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
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Merchants Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredMerchants.map((merchant, index) => (
            <motion.div
              key={merchant.merchantId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white p-6 rounded-xl border border-gray-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{merchant.shopName}</h3>
                  <p className="text-sm text-gray-500">{merchant.ownerName}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    merchant.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {merchant.status}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail size={14} />
                  {merchant.email}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone size={14} />
                  {merchant.phone}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin size={14} />
                  {merchant.address}
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                  {merchant.majorCategory}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                  {merchant.subCategory}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {merchant.status === 'active' ? (
                  <button
                    onClick={() => handleSuspend(merchant.merchantId)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Ban size={16} />
                    Suspend
                  </button>
                ) : (
                  <button
                    onClick={() => handleActivate(merchant.merchantId)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  >
                    <CheckCircle size={16} />
                    Activate
                  </button>
                )}
                <button
                  onClick={() => handleDelete(merchant.merchantId)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredMerchants.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No merchants found</p>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default Merchants
