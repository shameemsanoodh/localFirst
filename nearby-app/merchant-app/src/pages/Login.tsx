import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

const Login: React.FC = () => {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [identifier, setIdentifier] = useState('')
  const [passcode, setPasscode] = useState('')
  const [showPasscode, setShowPasscode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [focused, setFocused] = useState<string | null>(null)

  const isEmail = identifier.includes('@')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/merchants/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier,
          passcode
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Invalid credentials')
      }

      const data = await response.json()

      // Store complete merchant data in localStorage for MerchantHome
      localStorage.setItem('merchant-data', JSON.stringify({
        merchantId: data.merchant.merchantId,
        shopName: data.merchant.shopName,
        name: data.merchant.shopName,
        category: data.merchant.majorCategory || data.merchant.category || 'General',
        email: data.merchant.email,
        phone: data.merchant.phone,
        ownerName: data.merchant.ownerName,
        location: data.merchant.location,
        openTime: data.merchant.openTime,
        closeTime: data.merchant.closeTime,
        isOpen: data.merchant.isOpen,
        radius: '1km'
      }))

      // Store auth token
      localStorage.setItem('auth-token', data.token)

      setAuth({
        id: data.merchant.merchantId,
        userId: data.merchant.merchantId,
        merchantId: data.merchant.merchantId,
        name: data.merchant.shopName,
        email: data.merchant.email,
        phone: data.merchant.phone || '',
        role: 'merchant',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as any, ['merchant'], data.token)

      navigate('/')
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const canSubmit = identifier.length >= 4 && passcode.length === 6

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#FAF8F5' }}>
      {/* Top bar */}
      <div className="px-6 pt-14 pb-2">
        <a
          href="http://localhost:5173"
          className="text-sm font-semibold"
          style={{ color: '#9A9895' }}
        >
          ← Customer App
        </a>
      </div>

      {/* Main content - Centered */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 flex flex-col justify-center px-6 max-w-sm mx-auto w-full"
      >
        {/* Brand mark */}
        <div className="mb-10">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6 text-2xl" style={{ background: '#22C55E' }}>
            🏪
          </div>
          <h1 className="text-4xl font-bold mb-2" style={{ color: '#1A1A1A' }}>
            Merchant<br />Login
          </h1>
          <p style={{ color: '#6B6B6B' }}>Sign in to manage your shop</p>
        </div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 rounded-xl text-sm"
            style={{ background: '#FFF4F4', color: '#CC2222' }}
          >
            {error}
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Merchant ID or Email */}
          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#6B6B6B' }}>
              MERCHANT ID OR EMAIL
            </label>
            <input
              type="text"
              placeholder="SHOP1234 or merchant@email.com"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              onFocus={() => setFocused('id')}
              onBlur={() => setFocused(null)}
              required
              disabled={loading}
              className="w-full px-4 py-3.5 rounded-2xl text-sm font-medium outline-none"
              style={{
                background: '#EFEFEB',
                color: '#1A1A1A',
                border: '2px solid',
                borderColor: focused === 'id' ? '#22C55E' : 'transparent',
              }}
            />
          </div>

          {/* Passcode */}
          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#6B6B6B' }}>
              6-DIGIT PASSCODE
            </label>
            <div className="relative">
              <input
                type={showPasscode ? 'text' : 'password'}
                placeholder="••••••"
                value={passcode}
                onChange={e => setPasscode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onFocus={() => setFocused('pw')}
                onBlur={() => setFocused(null)}
                required
                disabled={loading}
                className="w-full px-4 py-3.5 rounded-2xl text-sm font-medium outline-none pr-12"
                style={{
                  background: '#EFEFEB',
                  color: '#1A1A1A',
                  border: '2px solid',
                  borderColor: focused === 'pw' ? '#22C55E' : 'transparent',
                  letterSpacing: '0.3em',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPasscode(!showPasscode)}
                className="absolute right-4 top-1/2 -translate-y-1/2"
              >
                {showPasscode ? <EyeOff size={18} style={{ color: '#9A9895' }} /> : <Eye size={18} style={{ color: '#9A9895' }} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <motion.button
            type="submit"
            disabled={loading || !canSubmit}
            whileTap={{ scale: 0.97 }}
            className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 mt-6"
            style={{
              background: canSubmit ? '#22C55E' : '#CFCDC9',
              color: canSubmit ? '#FFFFFF' : '#9A9895',
            }}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <>Sign In <ArrowRight size={18} /></>
            )}
          </motion.button>
        </form>

        {/* Sign up */}
        <p className="text-center text-sm mt-6" style={{ color: '#6B6B6B' }}>
          New merchant?{' '}
          <button onClick={() => navigate('/signup')} className="font-bold" style={{ color: '#1A1A1A' }}>
            Register your shop
          </button>
        </p>
      </motion.div>

      {/* Bottom safe padding */}
      <div className="h-8" />
    </div>
  )
}

export default Login
