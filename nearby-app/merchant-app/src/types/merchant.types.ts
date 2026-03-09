export interface Merchant {
  id: string
  merchantId: string
  phone: string
  email?: string
  shopName: string
  ownerName: string
  category: string
  subcategory?: string
  address: string
  city: string
  latitude: number
  longitude: number
  status: 'pending' | 'approved' | 'suspended'
  isOpen: boolean
  openHour?: number
  closeHour?: number
  capabilities?: string[]
  responseRate?: number
  createdAt: string
  updatedAt: string
}
