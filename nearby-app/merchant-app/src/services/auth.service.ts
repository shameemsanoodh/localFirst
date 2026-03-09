import api from './api';
import type { User, UserRole } from '@/types/user.types';

interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phone: string;
  role?: 'user' | 'merchant';
}

interface LoginRequest {
  email: string;
  password: string;
}

interface AuthResponse {
  userId: string;
  token: string;
  refreshToken: string;
  user: User;
  roles: UserRole[];
}

export const authService = {
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post<{ success: boolean; data: AuthResponse }>('/auth/register', data);
    return response.data.data;
  },

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<{ success: boolean; data: AuthResponse }>('/auth/login', data);
    return response.data.data;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
    localStorage.removeItem('auth-token');
    localStorage.removeItem('refresh-token');
  },

  async getProfile(): Promise<User> {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },

  async updateProfile(userId: string, data: Partial<User>): Promise<User> {
    const response = await api.put<User>(`/users/${userId}`, data);
    return response.data;
  },

  async updateLocation(userId: string, lat: number, lng: number): Promise<void> {
    await api.post(`/users/${userId}/location`, { lat, lng });
  },
};
