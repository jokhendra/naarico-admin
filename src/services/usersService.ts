import { usersApi, User, UserFilters, UpdateUserStatusDto, UpdateUserRoleDto } from '@/lib/api/users-api';

/**
 * Generic service response structure
 */
export interface UsersServiceResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  message?: string;
}

export interface UsersListResponse {
  users: User[];
  total: number;
}

/**
 * Service for handling user-related operations
 * Wraps the users API with proper error handling and response formatting
 */
class UsersService {
  /**
   * Get all users with filters
   * Admin only
   */
  async getUsers(filters?: UserFilters): Promise<UsersServiceResponse<UsersListResponse>> {
    try {
      const response = await usersApi.getUsers(filters);
      return {
        success: true,
        data: response,
      };
    } catch (error: any) {
      console.error('Error fetching users:', error);
      return {
        success: false,
        data: { users: [], total: 0 },
        error: error.message || 'Failed to fetch users',
      };
    }
  }

  /**
   * Get user by ID
   * Admin only
   */
  async getUserById(id: string): Promise<UsersServiceResponse<User | null>> {
    try {
      const response = await usersApi.getUserById(id);
      return {
        success: true,
        data: response,
      };
    } catch (error: any) {
      console.error(`Error fetching user ${id}:`, error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to fetch user details',
      };
    }
  }

  /**
   * Update user basic information
   * Admin only
   */
  async updateUser(id: string, userData: Partial<User>): Promise<UsersServiceResponse<User | null>> {
    try {
      const response = await usersApi.updateUser(id, userData);
      return {
        success: true,
        data: response,
        message: 'User updated successfully',
      };
    } catch (error: any) {
      console.error(`Error updating user ${id}:`, error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to update user',
      };
    }
  }

  /**
   * Update user status (Block/Unblock)
   * Admin only
   */
  async updateUserStatus(id: string, status: UpdateUserStatusDto['status']): Promise<UsersServiceResponse<User | null>> {
    try {
      const response = await usersApi.updateUserStatus(id, { status });
      const statusLabels = {
        ACTIVE: 'activated',
        BLOCKED: 'blocked',
        INACTIVE: 'deactivated',
      };
      return {
        success: true,
        data: response,
        message: `User ${statusLabels[status]} successfully`,
      };
    } catch (error: any) {
      console.error(`Error updating user ${id} status:`, error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to update user status',
      };
    }
  }

  /**
   * Update user role (Promote USER to SELLER)
   * Admin only
   */
  async updateUserRole(id: string, role: UpdateUserRoleDto['role']): Promise<UsersServiceResponse<User | null>> {
    try {
      const response = await usersApi.updateUserRole(id, { role });
      return {
        success: true,
        data: response,
        message: `User role updated to ${role} successfully`,
      };
    } catch (error: any) {
      console.error(`Error updating user ${id} role:`, error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to update user role',
      };
    }
  }

  /**
   * Delete user
   * Admin only - Cannot delete admin users
   */
  async deleteUser(id: string): Promise<UsersServiceResponse<boolean>> {
    try {
      await usersApi.deleteUser(id);
      return {
        success: true,
        data: true,
        message: 'User deleted successfully',
      };
    } catch (error: any) {
      console.error(`Error deleting user ${id}:`, error);
      return {
        success: false,
        data: false,
        error: error.message || 'Failed to delete user',
      };
    }
  }

  /**
   * Get user status badge configuration
   */
  getUserStatusBadgeConfig(status: string) {
    const configs: Record<string, { variant: any; label: string; color: string }> = {
      ACTIVE: { variant: 'default', label: 'Active', color: 'bg-green-100 text-green-800' },
      BLOCKED: { variant: 'destructive', label: 'Blocked', color: 'bg-red-100 text-red-800' },
      INACTIVE: { variant: 'secondary', label: 'Inactive', color: 'bg-gray-100 text-gray-800' },
    };

    return configs[status] || { variant: 'outline', label: status, color: 'bg-gray-100 text-gray-800' };
  }

