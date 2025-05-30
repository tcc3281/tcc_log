import { isServer } from './api';

// Get the API URL for static assets (uploads, images, etc.)
const apiUrl = isServer ? 
  process.env.NEXT_SERVER_API_URL || 'http://backend:8000' : 
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Generate a full URL for an uploaded file
 * @param path The file path (e.g., /uploads/profiles/image.jpg)
 * @returns The full URL to the file
 */
export const getFileUrl = (path: string): string => {
  // If the path is empty or null, return placeholder image
  if (!path) {
    console.warn('getFileUrl: empty path, returning placeholder');
    return '/images/placeholder-image.svg';
  }
  
  // If the path is a data URL (base64), return it as is
  if (path.startsWith('data:')) {
    return path;
  }
  
  // If the path already has the protocol and host, return it as is
  if (path.startsWith('http')) {
    return path;
  }
<<<<<<< HEAD
    // Handle uploads directory
  if (path.includes('/uploads/')) {
    // Parse the path to extract the correct parts
    const parts = path.split('/');
    const isProfileImage = parts.includes('profiles');
    
    // For profile images we need to preserve the directory structure
    let relativePath;
    if (isProfileImage) {
      // Get the proper path like /uploads/profiles/filename.jpg
      const profileIdx = parts.indexOf('profiles');
      relativePath = ['uploads', 'profiles', parts[profileIdx + 1]].join('/');
    } else {
      // For regular uploads, just use the filename
      const filename = path.split('/').pop();
      relativePath = `uploads/${filename}`;
    }
    
    // First try accessing the file directly from the public folder (works in Docker)
    const publicUrl = `/${relativePath}`;
    
    // Fallback to the API route (works in development)
    const apiUrlPath = `${apiUrl}/${relativePath}`;
    
    // In Docker environment, use the public URL; otherwise use the API route
    const isDocker = typeof window !== 'undefined' && window.location.hostname === 'localhost';
    const finalUrl = isDocker ? publicUrl : apiUrlPath;
    console.log('getFileUrl: using uploads url', { path, finalUrl, relativePath });
=======
  
  // Handle uploads directory
  if (path.includes('/uploads/')) {
    // Extract just the filename part
    const filename = path.split('/').pop();
    
    // First try accessing the file directly from the public folder
    const publicUrl = `/uploads/${filename}`;
    
    // Fallback to the API route
    const apiUrlPath = `${apiUrl}/uploads/${filename}`;
    
    // In production, try to use the public URL first
    const finalUrl = process.env.NODE_ENV === 'production' ? publicUrl : apiUrlPath;
    console.log('getFileUrl: using uploads url', { path, finalUrl });
>>>>>>> 00b0240d4273d4346006ba2961f144846d8474c3
    return finalUrl;
  }
  
  // If the path starts with a slash, remove it to avoid double slashes
  const normalizedPath = path.startsWith('/') ? path.substring(1) : path;
  
  // Return the full URL
  const fullUrl = `${apiUrl}/${normalizedPath}`;
  console.log('getFileUrl: constructed full URL', { path, normalizedPath, apiUrl, fullUrl });
  return fullUrl;
};
