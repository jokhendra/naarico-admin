'use client';

import { 
  createContext, 
  ReactNode, 
  useContext, 
  useState,
  useCallback,
  useEffect,
  useRef
} from 'react';
import { authApi } from '@/lib/api/auth-api';

// CSRF context type definition
interface CsrfContextType {
  isLoading: boolean;
  error: string | null;
  refreshCsrfToken: (force?: boolean) => Promise<boolean>;
  withCsrfProtection: <T>(operation: () => Promise<T>) => Promise<T>;
  clearError: () => void;
}

// Create CSRF context with default value
const CsrfContext = createContext<CsrfContextType | undefined>(undefined);

// Props for the CSRF provider component
interface CsrfProviderProps {
  children: ReactNode;
}

// CSRF provider component
export function CsrfProvider({ children }: CsrfProviderProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const lastRefreshTimeRef = useRef<number>(0);
  const refreshPromiseRef = useRef<Promise<boolean> | null>(null);

  // Refresh the CSRF token if needed
  const refreshCsrfToken = useCallback(async (force = false): Promise<boolean> => {
    // If we already have an in-flight refresh, return that promise
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }
    
    // Only refresh if forced or if the token is older than 10 minutes
    const currentTime = Date.now();
    const shouldRefresh = force || (currentTime - lastRefreshTimeRef.current > 10 * 60 * 1000);
    
    if (!shouldRefresh) {
      return true; // Skip refresh if token is still fresh
    }
    
    // Create a new refresh promise
    setIsLoading(true);
    setError(null);
    
    refreshPromiseRef.current = (async () => {
      try {
        await authApi.getCsrfToken();
        lastRefreshTimeRef.current = Date.now();
        return true;
      } catch (err) {
        const errorMessage = 'Failed to refresh CSRF token';
        setError(errorMessage);
        console.error(errorMessage, err);
        return false;
      } finally {
        setIsLoading(false);
        // Clear the promise reference after a delay to prevent immediate retries
        setTimeout(() => {
          refreshPromiseRef.current = null;
        }, 500);
      }
    })();
    
    return refreshPromiseRef.current;
  }, []);

  // Helper for sensitive operations - call this before important operations
  const withCsrfProtection = useCallback(async <T,>(operation: () => Promise<T>): Promise<T> => {
    try {
      // First refresh the CSRF token
      const tokenRefreshed = await refreshCsrfToken();
      if (!tokenRefreshed) {
        throw new Error('Could not refresh CSRF token before operation');
      }
      
      // Now execute the protected operation
      return await operation();
    } catch (err) {
      console.error('Protected operation failed:', err);
      throw err;
    }
  }, [refreshCsrfToken]);

  // Get an initial CSRF token on mount - but only once
  useEffect(() => {
    if (lastRefreshTimeRef.current === 0) {
      refreshCsrfToken(true).catch(err => {
        console.warn('Initial CSRF token fetch failed:', err);
      });
    }
  }, [refreshCsrfToken]);

  const clearError = useCallback(() => setError(null), []);

  // Return the context provider with its value
  return (
    <CsrfContext.Provider
      value={{
        isLoading,
        error,
        refreshCsrfToken,
        withCsrfProtection,
        clearError,
      }}
    >
      {children}
    </CsrfContext.Provider>
  );
}

// Custom hook to use the CSRF context
export const useCsrf = (): CsrfContextType => {
  const context = useContext(CsrfContext);
  
  if (context === undefined) {
    throw new Error('useCsrf must be used within a CsrfProvider');
  }
  
  return context;
}; 