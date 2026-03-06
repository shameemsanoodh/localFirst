import React, { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { User, LogOut, Shield, Store, ChevronDown } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/categories', label: 'Categories' },
    { path: '/offers', label: 'Offers' },
    { path: '/account', label: 'Account' },
]

const TopNav: React.FC = () => {
    const location = useLocation()
    const navigate = useNavigate()
    const { user, isAuthenticated, clearAuth } = useAuthStore()
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Close dropdown when clicking outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const handleLogout = () => {
        clearAuth()
        localStorage.removeItem('auth-token')
        localStorage.removeItem('refresh-token')
        setDropdownOpen(false)
        navigate('/login')
    }

    // Get user initials for avatar
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
    }

    return (
        <nav className="hidden md:block sticky top-0 z-50 bg-white shadow-top-nav">
            <div className="premium-container">
                <div className="flex items-center justify-between h-[72px]">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="w-9 h-9 bg-nearby-500 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                            <span className="text-white font-display font-bold text-lg">N</span>
                        </div>
                        <span className="font-display font-bold text-xl text-gray-900">
                            Near<span className="text-nearby-500">By</span>
                        </span>
                    </Link>

                    {/* Nav Links + Auth */}
                    <div className="flex items-center gap-1">
                        {navLinks.map(({ path, label }) => {
                            const isActive = location.pathname === path
                            return (
                                <Link
                                    key={path}
                                    to={path}
                                    className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                                        ? 'text-nearby-500 bg-nearby-50'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                        }`}
                                >
                                    {label}
                                    {isActive && (
                                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-nearby-500 rounded-full" />
                                    )}
                                </Link>
                            )
                        })}

                        {/* Auth Section */}
                        {isAuthenticated && user ? (
                            <div className="relative ml-3" ref={dropdownRef}>
                                <button
                                    onClick={() => setDropdownOpen((o) => !o)}
                                    className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100 hover:border-gray-200 group"
                                >
                                    {/* Avatar circle */}
                                    <div className="w-8 h-8 rounded-full bg-nearby-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                        {user.avatarUrl ? (
                                            <img src={user.avatarUrl} alt={user.name} className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            getInitials(user.name || 'U')
                                        )}
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm font-semibold text-gray-900 leading-tight">{user.name?.split(' ')[0]}</p>
                                        <p className="text-[10px] text-gray-400 capitalize leading-tight">{user.role || 'user'}</p>
                                    </div>
                                    <ChevronDown size={14} className={`text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {/* Dropdown */}
                                {dropdownOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                                        {user.role === 'admin' && (
                                            <button
                                                onClick={() => { navigate('/admin'); setDropdownOpen(false) }}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                                            >
                                                <Shield size={15} />
                                                Admin Panel
                                            </button>
                                        )}
                                        <button
                                            onClick={() => { navigate('/account'); setDropdownOpen(false) }}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                        >
                                            <User size={15} />
                                            My Account
                                        </button>
                                        <div className="border-t border-gray-100 my-1" />
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                                        >
                                            <LogOut size={15} />
                                            Sign Out
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <button
                                onClick={() => navigate('/login')}
                                className="ml-3 flex items-center gap-2 bg-nearby-500 hover:bg-nearby-600 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors shadow-sm hover:shadow-md"
                            >
                                <User size={16} />
                                Sign In
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    )
}

export default TopNav
