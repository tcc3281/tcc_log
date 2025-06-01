import axios from 'axios';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

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
    const userResponse = await fetch(`${apiUrl}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error('Error getting user info:', userResponse.status, errorText);
      throw new Error(`Failed to get user info: ${userResponse.status} ${userResponse.statusText}`);
    }
    
    const user = await userResponse.json();
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
export async function registerUser(username: string, email: string, password: string) {  try {
    console.log(`Registering new user: ${username}, ${email}`);
    
    const response = await fetch(`${apiUrl}/users/`, {
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