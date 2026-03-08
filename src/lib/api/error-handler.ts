// API error interface
export interface ApiError {
  status: number;
  message: string;
  details?: any;
}

/**
 * Handles API errors in a consistent way
 * @param error The error object from axios
 * @returns Structured API error object
 */
export function handleApiError(error: any): ApiError {
  if (error.response) {
    // Server responded with an error status
    const { status, data } = error.response;
    
    // Handle nested response structure from our API
    const errorData = data.data || data;
    const errorMessage = data.message || (errorData?.message) || getDefaultErrorMessage(status);
    
    return {
      status,
      message: errorMessage,
      details: errorData?.details || null,
    };
  } else if (error.request) {
    // Request was made but no response received
    return {
      status: 0,
      message: 'No response from server. Please check your connection.',
    };
  } else {
    // Something else happened while setting up the request
    return {
      status: 0,
      message: error.message || 'An unknown error occurred',
    };
  }
}

/**
 * Returns a default error message based on HTTP status code
 */
export function getDefaultErrorMessage(status: number): string {
  switch (status) {
    case 400:
      return 'Invalid request data';
    case 401:
      return 'Unauthorized access';
    case 403:
      return 'You do not have permission to perform this action';
    case 404:
      return 'Resource not found';
    case 409:
      return 'Conflict with existing data';
    case 422:
      return 'Validation error';
    case 500:
      return 'Server error - please try again later';
    default:
      return `Error ${status}`;
  }
}

/**
 * Logs API errors to console in development
 */
export function logApiError(error: any): void {
  if (process.env.NODE_ENV !== 'production') {
    console.error('API Error:', error);
    
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
} 