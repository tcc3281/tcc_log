'use client';
import React, { useEffect } from 'react';
import { AuthProvider } from '../context/AuthContext';
import '../lib/auth-debug'; // Import the auth debugging utility
 
export function Providers({ children }: { children: React.ReactNode }) {
  // Make the debug function available in development environments
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      console.info('Auth debugging tools available. Use window.debugAuth() to check authentication.');
    }
  }, []);
  
  return (
    <AuthProvider>{children}</AuthProvider>
  );
}