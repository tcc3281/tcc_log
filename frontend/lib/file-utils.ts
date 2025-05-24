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
    return finalUrl;
  }
  
  // If the path starts with a slash, remove it to avoid double slashes
  const normalizedPath = path.startsWith('/') ? path.substring(1) : path;
  
  // Return the full URL
  const fullUrl = `${apiUrl}/${normalizedPath}`;
  console.log('getFileUrl: constructed full URL', { path, normalizedPath, apiUrl, fullUrl });
  return fullUrl;
};
