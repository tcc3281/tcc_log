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

// Add response interceptor for better debugging and token handling
api.interceptors.response.use((response) => {
  console.log(`Response from ${response.config.url}: Status ${response.status}`);
  return response;
}, (error) => {
  if (error.response) {
    console.error('Error response:', error.response.status, error.response.data);
    
    // Handle authentication errors (401)
    if (error.response.status === 401) {
      console.log('Authentication error - handling credentials');
      
      // Don't clear credentials or redirect while trying to validate the token in AuthContext
      const isValidatingToken = error.config.url.endsWith('/users/me') && 
                               error.config.method === 'get' && 
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
    }
  } else if (error.request) {
    console.error('No response received:', error.request);
  } else {
    console.error('Error setting up request:', error.message);
  }
  return Promise.reject(error);
});

export default api;