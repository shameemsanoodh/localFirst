import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'nearby-app-secret-key-change-in-production'

export interface TokenPayload {
  merchantId: string
  email: string
  role: 'merchant' | 'customer'
  phone: string
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload
}
