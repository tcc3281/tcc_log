import api from './api';

// We'll use the standardized API instance from api.ts

// Parse JWT token manually
function parseJwt(token: string) {
  try {
    // Split the token into parts
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT token format');
    }
    
    // Decode the payload (second part)
    const payload = parts[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Error parsing JWT token:', e);
    return null;
  }
}

// Helper function để test token và endpoint
async function debugFetch(path: string, token: string) {
  const headers = { 'Authorization': `Bearer ${token}` };
  console.log(`Debug fetch to ${path} with headers:`, headers);
  
  try {
    const response = await api.get(path, {
      headers: headers
    });
    
    console.log(`Response status: ${response.status}`);
    console.log('Response data:', response.data);
    return response.data;
  } catch (err) {
    console.error('Debug fetch error:', err);
    throw err;
  }
}

/**
 * Lấy token đăng nhập từ API
 */
export async function getAuthToken(username: string, password: string) {
  try {
    // Tạo URLSearchParams cho định dạng form data
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);
    
    console.log(`Authenticating user: ${username}`);
    
    // Gọi API để lấy token using the api instance
    const response = await api.post('/auth/token', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    const data = response.data;
    
    if (!data || !data.access_token) {
      throw new Error('Token không hợp lệ từ phản hồi API');
    }
    
    console.log('Auth response:', data);
    
    return data.access_token;
  } catch (error) {
    console.error('Lỗi lấy token:', error);
    throw error;
  }
}

/**
 * Lấy thông tin người dùng qua token
 */
export async function getUserInfo(token: string) {
  try {
    if (!token) {
      throw new Error('Token is required');
    }
    
    console.log('Getting user info with token...');
    
    // Sử dụng endpoint /auth/me thay vì /users để lấy thông tin user hiện tại
    const userResponse = await api.get('/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const user = userResponse.data;
    console.log('User info retrieved:', user);
    
    return user;
  } catch (error) {
    console.error('Lỗi lấy thông tin người dùng:', error);
    throw error;
  }
}

/**
 * Đăng ký người dùng mới
 */
export async function registerUser(username: string, email: string, password: string) {
  try {
    console.log(`Registering new user: ${username}, ${email}`);
    
    const response = await api.post('/users', {
      username,
      email,
      password
    });
    
    return response.data;
  } catch (error) {
    console.error('Lỗi đăng ký người dùng:', error);
    throw error;
  }
}

/**
 * Quy trình đăng nhập hoàn chỉnh
 */
export async function loginUser(username: string, password: string) {
  try {
    // Lấy token
    const token = await getAuthToken(username, password);
    
    // Thêm thời gian delay nhỏ để đảm bảo token được xử lý
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Lấy thông tin người dùng
    const userData = await getUserInfo(token);
    
    return { user: userData, token };
  } catch (error) {
    console.error('Lỗi trong quy trình đăng nhập:', error);
    throw error;
  }
}

/**
 * Quy trình đăng ký và đăng nhập hoàn chỉnh
 */
export async function registerAndLogin(username: string, email: string, password: string) {
  try {
    // Đăng ký người dùng
    await registerUser(username, email, password);
    
    // Thêm delay nhỏ để đảm bảo đăng ký hoàn tất
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Đăng nhập sau khi đăng ký
    return await loginUser(username, password);
  } catch (error) {
    console.error('Lỗi trong quy trình đăng ký & đăng nhập:', error);
    throw error;
  }
} 