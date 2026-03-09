import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit2, Camera, MapPin, Phone, Clock, Save } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

const MerchantProfile: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const merchantData = JSON.parse(localStorage.getItem('merchant-data') || '{}')
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState({
    shopName: merchantData.shopName || merchantData.name || 'Loading...',
    ownerName: merchantData.ownerName || 'Shop Owner',
    phone: merchantData.phone || '+919999999999',
    whatsapp: merchantData.whatsapp || '',
    category: merchantData.category || 'General',
    address: merchantData.address || 'Downtown Area, ~1km radius',
    openHour: parseInt(merchantData.openTime?.split(':')[0] || '9'),
    closeHour: parseInt(merchantData.closeTime?.split(':')[0] || '21'),
    profileImage: merchantData.profileImage || '',
    merchantId: merchantData.merchantId || ''
  })

  // Fetch merchant profile from backend
  React.useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
      const token = localStorage.getItem('auth-token')
      
      if (!token) {
        setLoading(false)
        return
      }

      // For now, use data from localStorage since we already have it
      // In production, you'd fetch from /merchant/profile endpoint
      const data = JSON.parse(localStorage.getItem('merchant-data') || '{}')
      
      setProfile({
        shopName: data.shopName || data.name || 'Shop',
        ownerName: data.ownerName || 'Shop Owner',
        phone: data.phone || '',
        whatsapp: data.whatsapp || '',
        category: data.category || 'General',
        address: data.location?.address || 'Location not set',
        openHour: parseInt(data.openTime?.split(':')[0] || '9'),
        closeHour: parseInt(data.closeTime?.split(':')[0] || '21'),
        profileImage: data.profileImage || '',
        merchantId: data.merchantId || ''
      })
      
      setLoading(false)
    } catch (error) {
      console.error('Error fetching profile:', error)
      setLoading(false)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfile(prev => ({ ...prev, profileImage: reader.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = () => {
    const updatedData = { ...merchantData, ...profile }
    localStorage.setItem('merchant-data', JSON.stringify(updatedData))
    setIsEditing(false)
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: '#FAF8F5' }}>
      {/* Header */}
      <div className="px-4 sm:px-6 pt-6 pb-4" style={{ background: '#2C3E50' }}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/')} className="p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <ArrowLeft size={20} className="text-white" />
              </button>
              <h1 className="text-xl font-bold text-white">Shop Profile</h1>
            </div>
            <button
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              className="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
              style={{ background: isEditing ? '#22C55E' : 'rgba(255,255,255,0.1)', color: '#FFFFFF' }}
            >
              {isEditing ? (
                <>
                  <Save size={16} />
                  Save
                </>
              ) : (
                <>
                  <Edit2 size={16} />
                  Edit
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-4 max-w-2xl mx-auto space-y-4">
        {/* Profile Image */}
        <div className="p-6 rounded-xl shadow-sm text-center" style={{ background: '#FFFFFF' }}>
          <div className="relative inline-block">
            <div className="w-24 h-24 rounded-full overflow-hidden mx-auto" style={{ background: '#F3F4F6' }}>
              {profile.profileImage ? (
                <img src={profile.profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl">
                  🏪
                </div>
              )}
            </div>
            {isEditing && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-2 rounded-full shadow-lg"
                  style={{ background: '#22C55E' }}
                >
                  <Camera size={16} className="text-white" />
                </button>
              </>
            )}
          </div>
          <h2 className="text-xl font-bold text-gray-900 mt-4">{profile.shopName}</h2>
          <p className="text-sm text-gray-600">{profile.category}</p>
        </div>

        {/* Shop Information */}
        <div className="p-4 rounded-xl shadow-sm space-y-4" style={{ background: '#FFFFFF' }}>
          <h3 className="font-bold text-gray-900">Shop Information</h3>

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Shop Name</label>
            {isEditing ? (
              <input
                type="text"
                value={profile.shopName}
                onChange={(e) => setProfile(prev => ({ ...prev, shopName: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 outline-none focus:border-gray-900"
              />
            ) : (
              <p className="text-sm text-gray-900">{profile.shopName}</p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Owner Name</label>
            {isEditing ? (
              <input
                type="text"
                value={profile.ownerName}
                onChange={(e) => setProfile(prev => ({ ...prev, ownerName: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 outline-none focus:border-gray-900"
              />
            ) : (
              <p className="text-sm text-gray-900">{profile.ownerName}</p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Category</label>
            {isEditing ? (
              <select
                value={profile.category}
                onChange={(e) => setProfile(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 outline-none focus:border-gray-900"
              >
                <option value="Grocery">Grocery</option>
                <option value="Pharmacy">Pharmacy</option>
                <option value="Electronics">Electronics</option>
                <option value="Hardware">Hardware</option>
                <option value="Other">Other</option>
              </select>
            ) : (
              <p className="text-sm text-gray-900">{profile.category}</p>
            )}
          </div>
        </div>

        {/* Contact Information */}
        <div className="p-4 rounded-xl shadow-sm space-y-4" style={{ background: '#FFFFFF' }}>
          <h3 className="font-bold text-gray-900">Contact Information</h3>

          <div className="flex items-center gap-3">
            <Phone size={18} className="text-gray-600" />
            <div className="flex-1">
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Phone Number</label>
              {isEditing ? (
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 outline-none focus:border-gray-900"
                />
              ) : (
                <p className="text-sm text-gray-900">{profile.phone}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Phone size={18} className="text-green-600" />
            <div className="flex-1">
              <label className="text-xs font-semibold text-gray-600 mb-1 block">WhatsApp (Optional)</label>
              {isEditing ? (
                <input
                  type="tel"
                  value={profile.whatsapp}
                  onChange={(e) => setProfile(prev => ({ ...prev, whatsapp: e.target.value }))}
                  placeholder="+91 XXXXXXXXXX"
                  className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 outline-none focus:border-gray-900"
                />
              ) : (
                <p className="text-sm text-gray-900">{profile.whatsapp || 'Not set'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="p-4 rounded-xl shadow-sm" style={{ background: '#FFFFFF' }}>
          <h3 className="font-bold text-gray-900 mb-3">Location</h3>
          <div className="flex items-start gap-3">
            <MapPin size={18} className="text-red-600 mt-1" />
            <div className="flex-1">
              {isEditing ? (
                <textarea
                  value={profile.address}
                  onChange={(e) => setProfile(prev => ({ ...prev, address: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 outline-none focus:border-gray-900 resize-none"
                />
              ) : (
                <p className="text-sm text-gray-900">{profile.address}</p>
              )}
            </div>
          </div>
        </div>

        {/* Store Hours */}
        <div className="p-4 rounded-xl shadow-sm" style={{ background: '#FFFFFF' }}>
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Clock size={18} className="text-orange-600" />
            Store Hours
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Opening Time</label>
              {isEditing ? (
                <select
                  value={profile.openHour}
                  onChange={(e) => setProfile(prev => ({ ...prev, openHour: Number(e.target.value) }))}
                  className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 outline-none focus:border-gray-900"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>
                  ))}
                </select>
              ) : (
                <p className="text-sm text-gray-900">{String(profile.openHour).padStart(2, '0')}:00</p>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Closing Time</label>
              {isEditing ? (
                <select
                  value={profile.closeHour}
                  onChange={(e) => setProfile(prev => ({ ...prev, closeHour: Number(e.target.value) }))}
                  className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 outline-none focus:border-gray-900"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>
                  ))}
                </select>
              ) : (
                <p className="text-sm text-gray-900">{String(profile.closeHour).padStart(2, '0')}:00</p>
              )}
            </div>
          </div>
        </div>

        {/* Merchant ID */}
        <div className="p-4 rounded-xl shadow-sm" style={{ background: '#FEF3C7' }}>
          <h3 className="font-bold text-gray-900 mb-2">Merchant ID</h3>
          <p className="text-2xl font-bold text-orange-600">{profile.merchantId || user?.merchantId || 'Loading...'}</p>
          <p className="text-xs text-gray-600 mt-1">Use this ID to login</p>
        </div>

        {/* Admin Panel Link */}
        <div className="p-4 rounded-xl shadow-sm" style={{ background: '#FFFFFF' }}>
          <h3 className="font-bold text-gray-900 mb-3">Admin Access</h3>
          <a
            href={import.meta.env.VITE_ADMIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full px-4 py-3 rounded-lg text-center font-semibold text-white transition-transform active:scale-95"
            style={{ background: '#22C55E' }}
          >
            🔐 Open Admin Panel
          </a>
          <p className="text-xs text-gray-600 mt-2 text-center">Manage users, merchants, and analytics</p>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 px-4 sm:px-6 py-3 sm:py-4" style={{ background: '#FFFFFF', borderTop: '1px solid #E5E7EB' }}>
        <div className="flex items-center justify-around max-w-2xl mx-auto">
          {[
            { icon: '🏠', label: 'Home', path: '/' },
            { icon: '📦', label: 'Products', path: '/products' },
            { icon: '📊', label: 'Stats', path: '/stats' },
            { icon: '👤', label: 'Profile', path: '/profile', active: true },
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

export default MerchantProfile
