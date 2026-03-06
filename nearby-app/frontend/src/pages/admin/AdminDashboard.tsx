import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Store, ShoppingCart, Radio, ChevronRight, ChevronDown,
  Plus, Pencil, Trash2, Search, Ban, CheckCircle, MessageCircle, X,
  ArrowLeft, LogOut, RefreshCw, TrendingUp, BarChart3, Loader2
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { useAuthStore } from '@/store/authStore'
import { adminService, type AdminStats, type AdminUser } from '@/services/admin.service'
import { categoriesService } from '@/services/categories.service'
import type { Category } from '@/types/category.types'
import { VoiceSearchAnalytics } from '@/components/analytics/VoiceSearchAnalytics'

// ——— Category Tree Node ———

interface CategoryNode {
  id: string
  name: string
  icon: string
  children: CategoryNode[]
}

// ——— Support Tickets (mock for now) ———
interface Ticket {
  id: string
  title: string
  user: string
  role: string
  message: string
  status: 'open' | 'in progress'
}

const mockTickets: Ticket[] = [
  { id: 't1', title: 'Order not received', user: 'Rahul K', role: 'user', message: 'My order #01 has not been delivered yet', status: 'open' },
  { id: 't2', title: 'Payment issue', user: 'QuickFix Hardware', role: 'merchant', message: 'Payment for last week is pending', status: 'in progress' },
]

// ——— Subcomponents ———

