import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  loginStart,
  loginSuccess,
  loginFailure,
  logout as logoutAction,
  clearError,
} from '@/store/slices/authSlice';
import { User, LoginForm, SignupForm, UserRole } from '@/models/types';
import { toast } from 'sonner';
import { api, authStorage } from '@/lib/api';
import { disconnectSocket } from '@/lib/socket';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, error } = useAppSelector(state => state.auth);

  const normalizeUser = useCallback((raw: any): User => {
    const defaultReputation = {
      overall: 0,
      totalReviews: 0,
      reliabilityScore: 0,
      responseRate: 100,
      completionRate: 100,
      badge: 'new' as const,
      recentTrend: 'stable' as const,
    };

    return {
      id: raw.id,
      email: raw.email,
      name: raw.name,
      role: raw.role as UserRole,
      avatar: raw.avatar || undefined,
      phone: raw.phone || undefined,
      address: raw.address || undefined,
      neighborhood: raw.neighborhood || 'Unknown',
      city: raw.city || 'Unknown',
      coordinates: raw.coordinates || undefined,
      bio: raw.bio || undefined,
      skills: raw.skills || undefined,
      isVerified: Boolean(raw.is_verified ?? raw.isVerified),
      createdAt: raw.created_at || raw.createdAt || new Date().toISOString(),
      reputation: raw.reputation || defaultReputation,
    };
  }, []);

  const login = useCallback(async (credentials: LoginForm | string, password?: string, role?: 'user' | 'moderator' | 'admin'): Promise<boolean> => {
    dispatch(loginStart());
    
    // Handle both object and separate parameters
    const loginData = typeof credentials === 'string' 
      ? { email: credentials, password: password! }
      : credentials;
    
    // Determine endpoint based on role
    let endpoint = '/auth/login';
    if (role === 'moderator') {
      endpoint = '/auth/moderator-login';
    } else if (role === 'admin') {
      endpoint = '/auth/admin-login';
    }
    
    try {
      const data = await api.post<{
        user: User;
        accessToken: string;
        refreshToken: string;
      }>(endpoint, loginData);

      const normalized = normalizeUser(data.user);
      authStorage.setTokens(data.accessToken, data.refreshToken);
      authStorage.setUser(normalized);
      dispatch(loginSuccess({ user: normalized, accessToken: data.accessToken, refreshToken: data.refreshToken }));

      toast.success('Welcome back!');
      if (normalized.role === 'admin') {
        navigate('/admin');
      } else if (normalized.role === 'moderator') {
        navigate('/moderator');
      } else {
        navigate('/dashboard');
      }
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid credentials';
      dispatch(loginFailure(message));
      toast.error('Login failed. Please try again.');
      return false;
    }
  }, [dispatch, navigate, normalizeUser]);

  const signup = useCallback(async (data: SignupForm): Promise<boolean> => {
    dispatch(loginStart());
    
    try {
      await api.post('/auth/register', {
        name: data.name,
        email: data.email,
        password: data.password,
      });

      dispatch(clearError());
      toast.success('Account created. Please verify your email before logging in.');
      navigate('/login');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create account';
      dispatch(loginFailure(message));
      toast.error(message);
      return false;
    }
  }, [dispatch, navigate]);

  const logout = useCallback(() => {
    const refreshToken = authStorage.getRefreshToken();
    if (refreshToken) {
      api.post('/auth/logout', { refreshToken }, { auth: true }).catch(() => null);
    }
    authStorage.clearTokens();
    authStorage.clearUser();
    disconnectSocket();
    dispatch(logoutAction());
    toast.success('Logged out successfully');
    navigate('/');
  }, [dispatch, navigate]);

  const clearAuthError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    signup,
    logout,
    clearAuthError,
    isAdmin: user?.role === 'admin',
    isModerator: user?.role === 'moderator',
    isUser: user?.role === 'user',
  };
};
