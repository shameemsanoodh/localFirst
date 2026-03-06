import React from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  User,
  ShoppingBag,
  Heart,
  HelpCircle,
  UserPlus,
  Settings,
  LogOut,
  ChevronRight,
  ArrowLeft,
  Shield,
  Store,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { Avatar } from '@/components/ui/Avatar'

const Account: React.FC = () => {
  const navigate = useNavigate()
  const { user, isAuthenticated, clearAuth } = useAuthStore()
  const [toast, setToast] = React.useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  const menuItems = [
    { icon: ShoppingBag, label: 'My Orders', action: () => showToast('My Orders — coming soon') },
    { icon: Heart, label: 'Saved Items', action: () => showToast('Saved Items — coming soon') },
    { icon: HelpCircle, label: 'Help & Support', action: () => showToast('Help & Support — coming soon') },
    { icon: UserPlus, label: 'Invite Friends', action: () => showToast('Invite Friends — coming soon') },
    { icon: Settings, label: 'Settings', action: () => showToast('Settings — coming soon') },
  ]

  const handleLogout = () => {
    clearAuth()
    navigate('/login')
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen pb-24 md:pb-8 bg-gray-50 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-sm"
        >
          <div className="w-24 h-24 bg-nearby-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <User size={48} className="text-nearby-500" />
          </div>
          <h2 className="text-2xl font-display font-bold text-gray-900 mb-2">Welcome to NearBy</h2>
          <p className="text-gray-500 mb-8 text-sm">Sign in to access your account, track orders, and more</p>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-nearby-500 hover:bg-nearby-600 text-white font-semibold py-3.5 rounded-xl transition-colors shadow-sm"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/signup')}
              className="w-full bg-white border border-gray-200 hover:border-nearby-300 hover:bg-nearby-50 text-gray-700 font-semibold py-3.5 rounded-xl transition-colors"
            >
              Create Account
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24 md:pb-8 bg-gray-50">
      {/* Mobile header */}
      <div className="md:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-700" />
          </button>
          <h1 className="text-lg font-display font-bold text-gray-900">Account</h1>
        </div>
      </div>

      {/* Profile Header */}
      <div className="bg-gradient-to-br from-nearby-500 via-nearby-600 to-nearby-700 px-4 pt-8 pb-14 md:rounded-b-3xl">
        <div className="premium-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4"
          >
            <Avatar
              src={user?.avatarUrl}
              alt={user?.name || 'User'}
              size="lg"
            />
            <div className="text-white">
              <h2 className="text-xl font-display font-bold">{user?.name}</h2>
              <p className="text-white/70 text-sm">{user?.email || user?.phone}</p>
              <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold capitalize" style={{ background: 'rgba(255,255,255,0.2)' }}>{user?.role || 'user'}</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Role-based Dashboard Links */}
      {user?.role === 'admin' && (
        <div className="premium-container -mt-6 mb-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <button
              onClick={() => navigate('/admin')}
              className="w-full flex items-center justify-between px-5 py-4 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl shadow-lg text-white group hover:shadow-xl transition-all hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Shield size={20} className="text-white" />
                </div>
                <div className="text-left">
                  <span className="font-semibold text-sm block">Admin Panel</span>
                  <span className="text-white/70 text-xs">Manage platform, users & categories</span>
                </div>
              </div>
              <ChevronRight size={18} className="text-white/60 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </div>
      )}

      {user?.role === 'merchant' && (
      {/* Menu Items */}
      <div className="premium-container -mt-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-card overflow-hidden"
        >
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={item.action}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-nearby-50 transition-colors">
                  <item.icon size={18} className="text-gray-600 group-hover:text-nearby-500 transition-colors" />
                </div>
                <span className="text-gray-900 font-medium text-sm">{item.label}</span>
              </div>
              <ChevronRight size={18} className="text-gray-300" />
            </button>
          ))}
        </motion.div>

        {/* Logout Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-4"
        >
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-white rounded-2xl shadow-card text-red-500 font-medium text-sm hover:bg-red-50 transition-colors"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </motion.div>
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

export default Account