const CategoryTreeItem: React.FC<{
  node: CategoryNode
  onEdit: (node: CategoryNode) => void
  onDelete: (node: CategoryNode) => void
  onAddChild: (parentId: string) => void
}> = ({ node, onEdit, onDelete, onAddChild }) => {
  const [expanded, setExpanded] = useState(false)
  const hasChildren = node.children.length > 0

  return (
    <div>
      <div className="flex items-center gap-3 py-3 px-4 hover:bg-gray-50 rounded-xl transition-colors group">
        <button
          onClick={() => hasChildren && setExpanded(!expanded)}
          className={`w-6 h-6 flex items-center justify-center rounded-md transition-all ${hasChildren ? 'text-gray-500 hover:bg-gray-200 cursor-pointer' : 'text-transparent'}`}
        >
          {hasChildren && (expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />)}
        </button>

        <span className="text-xl">{node.icon}</span>
        <span className="flex-1 font-medium text-gray-900 text-sm">{node.name}</span>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onAddChild(node.id)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors" title="Add subcategory">
            <Plus size={14} />
          </button>
          <button onClick={() => onEdit(node)} className="p-1.5 rounded-lg hover:bg-yellow-50 text-yellow-600 transition-colors" title="Edit">
            <Pencil size={14} />
          </button>
          <button onClick={() => onDelete(node)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors" title="Delete">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="ml-8 border-l-2 border-gray-100 pl-2 overflow-hidden"
          >
            {node.children.map((child) => (
              <CategoryTreeItem
                key={child.id}
                node={child}
                onEdit={onEdit}
                onDelete={onDelete}
                onAddChild={onAddChild}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ——— Add/Edit Category Modal ———

const CategoryModal: React.FC<{
  isOpen: boolean
  onClose: () => void
  onSave: (name: string, icon: string) => void
  editNode?: CategoryNode | null
  parentName?: string
  isSaving?: boolean
}> = ({ isOpen, onClose, onSave, editNode, parentName, isSaving }) => {
  const [name, setName] = useState(editNode?.name || '')
  const [icon, setIcon] = useState(editNode?.icon || '📁')

  React.useEffect(() => {
    setName(editNode?.name || '')
    setIcon(editNode?.icon || '📁')
  }, [editNode, isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-lg text-gray-900">
            {editNode ? 'Edit Category' : parentName ? `Add subcategory to ${parentName}` : 'Add Category'}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Icon (emoji)</label>
            <input
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-nearby-500 focus:border-transparent outline-none text-2xl text-center"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Category Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Groceries"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-nearby-500 focus:border-transparent outline-none text-sm"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 px-4 border border-gray-200 rounded-xl text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={() => { if (name.trim()) { onSave(name.trim(), icon); } }}
            disabled={isSaving}
            className="flex-1 py-2.5 px-4 bg-nearby-500 text-white rounded-xl font-medium text-sm hover:bg-nearby-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSaving && <Loader2 size={14} className="animate-spin" />}
            {editNode ? 'Save Changes' : 'Add Category'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ——— Main Admin Dashboard ———

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'categories' | 'users' | 'support' | 'analytics' | 'voice-analytics'>('categories')
  const [categories, setCategories] = useState<CategoryNode[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingNode, setEditingNode] = useState<CategoryNode | null>(null)
  const [addParentId, setAddParentId] = useState<string | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const navTo = useNavigate()
  const { clearAuth } = useAuthStore()

  // ——— Fetch real data from API ———

  const fetchStats = useCallback(async () => {
    setIsLoadingStats(true)
    try {
      const data = await adminService.getStats()
      setStats(data)
    } catch (err) {
      console.error('Failed to load admin stats:', err)
    } finally {
      setIsLoadingStats(false)
    }
  }, [])

  const fetchUsers = useCallback(async () => {
    setIsLoadingUsers(true)
    try {
      const data = await adminService.getUsers()
      setUsers(data)
    } catch (err) {
      console.error('Failed to load users:', err)
    } finally {
      setIsLoadingUsers(false)
    }
  }, [])

  const fetchCategories = useCallback(async () => {
    setIsLoadingCategories(true)
    try {
      const apiCategories = await categoriesService.getAll()
      // Map API categories to tree nodes
      const nodes: CategoryNode[] = apiCategories.map((cat: Category) => ({
        id: (cat as any).categoryId || (cat as any).id || cat.name.toLowerCase(),
        name: cat.name,
        icon: (cat as any).emoji || '📦',
        children: [],
      }))
      setCategories(nodes)
    } catch (err) {
      console.error('Failed to load categories:', err)
    } finally {
      setIsLoadingCategories(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
    fetchCategories()
  }, [fetchStats, fetchCategories])

  useEffect(() => {
    if (activeTab === 'users' && users.length === 0) {
      fetchUsers()
    }
  }, [activeTab, users.length, fetchUsers])

  // ——— Stats display ———

  const statsCards = stats ? [
    { label: 'Users', value: stats.totalUsers.toLocaleString(), icon: Users, color: 'bg-blue-50 text-blue-600', detail: `${stats.recentSignups} this week` },
    { label: 'Merchants', value: stats.roleBreakdown.merchants.toLocaleString(), icon: Store, color: 'bg-green-50 text-green-600', detail: 'verified' },
    { label: 'Orders', value: stats.totalOrders.toLocaleString(), icon: ShoppingCart, color: 'bg-purple-50 text-purple-600', detail: `${stats.totalOffers} offers` },
    { label: 'Broadcasts', value: stats.totalBroadcasts.toLocaleString(), icon: Radio, color: 'bg-orange-50 text-orange-500', detail: `${stats.totalCategories} categories` },
  ] : []

  // ——— Category CRUD with API ———

  const findParentName = (parentId: string, nodes: CategoryNode[]): string => {
    for (const n of nodes) {
      if (n.id === parentId) return n.name
      const found = findParentName(parentId, n.children)
      if (found) return found
    }
    return ''
  }

  const handleSave = async (name: string, icon: string) => {
    setIsSaving(true)
    try {
      if (editingNode) {
        // Update via API
        await categoriesService.update(editingNode.id, { name, emoji: icon } as any)
        setCategories(prev => prev.map(n =>
          n.id === editingNode.id ? { ...n, name, icon } : n
        ))
      } else {
        // Create via API
        const parentId = addParentId || 'root'
        const newCat = await categoriesService.create({ name, emoji: icon, parentId } as any)
        const newNode: CategoryNode = {
          id: (newCat as any).categoryId || (newCat as any).id || `cat-${Date.now()}`,
          name,
          icon,
          children: [],
        }
        if (addParentId) {
          setCategories(prev => prev.map(n =>
            n.id === addParentId ? { ...n, children: [...n.children, newNode] } : n
          ))
        } else {
          setCategories(prev => [...prev, newNode])
        }
      }
      setModalOpen(false)
      setEditingNode(null)
      setAddParentId(null)
      // Refresh stats
      fetchStats()
    } catch (err) {
      console.error('Failed to save category:', err)
      alert('Failed to save category. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (node: CategoryNode) => {
    if (!confirm(`Delete category "${node.name}"?`)) return
    try {
      await categoriesService.delete(node.id)
      setCategories(prev => prev.filter(n => n.id !== node.id))
      fetchStats()
    } catch (err) {
      console.error('Failed to delete category:', err)
      alert('Failed to delete category.')
    }
  }

  const handleEdit = (node: CategoryNode) => {
    setEditingNode(node)
    setAddParentId(null)
    setModalOpen(true)
  }

  const handleAddChild = (parentId: string) => {
    setEditingNode(null)
    setAddParentId(parentId)
    setModalOpen(true)
  }

  // ——— User Actions with API ———

  const handleToggleUser = async (userId: string, currentStatus?: string) => {
    try {
      const action = currentStatus === 'active' ? 'suspend' : 'activate'
      await adminService.manageUser(userId, action)
      setUsers(prev => prev.map(u => {
        if (u.userId !== userId) return u
        return { ...u, status: action === 'suspend' ? 'suspended' : 'active' }
      }))
    } catch (err) {
      console.error('Failed to manage user:', err)
      alert('Failed to update user status.')
    }
  }

  const handleLogout = () => {
    clearAuth()
    localStorage.removeItem('auth-token')
    localStorage.removeItem('refresh-token')
    localStorage.removeItem('auth-storage')
    navTo('/login')
  }

  const tabs = ['categories', 'users', 'support', 'analytics', 'voice-analytics'] as const

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-8">
      {/* Header */}
      <div className="px-4 pt-8 pb-4 premium-container">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navTo(-1)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <ArrowLeft size={20} className="text-gray-700" />
            </button>
            <h1 className="text-2xl font-display font-bold text-gray-900">Admin Panel</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { fetchStats(); fetchCategories(); fetchUsers(); }} className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors text-gray-500 hover:text-gray-700" title="Refresh">
              <RefreshCw size={18} />
            </button>
            <button onClick={handleLogout} className="p-2.5 hover:bg-red-50 rounded-xl transition-colors text-gray-500 hover:text-red-500" title="Logout">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="px-4 premium-container">
        {isLoadingStats ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="bg-white animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gray-100" />
                  <div>
                    <div className="h-6 w-12 bg-gray-100 rounded mb-1" />
                    <div className="h-3 w-16 bg-gray-50 rounded" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {statsCards.map((stat, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <Card className="bg-white">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${stat.color}`}>
                      <stat.icon size={22} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      <p className="text-xs text-gray-500">{stat.label}</p>
                      <p className="text-[10px] text-gray-400">{stat.detail}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="px-4 mt-6 premium-container">
        <div className="bg-white rounded-2xl shadow-card p-1 flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 px-4 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${activeTab === tab
                ? 'bg-gray-900 text-white'
                : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              {tab === 'voice-analytics' ? 'Voice Analytics' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4 mt-6 premium-container">

        {/* ===== Categories Tab ===== */}
        {activeTab === 'categories' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">Category Tree ({categories.length})</h2>
              <button
                onClick={() => { setEditingNode(null); setAddParentId(null); setModalOpen(true) }}
                className="flex items-center gap-1.5 bg-nearby-500 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-nearby-600 transition-colors"
              >
                <Plus size={16} /> Add
              </button>
            </div>

            {isLoadingCategories ? (
              <Card className="bg-white">
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={24} className="animate-spin text-gray-400" />
                  <span className="ml-2 text-sm text-gray-500">Loading categories...</span>
                </div>
              </Card>
            ) : (
              <Card className="bg-white divide-y divide-gray-50">
                {categories.map((cat) => (
                  <CategoryTreeItem
                    key={cat.id}
                    node={cat}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onAddChild={handleAddChild}
                  />
                ))}
                {categories.length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-sm">No categories yet</div>
                )}
              </Card>
            )}

            <CategoryModal
              isOpen={modalOpen}
              onClose={() => { setModalOpen(false); setEditingNode(null); setAddParentId(null) }}
              onSave={handleSave}
              editNode={editingNode}
              parentName={addParentId ? findParentName(addParentId, categories) : undefined}
              isSaving={isSaving}
            />
          </motion.div>
        )}

        {/* ===== Users Tab ===== */}
        {activeTab === 'users' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Search */}
            <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-2xl shadow-card mb-4">
              <Search size={18} className="text-gray-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users..."
                className="flex-1 outline-none text-sm text-gray-900 placeholder:text-gray-400"
              />
            </div>

            {isLoadingUsers ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={24} className="animate-spin text-gray-400" />
                <span className="ml-2 text-sm text-gray-500">Loading users...</span>
              </div>
            ) : (
              <div className="space-y-3">
                {users
                  .filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((user) => (
                    <Card key={user.userId} className="bg-white">
                      <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${user.role === 'admin' ? 'bg-red-500' : user.role === 'merchant' ? 'bg-green-500' : 'bg-blue-500'
                          }`}>
                          {user.name.charAt(0)}
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm truncate">{user.name}</p>
                          <p className="text-xs text-gray-500 truncate">
                            {user.email} ·
                            <span className={`ml-1 ${user.role === 'admin' ? 'text-red-500' : user.role === 'merchant' ? 'text-green-600' : 'text-blue-500'} font-medium`}>
                              {user.role}
                            </span>
                          </p>
                          <p className="text-[10px] text-gray-400">Joined: {new Date(user.createdAt).toLocaleDateString()}</p>
                        </div>
                        {/* Action */}
                        {user.role !== 'admin' && (
                          user.status === 'suspended' ? (
                            <button onClick={() => handleToggleUser(user.userId, 'suspended')} className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-xs font-medium hover:bg-green-100 transition-colors">
                              <CheckCircle size={13} /> Activate
                            </button>
                          ) : (
                            <button onClick={() => handleToggleUser(user.userId, 'active')} className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors">
                              <Ban size={13} /> Suspend
                            </button>
                          )
                        )}
                        {user.role === 'admin' && (
                          <span className="text-xs text-gray-400 font-medium px-2.5 py-1 rounded-full bg-red-50 text-red-500">Admin</span>
                        )}
                      </div>
                    </Card>
                  ))}
                {users.length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-sm">No users found</div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* ===== Support Tab ===== */}
        {activeTab === 'support' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {mockTickets.map((ticket) => (
              <Card key={ticket.id} className="bg-white">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">{ticket.title}</h3>
                    <p className="text-xs text-gray-500">by {ticket.user} ({ticket.role})</p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ticket.status === 'open' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                    }`}>
                    {ticket.status}
                  </span>
                </div>
                <div className="bg-gray-50 rounded-xl px-4 py-3 mb-3">
                  <p className="text-sm text-gray-700">{ticket.message}</p>
                </div>
                <button className="flex items-center gap-1.5 text-blue-600 text-sm font-medium hover:text-blue-700 transition-colors">
                  <MessageCircle size={14} /> Reply
                </button>
              </Card>
            ))}
          </motion.div>
        )}

        {/* ===== Analytics Tab ===== */}
        {activeTab === 'analytics' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {stats ? (
              <div className="space-y-4">
                <Card className="bg-white">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <BarChart3 size={18} className="text-nearby-500" />
                    Platform Overview
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-xl">
                      <p className="text-2xl font-bold text-blue-600">{stats.totalUsers}</p>
                      <p className="text-xs text-gray-500 mt-1">Total Users</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-xl">
                      <p className="text-2xl font-bold text-green-600">{stats.totalCategories}</p>
                      <p className="text-xs text-gray-500 mt-1">Categories</p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-xl">
                      <p className="text-2xl font-bold text-purple-600">{stats.totalOffers}</p>
                      <p className="text-xs text-gray-500 mt-1">Offers</p>
                    </div>
                  </div>
                </Card>

                <Card className="bg-white">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <TrendingUp size={18} className="text-green-500" />
                    User Breakdown
                  </h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Regular Users', count: stats.roleBreakdown.users, color: 'bg-blue-500', total: stats.totalUsers },
                      { label: 'Merchants', count: stats.roleBreakdown.merchants, color: 'bg-green-500', total: stats.totalUsers },
                      { label: 'Admins', count: stats.roleBreakdown.admins, color: 'bg-red-500', total: stats.totalUsers },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-700">{item.label}</span>
                          <span className="text-sm font-semibold text-gray-900">{item.count}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${item.color} rounded-full transition-all duration-500`}
                            style={{ width: `${item.total > 0 ? (item.count / item.total) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="bg-white">
                  <h3 className="font-bold text-gray-900 mb-2">Recent Activity</h3>
                  <p className="text-sm text-gray-500">
                    <span className="font-semibold text-gray-900">{stats.recentSignups}</span> new signups in the last 7 days
                  </p>
                </Card>
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📊</div>
                <p className="text-gray-500 font-medium">Loading analytics...</p>
              </div>
            )}
          </motion.div>
        )}

        {/* ===== Voice Analytics Tab ===== */}
        {activeTab === 'voice-analytics' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <VoiceSearchAnalytics />
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default AdminDashboard
