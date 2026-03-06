import React, { useState, useEffect } from 'react'
import { Search, Loader2, Edit } from 'lucide-react'
import { apiService, User } from '../services/api.service'

const UsersNew: React.FC = () => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const data = await apiService.getUsers()
      setUsers(data)
    } catch (error) {
      console.error('Failed to fetch users:', error)
      // Mock data
      setUsers([
        {
          userId: '1',
          phone: '-',
          name: 'Faris',
          createdAt: '2026-02-10T00:00:00Z',
          status: 'active'
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const roleCounts = {
    customers: 2,
    influencers: 3,
    freelancers: 3,
    b2bClients: 3,
    admins: 1
  }

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      'b2b client': 'bg-orange-100 text-orange-700',
      'admin': 'bg-red-100 text-red-700',
      'merchant': 'bg-green-100 text-green-700',
      'user': 'bg-blue-100 text-blue-700',
      'influencer': 'bg-purple-100 text-purple-700',
      'freelancer': 'bg-indigo-100 text-indigo-700'
    }
    return colors[role.toLowerCase()] || 'bg-gray-100 text-gray-700'
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.phone?.includes(searchQuery)
    return matchesSearch
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Users & Roles</h1>
        <p className="text-gray-600 mt-1">Manage user accounts and permissions</p>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>
        
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white"
        >
          <option value="all">All Roles</option>
          <option value="customers">Customers</option>
          <option value="influencers">Influencers</option>
          <option value="freelancers">Freelancers</option>
          <option value="b2b">B2B Clients</option>
          <option value="admins">Admins</option>
        </select>
      </div>

      {/* Role Count Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <div className="text-3xl font-bold text-gray-900 mb-2">{roleCounts.customers}</div>
          <div className="text-sm text-gray-600">Customers</div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <div className="text-3xl font-bold text-gray-900 mb-2">{roleCounts.influencers}</div>
          <div className="text-sm text-gray-600">Influencers</div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <div className="text-3xl font-bold text-gray-900 mb-2">{roleCounts.freelancers}</div>
          <div className="text-sm text-gray-600">Freelancers</div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <div className="text-3xl font-bold text-gray-900 mb-2">{roleCounts.b2bClients}</div>
          <div className="text-sm text-gray-600">B2b Clients</div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <div className="text-3xl font-bold text-gray-900 mb-2">{roleCounts.admins}</div>
          <div className="text-sm text-gray-600">Admins</div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">User</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Phone</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Role</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Joined</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.userId} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-400 to-pink-500 flex items-center justify-center text-white font-semibold">
                          {user.name?.[0]?.toUpperCase() || 'F'}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{user.name || 'Faris'}</div>
                          <div className="text-sm text-gray-500">0eb7a09a...</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {user.phone || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor('b2b client')}`}>
                        b2b client
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                        <Edit size={16} />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default UsersNew
