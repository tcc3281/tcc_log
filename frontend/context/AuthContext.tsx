'use client';
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import api from '../lib/api';
import axios from 'axios';

// Define types
interface User {
  user_id: number;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (userData: User, token: string) => void;
  logout: () => void;
  isLoading: boolean;
}

// Create context with proper typing
const AuthContext = createContext<AuthContextType | null>(null);

// Provider component with proper props typing
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

  // Load user from localStorage on initial render
  useEffect(() => {
    const loadUserFromStorage = async () => {
      try {
        setIsLoading(true);
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');
        
        if (storedUser && storedToken) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setToken(storedToken);
          
          // *** QUAN TRỌNG: Áp dụng token cho tất cả các request API trong tương lai ***
          api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          console.log('Restored auth token from localStorage:', `Bearer ${storedToken.substring(0, 15)}...`);
          
          // Validate token by calling the user endpoint
          try {
            const response = await api.get(`/users/me`);
            console.log('Token validation successful:', response.data);
            
            // Cập nhật thông tin người dùng nếu cần
            if (response.data && response.data.user_id) {
              setUser(response.data);
              localStorage.setItem('user', JSON.stringify(response.data));
            }
          } catch (error) {
            console.error('Error validating token:', error);
            // Token is invalid, clear storage
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            setUser(null);
            setToken(null);
            delete api.defaults.headers.common['Authorization'];
            console.log('Invalid token - cleared auth state');
          }
        } else {
          console.log('No stored credentials found');
        }
      } catch (err) {
        console.error('Error loading user from storage:', err);
        // Clear possibly corrupted storage
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
      } finally {
        setIsLoading(false);
      }
    };

    loadUserFromStorage();
  }, [apiUrl]);

  const login = (userData: User, authToken: string) => {
    // Save user to state
    setUser(userData);
    setToken(authToken);
    
    // Save to localStorage for persistence
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', authToken);
    
    // Set authorization header for all future requests
    api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
    
    console.log('Logged in successfully:', userData, `Bearer ${authToken.substring(0, 15)}...`);
  };

  const logout = () => {
    // Clear state
    setUser(null);
    setToken(null);
    
    // Clear localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    
    // Remove authorization header
    delete api.defaults.headers.common['Authorization'];
    
    console.log('Logged out successfully');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook with proper return type
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};