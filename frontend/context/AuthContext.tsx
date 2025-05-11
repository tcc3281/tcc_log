'use client';
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import api from '../lib/api';
import { useRouter } from 'next/navigation';

// Define the user type
export type User = { user_id: number; username: string; email: string };

// Define the context type
interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  register: (username: string, email: string, password: string) => Promise<void>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Set mounted state to true when component mounts on client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize auth state from localStorage on client-side only
  useEffect(() => {
    if (mounted) {
      const storedToken = localStorage.getItem('auth_token');
      if (storedToken) {
        setToken(storedToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        api.get('/auth/me')
          .then(response => {
            setUser(response.data);
          })
          .catch(() => {
            localStorage.removeItem('auth_token');
            delete api.defaults.headers.common['Authorization'];
          })
          .finally(() => {
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    }
  }, [mounted]);

  // Only proceed with rendering children after client-side hydration
  if (!mounted) {
    return null; // Return null or a loading placeholder for initial server render
  }

  const login = async (username: string, password: string) => {
    try {
      const response = await api.post(
        '/auth/token',
        new URLSearchParams({ username, password }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
      );
      const { access_token } = response.data;
      setToken(access_token);
      localStorage.setItem('auth_token', access_token);
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      const meResponse = await api.get('/auth/me');
      setUser(meResponse.data);
      router.push('/topics');
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      await api.post('/users', { username, email, password });
      router.push('/login');
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('auth_token');
    delete api.defaults.headers.common['Authorization'];
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, register }}>
      {!loading ? children : null}
    </AuthContext.Provider>
  );
};

// Custom hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};