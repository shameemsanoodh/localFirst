import React, { useState, useEffect } from 'react'
import { Search, Loader2, Trash2, History, X } from 'lucide-react'
import Layout from '../components/Layout'
import { apiService, User } from '../services/api.service'

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [userHistory, setUserHistory] = useState<User['searchHistory']>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const data = await apiService.getUsers()
      setUsers(data)
    } catch (error) {
      console.error('Failed to load users:', error)
      setUsers([
        {
          userId: 'U001',
          phone: '9876543210',
          email: 'john@example.com',
          name: 'John Doe',
          location: { lat: 12.9716, lng: 77.5946, area: 'Koramangala' },
          createdAt: '2026-02-10',
          status: 'active',
          lastActive: '2026-03-05',
          totalSearches: 24,
        },
        {
          userId: 'U002',
          phone: '9876543211',
          email: 'jane@example.com',
          name: 'Jane Smith',
          location: { lat: 12.9716, lng: 77.5946, area: 'Indiranagar' },
          createdAt: '2026-02-15',
          status: 'active',
          lastActive: '2026-03-04',
          totalSearches: 18,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const loadUserHistory = async (user: User) => {
    setSelectedUser(user)
    setShowHistoryModal(true)
    setLoadingHistory(true)
    try {
      const history = await apiService.getUserHistory(user.userId)
      setUserHistory(history || [])
    } catch (error) {
      console.error('Failed to load user history:', error)
      setUserHistory([
        {
          broadcastId: 'B001',
          query: 'Looking for fresh vegetables',
          timestamp: '2026-03-05T10:30:00Z',
          responseCount: 3,
        },
        {
          broadcastId: 'B002',
          query: 'Need a plumber urgently',
          timestamp: '2026-03-04T14:20:00Z',
          responseCount: 5,
        },
      ])
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleSuspend = async (userId: string) => {
    try {
      await apiService.suspendUser(userId)
      setUsers(prev => prev.map(u => (u.userId === userId ? { ...u, status: 'suspended' as const } : u)))
    } catch (error) {
      console.error('Failed to suspend user:', error)
    }
  }

  const handleActivate = async (userId: string) => {
    try {
      await apiService.activateUser(userId)
      setUsers(prev => prev.map(u => (u.userId === userId ? { ...u, status: 'active' as const } : u)))
    } catch (error) {
      console.error('Failed to activate user:', error)
    }
  }

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return
    try {
      await apiService.deleteUser(userId)
      setUsers(prev => prev.filter(u => u.userId !== userId))
    } catch (error) {
      console.error('Failed to delete user:', error)
    }
  }

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.phone.includes(searchQuery) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 size={48} className="animate-spin text-green-600" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500 mt-1">Manage user accounts</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 mb-6">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, phone, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-green-600"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Joined</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Last Active</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Searches</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.userId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{user.phone}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{user.email || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                        user.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {user.lastActive ? new Date(user.lastActive).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => loadUserHistory(user)}
                      className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700 font-medium"
                    >
                      <History size={14} />
                      {user.totalSearches || 0}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {user.status === 'active' ? (
                        <button
                          onClick={() => handleSuspend(user.userId)}
                          className="px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          Suspend
                        </button>
                      ) : (
                        <button
                          onClick={() => handleActivate(user.userId)}
                          className="px-3 py-1 text-xs font-semibold text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        >
                          Reactivate
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(user.userId)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} className="text-gray-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Search History Modal */}
        {showHistoryModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Search History</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedUser?.phone} - Last 20 queries
                  </p>
                </div>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {loadingHistory ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 size={32} className="animate-spin text-green-600" />
                  </div>
                ) : !userHistory || userHistory.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    No search history found
                  </div>
                ) : (
                  <div className="space-y-3">
                    {userHistory.map((item) => (
                      <div
                        key={item.broadcastId}
                        className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <p className="font-medium text-gray-900 mb-2">{item.query}</p>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>{new Date(item.timestamp).toLocaleString()}</span>
                          <span className={item.responseCount > 0 ? 'text-green-600' : 'text-red-600'}>
                            {item.responseCount} {item.responseCount === 1 ? 'response' : 'responses'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default Users
