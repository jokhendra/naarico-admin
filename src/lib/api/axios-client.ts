import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import { API_BASE_URL, ENDPOINTS } from './endpoints';

// Token storage keys
const AUTH_TOKEN_KEY = 'admin_auth_token';
const REFRESH_TOKEN_KEY = 'admin_refresh_token';
const USER_ID_KEY = 'admin_user_id';

// CSRF token cache
let csrfTokenCache: string | null = null;
let csrfTokenExpiry = 0;
const CSRF_TOKEN_TTL = 15 * 60 * 1000; // 15 minutes

// Load tokens from sessionStorage on initialization (client-side only)
let accessToken: string | null = null;
let refreshToken: string | null = null;
let userId: string | null = null;

// Get CSRF token from cookies
const getCsrfToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  // If we have a cached token that hasn't expired, return it
  if (csrfTokenCache && Date.now() < csrfTokenExpiry) {
    return csrfTokenCache;
  }
  
  // Parse cookies to find the CSRF token
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'XSRF-TOKEN') {
      // Cache the token with expiry
      csrfTokenCache = decodeURIComponent(value);
      csrfTokenExpiry = Date.now() + CSRF_TOKEN_TTL;
      return csrfTokenCache;
    }
  }
  
  // No token found
  csrfTokenCache = null;
  return null;
};

// Track CSRF token fetch attempts to prevent infinite loops
let csrfFetchPromise: Promise<boolean> | null = null;
let csrfLastAttemptTime = 0;
const MIN_CSRF_RETRY_INTERVAL = 5000; // 5 seconds

// Initialize tokens from sessionStorage if available
if (typeof window !== 'undefined') {
  try {
    accessToken = sessionStorage.getItem(AUTH_TOKEN_KEY);
    refreshToken = sessionStorage.getItem(REFRESH_TOKEN_KEY);
    userId = sessionStorage.getItem(USER_ID_KEY);
    
    console.log('Loaded auth state from session storage:', {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      hasUserId: !!userId
    });
  } catch (e) {
    console.error('Error loading auth state from session storage:', e);
  }
}

// Create the axios instance
export const axiosClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important for cookies (refresh token)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Fetch CSRF token - returns an existing promise if one is in progress
const fetchCsrfToken = async (): Promise<boolean> => {
  // If we already have a valid token, just return true
  if (getCsrfToken()) {
    return true;
  }
  
  // Check if we have a fetch in progress
  if (csrfFetchPromise) {
    return csrfFetchPromise;
  }
  
  // Rate limit retries
  const now = Date.now();
  if (now - csrfLastAttemptTime < MIN_CSRF_RETRY_INTERVAL) {
    console.log('CSRF token fetch throttled');
    return false;
  }
  
  csrfLastAttemptTime = now;
  
  // Create a new fetch promise
  csrfFetchPromise = new Promise<boolean>(async (resolve) => {
    try {
      console.log('Fetching new CSRF token...');
      
      // Use a direct axios call to avoid interceptor loops
      await axios.get(`${API_BASE_URL}${ENDPOINTS.AUTH.CSRF_TOKEN}`, {
        withCredentials: true,
      });
      
      // Verify token was set
      const token = getCsrfToken();
      resolve(!!token);
    } catch (error) {
      console.error('CSRF token fetch failed:', error);
      resolve(false);
    } finally {
      // Clear the promise after a delay to prevent immediate retries
      setTimeout(() => {
        csrfFetchPromise = null;
      }, 500);
    }
  });
  
  return csrfFetchPromise;
};

// Request interceptor - adds auth token to requests
axiosClient.interceptors.request.use(
  async (config) => {
    // Add auth token if available
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
      
      // Enhanced debugging for admin-specific endpoints
      if (config.url?.includes('/admin/')) {
        console.log('Making admin API request:', {
          url: config.url,
          method: config.method,
          hasToken: true
        });
      }
    } else {
      console.log('Making request without auth token:', {
        url: config.url,
        method: config.method
      });
    }
    
    // Skip CSRF token for CSRF endpoint itself and GET/HEAD/OPTIONS requests
    const isSafeMethod = ['get', 'head', 'options'].includes(config.method?.toLowerCase() || '');
    const isCsrfEndpoint = config.url === ENDPOINTS.AUTH.CSRF_TOKEN;
    
    // Only non-safe methods and non-csrf-endpoint requests need a CSRF token
    if (!isSafeMethod && !isCsrfEndpoint) {
      let csrfToken = getCsrfToken();
      
      // Special handling for admin login
      const isAdminLogin = config.url === ENDPOINTS.AUTH.ADMIN_LOGIN;
      if (isAdminLogin) {
        console.log('Admin login request - CSRF status:', {
          hasToken: !!csrfToken,
          method: config.method,
          url: config.url
        });
      }
      
      // If no CSRF token is available, try to fetch one
      if (!csrfToken) {
        const fetched = await fetchCsrfToken();
        if (fetched) {
          csrfToken = getCsrfToken();
          if (isAdminLogin) {
            console.log('Fetched new CSRF token for admin login:', !!csrfToken);
          }
        }
      }
      
      if (csrfToken) {
        config.headers['X-CSRF-TOKEN'] = csrfToken;
        if (isAdminLogin) {
          console.log('Added CSRF token to admin login request');
        }
      } else {
        console.warn('No CSRF token available for non-GET request:', config.url);
      }
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
axiosClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    
    // Handle CSRF token errors specifically
    if (
      error.response?.status === 403 && 
      typeof error.response.data === 'object' && 
      error.response.data !== null && 
      'message' in error.response.data && 
      typeof error.response.data.message === 'string' && 
      error.response.data.message.includes('csrf')
    ) {
      console.error('CSRF token validation failed');
      
      // Only retry once for CSRF errors
      if (!originalRequest._retry) {
        originalRequest._retry = true;
        
        // Force clear the CSRF token cache
        csrfTokenCache = null;
        csrfTokenExpiry = 0;
        
        // Fetch a new CSRF token and retry
        const success = await fetchCsrfToken();
        if (success) {
          // Update the request with the new token
          const csrfToken = getCsrfToken();
          if (csrfToken && originalRequest.headers) {
            originalRequest.headers['X-CSRF-TOKEN'] = csrfToken;
          }
          
          // Retry the request
          return axiosClient(originalRequest);
        }
      }
    }
    
    // Handle 401 errors (token expired)
    if (
      error.response?.status === 401 && 
      !originalRequest._retry && 
      originalRequest.url !== ENDPOINTS.AUTH.REFRESH &&
      userId
    ) {
      originalRequest._retry = true;
      
      try {
        console.log('Attempting token refresh');
        
        // Support both HTTP-only cookie and stored refresh token approaches
        const requestData = { userId };
        
        // Only add refresh token to request body if we have it in memory
        // If using HTTP-only cookies, the token will be sent automatically
        if (refreshToken) {
          console.log('Using stored refresh token for refresh');
          Object.assign(requestData, { refreshToken });
        } else {
          console.log('Using HTTP-only cookie for refresh token');
        }
        
        // Call refresh token endpoint with required parameters
        const response = await axios.post(
          `${API_BASE_URL}${ENDPOINTS.AUTH.REFRESH}`,
          requestData,
          { withCredentials: true }
        );
        
        console.log('Token refresh response:', response.data);
        
        // Update in-memory token
        const responseData = response.data.data || response.data;
        const newToken = responseData.accessToken;
        
        // Store the new access token
        setAuthToken(newToken);
        
        // Update header and retry
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          
          // Also add CSRF token again
          const csrfToken = getCsrfToken();
          if (csrfToken && !['get', 'head', 'options'].includes(originalRequest.method || '')) {
            originalRequest.headers['X-CSRF-TOKEN'] = csrfToken;
          }
        }
        
        return axiosClient(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // Force logout on refresh failure
        clearAllTokens();
        window.dispatchEvent(new CustomEvent('auth:logout'));
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth token management functions
export const setAuthToken = (token: string) => {
  console.log('Setting auth token:', token?.substring(0, 15) + '...');
  accessToken = token;
  
  // Store in sessionStorage (client-side only)
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(AUTH_TOKEN_KEY, token);
    } catch (e) {
      console.error('Error storing auth token in session storage:', e);
    }
  }
};

export const setRefreshToken = (token: string) => {
  console.log('Setting refresh token:', token?.substring(0, 15) + '...');
  refreshToken = token;
  
  // Store in sessionStorage (client-side only)
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(REFRESH_TOKEN_KEY, token);
    } catch (e) {
      console.error('Error storing refresh token in session storage:', e);
    }
  }
};

export const setUserId = (id: string) => {
  console.log('Setting user ID:', id);
  userId = id;
  
  // Store in sessionStorage (client-side only)
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(USER_ID_KEY, id);
    } catch (e) {
      console.error('Error storing user ID in session storage:', e);
    }
  }
};

export const clearAuthToken = () => {
  console.log('Clearing auth token');
  accessToken = null;
  
  // Remove from sessionStorage (client-side only)
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem(AUTH_TOKEN_KEY);
    } catch (e) {
      console.error('Error removing auth token from session storage:', e);
    }
  }
};

export const clearRefreshToken = () => {
  console.log('Clearing refresh token');
  refreshToken = null;
  
  // Remove from sessionStorage (client-side only)
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch (e) {
      console.error('Error removing refresh token from session storage:', e);
    }
  }
};

export const clearAllTokens = () => {
  console.log('Clearing all tokens');
  accessToken = null;
  refreshToken = null;
  userId = null;
  
  // Remove from sessionStorage (client-side only)
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem(AUTH_TOKEN_KEY);
      sessionStorage.removeItem(REFRESH_TOKEN_KEY);
      sessionStorage.removeItem(USER_ID_KEY);
    } catch (e) {
      console.error('Error removing tokens from session storage:', e);
    }
  }
};

// Function to check if user is authenticated
export const isAuthenticated = () => {
  return !!accessToken;
}; 