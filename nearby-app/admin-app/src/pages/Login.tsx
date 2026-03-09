import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Loader2, Shield } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { apiService } from '../services/api.service'

const Login: React.FC = () => {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await apiService.login(email, password)
      localStorage.setItem('admin-token', response.token)
      setAuth(response.admin.adminId || 'admin-001', response.token)
      navigate('/')
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#FAF8F5' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="bg-white rounded-2xl p-8 shadow-sm" style={{ border: '1px solid #E5E3DF' }}>
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
              <Shield size={32} className="text-blue-600" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-center mb-2" style={{ color: '#1A1A1A' }}>
            Admin Login
          </h1>
          <p className="text-center mb-8" style={{ color: '#6B6B6B' }}>
            NearBy Platform Management
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#6B6B6B' }}>
                EMAIL
              </label>
              <input
                type="email"
                placeholder="admin@nearby.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 rounded-2xl text-sm font-medium outline-none"
                style={{ background: '#EFEFEB', color: '#1A1A1A' }}
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#6B6B6B' }}>
                PASSWORD
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                data-lpignore="true"
                className="w-full px-4 py-3.5 rounded-2xl text-sm font-medium outline-none"
                style={{ background: '#EFEFEB', color: '#1A1A1A' }}
                required
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-3 rounded-xl text-sm"
                style={{ background: '#FFF4F4', color: '#CC2222' }}
              >
                {error}
              </motion.div>
            )}

            <motion.button
              type="submit"
              disabled={loading}
              whileTap={{ scale: 0.97 }}
              className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2"
              style={{
                background: '#22C55E',
                color: '#FFFFFF',
              }}
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                'Sign In'
              )}
            </motion.button>
          </form>

          <div className="mt-6 p-4 rounded-xl" style={{ background: '#F0FDF4' }}>
            <p className="text-xs text-center" style={{ color: '#6B6B6B' }}>
              Use your admin email and password to sign in
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default Login
