import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, Grid3x3, Search, Tag, User } from 'lucide-react'

const BottomNav: React.FC = () => {
  const location = useLocation()

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-100 shadow-nav z-50 safe-area-bottom">
      <div className="flex justify-around items-center px-2 h-[68px] relative">
        {/* Home */}
        <Link to="/" className="flex flex-col items-center justify-center py-1 px-3 min-w-[56px]">
          <motion.div whileTap={{ scale: 0.85 }} className={`p-1.5 rounded-xl ${isActive('/') ? 'bg-nearby-50' : ''}`}>
            <Home size={22} className={isActive('/') ? 'text-nearby-500' : 'text-gray-400'} strokeWidth={isActive('/') ? 2.5 : 1.8} fill={isActive('/') ? 'currentColor' : 'none'} />
          </motion.div>
          <span className={`text-[10px] font-medium mt-0.5 ${isActive('/') ? 'text-nearby-500 font-semibold' : 'text-gray-500'}`}>Home</span>
        </Link>

        {/* Categories */}
        <Link to="/categories" className="flex flex-col items-center justify-center py-1 px-3 min-w-[56px]">
          <motion.div whileTap={{ scale: 0.85 }} className={`p-1.5 rounded-xl ${isActive('/categories') ? 'bg-nearby-50' : ''}`}>
            <Grid3x3 size={22} className={isActive('/categories') ? 'text-nearby-500' : 'text-gray-400'} strokeWidth={isActive('/categories') ? 2.5 : 1.8} />
          </motion.div>
          <span className={`text-[10px] font-medium mt-0.5 ${isActive('/categories') ? 'text-nearby-500 font-semibold' : 'text-gray-500'}`}>Categories</span>
        </Link>

        {/* Floating Search Button (center) */}
        <Link to="/search" className="flex flex-col items-center justify-center -mt-6">
          <motion.div
            whileTap={{ scale: 0.9 }}
            className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
            }}
          >
            <Search size={24} className="text-white" strokeWidth={2.5} />
          </motion.div>
          <span className={`text-[10px] font-medium mt-1 ${isActive('/search') ? 'text-nearby-500 font-semibold' : 'text-gray-500'}`}>Search</span>
        </Link>

        {/* Offers */}
        <Link to="/offers" className="flex flex-col items-center justify-center py-1 px-3 min-w-[56px]">
          <motion.div whileTap={{ scale: 0.85 }} className={`p-1.5 rounded-xl ${isActive('/offers') ? 'bg-nearby-50' : ''}`}>
            <Tag size={22} className={isActive('/offers') ? 'text-nearby-500' : 'text-gray-400'} strokeWidth={isActive('/offers') ? 2.5 : 1.8} />
          </motion.div>
          <span className={`text-[10px] font-medium mt-0.5 ${isActive('/offers') ? 'text-nearby-500 font-semibold' : 'text-gray-500'}`}>Offers</span>
        </Link>

        {/* Account */}
        <Link to="/account" className="flex flex-col items-center justify-center py-1 px-3 min-w-[56px]">
          <motion.div whileTap={{ scale: 0.85 }} className={`p-1.5 rounded-xl ${isActive('/account') ? 'bg-nearby-50' : ''}`}>
            <User size={22} className={isActive('/account') ? 'text-nearby-500' : 'text-gray-400'} strokeWidth={isActive('/account') ? 2.5 : 1.8} />
          </motion.div>
          <span className={`text-[10px] font-medium mt-0.5 ${isActive('/account') ? 'text-nearby-500 font-semibold' : 'text-gray-500'}`}>Account</span>
        </Link>
      </div>
    </nav>
  )
}

export default BottomNav
