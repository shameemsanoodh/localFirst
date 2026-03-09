export interface Broadcast {
  id: string
  broadcastId?: string
  userId: string
  productName: string
  query?: string
  category?: string
  detectedCategory?: string
  userLat: number
  userLng: number
  radius: number
  status: 'active' | 'cancelled' | 'expired'
  createdAt: string
  updatedAt: string
  distance?: number
  confidence?: number
  maxPrice?: number
  merchantResponse?: {
    response: 'accept' | 'reject' | 'schedule'
    scheduledTime?: string
    price?: number
    notes?: string
  }
}

export interface BroadcastResponse {
  id: string
  broadcastId: string
  merchantId: string
  response: 'accept' | 'reject' | 'schedule'
  price?: number
  scheduledTime?: string
  notes?: string
  createdAt: string
}

export interface Offer {
  id: string
  merchantId: string
  title: string
  description: string
  discount?: number
  validUntil: string
  status: 'active' | 'paused' | 'expired'
  createdAt: string
}

export interface Reservation {
  id: string
  broadcastId: string
  userId: string
  merchantId: string
  productName: string
  price: number
  status: 'active' | 'picked_up' | 'expired'
  createdAt: string
  expiresAt: string
}
