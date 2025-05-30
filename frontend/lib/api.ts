import axios, { AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';

<<<<<<< HEAD
// Extend the AxiosRequestConfig type to include retryCount
interface CustomRequestConfig extends InternalAxiosRequestConfig {
  retryCount?: number;
}

=======
>>>>>>> 00b0240d4273d4346006ba2961f144846d8474c3
// Determine correct API URL based on environment
// Use NEXT_SERVER_API_URL for server-side requests and NEXT_PUBLIC_API_URL for client-side requests
export const isServer = typeof window === 'undefined';
const serverApiUrl = process.env.NEXT_SERVER_API_URL || 'http://backend:8000';
const clientApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Select the appropriate URL based on whether we're on client or server
const apiUrl = isServer ? serverApiUrl : clientApiUrl;
console.log(`API URL (${isServer ? 'server-side' : 'client-side'}):`, apiUrl);

// Create axios instance with proper configuration
const api = axios.create({
  baseURL: apiUrl,
  timeout: 30000, // Reduce timeout to 30 seconds for faster failure feedback
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
      // Always use the client API URL for file URLs since they'll be loaded by the browser
    const clientUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const fileUrl = `${clientUrl}/uploads/${fileData.file_path}`;
    
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
<<<<<<< HEAD

// Add retry functionality to axios
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

// Add request interceptor for better debugging and token handling
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // Enhanced logging for debugging - log full request details
  console.log(`Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, 
    config.headers ? `Headers: ${JSON.stringify(config.headers)}` : '');
  
  // Get token from localStorage if it exists and not already set in headers
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token && !config.headers.Authorization) {
      // Make sure to include the 'Bearer ' prefix
      config.headers.Authorization = `Bearer ${token}`;
      
      // Log with partial token for debugging (hide most of the token)
      const tokenPreview = token.length > 20 
        ? `${token.substring(0, 10)}...${token.substring(token.length - 5)}`
        : token.substring(0, 15) + '...';
      console.log(`Added token to request: Bearer ${tokenPreview}`);
    }
  }
  
  return config;
}, (error) => {
  console.error('Request error:', error);
  return Promise.reject(error);
});

=======

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
      
      // Log with partial token for debugging (hide most of the token)
      const tokenPreview = token.length > 20 
        ? `${token.substring(0, 10)}...${token.substring(token.length - 5)}`
        : token.substring(0, 15) + '...';
      console.log(`Added token to request: Bearer ${tokenPreview}`);
    }
  }
  
  return config;
}, (error) => {
  console.error('Request error:', error);
  return Promise.reject(error);
});

>>>>>>> 00b0240d4273d4346006ba2961f144846d8474c3
// Add response interceptor for better debugging and token handling
api.interceptors.response.use((response) => {
  console.log(`Response from ${response.config.url}: Status ${response.status}`);
  return response;
}, async (error) => {
  // Implement retry logic for network errors and 5xx errors
  const config = error.config;
  
  // Set the retry count if it doesn't exist
  if (!config || !config.url) {
    console.error('No config found in error object:', error);
    return Promise.reject(error);
  }
  
  // Create a retry counter on the config object if it doesn't exist
  if (config._retryCount === undefined) {
    config._retryCount = 0;
  }
  
  // Check if we should retry (network errors or server errors)
  const shouldRetry = !error.response || error.response.status >= 500;
  const canRetry = config._retryCount < MAX_RETRIES;
  
  if (shouldRetry && canRetry) {
    config._retryCount += 1;
    console.log(`Retrying request to ${config.url} (attempt ${config._retryCount}/${MAX_RETRIES})...`);
    
    // Wait before retrying using exponential backoff
    const delay = RETRY_DELAY * Math.pow(2, config._retryCount - 1);
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Return the axios instance to retry the request
    return api(config);
  }
  
  // Continue with normal error handling if we're not retrying
  if (error.response) {
    console.error('Error response:', error.response.status, error.response.data);
    
    // Handle authentication errors (401)
    if (error.response.status === 401) {
      console.log('Authentication error - handling credentials');
      
      // Don't clear credentials or redirect while trying to validate the token in AuthContext
<<<<<<< HEAD
      const isValidatingToken = config.url.endsWith('/users/me') && 
                               config.method === 'get' && 
=======
      const isValidatingToken = error.config.url.endsWith('/users/me') && 
                               error.config.method === 'get' && 
>>>>>>> 00b0240d4273d4346006ba2961f144846d8474c3
                               localStorage.getItem('token');
                               
      // Don't redirect or clear on login/register pages or when validating token
      const isAuthPage = typeof window !== 'undefined' && 
                        (window.location.pathname.includes('/login') || 
                         window.location.pathname.includes('/register'));
                         
      if (!isValidatingToken && !isAuthPage && typeof window !== 'undefined') {
        // Calculate how long the user has been logged in
        const loginTimestamp = localStorage.getItem('login_timestamp');
        const currentTime = Date.now();
        const loginDuration = loginTimestamp ? (currentTime - parseInt(loginTimestamp)) / 1000 / 60 : 0; // in minutes
        
        console.log(`Login duration: ${loginDuration.toFixed(2)} minutes`);
        
        // Clear auth data
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('login_timestamp');
        
        // Redirect to login page with a message parameter
        const redirectUrl = '/login?session_expired=true';
        console.log(`Redirecting to ${redirectUrl}`);
        
        // Use a small delay to avoid interrupting the current request handling
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 100);
      }
    } 
    // Handle validation errors (422)
    else if (error.response.status === 422) {
      console.error('Validation error:', error.response.data);
    }
    // Handle server errors (500)
    else if (error.response.status >= 500) {
      console.error('Server error:', error.response.data);
<<<<<<< HEAD
    }  } else if (error.request) {
    // No response received - likely a network error
    console.error('No response received (network error):', error.request);
    
    // Check if browser is online
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      console.error('Browser is offline. Please check your internet connection.');
      error.isOffline = true;
    } else {
      // Detailed logging for network issues
      console.error('Network error details:', {
        url: config?.url,
        baseURL: config?.baseURL, 
        method: config?.method,
        retryCount: config?._retryCount
      });
    }
=======
    }
  } else if (error.request) {
    console.error('No response received:', error.request);
>>>>>>> 00b0240d4273d4346006ba2961f144846d8474c3
  } else {
    console.error('Error setting up request:', error.message);
  }
  
  return Promise.reject(error);
});

export default api;