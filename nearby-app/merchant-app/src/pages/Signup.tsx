import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Phone, Loader2 } from 'lucide-react'

const Signup: React.FC = () => {
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [focused, setFocused] = useState(false)

  const checkPhoneAndProceed = async () => {
    if (phone.length !== 10) return

    setLoading(true)
    setError('')

    try {
      // Check if phone exists in DB
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/check-phone/${phone}`)
      
      if (response.ok) {
        const data = await response.json()
        
        if (data.exists) {
          if (data.role === 'customer') {
            setError('This number is registered as customer. Please use merchant login or different number.')
          } else if (data.role === 'merchant') {
            setError('This number already registered. Please login.')
          }
          setLoading(false)
          return
        }
      }
      
      // Phone is new, proceed to onboarding
      localStorage.setItem('signup-phone', phone)
      navigate('/onboarding')
      
    } catch (err) {
      // If API fails, proceed anyway (offline mode)
      console.warn('Phone check failed, proceeding:', err)
      localStorage.setItem('signup-phone', phone)
      navigate('/onboarding')
    } finally {
      setLoading(false)
    }
  }

  // Auto-check when 10 digits entered
  React.useEffect(() => {
    if (phone.length === 10 && !loading && !error) {
      checkPhoneAndProceed()
    }
  }, [phone])

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#FAF8F5' }}>
      <div className="px-6 pt-14 pb-2">
        <button 
          onClick={() => navigate('/login')} 
          className="text-sm font-semibold" 
          style={{ color: '#9A9895' }}
        >
          ← Back
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 flex flex-col justify-center px-6 max-w-sm mx-auto w-full"
      >
        <div className="mb-10">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6 text-2xl" style={{ background: '#22C55E' }}>
            🏪
          </div>
          <h1 className="text-4xl font-bold mb-2" style={{ color: '#1A1A1A' }}>
            Register<br />Your Shop
          </h1>
          <p style={{ color: '#6B6B6B' }}>Enter your mobile number to get started</p>
        </div>

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

        <div>
          <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#6B6B6B' }}>
            MOBILE NUMBER
          </label>
          <div 
            className="flex items-center gap-3 px-4 py-3.5 rounded-2xl" 
            style={{ 
              background: '#EFEFEB', 
              border: '2px solid', 
              borderColor: focused ? '#22C55E' : 'transparent' 
            }}
          >
            <Phone size={20} style={{ color: '#6B6B6B' }} />
            <span className="text-sm font-semibold" style={{ color: '#6B6B6B' }}>+91</span>
            <input
              type="tel"
              placeholder="9876543210"
              value={phone}
              onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              disabled={loading}
              className="flex-1 text-sm font-medium bg-transparent outline-none"
              style={{ color: '#1A1A1A' }}
              autoFocus
            />
            {loading && <Loader2 size={18} className="animate-spin" style={{ color: '#22C55E' }} />}
          </div>
          
          {phone.length === 10 && !loading && !error && (
            <motion.p 
              initial={{ opacity: 0, y: 4 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="text-sm mt-2" 
              style={{ color: '#22C55E' }}
            >
              ✓ Checking availability...
            </motion.p>
          )}
        </div>

        <div className="mt-8 p-4 rounded-2xl" style={{ background: '#EFEFEB' }}>
          <p className="text-xs" style={{ color: '#6B6B6B' }}>
            📱 1000+ shops near you are already live on NearBy
          </p>
        </div>

        <p className="text-center text-sm mt-6" style={{ color: '#6B6B6B' }}>
          Already have an account?{' '}
          <button onClick={() => navigate('/login')} className="font-bold" style={{ color: '#1A1A1A' }}>
            Sign in
          </button>
        </p>
      </motion.div>

      <div className="h-8" />
    </div>
  )
}

export default Signup
