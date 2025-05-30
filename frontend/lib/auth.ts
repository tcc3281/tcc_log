<<<<<<< HEAD
import api from './api';

// We'll use the standardized API instance from api.ts
=======
import axios from 'axios';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
>>>>>>> 00b0240d4273d4346006ba2961f144846d8474c3

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
<<<<<<< HEAD
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
=======
async function debugFetch(url: string, token: string) {
  const headers = { 'Authorization': `Bearer ${token}` };
  console.log(`Debug fetch to ${url} with headers:`, headers);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: headers
    });
    
    const responseText = await response.text();
    console.log(`Response status: ${response.status}`);
    
    // Try to parse as JSON if possible
    try {
      const jsonData = JSON.parse(responseText);
      console.log('Response data:', jsonData);
      return jsonData;
    } catch (e) {
      console.log('Raw response:', responseText);
      return responseText;
    }
>>>>>>> 00b0240d4273d4346006ba2961f144846d8474c3
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
    
<<<<<<< HEAD
    // Gọi API để lấy token using the api instance
    const response = await api.post('/auth/token', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    const data = response.data;
=======
    // Gọi API để lấy token
    const response = await fetch(`${apiUrl}/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Authentication error:', response.status, errorText);
      throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
>>>>>>> 00b0240d4273d4346006ba2961f144846d8474c3
    
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
<<<<<<< HEAD
 * Lấy thông tin người dùng qua token
=======
 * Lấy thông tin người dùng qua token và username
>>>>>>> 00b0240d4273d4346006ba2961f144846d8474c3
 */
export async function getUserInfo(token: string) {
  try {
    if (!token) {
      throw new Error('Token is required');
    }
    
<<<<<<< HEAD
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
    
=======
    // Giải mã JWT token để lấy username
    const decoded = parseJwt(token);
    console.log('Decoded token:', decoded);
    
    if (!decoded || !decoded.sub) {
      throw new Error('Invalid token or missing subject (username)');
    }
    
    // Lấy username từ token (JWT thường lưu trong trường 'sub')
    const username = decoded.sub;
    
    // Đầu tiên, tìm user_id bằng cách gọi API users với filter username
    console.log(`Finding user info for username: ${username}`);
    
    // Lấy danh sách tất cả người dùng (hoặc có thể cải thiện API để lọc theo username)
    const usersResponse = await fetch(`${apiUrl}/users`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!usersResponse.ok) {
      const errorText = await usersResponse.text();
      console.error('Error getting users list:', usersResponse.status, errorText);
      throw new Error(`Failed to get users list: ${usersResponse.status} ${usersResponse.statusText}`);
    }
    
    const users = await usersResponse.json();
    console.log('Users list:', users);
    
    // Tìm user theo username
    const user = users.find((u: any) => u.username === username);
    
    if (!user) {
      throw new Error(`User with username ${username} not found`);
    }
    
    console.log('Found user:', user);
>>>>>>> 00b0240d4273d4346006ba2961f144846d8474c3
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
    
<<<<<<< HEAD
    const response = await api.post('/users', {
      username,
      email,
      password
    });
    
    return response.data;
=======
    const response = await fetch(`${apiUrl}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username,
        email,
        password
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Registration error:', response.status, errorText);
      throw new Error(`Registration failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
>>>>>>> 00b0240d4273d4346006ba2961f144846d8474c3
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