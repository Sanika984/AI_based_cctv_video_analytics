import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  // Verify and sync user profile on startup if token exists
  useEffect(() => {
    const verifySession = async () => {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const { data } = await api.get('/auth/me');
        setUser(data);
        localStorage.setItem('user', JSON.stringify(data));
      } catch (err) {
        console.warn('Session expired or invalid token:', err);
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    verifySession();
  }, [logout]);

  const login = async (username, password) => {
    try {
      const { data } = await api.post('/auth/login', { username, password });
      const { access_token, user: profile } = data;

      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(profile));

      setToken(access_token);
      setUser(profile);

      return { success: true, user: profile };
    } catch (err) {
      const message = err.response?.data?.detail || 'Authentication failed. Please check your credentials.';
      return { success: false, error: message };
    }
  };

  const hasRole = (allowedRoles) => {
    if (!user || !user.role) return false;
    if (!allowedRoles || allowedRoles.length === 0) return true;
    return allowedRoles.includes(user.role);
  };

  const value = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    logout,
    hasRole,
    isAdmin: user?.role === 'admin',
    isOperator: user?.role === 'operator',
    isViewer: user?.role === 'viewer',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
