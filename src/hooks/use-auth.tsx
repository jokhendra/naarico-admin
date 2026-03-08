"use client";

import { useContext } from 'react';
import { AuthContext } from '@/contexts/AuthContext';

interface UseAuthReturn {
  user: any;
  isLoading: boolean;
  error: string | null;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  login: (email: string, password: string) => Promise<void>;
  adminLogin: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSeller: boolean;
  hasPermission: (role: string) => boolean;
  clearError: () => void;
  updateProfile: (data: { name: string }) => Promise<boolean>;
}

export function useAuth(): UseAuthReturn {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  // Check if user is admin
  const isAdmin = context.user?.role === 'ADMIN';
  
  // Check if user is seller
  const isSeller = context.user?.role === 'SELLER';
  
  // Check if user has specific permission
  const hasPermission = (requiredRole: string) => {
    if (!context.user) return false;
    
    // Admin has all permissions
    if (context.user.role === 'ADMIN') return true;
    
    // Check specific role
    return context.user.role === requiredRole;
  };
  
  return {
    ...context,
    isAdmin,
    isSeller,
    hasPermission,
  };
} 