import axios from 'axios';

// Log the actual API URL being used for debugging
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
console.log('API URL:', apiUrl);

// Create axios instance with proper configuration
const api = axios.create({
  baseURL: apiUrl,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
  // Set withCredentials to false to avoid CORS issues
  withCredentials: false
});

// Add request interceptor for error handling
api.interceptors.request.use(
  (config) => {
    // Check if we're running on the client side before accessing localStorage
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    // Enhanced logging for debugging - log full request details
    console.log(`Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    console.log('Headers:', config.headers);
    
    // For POST requests, also log data
    if (config.method?.toLowerCase() === 'post') {
      console.log('Request data:', config.data);
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    // Log successful responses
    console.log(`Response from ${response.config.url}: Status ${response.status}`);
    return response;
  },
  (error) => {
    // Check for method not allowed error specifically
    if (error.response && error.response.status === 405) {
      console.error('Method Not Allowed (405) Error - The API endpoint does not support this HTTP method');
      console.error(`Method used: ${error.config?.method?.toUpperCase() || 'unknown'}`);
      console.error(`URL: ${error.config?.baseURL}${error.config?.url}`);
    } 
    // Handle timeout errors
    else if (error.code === 'ECONNABORTED') {
      console.error('Request timeout - the server took too long to respond');
      console.error(`Request timeout for URL: ${error.config?.url}`);
    }
    // Handle network errors 
    else if (error.message === 'Network Error') {
      console.error('Network error - please check your connection or if the API server is running');
      console.error('Backend server URL:', apiUrl);
      console.error('Is your FastAPI server running? Try running "python run_backend.py" in another terminal');
    }
    
    // Log more detailed error information
    if (error.response) {
      console.error('Error status:', error.response.status);
      console.error('Error data:', error.response.data);
      console.error('Error headers:', error.response.headers);
    } else if (error.request) {
      console.error('No response received:', error.request);
      console.error('Request details:', {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
        baseURL: error.config?.baseURL,
        timeout: error.config?.timeout
      });
    }
    
    return Promise.reject(error);
  }
);
 
export default api;