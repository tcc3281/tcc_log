'use client';
import React, { createContext, useState, useContext, ReactNode } from 'react';
import api from '../lib/api';
import { useRouter } from 'next/navigation';

// Define the user type
export type User = { user_id: number; username: string; email: string };

// Define the context type
interface AuthContextType {
  user: User | null;
  token: string | null;
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
  const router = useRouter();

  const login = async (username: string, password: string) => {
    const response = await api.post(
      '/auth/token',
      new URLSearchParams({ username, password }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    );
    const { access_token } = response.data;
    setToken(access_token);
    api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    const meResponse = await api.get('/auth/me');
    setUser(meResponse.data);
    router.push('/topics');
  };

  const register = async (username: string, email: string, password: string) => {
    await api.post('/users', { username, email, password });
    router.push('/login');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    delete api.defaults.headers.common['Authorization'];
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, register }}>
      {children}
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