import React, { useState, useEffect } from 'react'
import {
  Users, Store, ShoppingCart, Radio, Plus, Trash2, Search,
  CheckCircle, X, LogOut, RefreshCw,
  BarChart3, Loader2, Tag, Eye, Edit,
  Copy, Settings
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { adminService } from '@/services/admin.service'

// Types
interface AdminStats {
  totalUsers: number
  totalMerchants: number
  totalBroadcasts: number
  totalOffers: number
  totalOrders: number
  recentSignups: number
  activeToday: number
  roleBreakdown: {
    users: number
    merchants: number
    admins: number
  }
}

interface User {
  userId: string
  name: string
  email: string
  phone: string
  role: 'user' | 'merchant' | 'admin' | 'b2b_client' | 'influencer' | 'freelancer'
  status: 'active' | 'suspended'
  createdAt: string
  avatar?: string
}

interface Service {
  serviceId: string
  name: string
  description: string
  category: string
  price: number
  duration: string
  status: 'active' | 'inactive'
}

interface Offer {
  offerId: string
  title: string
  description: string
  badge: string
  discount: string
  order: number
  status: 'active' | 'inactive'
}

interface CreatorApplication {
  applicationId: string
  name: string
  type: 'freelancer' | 'influencer'
  email: string
  phone: string
  locations: string[]
  appliedAt: string
  status: 'pending' | 'approved' | 'rejected'
}

interface EmployeeID {
  employeeId: string
  employeeName: string
  status: 'available' | 'registered'
  createdAt: string
  registeredAt?: string
}

const AdminDashboardEnhanced: React.FC = () => {
  const navigate = useNavigate()
  const { clearAuth } = useAuthStore()

  // Active tab state
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'services' | 'offers' | 'creators' | 'employees'>('overview')

  // Data state
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [offers, setOffers] = useState<Offer[]>([])
  const [creators, setCreators] = useState<CreatorApplication[]>([])
  const [employees, setEmployees] = useState<EmployeeID[]>([])

  // UI state
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [newEmployeeName, setNewEmployeeName] = useState('')
  const [employeeCreatedMsg, setEmployeeCreatedMsg] = useState('')
  const [toastMsg, setToastMsg] = useState('')

  useEffect(() => {
    loadData()
  }, [activeTab])

  const loadData = async () => {
    setLoading(true)
    try {
      // Try real API first
      let apiStats: AdminStats | null = null
      let apiUsers: User[] | null = null

      try {
        const statsData = await adminService.getStats()
        apiStats = {
          totalUsers: statsData.totalUsers || 0,
          totalMerchants: statsData.totalMerchants || 0,
          totalBroadcasts: statsData.totalBroadcasts || 0,
          totalOffers: statsData.totalOffers || 0,
          totalOrders: statsData.totalOrders || 0,
          recentSignups: statsData.recentSignups || 0,
          activeToday: (statsData as any).activeToday || 0,
          roleBreakdown: statsData.roleBreakdown || { users: 0, merchants: 0, admins: 0 },
        }
      } catch (e) {
        console.warn('Admin stats API call failed, using fallback:', e)
      }

      try {
        const usersData = await adminService.getUsers()
        apiUsers = usersData.map(u => ({
          userId: u.userId,
          name: u.name || u.email?.split('@')[0] || 'Unknown',
          email: u.email,
          phone: u.phone || '-',
          role: (u.role || 'user') as User['role'],
          status: (u.status || 'active') as User['status'],
          createdAt: u.createdAt?.slice(0, 10) || new Date().toISOString().slice(0, 10),
        }))
      } catch (e) {
        console.warn('Admin users API call failed, using fallback:', e)
      }

      // Use API data or fallback to mock
      setStats(apiStats || {
        totalUsers: 12,
        totalMerchants: 5,
        totalBroadcasts: 156,
        totalOffers: 4,
        totalOrders: 89,
        recentSignups: 3,
        activeToday: 8,
        roleBreakdown: { users: 2, merchants: 3, admins: 1 },
      })

      setUsers(apiUsers || [
        { userId: 'user1', name: 'Faris', email: 'web7a03a...', phone: '-', role: 'b2b_client', status: 'active', createdAt: '2026-02-10' },
        { userId: 'user2', name: 'Zaffar', email: 'bw89770c...', phone: '-', role: 'b2b_client', status: 'active', createdAt: '2026-02-09' },
        { userId: 'user3', name: 'Faris new', email: '945ecb8...', phone: '-', role: 'influencer', status: 'active', createdAt: '2026-02-09' },
        { userId: 'user4', name: 'Shiyaz', email: '93927d02...', phone: '-', role: 'freelancer', status: 'active', createdAt: '2026-02-09' },
      ])

      // Load services
      const mockServices: Service[] = [
        {
          serviceId: 'svc1',
          name: 'Social Media Content',
          description: 'Content creation for social media platforms',
          category: 'Content',
          price: 20000,
          duration: '4h',
          status: 'active',
        },
        {
          serviceId: 'svc2',
          name: 'DroneShoot',
          description: 'bangalore got ready',
          category: 'drone shoot in blr',
          price: 500,
          duration: '3h',
          status: 'active',
        },
      ]
      setServices(mockServices)

      // Load offers
      const mockOffers: Offer[] = [
        {
          offerId: 'off1',
          title: 'Extra 25% off',
          description: 'on your first studio booking',
          badge: '25% OFF • Order: 1',
          discount: '25%',
          order: 1,
          status: 'active',
        },
        {
          offerId: 'off2',
          title: 'Weekend Special',
          description: 'Book any service this weekend',
          badge: '₹500 OFF • Order: 2',
          discount: '₹500',
          order: 2,
          status: 'active',
        },
      ]
      setOffers(mockOffers)

      // Load creator applications
      const mockCreators: CreatorApplication[] = [
        {
          applicationId: 'app1',
          name: 'Shiyaz',
          type: 'freelancer',
          email: 'Not specified',
          phone: 'No locations',
          locations: [],
          appliedAt: '2026-03-09',
          status: 'pending',
        },
      ]
      setCreators(mockCreators)

      // Load employee IDs
      const mockEmployees: EmployeeID[] = [
        {
          employeeId: 'studio_002',
          employeeName: 'Faris',
          status: 'registered',
          createdAt: '2026-02-09',
          registeredAt: '2026-02-09',
        },
        {
          employeeId: 'studio_001',
          employeeName: 'shameem',
          status: 'registered',
          createdAt: '2026-02-08',
          registeredAt: '2026-02-08',
        },
      ]
      setEmployees(mockEmployees)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    clearAuth()
    navigate('/login')
  }

  const handleUserAction = async (userId: string, action: 'edit' | 'suspend' | 'activate') => {
    if (action === 'suspend' || action === 'activate') {
      // Optimistically update UI
      setUsers(prev => prev.map(u =>
        u.userId === userId
          ? { ...u, status: action === 'suspend' ? 'suspended' : 'active' }
          : u
      ))
      // Try API call
      try {
        await adminService.manageUser(userId, action)
      } catch (e) {
        console.warn('manageUser API failed:', e)
      }
    } else if (action === 'edit') {
      showToast('Edit user — coming soon')
    }
  }

  const handleServiceToggle = (serviceId: string) => {
    setServices(prev => prev.map(s =>
      s.serviceId === serviceId
        ? { ...s, status: s.status === 'active' ? 'inactive' : 'active' }
        : s
    ))
  }

  const handleOfferToggle = (offerId: string) => {
    setOffers(prev => prev.map(o =>
      o.offerId === offerId
        ? { ...o, status: o.status === 'active' ? 'inactive' : 'active' }
        : o
    ))
  }

  const handleCreatorAction = (applicationId: string, action: 'approve' | 'reject') => {
    setCreators(prev => prev.map(c =>
      c.applicationId === applicationId
        ? { ...c, status: action === 'approve' ? 'approved' : 'rejected' }
        : c
    ))
  }

  const handleDeleteService = (serviceId: string) => {
    setServices(prev => prev.filter(s => s.serviceId !== serviceId))
    showToast('Service deleted')
  }

  const handleDeleteOffer = (offerId: string) => {
    setOffers(prev => prev.filter(o => o.offerId !== offerId))
    showToast('Offer deleted')
  }

  const handleCreateEmployee = () => {
    if (!newEmployeeName.trim()) return
    const nextNum = (employees.length + 1).toString().padStart(3, '0')
    const newId: EmployeeID = {
      employeeId: `studio_${nextNum}`,
      employeeName: newEmployeeName.trim(),
      status: 'available',
      createdAt: new Date().toISOString().slice(0, 10),
    }
    setEmployees(prev => [newId, ...prev])
    setNewEmployeeName('')
    setEmployeeCreatedMsg(`Created: ${newId.employeeId}`)
    setTimeout(() => setEmployeeCreatedMsg(''), 3000)
  }

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 2000)
  }

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === 'all' || u.role === roleFilter
    return matchesSearch && matchesRole
  })

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-red-100 text-red-700',
      merchant: 'bg-green-100 text-green-700',
      user: 'bg-blue-100 text-blue-700',
      b2b_client: 'bg-orange-100 text-orange-700',
      influencer: 'bg-purple-100 text-purple-700',
      freelancer: 'bg-indigo-100 text-indigo-700',
    }
    return colors[role] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast notification */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl text-sm font-semibold shadow-lg bg-gray-900 text-white">
          {toastMsg}
        </div>
      )}
      {/* Sidebar */}
      <div className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Studio Admin</h1>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'overview'
              ? 'bg-gray-900 text-white'
              : 'text-gray-700 hover:bg-gray-100'
              }`}
          >
            <BarChart3 size={18} />
            Overview
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'users'
              ? 'bg-gray-900 text-white'
              : 'text-gray-700 hover:bg-gray-100'
              }`}
          >
            <Users size={18} />
            Users & Roles
          </button>

          <button
            onClick={() => setActiveTab('employees')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'employees'
              ? 'bg-gray-900 text-white'
              : 'text-gray-700 hover:bg-gray-100'
              }`}
          >
            <Users size={18} />
            Employee Management
          </button>

          <button
            onClick={() => setActiveTab('creators')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'creators'
              ? 'bg-gray-900 text-white'
              : 'text-gray-700 hover:bg-gray-100'
              }`}
          >
            <Users size={18} />
            Creator Applications
          </button>

          <button
            onClick={() => setActiveTab('services')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'services'
              ? 'bg-gray-900 text-white'
              : 'text-gray-700 hover:bg-gray-100'
              }`}
          >
            <Settings size={18} />
            Services
          </button>

          <button
            onClick={() => setActiveTab('offers')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'offers'
              ? 'bg-gray-900 text-white'
              : 'text-gray-700 hover:bg-gray-100'
              }`}
          >
            <Tag size={18} />
            Offers
          </button>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold">
              A
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">admin</p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
                <p className="text-sm text-gray-500 mt-1">Monitor your platform metrics</p>
              </div>
              <button
                onClick={loadData}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={32} className="animate-spin text-gray-400" />
              </div>
            ) : (
              <>
                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-6 mb-8">
                  <div className="bg-white p-6 rounded-xl border border-gray-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Users size={24} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{stats?.totalUsers}</p>
                        <p className="text-sm text-gray-500">Total Users</p>
                      </div>
                    </div>
                    <p className="text-xs text-green-600">+{stats?.recentSignups} this week</p>
                  </div>

                  <div className="bg-white p-6 rounded-xl border border-gray-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                        <Store size={24} className="text-green-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{stats?.totalMerchants}</p>
                        <p className="text-sm text-gray-500">Merchants</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">Active today: {stats?.activeToday}</p>
                  </div>

                  <div className="bg-white p-6 rounded-xl border border-gray-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                        <Radio size={24} className="text-purple-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{stats?.totalBroadcasts}</p>
                        <p className="text-sm text-gray-500">Broadcasts</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">Last 30 days</p>
                  </div>

                  <div className="bg-white p-6 rounded-xl border border-gray-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                        <ShoppingCart size={24} className="text-orange-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{stats?.totalOrders}</p>
                        <p className="text-sm text-gray-500">Orders</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">{stats?.totalOffers} active offers</p>
                  </div>
                </div>

                {/* Role Breakdown */}
                <div className="bg-white p-6 rounded-xl border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">User Breakdown by Role</h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Customers', count: stats?.roleBreakdown.users || 0, color: 'bg-blue-500' },
                      { label: 'Influencers', count: 3, color: 'bg-purple-500' },
                      { label: 'Freelancers', count: 3, color: 'bg-indigo-500' },
                      { label: 'B2B Clients', count: 3, color: 'bg-orange-500' },
                      { label: 'Admins', count: stats?.roleBreakdown.admins || 0, color: 'bg-red-500' },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-700">{item.label}</span>
                          <span className="text-sm font-semibold text-gray-900">{item.count}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${item.color} rounded-full transition-all duration-500`}
                            style={{ width: `${(item.count / (stats?.totalUsers || 1)) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Users & Roles Tab */}
        {activeTab === 'users' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Users & Roles</h2>
                <p className="text-sm text-gray-500 mt-1">Manage user accounts and permissions</p>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 mb-6">
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-gray-900"
                >
                  <option value="all">All Roles</option>
                  <option value="user">Customers</option>
                  <option value="merchant">Merchants</option>
                  <option value="influencer">Influencers</option>
                  <option value="freelancer">Freelancers</option>
                  <option value="b2b_client">B2B Clients</option>
                  <option value="admin">Admins</option>
                </select>
              </div>
            </div>

            {/* Role Count Cards */}
            <div className="grid grid-cols-6 gap-4 mb-6">
              {[
                { label: 'Customers', count: 2, color: 'text-blue-600' },
                { label: 'Influencers', count: 3, color: 'text-purple-600' },
                { label: 'Freelancers', count: 3, color: 'text-indigo-600' },
                { label: 'B2B Clients', count: 3, color: 'text-orange-600' },
                { label: 'Admins', count: 1, color: 'text-red-600' },
              ].map((role) => (
                <div key={role.label} className="bg-white p-4 rounded-xl border border-gray-200 text-center">
                  <p className={`text-3xl font-bold ${role.color}`}>{role.count}</p>
                  <p className="text-sm text-gray-500 mt-1">{role.label}</p>
                </div>
              ))}
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Joined</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.userId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{user.name}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{user.phone}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(user.role)}`}>
                          {user.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{user.createdAt}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleUserAction(user.userId, 'edit')}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit size={16} className="text-gray-600" />
                          </button>
                          {user.role !== 'admin' && (
                            user.status === 'active' ? (
                              <button
                                onClick={() => handleUserAction(user.userId, 'suspend')}
                                className="px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                Suspend
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUserAction(user.userId, 'activate')}
                                className="px-3 py-1 text-xs font-semibold text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              >
                                Activate
                              </button>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Services Tab */}
        {activeTab === 'services' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Service Catalog</h2>
                <p className="text-sm text-gray-500 mt-1">Manage available services</p>
              </div>
              <button
                onClick={() => showToast('Edit service — full editing coming soon')}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Plus size={18} />
                Add Service
              </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Service</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Duration</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {services.map((service) => (
                    <tr key={service.serviceId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">{service.name}</p>
                          <p className="text-sm text-gray-500">{service.description}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                          {service.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">₹{service.price.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{service.duration}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${service.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                          }`}>
                          {service.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleServiceToggle(service.serviceId)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title={service.status === 'active' ? 'Deactivate' : 'Activate'}
                          >
                            {service.status === 'active' ? (
                              <Eye size={16} className="text-gray-600" />
                            ) : (
                              <Eye size={16} className="text-gray-400" />
                            )}
                          </button>
                          <button
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit size={16} className="text-gray-600" />
                          </button>
                          <button
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                            onClick={() => handleDeleteService(service.serviceId)}
                          >
                            <Trash2 size={16} className="text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Offers Tab */}
        {activeTab === 'offers' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Promotional Offers</h2>
                <p className="text-sm text-gray-500 mt-1">Manage the promotional banners shown on the homepage</p>
              </div>
              <button
                onClick={() => showToast('Add offer — full editing coming soon')}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Plus size={18} />
                Add Offer
              </button>
            </div>

            <div className="space-y-4">
              {offers.map((offer, index) => (
                <div
                  key={offer.offerId}
                  className="bg-white p-6 rounded-xl border-l-4 border-gray-200 hover:border-red-600 transition-colors"
                  style={{
                    borderLeftColor: index === 0 ? '#DC2626' : index === 1 ? '#7C3AED' : index === 2 ? '#059669' : '#3B82F6'
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-2xl"
                      style={{
                        background: index === 0 ? '#DC2626' : index === 1 ? '#7C3AED' : index === 2 ? '#059669' : '#3B82F6'
                      }}
                    >
                      ✨
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-bold text-gray-900">{offer.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${offer.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                          }`}>
                          {offer.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{offer.description}</p>
                      <p className="text-xs text-gray-500 mt-1">Badge: {offer.badge}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={offer.status === 'active'}
                          onChange={() => handleOfferToggle(offer.offerId)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                      </label>
                      <button
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit size={18} className="text-gray-600" />
                      </button>
                      <button
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                        onClick={() => handleDeleteOffer(offer.offerId)}
                      >
                        <Trash2 size={18} className="text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Creator Applications Tab */}
        {activeTab === 'creators' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Creator Applications</h2>
                <p className="text-sm text-gray-500 mt-1">Review and approve creator signups</p>
              </div>
            </div>

            <div className="space-y-4">
              {creators.map((creator) => (
                <div key={creator.applicationId} className="bg-white p-6 rounded-xl border border-gray-200">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl">
                      {creator.name.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">{creator.name}</h3>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                          {creator.type}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p className="flex items-center gap-2">
                          <span className="text-gray-400">📧</span>
                          {creator.email}
                        </p>
                        <p className="flex items-center gap-2">
                          <span className="text-gray-400">📍</span>
                          {creator.phone}
                        </p>
                        <p className="flex items-center gap-2">
                          <span className="text-gray-400">📅</span>
                          Applied: {creator.appliedAt}
                        </p>
                      </div>
                    </div>

                    {creator.status === 'pending' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCreatorAction(creator.applicationId, 'reject')}
                          className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <X size={16} />
                          Reject
                        </button>
                        <button
                          onClick={() => handleCreatorAction(creator.applicationId, 'approve')}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          <CheckCircle size={16} />
                          Approve
                        </button>
                      </div>
                    )}

                    {creator.status === 'approved' && (
                      <span className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-semibold">
                        Approved
                      </span>
                    )}

                    {creator.status === 'rejected' && (
                      <span className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-semibold">
                        Rejected
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Employee Management Tab */}
        {activeTab === 'employees' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Employee Management</h2>
                <p className="text-sm text-gray-500 mt-1">Create and manage employee IDs for staff signup</p>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-6 mb-6">
              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <p className="text-sm text-gray-500 mb-2">Total IDs Created</p>
                <p className="text-3xl font-bold text-gray-900">{employees.length}</p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <p className="text-sm text-gray-500 mb-2">Available (Unused)</p>
                <p className="text-3xl font-bold text-green-600">
                  {employees.filter(e => e.status === 'available').length}
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <p className="text-sm text-gray-500 mb-2">Registered Employees</p>
                <p className="text-3xl font-bold text-blue-600">
                  {employees.filter(e => e.status === 'registered').length}
                </p>
              </div>
            </div>

            {/* Create New Employee ID */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Create New Employee ID</h3>
              <p className="text-sm text-gray-500 mb-4">Generate a unique employee ID that staff members can use to sign up</p>

              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <Users size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Enter employee name..."
                    value={newEmployeeName}
                    onChange={e => setNewEmployeeName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-red-600"
                    onKeyDown={e => e.key === 'Enter' && handleCreateEmployee()}
                  />
                </div>
                <button
                  onClick={handleCreateEmployee}
                  disabled={!newEmployeeName.trim()}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:opacity-50"
                >
                  Create Employee ID
                </button>
              </div>
              {employeeCreatedMsg && (
                <p className="text-sm text-green-600 font-semibold mt-2">✓ {employeeCreatedMsg}</p>
              )}
              <p className="text-xs text-gray-500 mt-2">The system will auto-generate a unique ID (e.g., studio_001, studio_002)</p>
            </div>

            {/* Employee Registrations */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">Employee Registrations</h3>
                <p className="text-sm text-gray-500">All created employee IDs and their status</p>
              </div>

              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Employee ID</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Employee Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Registered</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {employees.map((employee) => (
                    <tr key={employee.employeeId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <code className="px-3 py-1 bg-gray-100 rounded text-sm font-mono text-gray-900">
                            {employee.employeeId}
                          </code>
                          <button
                            onClick={() => navigator.clipboard.writeText(employee.employeeId)}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                            title="Copy ID"
                          >
                            <Copy size={14} className="text-gray-400" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900">{employee.employeeName}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${employee.status === 'registered'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-green-100 text-green-700'
                          }`}>
                          {employee.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{employee.createdAt}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{employee.registeredAt || '-'}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye size={16} className="text-gray-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminDashboardEnhanced
