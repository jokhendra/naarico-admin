import { axiosClient, setAuthToken, clearAuthToken, setRefreshToken, setUserId, clearAllTokens, clearRefreshToken } from './axios-client';
import { ENDPOINTS } from './endpoints';
import { logApiError } from './error-handler';

// Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserDto;
}

export interface UserDto {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  status: string;
  phone?: string;
  is_email_verified?: boolean;
  is_phone_verified?: boolean;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
  profileImage?: string | null;
  password_change_required?: boolean;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Auth API service
 * 
 * CSRF Protection:
 * - The backend sets an XSRF-TOKEN cookie for all requests
 * - For non-GET requests, the client must include the X-CSRF-TOKEN header with the value from the cookie
 * - The getCsrfToken() method fetches a fresh token by calling the /auth/csrf-token endpoint
 * - This token is automatically included in subsequent non-GET requests by the axios-client interceptor
 * - For sensitive operations, you can use the useCsrf() hook's withCsrfProtection method
 */
export const authApi = {
  // Register new user
  register: async (data: RegisterData): Promise<boolean> => {
    try {
      // Ensure we have a CSRF token before attempting registration
      try {
        console.log('Pre-fetching CSRF token for registration');
        await authApi.getCsrfToken();
      } catch (csrfError) {
        console.warn('Failed to pre-fetch CSRF token, continuing anyway:', csrfError);
      }
      
      const response = await axiosClient.post(ENDPOINTS.AUTH.REGISTER, data);
      console.log('Registration response:', response.data);
      return response.data.success || response.status === 201;
    } catch (error) {
      logApiError(error);
      throw error;
    }
  },
  
  // Login user
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      const response = await axiosClient.post(ENDPOINTS.AUTH.LOGIN, credentials);
      console.log('Login response:', response.data);
      // Backend structure: { statusCode, message, data: { accessToken, refreshToken, user } }
      const authData = response.data.data;
      
      // Store access token and user ID in memory
      setAuthToken(authData.accessToken);
      setUserId(authData.user.id);
      
      // Handle refresh token - might be in HTTP-only cookie instead of response body
      if (authData.refreshToken) {
        setRefreshToken(authData.refreshToken);
      } else {
        console.log('Refresh token not in response body, using HTTP-only cookie instead');
        clearRefreshToken();
      }
      
      return authData;
    } catch (error) {
      logApiError(error);
      throw error;
    }
  },
  
  // Admin login
  adminLogin: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      // Ensure we have a CSRF token before attempting admin login
      try {
        console.log('Pre-fetching CSRF token for admin login');
        await authApi.getCsrfToken();
      } catch (csrfError) {
        console.warn('Failed to pre-fetch CSRF token, continuing anyway:', csrfError);
      }
      
      const response = await axiosClient.post(ENDPOINTS.AUTH.ADMIN_LOGIN, credentials);
      console.log('Admin login response:', response.data);
      // Backend structure: { statusCode, message, data: { accessToken, refreshToken, user } }
      const authData = response.data.data;
      
      // Store access token and user ID in memory
      setAuthToken(authData.accessToken);
      
      // Handle refresh token - it might be in HTTP-only cookie instead of response body
      if (authData.refreshToken) {
        // For backward compatibility, store refresh token from response if available
        setRefreshToken(authData.refreshToken);
      } else {
        console.log('Refresh token not in response body, using HTTP-only cookie instead');
        // Clear any stored refresh token to rely on HTTP-only cookie
        clearRefreshToken();
      }
      
      // Always store user ID
      setUserId(authData.user.id);
      
      return authData;
    } catch (error) {
      logApiError(error);
      throw error;
    }
  },
  
  // Logout user
  logout: async (): Promise<{ success: boolean }> => {
    try {
      const response = await axiosClient.post(ENDPOINTS.AUTH.LOGOUT);
      return response.data;
    } catch (error: any) {
      // 401 errors during logout are normal (session already expired)
      // Don't log these as errors
      if (error.response?.status === 401) {
        console.log('Logout: Session already expired (expected)');
      } else {
        console.error('Logout API error:', error);
        logApiError(error);
      }
      
      // Don't throw - logout is successful client-side regardless of API response
      return { success: true };
    }
  },
  
  // Get current user profile
  getProfile: async (): Promise<UserDto> => {
    try {
      const response = await axiosClient.get(ENDPOINTS.AUTH.PROFILE);
      // Backend structure: { statusCode, message, data: UserDto }
      return response.data.data || response.data;
    } catch (error) {
      logApiError(error);
      throw error;
    }
  },
  
  // Get current admin profile
  getAdminProfile: async (): Promise<UserDto> => {
    try {
      console.log('Fetching admin profile from:', ENDPOINTS.AUTH.ADMIN_PROFILE);
      const response = await axiosClient.get(ENDPOINTS.AUTH.ADMIN_PROFILE);
      // Backend structure: { statusCode, message, data: UserDto }
      console.log('Admin profile response:', response.data);
      const profileData = response.data.data;
      
      // If we got a successful admin profile, we should update userId too
      // This ensures token refresh has the correct user ID
      if (profileData && profileData.id) {
        setUserId(profileData.id);
      }
      
      return profileData;
    } catch (error) {
      logApiError(error);
      throw error;
    }
  },
  
  // Change password
  changePassword: async (data: ChangePasswordData): Promise<{ success: boolean }> => {
    try {
      const response = await axiosClient.post(ENDPOINTS.AUTH.CHANGE_PASSWORD, data);
      return response.data;
    } catch (error) {
      logApiError(error);
      throw error;
    }
  },
  
  // Refresh token (usually called automatically by axios interceptor)
  refreshToken: async (userId: string, refreshToken?: string): Promise<{ accessToken: string }> => {
    try {
      // Prepare request data
      const requestData: any = { userId };
      
      // Only include refresh token in request body if it's provided
      // If not provided, we're using HTTP-only cookies
      if (refreshToken) {
        requestData.refreshToken = refreshToken;
      }
      
      const response = await axiosClient.post(ENDPOINTS.AUTH.REFRESH, requestData);
      
      // Backend structure: { statusCode, message, data: { accessToken } }
      const tokenData = response.data.data;
      setAuthToken(tokenData.accessToken);
      return tokenData;
    } catch (error) {
      clearAllTokens();
      logApiError(error);
      throw error;
    }
  },
  
  // Get CSRF token (useful before important operations)
  getCsrfToken: async (): Promise<{ success: boolean }> => {
    try {
      // This call sets the XSRF-TOKEN cookie that will be used for future requests
      await axiosClient.get(ENDPOINTS.AUTH.CSRF_TOKEN);
      
      // Verify the cookie was set
      if (typeof window !== 'undefined') {
        const cookies = document.cookie.split(';');
        const hasCsrfToken = cookies.some(cookie => cookie.trim().startsWith('XSRF-TOKEN='));
        
        if (!hasCsrfToken) {
          console.error('CSRF token cookie was not set');
          return { success: false };
        }
      }
      
      return { success: true };
    } catch (error) {
      logApiError(error);
      console.error('Failed to fetch CSRF token:', error);
      throw error;
    }
  },
  
  // Update profile
  updateProfile: async (data: { name: string }): Promise<UserDto> => {
    try {
      const response = await axiosClient.patch(ENDPOINTS.USERS.BASE, data);
      return response.data.data;
    } catch (error) {
      logApiError(error);
      throw error;
    }
  },
}; 