export type UserRole = 'user' | 'merchant' | 'admin'

export interface User {
  id: string
  userId?: string
  phone: string
  email?: string
  name?: string
  role: UserRole
  merchantId?: string
  avatarUrl?: string
  createdAt: string
  updatedAt: string
}
