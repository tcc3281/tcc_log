'use client';
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import api from '../lib/api';
import axios from 'axios';

// Define types
interface User {
  user_id: number;
  username: string;
  email: string;
  profile_image_url?: string;
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
  
  // Determine correct API URL based on environment
  const isServer = typeof window === 'undefined';
  const serverApiUrl = process.env.NEXT_SERVER_API_URL || 'http://backend:8000';
  const clientApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  
  // Select the appropriate URL based on whether we're on client or server
  const apiUrl = isServer ? serverApiUrl : clientApiUrl;

  useEffect(() => {
    const loadUserFromStorage = async () => {
      try {
        setIsLoading(true);
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');
        const loginTimestamp = localStorage.getItem('login_timestamp');

        if (storedUser && storedToken) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setToken(storedToken);
          
          // Set authorization header
          api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          
          // Validate token by calling the auth/me endpoint
          try {
            const response = await api.get(`/auth/me`);
            console.log('Token validation successful:', response.data);
            
            // Update user info if needed
            if (response.data && response.data.user_id) {
              // Update user data if it's different from what we have
              if (JSON.stringify(parsedUser) !== JSON.stringify(response.data)) {
                setUser(response.data);
                localStorage.setItem('user', JSON.stringify(response.data));
                console.log('User info updated from API');
              }
              
              // Update login timestamp
              if (!loginTimestamp) {
                localStorage.setItem('login_timestamp', Date.now().toString());
              }
            } else {
              throw new Error('Invalid user data received from API');
            }
          } catch (error: any) {
            console.error('Error validating token:', error);
            
            // Clear auth for authentication related errors (401) or validation errors (422)
            if (error.response && (error.response.status === 401 || error.response.status === 422)) {
              // Token is invalid or expired, clear storage
              localStorage.removeItem('user');
              localStorage.removeItem('token');
              localStorage.removeItem('login_timestamp');
              setUser(null);
              setToken(null);
              delete api.defaults.headers.common['Authorization'];
              console.log(`Invalid token (${error.response.status}) - cleared auth state`);
              
              // Only redirect to login if not already on login/register page
              if (typeof window !== 'undefined') {
                const currentPath = window.location.pathname;
                if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
                  window.location.href = `/login?returnUrl=${encodeURIComponent(currentPath)}`;
                }
              }
            } else {
              // For other errors, keep the user logged in
              console.log('Network or server error, keeping user logged in');
            }
          }
        } else {
          console.log('No stored credentials found');
        }
      } catch (err) {
        console.error('Error loading user from storage:', err);
        // Clear possibly corrupted storage
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('login_timestamp');
        delete api.defaults.headers.common['Authorization'];
        setUser(null);
        setToken(null);
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
    
    // Save the login timestamp
    localStorage.setItem('login_timestamp', Date.now().toString());
    
    // Set authorization header for all future requests
    api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
    
    console.log('Logged in successfully:', userData, `Bearer ${authToken.substring(0, 15)}...`);
    
    // Get return URL from query params if exists
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const returnUrl = params.get('returnUrl');
      if (returnUrl) {
        window.location.href = returnUrl;
        return;
      }
    }
  };

  const logout = () => {
    // Clear state
    setUser(null);
    setToken(null);
    
    // Clear all auth data from localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('login_timestamp');
    
    // Remove authorization header
    delete api.defaults.headers.common['Authorization'];
    
    console.log('Logged out successfully');
    
    // Redirect to login with current path as returnUrl
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      window.location.href = `/login?returnUrl=${encodeURIComponent(currentPath)}`;
    }
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