'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { loginUser } from '../../lib/auth';
import Link from 'next/link';

const LoginPage = () => {
  const { user, login, isLoading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
  // Redirect if already logged in and handle session expiration messages
  useEffect(() => {
    // Check for session expired message in URL
    const searchParams = new URLSearchParams(window.location.search);
    const sessionExpired = searchParams.get('session_expired');
    
    if (sessionExpired === 'true' && !error) {
      setError('Your session has expired. Please log in again.');
    }
    
    // Redirect if already logged in
    if (!isLoading && user) {
      router.push('/topics');
    }
  }, [user, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!username.trim() || !password.trim()) {
      setError('Username and password are required');
      return;
    }
    
    // Display the API URL we're going to use
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    console.log(`Attempting to login using API URL: ${apiUrl}`);
    
    try {
      setIsSubmitting(true);
        // Network connectivity check before trying to login
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        await fetch(`${apiUrl}/health-check`, { 
          method: 'HEAD',
          mode: 'no-cors',
          cache: 'no-cache',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        console.log("API connectivity check passed");
      } catch (networkErr) {
        console.warn("API connectivity check failed:", networkErr);
        // Continue anyway, the actual login will have retry logic
      }
      
      // Sử dụng hàm tiện ích để đăng nhập
      const { user: userData, token } = await loginUser(username, password);
      
      // Lưu dữ liệu người dùng và token
      login(userData, token);
      
      // Chuyển hướng đến trang topic
      router.push('/topics');
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (err.message === 'Network Error' || err.name === 'TypeError') {
        setError('Unable to connect to the server. Please check your internet connection or try again later.');
      } else {
        setError('Invalid username or password. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-12 w-48 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
          <div className="h-8 w-36 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-[80vh] px-4">
      <div className="card w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Welcome Back</h1>
          <p className="text-gray-600 dark:text-gray-400">Login to your journal account</p>
        </div>
        
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-md mb-6 text-sm">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="form-label">Username</label>
            <input
              id="username"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="form-input"
              required
              disabled={isSubmitting}
            />
          </div>
          
          <div>
            <label htmlFor="password" className="form-label">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              required
              disabled={isSubmitting}
            />
          </div>
            <button 
            type="submit"            className={`w-full py-3 font-medium rounded-md shadow-md transition-colors ${
              isSubmitting 
                ? 'bg-blue-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Logging in...
              </span>
            ) : 'Log In'}
          </button>
        </form>
          <div className="mt-8 text-center border-t border-gray-200 dark:border-gray-700 pt-6">
          <p className="text-gray-600 dark:text-gray-400">
            Don't have an account? {' '}            <Link href="/register" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;