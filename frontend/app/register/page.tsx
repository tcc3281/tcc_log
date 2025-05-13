'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { registerAndLogin } from '../../lib/auth';

const RegisterPage = () => {
  const { user, login, isLoading } = useAuth();
  const router = useRouter();
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && user) {
      router.push('/topics');
    }
  }, [user, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate inputs
    if (!username.trim() || !email.trim() || !password.trim()) {
      setError('All fields are required');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Sử dụng hàm tiện ích để đăng ký và đăng nhập
      const { user: userData, token } = await registerAndLogin(username, email, password);
      
      // Lưu dữ liệu người dùng và token
      login(userData, token);
      
      // Chuyển hướng đến trang topic
      router.push('/topics');
    } catch (err: any) {
      console.error('Registration error:', err);
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Registration failed. Please try again later.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return <p>Loading...</p>;
  }
  return (
    <div className="flex justify-center items-center min-h-[80vh] px-4">
      <div className="card w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Create an Account</h1>
          <p className="text-gray-600 dark:text-gray-400">Sign up for your journal account</p>
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
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">        <div>          <label htmlFor="username" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Username</label><input
            id="username"
            type="text"
            placeholder="Choose a username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
            disabled={isSubmitting}
          />
        </div>
          <div>          <label htmlFor="email" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Email</label><input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
            disabled={isSubmitting}
          />
        </div>
          <div>          <label htmlFor="password" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Password</label><input
            id="password"
            type="password"
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
            disabled={isSubmitting}
          />
          <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">Password must be at least 6 characters long</p>
        </div>
          <div>          <label htmlFor="confirmPassword" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Confirm Password</label><input
            id="confirmPassword"
            type="password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
            disabled={isSubmitting}
          />
        </div>
          <button 
          type="submit" 
          className={`${
            isSubmitting 
              ? 'bg-emerald-400 cursor-not-allowed' 
              : 'bg-emerald-600 hover:bg-emerald-700'
          } text-white p-3 rounded mt-2 font-medium shadow-md transition-colors`}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>
        <p className="mt-6 text-center">
        Already have an account? <Link href="/login" className="text-blue-600 hover:underline font-medium">Login</Link>
      </p>    </div>
    </div>
  );
};

export default RegisterPage;