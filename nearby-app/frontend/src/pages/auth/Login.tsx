import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, ArrowRight, Store } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

const Login: React.FC = () => {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [focused, setFocused] = useState<string | null>(null)
  const [devMode, setDevMode] = useState(false)
  const [toast, setToast] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { authService } = await import('@/services/auth.service')
      const response = await authService.login(formData)
      
      // Redirect merchants to merchant app
      if (response.user.role === 'merchant') {
        window.location.href = 'http://localhost:5174/login'
        return
      }
      
      localStorage.setItem('auth-token', response.token)
      localStorage.setItem('refresh-token', response.refreshToken)
      setAuth(response.user, response.user.role ? [{ userId: response.userId, role: response.user.role as any }] : [], response.token)
      if (response.user.role === 'admin') navigate('/admin')
      else navigate('/')
    } catch {
      // Fallback: mock auth for offline/dev mode
      setDevMode(true)
      const role = formData.email.includes('admin') ? 'admin'
        : formData.email.includes('merchant') ? 'merchant' : 'user'
      
      // Redirect merchants to merchant app
      if (role === 'merchant') {
        window.location.href = 'http://localhost:5174/login'
        return
      }
      
      const mockUser = { userId: `local-${Date.now()}`, name: formData.email.split('@')[0], email: formData.email, role }
      const mockToken = `local-token-${Date.now()}`
      localStorage.setItem('auth-token', mockToken)
      setAuth(mockUser as any, [{ userId: mockUser.userId, role: role as any }], mockToken)
      if (role === 'admin') navigate('/admin')
      else navigate('/')
    } finally {
      setLoading(false)
    }
  }

  const canSubmit = formData.email.includes('@') && formData.password.length >= 6

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: '#FAF8F5', fontFamily: "'Inter', sans-serif" }}
    >
      {/* Top wordmark */}
      <div className="px-6 pt-14 pb-2">
        <button
          onClick={() => navigate('/')}
          className="text-sm font-semibold flex items-center gap-1.5"
          style={{ color: '#9A9895' }}
        >
          ← Back
        </button>
      </div>

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="flex-1 flex flex-col justify-center px-6 max-w-sm mx-auto w-full"
      >
        {/* Brand mark */}
        <div className="mb-10">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6 text-2xl shadow-sm"
            style={{ background: '#F5C842' }}
          >
            📍
          </div>
          <h1 className="text-4xl font-bold mb-2" style={{ color: '#1A1A1A', letterSpacing: '-0.02em' }}>
            Welcome<br />back
          </h1>
          <p style={{ color: '#6B6B6B' }}>Sign in to continue to Nearby</p>
        </div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 rounded-xl text-sm"
            style={{ background: '#FFF4F4', color: '#CC2222' }}
          >
            {error}
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Email */}
          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#6B6B6B', letterSpacing: '0.05em' }}>
              EMAIL
            </label>
            <input
              type="email"
              placeholder="name@example.com"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              onFocus={() => setFocused('email')}
              onBlur={() => setFocused(null)}
              required
              disabled={loading}
              className="w-full px-4 py-3.5 rounded-2xl text-sm font-medium outline-none transition-all"
              style={{
                background: '#EFEFEB',
                color: '#1A1A1A',
                border: '2px solid',
                borderColor: focused === 'email' ? '#1A1A1A' : 'transparent',
              }}
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#6B6B6B', letterSpacing: '0.05em' }}>
              PASSWORD
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                onFocus={() => setFocused('pw')}
                onBlur={() => setFocused(null)}
                required
                disabled={loading}
                className="w-full px-4 py-3.5 rounded-2xl text-sm font-medium outline-none transition-all pr-12"
                style={{
                  background: '#EFEFEB',
                  color: '#1A1A1A',
                  border: '2px solid',
                  borderColor: focused === 'pw' ? '#1A1A1A' : 'transparent',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2"
                style={{ color: '#9A9895' }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="text-right">
            <button
              type="button"
              onClick={() => { setToast('Password reset — coming soon'); setTimeout(() => setToast(''), 2000) }}
              className="text-xs font-semibold"
              style={{ color: '#6B6B6B' }}
            >
              Forgot password?
            </button>
          </div>

          {/* Submit */}
          <motion.button
            type="submit"
            disabled={loading || !canSubmit}
            whileTap={{ scale: 0.97 }}
            className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all mt-2"
            style={{
              background: canSubmit ? '#1A1A1A' : '#CFCDC9',
              color: canSubmit ? '#F5C842' : '#9A9895',
            }}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <>Sign In <ArrowRight size={18} /></>
            )}
          </motion.button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px" style={{ background: '#E5E3DF' }} />
          <span className="text-xs" style={{ color: '#9A9895' }}>or</span>
          <div className="flex-1 h-px" style={{ background: '#E5E3DF' }} />
        </div>

        {/* Sign up - Customer only */}
        <Link to="/onboarding">
          <motion.div
            whileTap={{ scale: 0.97 }}
            className="w-full p-4 rounded-2xl flex items-center gap-3 cursor-pointer"
            style={{ background: '#EFEFEB' }}
          >
            <span className="text-xl">🛍️</span>
            <div className="flex-1">
              <p className="text-sm font-bold" style={{ color: '#1A1A1A' }}>New customer?</p>
              <p className="text-xs" style={{ color: '#6B6B6B' }}>Create a free account</p>
            </div>
            <ArrowRight size={16} style={{ color: '#9A9895' }} />
          </motion.div>
        </Link>
      </motion.div>

      {/* Bottom safe padding */}
      <div className="h-8" />

      {/* Dev mode indicator */}
      {devMode && (
        <div className="fixed top-4 right-4 px-3 py-1.5 rounded-lg text-xs font-bold z-50" style={{ background: '#FEF3C7', color: '#92400E' }}>
          ⚠ Dev Mode — offline auth
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl text-sm font-semibold shadow-lg bg-gray-900 text-white">
          {toast}
        </div>
      )}
    </div>
  )
}

export default Login
