import axios from 'axios';

/**
 * Utility to debug authentication issues
 * Call this from browser console to check authentication endpoints
 */
export async function debugAuth() {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  console.log('Current auth state:');
  console.log('- Token exists:', !!token);
  console.log('- User exists:', !!user);
  
  if (token) {
    try {
      // Try auth/me endpoint
      const authMeResponse = await axios.get('http://localhost:8000/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('✅ /auth/me endpoint works:', authMeResponse.data);
    } catch (error: any) {
      console.error('❌ /auth/me endpoint error:', error.response?.status, error.response?.data || error.message);
    }
    
    try {
      // Try users/me endpoint (should not exist)
      const usersMeResponse = await axios.get('http://localhost:8000/users/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('✅ /users/me endpoint works:', usersMeResponse.data);
    } catch (error: any) {
      console.error('❌ /users/me endpoint error:', error.response?.status, error.response?.data || error.message);
    }
  }

  return {
    token: !!token,
    user: user ? JSON.parse(user) : null
  };
}

// Make this function available in the global scope for browser console debugging
if (typeof window !== 'undefined') {
  (window as any).debugAuth = debugAuth;
}
