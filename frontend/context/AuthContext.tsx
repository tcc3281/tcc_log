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
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';  // Load user from localStorage on initial render
  useEffect(() => {
    const loadUserFromStorage = async () => {
      try {
        setIsLoading(true);
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');
        const loginTimestamp = localStorage.getItem('login_timestamp');
        
        if (storedUser && storedToken) {
          const parsedUser = JSON.parse(storedUser);
          
          // Apply the token to all future API requests
          api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          
          // Log a cleaner token preview for debugging
          const tokenPreview = storedToken.length > 20 
            ? `${storedToken.substring(0, 10)}...${storedToken.substring(storedToken.length - 5)}`
            : storedToken.substring(0, 15) + '...';
          console.log('Restored auth token from localStorage:', `Bearer ${tokenPreview}`);
          
          // Always set the user and token from localStorage first to prevent flickering UI
          // This provides a smoother UX while we validate in the background
          setUser(parsedUser);
          setToken(storedToken);
          
          // Validate token by calling the user endpoint
          try {
            const response = await api.get(`/users/me`);
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
            
            // Only clear auth if the error is authentication related (401)
            if (error.response && error.response.status === 401) {
              // Token is invalid or expired, clear storage
              localStorage.removeItem('user');
              localStorage.removeItem('token');
              localStorage.removeItem('login_timestamp');
              setUser(null);
              setToken(null);
              delete api.defaults.headers.common['Authorization'];
              console.log('Invalid token - cleared auth state');
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