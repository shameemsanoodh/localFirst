const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'https://4cwdqd7sz4.execute-api.ap-south-1.amazonaws.com/prod'

export interface AdminStats {
  totalUsers: number
  totalMerchants: number
  totalBroadcasts: number
  totalProducts: number
  activeToday: number
  recentSignups: number
  merchantsByCategory: { category: string; count: number }[]
  userGrowth: { date: string; users: number }[]
}

export interface Merchant {
  merchantId: string
  shopName: string
  ownerName: string
  email: string
  phone: string
  majorCategory: string
  subCategory: string
  location: { lat: number; lng: number }
  address: string
  status: 'active' | 'suspended'
  createdAt: string
  onboardingCompleted: boolean
}

export interface User {
  userId: string
  phone: string
  name?: string
  location?: { lat: number; lng: number; area?: string }
  createdAt: string
  status: 'active' | 'suspended'
}

export interface Broadcast {
  broadcastId: string
  userId: string
  userName?: string
  message: string
  category?: string
  location: { lat: number; lng: number; area?: string }
  createdAt: string
  status: 'active' | 'expired'
  responseCount: number
}

export interface LocationInsight {
  area: string
  merchantCount: number
  userCount: number
  broadcastCount: number
  topCategories: { category: string; count: number }[]
}

export interface SearchTrend {
  keyword: string
  count: number
  category?: string
  trend: 'up' | 'down' | 'stable'
}

class ApiService {
  private async fetch(endpoint: string, options?: RequestInit) {
    const token = localStorage.getItem('admin-token')
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options?.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`)
    }

    return response.json()
  }

  // Dashboard Stats
  async getStats(): Promise<AdminStats> {
    return this.fetch('/admin/stats')
  }

  // Merchants
  async getMerchants(): Promise<Merchant[]> {
    return this.fetch('/admin/merchants')
  }

  async suspendMerchant(merchantId: string): Promise<void> {
    return this.fetch(`/admin/merchants/${merchantId}/suspend`, { method: 'POST' })
  }

  async activateMerchant(merchantId: string): Promise<void> {
    return this.fetch(`/admin/merchants/${merchantId}/activate`, { method: 'POST' })
  }

  async deleteMerchant(merchantId: string): Promise<void> {
    return this.fetch(`/admin/merchants/${merchantId}`, { method: 'DELETE' })
  }

  // Users
  async getUsers(): Promise<User[]> {
    return this.fetch('/admin/users')
  }

  async suspendUser(userId: string): Promise<void> {
    return this.fetch(`/admin/users/${userId}/suspend`, { method: 'POST' })
  }

  async activateUser(userId: string): Promise<void> {
    return this.fetch(`/admin/users/${userId}/activate`, { method: 'POST' })
  }

  async deleteUser(userId: string): Promise<void> {
    return this.fetch(`/admin/users/${userId}`, { method: 'DELETE' })
  }

  // Broadcasts
  async getBroadcasts(): Promise<Broadcast[]> {
    return this.fetch('/admin/broadcasts')
  }

  async deleteBroadcast(broadcastId: string): Promise<void> {
    return this.fetch(`/admin/broadcasts/${broadcastId}`, { method: 'DELETE' })
  }

  // Location Analytics
  async getLocationInsights(): Promise<LocationInsight[]> {
    return this.fetch('/admin/analytics/location')
  }

  // Search Analytics
  async getSearchTrends(): Promise<SearchTrend[]> {
    return this.fetch('/admin/analytics/search')
  }
}

export const apiService = new ApiService()
