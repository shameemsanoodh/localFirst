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
  city?: string
  status: 'active' | 'suspended' | 'pending'
  createdAt: string
  onboardingCompleted: boolean
  responseRate?: number
  capabilitiesEnabled?: string[]
  broadcastHistory?: Array<{
    broadcastId: string
    query: string
    responseType: string
    timestamp: string
  }>
}

export interface User {
  userId: string
  phone: string
  email?: string
  name?: string
  location?: { lat: number; lng: number; area?: string }
  createdAt: string
  status: 'active' | 'suspended'
  lastActive?: string
  totalSearches?: number
  searchHistory?: Array<{
    broadcastId: string
    query: string
    timestamp: string
    responseCount: number
  }>
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

export interface AnalyticsData {
  topQueries: Array<{ query: string; count: number }>
  topCategories: Array<{ category: string; count: number }>
  supplyGaps: Array<{ query: string; count: number; category?: string }>
  searchesPerDay: Array<{ date: string; count: number }>
  categoryDistribution: Array<{ category: string; count: number; percentage: number }>
}

export interface Query {
  queryId: string
  senderType: 'user' | 'merchant'
  senderPhone: string
  message: string
  status: 'pending' | 'reviewed'
  createdAt: string
}

export interface Config {
  searchRadiusKm: number
  globalOffersEnabled: boolean
  lastUpdated?: string
}

export interface Offer {
  offerId: string
  merchantId?: string
  merchantName?: string
  title: string
  description: string
  status: 'active' | 'paused'
  expiresAt?: string
  createdAt: string
  isGlobal: boolean
}

export interface NotificationPayload {
  audience: 'all_users' | 'all_merchants' | 'city'
  city?: string
  title: string
  message: string
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

    if (response.status === 401) {
      // Token expired or invalid, redirect to login
      localStorage.removeItem('admin-token')
      window.location.href = '/login'
      throw new Error('Unauthorized')
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `API Error: ${response.statusText}`)
    }

    return response.json()
  }

  // Auth
  async login(email: string, password: string): Promise<{ token: string; admin: any }> {
    const response = await fetch(`${API_BASE_URL}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Login failed')
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
    return this.fetch(`/admin/merchants/${merchantId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'suspended' })
    })
  }

  async activateMerchant(merchantId: string): Promise<void> {
    return this.fetch(`/admin/merchants/${merchantId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'active' })
    })
  }

  async approveMerchant(merchantId: string): Promise<void> {
    return this.fetch(`/admin/merchants/${merchantId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'active' })
    })
  }

  async deleteMerchant(merchantId: string): Promise<void> {
    return this.fetch(`/admin/merchants/${merchantId}`, { method: 'DELETE' })
  }

  // Users
  async getUsers(): Promise<User[]> {
    return this.fetch('/admin/users')
  }

  async getUserHistory(userId: string): Promise<User['searchHistory']> {
    return this.fetch(`/admin/users/${userId}/history`)
  }

  async suspendUser(userId: string): Promise<void> {
    return this.fetch(`/admin/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'suspended' })
    })
  }

  async activateUser(userId: string): Promise<void> {
    return this.fetch(`/admin/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'active' })
    })
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

  async getAnalytics(): Promise<AnalyticsData> {
    return this.fetch('/admin/analytics/search')
  }

  // Queries
  async getQueries(): Promise<Query[]> {
    return this.fetch('/admin/queries')
  }

  async markQueryReviewed(queryId: string): Promise<void> {
    return this.fetch(`/admin/queries/${queryId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'reviewed' })
    })
  }

  async deleteQuery(queryId: string): Promise<void> {
    return this.fetch(`/admin/queries/${queryId}`, { method: 'DELETE' })
  }

  // Config
  async getConfig(): Promise<Config> {
    return this.fetch('/admin/config')
  }

  async updateConfig(config: Partial<Config>): Promise<void> {
    return this.fetch('/admin/config', {
      method: 'PATCH',
      body: JSON.stringify(config)
    })
  }

  // Offers
  async getOffers(): Promise<Offer[]> {
    return this.fetch('/admin/offers')
  }

  async createOffer(offer: Omit<Offer, 'offerId' | 'createdAt'>): Promise<Offer> {
    return this.fetch('/admin/offers', {
      method: 'POST',
      body: JSON.stringify(offer)
    })
  }

  async updateOfferStatus(offerId: string, status: 'active' | 'paused'): Promise<void> {
    return this.fetch(`/admin/offers/${offerId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    })
  }

  async deleteOffer(offerId: string): Promise<void> {
    return this.fetch(`/admin/offers/${offerId}`, { method: 'DELETE' })
  }

  // Notifications
  async sendNotification(payload: NotificationPayload): Promise<void> {
    return this.fetch('/admin/notifications', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
  }
}

export const apiService = new ApiService()
