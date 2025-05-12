import axios from 'axios';

// Log the actual API URL being used for debugging
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
console.log('API URL:', apiUrl);

// Create axios instance with proper configuration
const api = axios.create({
  baseURL: apiUrl,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  },
  // Set withCredentials to false to avoid CORS issues
  withCredentials: false
});

// Function to upload files and return the Markdown-ready URL
export const uploadFile = async (file: File, entryId: number): Promise<string> => {
  try {
    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    
    console.log(`Uploading file: ${file.name} (${file.type}, ${file.size} bytes) to entry ${entryId}`);
    
    // Use the API instance but override the Content-Type for multipart form
    const response = await api.post(`/files/files/${entryId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    // Get the file details from the response
    const fileData = response.data;
    console.log('File uploaded successfully:', fileData);
    
    // Return the Markdown-ready URL format based on file type
    const isImage = file.type.startsWith('image/');
    
    // Sử dụng đúng đường dẫn của file
    const fileUrl = `${apiUrl}/uploads/${fileData.file_path}`;
    
    if (isImage) {
      return `![${file.name}](${fileUrl})`;
    } else {
      // For other files like PDFs, return a link
      return `[${file.name}](${fileUrl})`;
    }
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

// Add request interceptor for better debugging and token handling
api.interceptors.request.use((config) => {
  // Enhanced logging for debugging - log full request details
  console.log(`Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, 
    config.headers ? `Headers: ${JSON.stringify(config.headers)}` : '');
  
  // Get token from localStorage if it exists and not already set in headers
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token && !config.headers.Authorization) {
      // Make sure to include the 'Bearer ' prefix
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`Added token to request: Bearer ${token.substring(0, 15)}...`);
    }
  }
  
  return config;
}, (error) => {
  console.error('Request error:', error);
  return Promise.reject(error);
});

// Add response interceptor for better debugging and token handling
api.interceptors.response.use((response) => {
  console.log(`Response from ${response.config.url}: Status ${response.status}`);
  return response;
}, (error) => {
  if (error.response) {
    console.error('Error response:', error.response.status, error.response.data);
    
    // Handle authentication errors (401)
    if (error.response.status === 401) {
      console.log('Authentication error - clearing credentials');
      // Clear tokens and redirect to login if unauthorized
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        
        // Chỉ điều hướng nếu không phải đang ở trang login
        const currentPath = window.location.pathname;
        if (!currentPath.includes('/login')) {
          window.location.href = '/login';
        }
      }
    } 
    // Handle validation errors (422)
    else if (error.response.status === 422) {
      console.error('Validation error:', error.response.data);
    }
    // Handle server errors (500)
    else if (error.response.status >= 500) {
      console.error('Server error:', error.response.data);
    }
  } else if (error.request) {
    console.error('No response received:', error.request);
  } else {
    console.error('Error setting up request:', error.message);
  }
  return Promise.reject(error);
});

export default api;