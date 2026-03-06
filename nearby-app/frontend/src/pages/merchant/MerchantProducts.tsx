import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { merchantsService } from '@/services/merchants.service'
import { ArrowLeft, Plus, Edit, Trash2, Package, Search } from 'lucide-react'

interface Product {
  id: string
  name: string
  category: string
  price: number
  stock: number
  status: 'in_stock' | 'low_stock' | 'out_of_stock'
  image?: string
}

const MerchantProducts: React.FC = () => {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [toast, setToast] = useState('')
  const [loading, setLoading] = useState(true)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  // Mock products data (fallback)
  const [products, setProducts] = useState<Product[]>([])
  const mockProducts: Product[] = [
    {
      id: '1',
      name: 'Harpic Toilet Cleaner',
      category: 'Cleaning Supplies',
      price: 120,
      stock: 25,
      status: 'in_stock',
    },
    {
      id: '2',
      name: 'Colgate Toothpaste',
      category: 'Personal Care',
      price: 85,
      stock: 5,
      status: 'low_stock',
    },
    {
      id: '3',
      name: 'Maggi Noodles',
      category: 'Groceries',
      price: 12,
      stock: 0,
      status: 'out_of_stock',
    },
  ]

  // Load products from API on mount
  useEffect(() => {
    (async () => {
      try {
        const offers = await merchantsService.getOffers()
        if (offers && offers.length > 0) {
          setProducts(offers.map((o: any) => ({
            id: o.offerId || o.offer_id || o.id,
            name: o.productName || o.product_name || o.title || o.name || '',
            category: o.category || 'General',
            price: o.price || 0,
            stock: o.stock ?? o.maxReservations ?? 10,
            status: o.stock === 0 ? 'out_of_stock' : (o.stock != null && o.stock <= 5) ? 'low_stock' : 'in_stock',
          })))
        } else {
          setProducts(mockProducts)
        }
      } catch (e) {
        console.warn('Products API failed, using mock data:', e)
        setProducts(mockProducts)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock': return 'bg-green-100 text-green-700'
      case 'low_stock': return 'bg-yellow-100 text-yellow-700'
      case 'out_of_stock': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'in_stock': return 'In Stock'
      case 'low_stock': return 'Low Stock'
      case 'out_of_stock': return 'Out of Stock'
      default: return status
    }
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: '#FAF8F5' }}>
      {/* Header */}
      <div className="px-6 pt-14 pb-4" style={{ background: '#1A1A1A' }}>
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate('/merchant')}
            className="p-2 rounded-xl hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft size={24} style={{ color: '#FAF8F5' }} />
          </button>
          <h1 className="text-xl font-bold" style={{ color: '#FAF8F5' }}>My Products</h1>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl outline-none"
            style={{ background: '#2A2A2A', color: '#FAF8F5', border: '1px solid #3A3A3A' }}
          />
        </div>
      </div>

      <div className="px-6 py-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="p-4 rounded-xl text-center" style={{ background: '#FFFFFF' }}>
            <p className="text-2xl font-bold" style={{ color: '#22C55E' }}>{products.filter(p => p.status === 'in_stock').length}</p>
            <p className="text-xs mt-1" style={{ color: '#6B6B6B' }}>In Stock</p>
          </div>
          <div className="p-4 rounded-xl text-center" style={{ background: '#FFFFFF' }}>
            <p className="text-2xl font-bold" style={{ color: '#F59E0B' }}>{products.filter(p => p.status === 'low_stock').length}</p>
            <p className="text-xs mt-1" style={{ color: '#6B6B6B' }}>Low Stock</p>
          </div>
          <div className="p-4 rounded-xl text-center" style={{ background: '#FFFFFF' }}>
            <p className="text-2xl font-bold" style={{ color: '#EF4444' }}>{products.filter(p => p.status === 'out_of_stock').length}</p>
            <p className="text-xs mt-1" style={{ color: '#6B6B6B' }}>Out of Stock</p>
          </div>
        </div>

        {/* Add Product Button */}
        <button
          onClick={() => showToast('Add product feature — coming soon')}
          className="w-full mb-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
          style={{ background: '#22C55E', color: '#FFFFFF' }}
        >
          <Plus size={20} />
          Add New Product
        </button>

        {/* Products List */}
        <div className="space-y-3">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 rounded-xl" style={{ background: '#FFFFFF' }}>
              <Package size={48} className="mx-auto mb-3 text-gray-300" />
              <p className="text-sm" style={{ color: '#6B6B6B' }}>No products found</p>
            </div>
          ) : (
            filteredProducts.map((product) => (
              <div key={product.id} className="p-4 rounded-xl" style={{ background: '#FFFFFF' }}>
                <div className="flex items-start gap-3">
                  <div className="w-16 h-16 rounded-lg flex items-center justify-center" style={{ background: '#F3F4F6' }}>
                    <Package size={32} className="text-gray-400" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <h3 className="font-bold" style={{ color: '#1A1A1A' }}>{product.name}</h3>
                        <p className="text-sm" style={{ color: '#6B6B6B' }}>{product.category}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(product.status)}`}>
                        {getStatusText(product.status)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div>
                        <p className="text-lg font-bold" style={{ color: '#1A1A1A' }}>₹{product.price}</p>
                        <p className="text-xs" style={{ color: '#6B6B6B' }}>Stock: {product.stock} units</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => showToast(`Editing ${product.name} — coming soon`)}
                          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <Edit size={18} className="text-gray-600" />
                        </button>
                        <button
                          onClick={() => setProducts(prev => prev.filter(p => p.id !== product.id))}
                          className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={18} className="text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 px-6 py-4" style={{ background: '#FFFFFF', borderTop: '1px solid #E5E3DF' }}>
        <div className="flex items-center justify-around max-w-md mx-auto">
          {[
            { icon: '🏠', label: 'Home', active: false, path: '/merchant' },
            { icon: '📦', label: 'Products', active: true, path: '/merchant/products' },
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

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl text-sm font-semibold shadow-lg bg-gray-900 text-white whitespace-nowrap">
          {toast}
        </div>
      )}
    </div>
  )
}

export default MerchantProducts
