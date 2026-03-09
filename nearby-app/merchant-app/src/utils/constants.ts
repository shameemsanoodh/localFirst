export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
export const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:3000';

export const APP_NAME = 'NearBy';
export const APP_TAGLINE = 'Your Local, Instantly';

export const DEFAULT_RADIUS = 5; // km
export const BROADCAST_TIMEOUT = 30000; // 30 seconds
export const RESERVATION_TIMEOUT = 900000; // 15 minutes

export const ROLES = {
  USER: 'user',
  MERCHANT: 'merchant',
  ADMIN: 'admin',
} as const;

export const ORDER_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  PICKED_UP: 'pickedup',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const BROADCAST_STATUS = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  FULFILLED: 'fulfilled',
  CANCELLED: 'cancelled',
} as const;

export const CATEGORIES = [
  { id: 'groceries', name: 'Groceries', icon: '🛒', color: 'bg-green-100' },
  { id: 'home', name: 'Home Essentials', icon: '🏠', color: 'bg-blue-100' },
  { id: 'hardware', name: 'Hardware', icon: '🔧', color: 'bg-orange-100' },
  { id: 'pharmacy', name: 'Pharmacy', icon: '💊', color: 'bg-red-100' },
  { id: 'automobile', name: 'Automobile', icon: '🚗', color: 'bg-gray-800' },
  { id: 'electronics', name: 'Electronics', icon: '📱', color: 'bg-purple-100' },
  { id: 'mobile', name: 'Mobile & Laptop', icon: '💻', color: 'bg-yellow-100' },
  { id: 'pets', name: 'Pet Supplies', icon: '🐾', color: 'bg-amber-100' },
] as const;
