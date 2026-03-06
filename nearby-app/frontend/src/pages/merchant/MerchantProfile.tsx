import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Store, Phone, MapPin, Clock, Edit2, Check } from 'lucide-react'
import { merchantsService } from '@/services/merchants.service'

const MerchantProfile: React.FC = () => {
  const navigate = useNavigate()

  const merchantData = JSON.parse(localStorage.getItem('merchant-data') || '{}')

  const [editing, setEditing] = useState(false)
  const [shopName, setShopName] = useState(merchantData.shopName || 'My Shop')
  const [phone, setPhone] = useState(merchantData.phone || '')
  const [address, setAddress] = useState(merchantData.address || '')
  const [openTime, setOpenTime] = useState(merchantData.openTime || '09:00')
  const [closeTime, setCloseTime] = useState(merchantData.closeTime || '21:00')
  const [saved, setSaved] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(true)

  // Load profile from API on mount
  useEffect(() => {
    (async () => {
      try {
        const profile = await merchantsService.getProfile()
        if (profile) {
          setShopName((profile as any).shopName || (profile as any).shop_name || shopName)
          setPhone((profile as any).phone || (profile as any).owner_phone || phone)
          setAddress((profile as any).address || (profile as any).location?.address || address)
          setOpenTime((profile as any).openTime || (profile as any).open_time || openTime)
          setCloseTime((profile as any).closeTime || (profile as any).close_time || closeTime)
        }
      } catch (e) {
        console.warn('Profile API failed, using localStorage:', e)
      } finally {
        setLoadingProfile(false)
      }
    })()
  }, [])

  const handleSave = () => {
    const updated = { ...merchantData, shopName, phone, address, openTime, closeTime }
    localStorage.setItem('merchant-data', JSON.stringify(updated))
    setSaved(true)
    setEditing(false)
    setTimeout(() => setSaved(false), 2000)
  }

  const fieldClass =
    'w-full px-4 py-3 rounded-xl text-sm outline-none transition-colors'
  const readonlyStyle = { background: '#FFFFFF', border: '2px solid #E5E3DF', color: '#1A1A1A' }
  const editStyle = { background: '#FFFBEA', border: '2px solid #F5C842', color: '#1A1A1A' }

  return (
    <div className="min-h-screen pb-24" style={{ background: '#FAF8F5', fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div className="px-6 pt-14 pb-4" style={{ background: '#1A1A1A' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/merchant')}
              className="p-2 rounded-xl hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft size={24} style={{ color: '#FAF8F5' }} />
            </button>
            <h1 className="text-xl font-bold" style={{ color: '#FAF8F5' }}>Shop Profile</h1>
          </div>
          <button
            onClick={() => editing ? handleSave() : setEditing(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-colors"
            style={{ background: '#F5C842', color: '#1A1A1A' }}
          >
            {editing ? <Check size={16} /> : <Edit2 size={16} />}
            {editing ? 'Save' : 'Edit'}
          </button>
        </div>
      </div>

      {saved && (
        <div className="mx-6 mt-4 p-3 rounded-xl text-center font-semibold text-sm" style={{ background: '#D1FAE5', color: '#065F46' }}>
          ✓ Profile saved successfully
        </div>
      )}

      <div className="px-6 py-6 space-y-4">
        {/* Shop Avatar */}
        <div className="flex items-center gap-4 p-5 rounded-2xl" style={{ background: '#FFFFFF' }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl" style={{ background: '#F5C842' }}>
            🏪
          </div>
          <div>
            <p className="text-lg font-bold" style={{ color: '#1A1A1A' }}>{shopName}</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-2 h-2 rounded-full" style={{ background: '#22C55E' }} />
              <span className="text-xs" style={{ color: '#9A9895' }}>Live · Visible within 2 km</span>
            </div>
          </div>
        </div>

        {/* Shop Name */}
        <div>
          <label className="text-xs font-semibold mb-2 block" style={{ color: '#6B6B6B', letterSpacing: '0.05em' }}>
            <Store size={12} className="inline mr-1" />
            SHOP NAME
          </label>
          <input
            type="text"
            value={shopName}
            onChange={e => setShopName(e.target.value)}
            readOnly={!editing}
            className={fieldClass}
            style={editing ? editStyle : readonlyStyle}
          />
        </div>

        {/* Phone */}
        <div>
          <label className="text-xs font-semibold mb-2 block" style={{ color: '#6B6B6B', letterSpacing: '0.05em' }}>
            <Phone size={12} className="inline mr-1" />
            PHONE NUMBER
          </label>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            readOnly={!editing}
            placeholder="Enter phone number"
            className={fieldClass}
            style={editing ? editStyle : readonlyStyle}
          />
        </div>

        {/* Address */}
        <div>
          <label className="text-xs font-semibold mb-2 block" style={{ color: '#6B6B6B', letterSpacing: '0.05em' }}>
            <MapPin size={12} className="inline mr-1" />
            ADDRESS
          </label>
          <textarea
            value={address}
            onChange={e => setAddress(e.target.value)}
            readOnly={!editing}
            placeholder="Enter shop address"
            rows={3}
            className={`${fieldClass} resize-none`}
            style={editing ? editStyle : readonlyStyle}
          />
        </div>

        {/* Hours */}
        <div>
          <label className="text-xs font-semibold mb-2 block" style={{ color: '#6B6B6B', letterSpacing: '0.05em' }}>
            <Clock size={12} className="inline mr-1" />
            OPERATING HOURS
          </label>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-xs mb-1" style={{ color: '#9A9895' }}>Opens</p>
              <input
                type="time"
                value={openTime}
                onChange={e => setOpenTime(e.target.value)}
                disabled={!editing}
                className={fieldClass}
                style={editing ? editStyle : readonlyStyle}
              />
            </div>
            <div className="text-sm font-semibold" style={{ color: '#6B6B6B', paddingTop: '18px' }}>→</div>
            <div className="flex-1">
              <p className="text-xs mb-1" style={{ color: '#9A9895' }}>Closes</p>
              <input
                type="time"
                value={closeTime}
                onChange={e => setCloseTime(e.target.value)}
                disabled={!editing}
                className={fieldClass}
                style={editing ? editStyle : readonlyStyle}
              />
            </div>
          </div>
        </div>

        {editing && (
          <button
            onClick={handleSave}
            className="w-full py-4 rounded-2xl font-bold text-base"
            style={{ background: '#1A1A1A', color: '#F5C842' }}
          >
            Save Profile
          </button>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 px-6 py-4" style={{ background: '#FFFFFF', borderTop: '1px solid #E5E3DF' }}>
        <div className="flex items-center justify-around max-w-md mx-auto">
          {[
            { icon: '🏠', label: 'Home', active: false, path: '/merchant' },
            { icon: '📦', label: 'Products', active: false, path: '/merchant/products' },
            { icon: '📊', label: 'Stats', active: false, path: '/merchant/stats' },
            { icon: '👤', label: 'Profile', active: true, path: '/merchant/profile' },
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

export default MerchantProfile
