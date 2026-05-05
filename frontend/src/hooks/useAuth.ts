import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  loginStart,
  loginSuccess,
  loginFailure,
  signupSuccess,
  logout as logoutAction,
  clearError,
  updateUser,
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
      neighborhood: raw.neighborhood || '',
      city: raw.city || '',
      coordinates: raw.coordinates || undefined,
      bio: raw.bio || undefined,
      skills: raw.skills || undefined,
      isVerified: Boolean(raw.is_verified ?? raw.isVerified),
      mustChangePassword: Boolean(raw.must_change_password ?? raw.mustChangePassword),
      createdAt: raw.created_at || raw.createdAt || new Date().toISOString(),
      reputation: raw.reputation || defaultReputation,
    };
  }, []);

  const login = useCallback(async (credentials: LoginForm | string, password?: string): Promise<boolean> => {
    dispatch(loginStart());
    
    // Handle both object and separate parameters
    const loginData = typeof credentials === 'string' 
      ? { email: credentials, password: password! }
      : credentials;
    
    let endpoint = '/auth/login';
    
    try {
      const data = await api.post<{
        user: any;
        accessToken: string;
        refreshToken: string;
        status?: string;
      }>(endpoint, loginData);

      const normalized = normalizeUser(data.user);
      
      // Handle Forced Password Change status
      if (data.status === 'PASSWORD_CHANGE_REQUIRED') {
        authStorage.setTokens(data.accessToken, ''); // No refresh token for limited sessions
        authStorage.setUser(normalized);
        dispatch(loginSuccess({ 
          user: normalized, 
          accessToken: data.accessToken, 
          refreshToken: '' 
        }));
        
        toast.info('Security Update Required', {
          description: 'Please change your password to secure your account.'
        });
        navigate('/change-password');
        return true;
      }

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

  const loginWithGoogle = useCallback(async (googleToken: string): Promise<boolean> => {
    dispatch(loginStart());
    
    try {
      const data = await api.post<{
        user: any;
        accessToken: string;
        refreshToken: string;
        message: string;
      }>('/auth/google', { token: googleToken });

      const normalized = normalizeUser(data.user);
      
      authStorage.setTokens(data.accessToken, data.refreshToken);
      authStorage.setUser(normalized);
      dispatch(loginSuccess({ 
        user: normalized, 
        accessToken: data.accessToken, 
        refreshToken: data.refreshToken 
      }));

      toast.success(data.message || 'Login successful!');
      
      if (normalized.role === 'admin') {
        navigate('/admin');
      } else if (normalized.role === 'moderator') {
        navigate('/moderator');
      } else {
        navigate('/dashboard');
      }
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Google login failed';
      dispatch(loginFailure(message));
      toast.error('Google login failed. Please try again.');
      return false;
    }
  }, [dispatch, navigate, normalizeUser]);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string): Promise<boolean> => {
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword }, { auth: true });
      toast.success('Password updated successfully! Re-authenticating...');
      
      // Clear session and redirect to login for a fresh "clean" session
      authStorage.clearTokens();
      authStorage.clearUser();
      dispatch(logoutAction());
      navigate('/login', { state: { message: 'Password updated. Please login with your new password.' } });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to change password';
      toast.error(message);
      return false;
    }
  }, [dispatch, navigate]);

  const completeOtpLogin = useCallback((data: { user: User; accessToken: string; refreshToken: string }) => {
    const normalized = normalizeUser(data.user);
    authStorage.setTokens(data.accessToken, data.refreshToken);
    authStorage.setUser(normalized);
    dispatch(loginSuccess({ user: normalized, accessToken: data.accessToken, refreshToken: data.refreshToken }));

    toast.success('Verification successful. Welcome to NearO!');
    navigate('/dashboard');
  }, [dispatch, navigate, normalizeUser]);

  const loginWithTokens = useCallback(async (accessToken: string, refreshToken: string): Promise<boolean> => {
    dispatch(loginStart());
    authStorage.setTokens(accessToken, refreshToken);
    
    try {
      const data = await api.get<any>('/users/me', { auth: true });
      const normalized = normalizeUser(data);
      
      authStorage.setUser(normalized);
      dispatch(loginSuccess({ 
        user: normalized, 
        accessToken, 
        refreshToken 
      }));

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch user profile';
      dispatch(loginFailure(message));
      authStorage.clearTokens();
      return false;
    }
  }, [dispatch, normalizeUser]);

  const signup = useCallback(async (data: SignupForm): Promise<boolean> => {
    dispatch(loginStart());
    
    try {
      const response = await api.post('/auth/register', {
        name: data.name,
        email: data.email,
        password: data.password,
      });

      dispatch(signupSuccess());
      toast.success('Account created! Please check your email for verification code.');
      
      // Navigate to OTP verification page with email and name
      navigate('/verify-otp', { 
        state: { 
          email: data.email,
          userName: data.name 
        } 
      });
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

  const refreshUser = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const data = await api.get<any>('/users/me', { auth: true });
      const normalized = normalizeUser(data);
      authStorage.setUser(normalized);
      dispatch(updateUser(normalized));
    } catch (err) {
      console.error('Failed to refresh user:', err);
      // If we get a 401/403, we might want to logout, but api.ts handles 401 refresh.
      // If it still fails, it might be better to just let the user stay logged out if token is invalid.
    }
  }, [isAuthenticated, normalizeUser, dispatch]);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    loginWithGoogle,
    loginWithTokens,
    changePassword,
    completeOtpLogin,
    signup,
    logout,
    refreshUser,
    clearAuthError,
    isAdmin: user?.role === 'admin',
    isModerator: user?.role === 'moderator',
    isUser: user?.role === 'user',
    mustChangePassword: user?.mustChangePassword
  };
};
