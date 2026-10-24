import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { useTheme } from './ThemeContext';
import { clearUserProgress } from '../utils/watchProgressStorage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('meetflow_token') || null);
  const [isLoading, setIsLoading] = useState(true);

  // Auth Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('login'); // 'login' | 'register'

  // Pending OTP Verification State
  const [pendingOtp, setPendingOtp] = useState(null); // { tempToken, email, expiresInSeconds }

  const { setPreference } = useTheme();

  // Load authenticated profile on startup if token exists
  useEffect(() => {
    async function loadUser() {
      const storedToken = localStorage.getItem('meetflow_token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await api.get('/auth/me');
        if (data.success && data.user) {
          setUser(data.user);
          // Sync saved theme preference if present
          if (data.user.themePreference) {
            setPreference(data.user.themePreference, false);
          }
        }
      } catch (err) {
        console.warn('Session expired or invalid, logging out:', err.message);
        localStorage.removeItem('meetflow_token');
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();
  }, [setPreference]);

  // Open / Close modal
  const openAuthModal = useCallback((tab = 'login') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
    setPendingOtp(null);
  }, []);

  // Login handler
  const login = useCallback(async (email, password) => {
    const data = await api.post('/auth/login', { email, password });

    if (data.requiresOtp) {
      setPendingOtp({
        tempToken: data.tempToken,
        email: data.email,
        expiresInSeconds: data.expiresInSeconds || 600,
      });
      return { requiresOtp: true, message: data.message };
    }

    if (data.token) {
      localStorage.setItem('meetflow_token', data.token);
      setToken(data.token);
      setUser(data.user);
      setPendingOtp(null);
      setIsAuthModalOpen(false);

      if (data.user?.themePreference) {
        setPreference(data.user.themePreference, false);
      }
      return { success: true, user: data.user };
    }

    return data;
  }, [setPreference]);

  // Register handler
  const register = useCallback(async (name, email, password) => {
    const data = await api.post('/auth/register', { name, email, password });

    if (data.token) {
      localStorage.setItem('meetflow_token', data.token);
      setToken(data.token);
      setUser(data.user);
      setPendingOtp(null);
      setIsAuthModalOpen(false);

      return { success: true, user: data.user };
    }

    return data;
  }, []);

  // Verify OTP handler
  const verifyOtp = useCallback(async (otp, trustDevice = true) => {
    if (!pendingOtp?.tempToken) {
      throw new Error('No pending verification session. Please sign in again.');
    }

    const data = await api.post('/auth/verify-otp', {
      tempToken: pendingOtp.tempToken,
      otp,
      trustDevice,
    });

    if (data.token) {
      localStorage.setItem('meetflow_token', data.token);
      setToken(data.token);
      setUser(data.user);
      setPendingOtp(null);
      setIsAuthModalOpen(false);

      if (data.user?.themePreference) {
        setPreference(data.user.themePreference, false);
      }
      return { success: true, user: data.user };
    }

    return data;
  }, [pendingOtp, setPreference]);

  // Resend OTP handler
  const resendOtp = useCallback(async () => {
    if (!pendingOtp?.tempToken) {
      throw new Error('No pending verification session.');
    }

    return await api.post('/auth/resend-otp', {
      tempToken: pendingOtp.tempToken,
    });
  }, [pendingOtp]);

  // Cancel OTP and return to login
  const cancelOtp = useCallback(() => {
    setPendingOtp(null);
  }, []);

  // Logout handler
  const logout = useCallback(async () => {
    try {
      if (user?._id) {
        clearUserProgress(user._id);
      }
      await api.post('/auth/logout');
    } catch (e) {
      // Ignore network errors during logout
    } finally {
      localStorage.removeItem('meetflow_token');
      setToken(null);
      setUser(null);
    }
  }, [user?._id]);

  // Refresh user profile
  const refreshUser = useCallback(async () => {
    try {
      const data = await api.get('/auth/me');
      if (data.success) {
        setUser(data.user);
      }
    } catch (e) {
      console.warn('Failed to refresh user:', e.message);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        isAuthModalOpen,
        authModalTab,
        pendingOtp,
        openAuthModal,
        closeAuthModal,
        setAuthModalTab,
        login,
        register,
        verifyOtp,
        resendOtp,
        cancelOtp,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
