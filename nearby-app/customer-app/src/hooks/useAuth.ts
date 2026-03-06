import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/auth.service';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone: string;
  role?: 'user' | 'merchant';
}

export const useAuth = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, setAuth, clearAuth } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) => authService.login(credentials),
    onSuccess: (data) => {
      setAuth(data.user, data.roles, data.token);
      localStorage.setItem('auth-token', data.token);
      localStorage.setItem('refresh-token', data.refreshToken);
      navigate('/');
    },
  });

  const registerMutation = useMutation({
    mutationFn: (data: RegisterData) => authService.register(data),
    onSuccess: (data) => {
      setAuth(data.user, data.roles, data.token);
      localStorage.setItem('auth-token', data.token);
      localStorage.setItem('refresh-token', data.refreshToken);
      navigate('/');
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      clearAuth();
      navigate('/login');
    },
  });

  const { data: profile, refetch: refetchProfile } = useQuery({
    queryKey: ['profile', user?.userId],
    queryFn: () => authService.getProfile(),
    enabled: isAuthenticated && !!user?.userId,
  });

  return {
    user,
    isAuthenticated,
    profile,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout: logoutMutation.mutate,
    refetchProfile,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    loginError: loginMutation.error,
    registerError: registerMutation.error,
  };
};
