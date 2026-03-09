import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Edit2, Trash2, Upload, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Product {
  id: string
  name: string
  category: string
  price: number
  stock: 'in_stock' | 'low_stock' | 'out_of_stock'
  image?: string
}

const MerchantProducts: React.FC = () => {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [newProduct, setNewProduct] = useState<{
    name: string
    category: string
    price: number
    stock: 'in_stock' | 'low_stock' | 'out_of_stock'
    image: string
  }>({
    name: '',
    category: '',
    price: 0,
    stock: 'in_stock',
    image: ''
  })
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch products from backend
  React.useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
      const token = localStorage.getItem('auth-token')
      
      if (!token) {
        console.log('No auth token found')
        setLoading(false)
        return
      }

      const response = await fetch(`${API_BASE_URL}/merchant/products`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Products response:', data)
        const backendProducts = data.data?.products || []
        // Map backend productId to frontend id
        const mappedProducts = backendProducts.map((p: any) => ({
          id: p.productId,
          name: p.name,
          category: p.category,
          price: p.price,
          stock: p.status || (p.stock === 0 ? 'out_of_stock' : p.stock <= 5 ? 'low_stock' : 'in_stock'),
          image: p.image
        }))
        console.log('Mapped products:', mappedProducts)
        setProducts(mappedProducts)
      } else {
        console.error('Failed to fetch products:', response.status)
        const errorData = await response.json()
        console.error('Error details:', errorData)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setNewProduct(prev => ({ ...prev, image: reader.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.category || newProduct.price <= 0) return

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
      const token = localStorage.getItem('auth-token')

      const response = await fetch(`${API_BASE_URL}/merchant/products`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newProduct.name,
          category: newProduct.category,
          price: newProduct.price,
          stock: newProduct.stock === 'in_stock' ? 10 : newProduct.stock === 'low_stock' ? 3 : 0,
          image: newProduct.image
        })
      })

      if (response.ok) {
        await fetchProducts() // Refresh the list
        setNewProduct({ name: '', category: '', price: 0, stock: 'in_stock', image: '' })
        setShowAddModal(false)
      }
    } catch (error) {
      console.error('Error adding product:', error)
    }
  }

  const handleDeleteProduct = async (id: string) => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
      const token = localStorage.getItem('auth-token')

      const response = await fetch(`${API_BASE_URL}/merchant/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        setProducts(prev => prev.filter(p => p.id !== id))
      }
    } catch (error) {
      console.error('Error deleting product:', error)
    }
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setNewProduct({
      name: product.name,
      category: product.category,
      price: product.price,
      stock: product.stock as 'in_stock' | 'low_stock' | 'out_of_stock',
      image: product.image || ''
    })
    setShowAddModal(true)
  }

  const handleUpdateProduct = async () => {
    if (!editingProduct) return

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
      const token = localStorage.getItem('auth-token')

      const response = await fetch(`${API_BASE_URL}/merchant/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newProduct.name,
          category: newProduct.category,
          price: newProduct.price,
          stock: newProduct.stock === 'in_stock' ? 10 : newProduct.stock === 'low_stock' ? 3 : 0,
          image: newProduct.image
        })
      })

      if (response.ok) {
        await fetchProducts() // Refresh the list
        setEditingProduct(null)
        setNewProduct({ name: '', category: '', price: 0, stock: 'in_stock', image: '' })
        setShowAddModal(false)
      }
    } catch (error) {
      console.error('Error updating product:', error)
    }
  }

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const stockCounts = {
    in_stock: products.filter(p => p.stock === 'in_stock').length,
    low_stock: products.filter(p => p.stock === 'low_stock').length,
    out_of_stock: products.filter(p => p.stock === 'out_of_stock').length,
  }

  const getStockColor = (stock: string) => {
    switch (stock) {
      case 'in_stock': return { bg: '#D1FAE5', text: '#065F46', label: 'In Stock' }
      case 'low_stock': return { bg: '#FEF3C7', text: '#92400E', label: 'Low Stock' }
      case 'out_of_stock': return { bg: '#FEE2E2', text: '#991B1B', label: 'Out of Stock' }
      default: return { bg: '#F3F4F6', text: '#6B7280', label: 'Unknown' }
    }
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: '#FAF8F5' }}>
      {/* Header */}
      <div className="px-4 sm:px-6 pt-6 pb-4" style={{ background: '#2C3E50' }}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => navigate('/')} className="p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <ArrowLeft size={20} className="text-white" />
            </button>
            <h1 className="text-xl font-bold text-white">My Products</h1>
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 rounded-xl outline-none text-sm"
            style={{ background: 'rgba(255,255,255,0.9)' }}
          />
        </div>
      </div>

      <div className="px-4 sm:px-6 py-4 max-w-2xl mx-auto space-y-4">
        {/* Stock Summary */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-xl text-center" style={{ background: '#FFFFFF' }}>
            <div className="text-2xl font-bold text-green-600">{stockCounts.in_stock}</div>
            <div className="text-xs text-gray-600">In Stock</div>
          </div>
          <div className="p-3 rounded-xl text-center" style={{ background: '#FFFFFF' }}>
            <div className="text-2xl font-bold text-orange-600">{stockCounts.low_stock}</div>
            <div className="text-xs text-gray-600">Low Stock</div>
          </div>
          <div className="p-3 rounded-xl text-center" style={{ background: '#FFFFFF' }}>
            <div className="text-2xl font-bold text-red-600">{stockCounts.out_of_stock}</div>
            <div className="text-xs text-gray-600">Out of Stock</div>
          </div>
        </div>

        {/* Add Product Button */}
        <button
          onClick={() => {
            setEditingProduct(null)
            setNewProduct({ name: '', category: '', price: 0, stock: 'in_stock', image: '' })
            setShowAddModal(true)
          }}
          className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2"
          style={{ background: '#22C55E' }}
        >
          <Plus size={20} />
          Add New Product
        </button>

        {/* Products List */}
        <div className="space-y-2">
          {filteredProducts.map((product) => {
            const stockInfo = getStockColor(product.stock)
            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl shadow-sm flex items-center gap-3"
                style={{ background: '#FFFFFF' }}
              >
                {product.image ? (
                  <img src={product.image} alt={product.name} className="w-12 h-12 rounded-lg object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl" style={{ background: '#F3F4F6' }}>
                    📦
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 text-sm truncate">{product.name}</h3>
                  <p className="text-xs text-gray-600">{product.category}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-bold text-gray-900">₹{product.price}</span>
                    <span 
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                      style={{ background: stockInfo.bg, color: stockInfo.text }}
                    >
                      {stockInfo.label}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditProduct(product)}
                    className="p-2 rounded-lg"
                    style={{ background: '#F3F4F6' }}
                  >
                    <Edit2 size={16} className="text-gray-600" />
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(product.id)}
                    className="p-2 rounded-lg"
                    style={{ background: '#FEE2E2' }}
                  >
                    <Trash2 size={16} className="text-red-600" />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12 rounded-xl" style={{ background: '#FFFFFF' }}>
            <span className="text-5xl mb-3 block">📦</span>
            <p className="text-sm text-gray-600">No products found</p>
          </div>
        )}
      </div>

      {/* Add/Edit Product Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md p-6 rounded-2xl max-h-[90vh] overflow-y-auto"
              style={{ background: '#FFFFFF' }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h3>
                <button onClick={() => setShowAddModal(false)}>
                  <X size={24} className="text-gray-600" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Image Upload */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Product Image</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full p-4 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center gap-2 hover:border-gray-400"
                  >
                    {newProduct.image ? (
                      <img src={newProduct.image} alt="Preview" className="w-24 h-24 rounded-lg object-cover" />
                    ) : (
                      <>
                        <Upload size={32} className="text-gray-400" />
                        <span className="text-sm text-gray-600">Click to upload image</span>
                      </>
                    )}
                  </button>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Product Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Harpic Toilet Cleaner"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 outline-none focus:border-gray-900"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Category</label>
                  <input
                    type="text"
                    placeholder="e.g. Cleaning Supplies"
                    value={newProduct.category}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 outline-none focus:border-gray-900"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Price (₹)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={newProduct.price || ''}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, price: Number(e.target.value) }))}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 outline-none focus:border-gray-900"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Stock Status</label>
                  <select
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, stock: e.target.value as any }))}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 outline-none focus:border-gray-900"
                  >
                    <option value="in_stock">In Stock</option>
                    <option value="low_stock">Low Stock</option>
                    <option value="out_of_stock">Out of Stock</option>
                  </select>
                </div>

                <button
                  onClick={editingProduct ? handleUpdateProduct : handleAddProduct}
                  disabled={!newProduct.name || !newProduct.category || newProduct.price <= 0}
                  className="w-full py-3 rounded-xl font-bold text-white disabled:opacity-50"
                  style={{ background: '#22C55E' }}
                >
                  {editingProduct ? 'Update Product' : 'Add Product'}
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
            { icon: '🏠', label: 'Home', path: '/' },
            { icon: '📦', label: 'Products', path: '/products', active: true },
            { icon: '📊', label: 'Stats', path: '/stats' },
            { icon: '👤', label: 'Profile', path: '/profile' },
          ].map((tab, i) => (
            <button
              key={i}
              className="flex flex-col items-center gap-0.5 sm:gap-1 transition-transform active:scale-95"
              onClick={() => navigate(tab.path)}
            >
              <div className={`text-xl sm:text-2xl ${tab.active ? 'scale-110' : 'opacity-50'}`}>{tab.icon}</div>
              <span className={`text-[10px] sm:text-xs font-medium ${tab.active ? 'text-black' : 'text-gray-400'}`}>
                {tab.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default MerchantProducts
