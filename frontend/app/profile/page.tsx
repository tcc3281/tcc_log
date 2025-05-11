'use client';
import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { useRouter } from 'next/navigation';

interface FormData {
  username: string;
  email: string;
  password: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ProfilePage() {
  const { user, updateUserInfo } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState<FormData>({
    username: '',
    email: '',
    password: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        username: user.username || '',
        email: user.email || ''
      }));
    } else {
      // Redirect if not logged in
      router.push('/login');
    }
  }, [user, router]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    // Form validation
    if (!formData.username.trim()) {
      setError('Username is required');
      setLoading(false);
      return;
    }
    
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('Valid email is required');
      setLoading(false);
      return;
    }
    
    // Password validation
    if (formData.newPassword) {
      if (formData.newPassword.length < 6) {
        setError('New password must be at least 6 characters');
        setLoading(false);
        return;
      }
      
      if (formData.newPassword !== formData.confirmPassword) {
        setError("New passwords don't match");
        setLoading(false);
        return;
      }
      
      if (!formData.password) {
        setError("Current password is required to change password");
        setLoading(false);
        return;
      }
    }
    
    try {
      // Prepare the update data
      const updateData: any = {
        username: formData.username,
        email: formData.email,
      };
      
      if (formData.newPassword) {
        updateData.current_password = formData.password;
        updateData.new_password = formData.newPassword;
      }
      
      if (user?.id) {
        // Make the actual API call to update user info
        const response = await api.patch(`/users/me`, updateData);
        
        // Update auth context with the new user info
        if (response.data && updateUserInfo) {
          updateUserInfo({
            ...user,
            username: formData.username,
            email: formData.email
          });
        }
        
        setSuccess('Profile updated successfully!');
        
        // Clear password fields after successful update
        setFormData(prev => ({
          ...prev,
          password: '',
          newPassword: '',
          confirmPassword: ''
        }));
      }
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null; // Don't render anything while redirecting

  return (
    <div className="container mx-auto max-w-md mt-10 p-4">
      <h1 className="text-2xl font-bold mb-6">Edit Profile</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-2 text-sm font-medium">Username</label>
          <input 
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div>
          <label className="block mb-2 text-sm font-medium">Email</label>
          <input 
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div className="border-t pt-4 mt-4">
          <h2 className="text-lg font-semibold mb-2">Change Password</h2>
          <p className="text-sm text-gray-600 mb-3">Leave blank if you don't want to change your password</p>
          
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium">Current Password</label>
            <input 
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium">New Password</label>
            <input 
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium">Confirm New Password</label>
            <input 
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="flex justify-between">
          <button 
            type="button" 
            onClick={() => router.push('/topics')}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors disabled:bg-blue-300"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
