import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { connectSocket, disconnectSocket } from '../socket';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('pulsechat_token'));
  const [loading, setLoading] = useState(true);

  // Set default axios headers
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }

  // Load user profile on initial mount if token exists
  useEffect(() => {
    const fetchMe = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get('/api/auth/me');
        setUser(res.data.user);
        connectSocket(res.data.user);
      } catch (err) {
        console.warn('Session expired or invalid:', err);
        logout();
      } finally {
        setLoading(false);
      }
    };

    fetchMe();
  }, [token]);

  const handleAuthSuccess = (userData, userToken) => {
    localStorage.setItem('pulsechat_token', userToken);
    setToken(userToken);
    setUser(userData);
    axios.defaults.headers.common['Authorization'] = `Bearer ${userToken}`;
    connectSocket(userData);
  };

  const login = async (username, password) => {
    const res = await axios.post('/api/auth/login', { username, password });
    handleAuthSuccess(res.data.user, res.data.token);
    return res.data;
  };

  const register = async (username, email, password, avatar) => {
    const res = await axios.post('/api/auth/register', { username, email, password, avatar });
    handleAuthSuccess(res.data.user, res.data.token);
    return res.data;
  };

  const guestLogin = async (username, avatar) => {
    const res = await axios.post('/api/auth/guest', { username, avatar });
    handleAuthSuccess(res.data.user, res.data.token);
    return res.data;
  };

  const updateProfile = async (profileData) => {
    const res = await axios.put('/api/auth/profile', profileData);
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem('pulsechat_token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
    disconnectSocket();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        guestLogin,
        updateProfile,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
