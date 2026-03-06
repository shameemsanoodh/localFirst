export interface User {
  userId: string;
  name: string;
  email: string;
  phone: string;
  role?: 'user' | 'merchant' | 'admin';
  avatarUrl?: string;
  lat?: number;
  lng?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface UserRole {
  userId: string;
  role: 'user' | 'merchant' | 'admin';
}

export interface AuthState {
  user: User | null;
  roles: UserRole[];
  token: string | null;
  isAuthenticated: boolean;
}
