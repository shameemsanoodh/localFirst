import React from 'react'
import { 
  LayoutGrid, 
  Users, 
  Store, 
  MessageSquare,
  MapPin,
  Gift,
  Bell,
  Radio, 
  BarChart3,
  LogOut
} from 'lucide-react'

interface SidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  isOpen: boolean
  onClose: () => void
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, isOpen, onClose }) => {
  const menuItems = [
    { id: 'overview', label: 'Dashboard', icon: LayoutGrid, path: '/' },
    { id: 'users', label: 'Users', icon: Users, path: '/users' },
    { id: 'merchants', label: 'Merchants', icon: Store, path: '/merchants' },
    { id: 'queries', label: 'Queries', icon: MessageSquare, path: '/queries' },
    { id: 'locations', label: 'Locations', icon: MapPin, path: '/locations' },
    { id: 'offers', label: 'Offers', icon: Gift, path: '/offers' },
    { id: 'notifications', label: 'Notifications', icon: Bell, path: '/notifications' },
    { id: 'broadcasts', label: 'Broadcasts', icon: Radio, path: '/broadcasts' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/analytics/search' },
  ]

  const handleSignOut = () => {
    localStorage.removeItem('admin-token')
    window.location.href = '/login'
  }

  const handleNavigation = (path: string, id: string) => {
    window.location.href = path
    onTabChange(id)
    onClose()
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`
          fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-50
          transform transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static
          flex flex-col
        `}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">NearBy Admin</h1>
          <button 
            onClick={onClose}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.path, item.id)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg
                    transition-colors duration-150
                    ${isActive 
                      ? 'bg-[#22C55E] text-white' 
                      : 'text-gray-600 hover:bg-gray-100'
                    }
                  `}
                >
                  <Icon size={20} />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              )
            })}
          </div>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-200">
          <div className="bg-gray-50 rounded-lg p-3 mb-3">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-[#22C55E] flex items-center justify-center text-white font-semibold">
                A
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-900">admin</div>
                <div className="text-xs text-gray-500">Administrator</div>
              </div>
            </div>
          </div>
          
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </div>
    </>
  )
}

export default Sidebar
