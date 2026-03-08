import { axiosClient } from './axios-client';
import { ENDPOINTS } from './endpoints';
import { logApiError } from './error-handler';

// Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  gender: string | null;
  status: string;
  role: string;
  lastLoginAt: string;
  profileImage: string | null;
  dateOfBirth: string | null;
  bio: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UsersResponse {
  users: User[];
  total: number;
}

export interface UserFilters {
  skip?: number;
  take?: number;
  email?: string;
  role?: string;
}

export interface UpdateUserStatusDto {
  status: 'ACTIVE' | 'BLOCKED' | 'INACTIVE';
}

export interface UpdateUserRoleDto {
  role: 'USER' | 'SELLER' | 'ADMIN';
}

// Users API service
export const usersApi = {
  // Get all users (admin only)
  getUsers: async (filters: UserFilters = {}): Promise<UsersResponse> => {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (filters.skip !== undefined) params.append('skip', filters.skip.toString());
      if (filters.take !== undefined) params.append('take', filters.take.toString());
      if (filters.email) params.append('email', filters.email);
      if (filters.role) params.append('role', filters.role);

      const response = await axiosClient.get(ENDPOINTS.USERS.BASE, { params });
      return response.data.data;
    } catch (error) {
      logApiError(error);
      throw error;
    }
  },

  // Get user by ID
  getUserById: async (id: string): Promise<User> => {
    try {
      console.log(`Fetching user details for ID: ${id}`);
      const response = await axiosClient.get(ENDPOINTS.USERS.DETAIL(id));
      return response.data.data;
    } catch (error) {
      logApiError(error);
      throw error;
    }
  },

  // Update user
  updateUser: async (id: string, userData: Partial<User>): Promise<User> => {
    try {
      const response = await axiosClient.patch(ENDPOINTS.USERS.DETAIL(id), userData);
      return response.data.data;
    } catch (error) {
      logApiError(error);
      throw error;
    }
  },

  // Update user status (block/unblock)
  updateUserStatus: async (id: string, data: UpdateUserStatusDto): Promise<User> => {
    try {
      console.log(`Updating user status for ID: ${id} to ${data.status}`);
      const response = await axiosClient.patch(ENDPOINTS.USERS.STATUS(id), data);
      return response.data.data;
    } catch (error) {
      console.error(`Error updating user status ${id}:`, error);
      logApiError(error);
      throw error;
    }
  },

  // Update user role (promote USER to SELLER)
  updateUserRole: async (id: string, data: UpdateUserRoleDto): Promise<User> => {
    try {
      console.log(`Updating user role for ID: ${id} to ${data.role}`);
      const response = await axiosClient.patch(ENDPOINTS.USERS.ROLE(id), data);
      return response.data.data;
    } catch (error) {
      console.error(`Error updating user role ${id}:`, error);
      logApiError(error);
      throw error;
    }
  },

  // Delete user
  deleteUser: async (id: string): Promise<void> => {
    try {
      console.log(`Deleting user ID: ${id}`);
      await axiosClient.delete(ENDPOINTS.USERS.DETAIL(id));
    } catch (error) {
      console.error(`Error deleting user ${id}:`, error);
      logApiError(error);
      throw error;
    }
  }
}; 