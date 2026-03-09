export interface Order {
  id: string
  userId: string
  merchantId: string
  broadcastId: string
  productName: string
  price: number
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  createdAt: string
  updatedAt: string
}
