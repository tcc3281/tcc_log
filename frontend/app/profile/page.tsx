'use client';
import { useState, useEffect, ChangeEvent, FormEvent, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getFileUrl } from '../../lib/file-utils';

interface FormData {
  username: string;
  email: string;
  password: string;
  newPassword: string;
  confirmPassword: string;
}

// Define User interface to match AuthContext
interface User {
  user_id: number;
  username: string;
  email: string;
  profile_image_url?: string;
}

export default function ProfilePage() {
  const { user, login } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
  const [imageLoading, setImageLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        username: user.username || '',
        email: user.email || ''
      }));      
      // Set preview image if user has a profile image
      if (user.profile_image_url) {
        // Don't set previewImage initially - we'll use the profile_image_url directly
        // with getFileUrl in the render function
        setPreviewImage(null);
      }
    } else {
      // Redirect if not logged in
      router.push('/login');
    }
  }, [user, router]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleImageSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPreviewImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleImageUpload = async () => {
    if (!fileInputRef.current?.files?.length) {
      setError('Please select an image to upload');
      return;
    }
    
    setImageLoading(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('file', fileInputRef.current.files[0]);
      
      const response = await api.post('/auth/me/upload-profile-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
        if (response.data) {
        // Update auth context with new profile image
        const token = localStorage.getItem('token');
        if (token && user) {
          login({
            ...user,
            profile_image_url: response.data.profile_image_url
          }, token);
        }
        
        // Clear the preview image since we'll use the profile_image_url from user object
        setPreviewImage(null);
        setSuccess('Profile image updated successfully!');
      }
    } catch (err: any) {
      console.error('Error uploading profile image:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to upload profile image');
    } finally {
      setImageLoading(false);
    }
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
      }        if (user?.user_id) {
        // Make the actual API call to update user info
        const response = await api.patch(`/auth/me`, updateData);
        
        // Update auth context with the new user info
        if (response.data) {
          // Save the token from localStorage
          const token = localStorage.getItem('token');
          
          if (token) {
            // Update the user info using the login function
            login({
              ...user,
              username: formData.username,
              email: formData.email
            }, token);
          }
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
      )}      {/* Profile Image Section */}
      <div className="mb-8 flex flex-col items-center">
        <div className="mb-4 relative w-32 h-32 rounded-full overflow-hidden border-2 border-gray-300">
          {previewImage ? (
            // If we have a preview image (from local file selection), display it directly
            <Image 
              src={previewImage} 
              alt="Profile" 
              width={128} 
              height={128} 
              className="object-cover w-full h-full"
              unoptimized // Disable Next.js image optimization
            />
          ) : user.profile_image_url ? (
            // Use a regular img tag for the server image to avoid Next.js optimization issues
            <img 
              src={getFileUrl(user.profile_image_url)} 
              alt="Profile"
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">
              No Image
            </div>
          )}
        </div>
        
        <div className="flex flex-col items-center">
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept="image/*" 
            className="hidden" 
            id="profile-image-input"
          />
          <div className="flex gap-3">
            <label 
              htmlFor="profile-image-input" 
              className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors cursor-pointer"
            >
              Select Image
            </label>
            <button 
              onClick={handleImageUpload}
              disabled={imageLoading || !previewImage}
              className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition-colors disabled:bg-green-300"
            >
              {imageLoading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">        <div>
          <label htmlFor="username" className="block mb-2 text-sm font-medium">Username</label>
          <input 
            id="username"
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
          <div>
          <label htmlFor="email" className="block mb-2 text-sm font-medium">Email</label>
          <input 
            id="email"
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
            <label htmlFor="current-password" className="block mb-2 text-sm font-medium">Current Password</label>
            <input 
              id="current-password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
            <div className="mb-4">
            <label htmlFor="new-password" className="block mb-2 text-sm font-medium">New Password</label>
            <input 
              id="new-password"
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
            <div className="mb-4">
            <label htmlFor="confirm-password" className="block mb-2 text-sm font-medium">Confirm New Password</label>
            <input 
              id="confirm-password"
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
