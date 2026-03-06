import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Menu } from 'lucide-react'
import Sidebar from './components/Sidebar'
import Login from './pages/Login'
import DashboardNew from './pages/DashboardNew'
import UsersNew from './pages/UsersNew'
import Merchants from './pages/Merchants'
import Broadcasts from './pages/Broadcasts'
import LocationAnalytics from './pages/LocationAnalytics'
import SearchAnalytics from './pages/SearchAnalytics'

function AppNew() {
  const [isAuthenticated] = useState(() => {
    return localStorage.getItem('admin-token') !== null
  })
  const [activeTab, setActiveTab] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (!isAuthenticated) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    )
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <DashboardNew />
      case 'users':
        return <UsersNew />
      case 'merchants':
        return <Merchants />
      case 'broadcasts':
        return <Broadcasts />
      case 'location':
        return <LocationAnalytics />
      case 'search':
        return <SearchAnalytics />
      default:
        return <DashboardNew />
    }
  }

  return (
    <BrowserRouter>
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <Sidebar 
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile Header */}
          <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <Menu size={24} className="text-gray-700" />
            </button>
            <h1 className="text-lg font-bold text-gray-900">Studio Admin</h1>
            <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white font-semibold">
              A
            </div>
          </div>

          {/* Content Area */}
          <main className="flex-1 overflow-y-auto p-6 lg:p-8">
            {renderContent()}
          </main>
        </div>
      </div>
    </BrowserRouter>
  )
}

export default AppNew