  /**
   * Get user role badge configuration
   */
  getUserRoleBadgeConfig(role: string) {
    const configs: Record<string, { variant: any; label: string; color: string }> = {
      ADMIN: { variant: 'default', label: 'Admin', color: 'bg-purple-100 text-purple-800' },
      SELLER: { variant: 'secondary', label: 'Seller', color: 'bg-blue-100 text-blue-800' },
      USER: { variant: 'outline', label: 'User', color: 'bg-gray-100 text-gray-800' },
    };

    return configs[role] || { variant: 'outline', label: role, color: 'bg-gray-100 text-gray-800' };
  }

  /**
   * Filter users by search term
   */
  filterUsersBySearch(users: User[], searchTerm: string): User[] {
    if (!searchTerm.trim()) return users;

    const term = searchTerm.toLowerCase();
    return users.filter(user =>
      user.email.toLowerCase().includes(term) ||
      user.firstName?.toLowerCase().includes(term) ||
      user.lastName?.toLowerCase().includes(term) ||
      user.phone?.toLowerCase().includes(term)
    );
  }

  /**
   * Filter users by role
   */
  filterUsersByRole(users: User[], role: string | 'all'): User[] {
    if (role === 'all') return users;
    return users.filter(user => user.role === role);
  }

  /**
   * Filter users by status
   */
  filterUsersByStatus(users: User[], status: string | 'all'): User[] {
    if (status === 'all') return users;
    return users.filter(user => user.status === status);
  }

  /**
   * Sort users by specified field
   */
  sortUsers(users: User[], sortBy: string, sortOrder: 'asc' | 'desc' = 'desc'): User[] {
    return [...users].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'email':
          aValue = a.email;
          bValue = b.email;
          break;
        case 'name':
          aValue = `${a.firstName || ''} ${a.lastName || ''}`.trim();
          bValue = `${b.firstName || ''} ${b.lastName || ''}`.trim();
          break;
        case 'role':
          aValue = a.role;
          bValue = b.role;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'lastLogin':
          aValue = a.lastLoginAt ? new Date(a.lastLoginAt) : new Date(0);
          bValue = b.lastLoginAt ? new Date(b.lastLoginAt) : new Date(0);
          break;
        case 'createdAt':
        default:
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }

  /**
   * Format user data for display
   */
  formatUserForDisplay(user: User) {
    return {
      ...user,
      fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A',
      formattedCreatedAt: new Date(user.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
      formattedLastLogin: user.lastLoginAt
        ? new Date(user.lastLoginAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : 'Never',
    };
  }

  /**
   * Calculate user statistics
   */
  calculateUserStats(users: User[]) {
    const stats = users.reduce(
      (acc, user) => {
        acc.totalUsers++;

        switch (user.role) {
          case 'ADMIN':
            acc.adminUsers++;
            break;
          case 'SELLER':
            acc.sellerUsers++;
            break;
          case 'USER':
            acc.regularUsers++;
            break;
        }

        switch (user.status) {
          case 'ACTIVE':
            acc.activeUsers++;
            break;
          case 'BLOCKED':
            acc.blockedUsers++;
            break;
          case 'INACTIVE':
            acc.inactiveUsers++;
            break;
        }

        if (user.isEmailVerified) {
          acc.verifiedEmails++;
        }

        return acc;
      },
      {
        totalUsers: 0,
        adminUsers: 0,
        sellerUsers: 0,
        regularUsers: 0,
        activeUsers: 0,
        blockedUsers: 0,
        inactiveUsers: 0,
        verifiedEmails: 0,
      }
    );

    return stats;
  }

  /**
   * Check if user can be promoted to seller
   */
  canPromoteToSeller(user: User): boolean {
    return user.role === 'USER' && user.status === 'ACTIVE';
  }

  /**
   * Check if user can be deleted
   */
  canDeleteUser(user: User): boolean {
    // Cannot delete admin users
    return user.role !== 'ADMIN';
  }

  /**
   * Check if user can be blocked
   */
  canBlockUser(user: User): boolean {
    // Can block any user except yourself (checked in component)
    return true;
  }
}

// Export singleton instance
export const usersService = new UsersService();
export default usersService;

