import { create } from 'zustand'

interface AuthState {
  isAuthenticated: boolean
  adminId: string | null
  token: string | null
  setAuth: (adminId: string, token: string) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: !!localStorage.getItem('admin-token'),
  adminId: localStorage.getItem('admin-id'),
  token: localStorage.getItem('admin-token'),
  setAuth: (adminId, token) => {
    localStorage.setItem('admin-id', adminId)
    localStorage.setItem('admin-token', token)
    set({ isAuthenticated: true, adminId, token })
  },
  clearAuth: () => {
    localStorage.removeItem('admin-id')
    localStorage.removeItem('admin-token')
    set({ isAuthenticated: false, adminId: null, token: null })
  },
}))
