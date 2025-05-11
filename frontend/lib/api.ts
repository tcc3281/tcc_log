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

// Add request interceptor for better debugging
api.interceptors.request.use((config) => {
  // Enhanced logging for debugging - log full request details
  console.log(`Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
  return config;
}, (error) => Promise.reject(error));

// Add response interceptor for better debugging
api.interceptors.response.use((response) => {
  console.log(`Response from ${response.config.url}: Status ${response.status}`);
  return response;
}, (error) => {
  if (error.response) {
    console.error('Error response:', error.response.status, error.response.data);
  } else if (error.request) {
    console.error('No response received:', error.request);
  } else {
    console.error('Error setting up request:', error.message);
  }
  return Promise.reject(error);
});

export default api;