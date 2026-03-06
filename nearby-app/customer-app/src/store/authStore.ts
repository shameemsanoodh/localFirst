import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserRole } from '@/types/user.types';

interface AuthState {
  user: User | null;
  roles: UserRole[];
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, roles: UserRole[], token: string) => void;
  clearAuth: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      roles: [],
      token: null,
      isAuthenticated: false,
      setAuth: (user, roles, token) =>
        set({ user, roles, token, isAuthenticated: true }),
      clearAuth: () =>
        set({ user: null, roles: [], token: null, isAuthenticated: false }),
      updateUser: (userData) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        })),
    }),
    {
      name: 'auth-storage',
    }
  )
);
