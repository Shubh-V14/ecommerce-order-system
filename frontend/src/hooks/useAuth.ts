/**
 * Authentication Hook
 * Custom hook for managing authentication state and operations
 */

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import { User, LoginCredentials, RegisterData, UserRole } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (apiClient.isAuthenticated()) {
          const user = apiClient.getCurrentUserFromStorage();
          if (user) {
            console.log('Auth initialized with stored user:', user);
            setState({
              user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } else {
            // Try to fetch current user from API
            console.log('Fetching current user from API...');
            const currentUser = await apiClient.getCurrentUser();
            console.log('Fetched user from API:', currentUser);
            setState({
              user: currentUser,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          }
        } else {
          console.log('No authentication token found');
          setState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: 'Failed to initialize authentication',
        });
      }
    };

    initAuth();
  }, []);

  // Listen for storage changes to update auth state
  useEffect(() => {
    const handleStorageChange = () => {
      console.log('Storage changed, reinitializing auth...');
      const user = apiClient.getCurrentUserFromStorage();
      const isAuth = apiClient.isAuthenticated();
      
      setState({
        user,
        isAuthenticated: isAuth,
        isLoading: false,
        error: null,
      });
    };

    // Listen for storage events
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom auth events
    window.addEventListener('authStateChanged', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authStateChanged', handleStorageChange);
    };
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const authData = await apiClient.login(credentials);
      setState({
        user: authData.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      return authData;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Login failed';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, []);

  const register = useCallback(async (userData: RegisterData) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const user = await apiClient.register(userData);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: null,
      }));
      return user;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Registration failed';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    apiClient.logout();
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Role-based access helpers
  const isAdmin = useCallback(() => {
    return state.user?.role === UserRole.ADMIN;
  }, [state.user]);

  const isVendor = useCallback(() => {
    return state.user?.role === UserRole.VENDOR;
  }, [state.user]);

  const isCustomer = useCallback(() => {
    return state.user?.role === UserRole.CUSTOMER;
  }, [state.user]);

  const hasRole = useCallback((role: UserRole) => {
    return state.user?.role === role;
  }, [state.user]);

  const canAccessAllOrders = useCallback(() => {
    return isAdmin() || isVendor();
  }, [isAdmin, isVendor]);

  return {
    ...state,
    login,
    register,
    logout,
    clearError,
    isAdmin,
    isVendor,
    isCustomer,
    hasRole,
    canAccessAllOrders,
  };
};
