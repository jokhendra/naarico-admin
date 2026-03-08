import { storesApi } from '@/lib/api/stores-api';
import {
  Store,
  CreateStoreFormData,
  UpdateStoreFormData,
  UpdateStoreStatusDto,
  ToggleVacationDto,
  StoreStatus,
} from '@/types/store';

/**
 * Generic service response structure
 */
export interface StoresServiceResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  message?: string;
}

/**
 * Service for handling store-related operations
 * Wraps the stores API with proper error handling and response formatting
 */
class StoresService {
  /**
   * Get all stores
   * Admin sees all stores, Seller sees only their own stores
   */
  async getStores(): Promise<StoresServiceResponse<Store[]>> {
    try {
      const response = await storesApi.getAll();
      return {
        success: true,
        data: response,
      };
    } catch (error: any) {
      console.error('Error fetching stores:', error);
      return {
        success: false,
        data: [],
        error: error.message || 'Failed to fetch stores',
      };
    }
  }

  /**
   * Get store by ID
   */
  async getStoreById(id: string): Promise<StoresServiceResponse<Store | null>> {
    try {
      const response = await storesApi.getById(id);
      return {
        success: true,
        data: response,
      };
    } catch (error: any) {
      console.error(`Error fetching store ${id}:`, error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to fetch store details',
      };
    }
  }

  /**
   * Create a new store (Seller only)
   */
  async createStore(storeData: CreateStoreFormData): Promise<StoresServiceResponse<Store | null>> {
    try {
      const response = await storesApi.create(storeData);
      return {
        success: true,
        data: response,
        message: 'Store created successfully',
      };
    } catch (error: any) {
      console.error('Error creating store:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to create store',
      };
    }
  }

  /**
   * Update an existing store
   */
  async updateStore(id: string, storeData: UpdateStoreFormData): Promise<StoresServiceResponse<Store | null>> {
    try {
      const response = await storesApi.update(id, storeData);
      return {
        success: true,
        data: response,
        message: 'Store updated successfully',
      };
    } catch (error: any) {
      console.error(`Error updating store ${id}:`, error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to update store',
      };
    }
  }

  /**
   * Update store status (Admin only)
   */
  async updateStoreStatus(id: string, status: StoreStatus): Promise<StoresServiceResponse<Store | null>> {
    try {
      const response = await storesApi.updateStatus(id, { status });
      return {
        success: true,
        data: response,
        message: `Store status updated to ${status}`,
      };
    } catch (error: any) {
      console.error(`Error updating store ${id} status:`, error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to update store status',
      };
    }
  }

  /**
   * Toggle vacation mode
   */
  async toggleVacation(
    id: string,
    isOnVacation: boolean,
    vacationMessage?: string
  ): Promise<StoresServiceResponse<Store | null>> {
    try {
      const response = await storesApi.toggleVacation(id, {
        isOnVacation,
        vacationMessage,
      });
      return {
        success: true,
        data: response,
        message: isOnVacation ? 'Vacation mode enabled' : 'Vacation mode disabled',
      };
    } catch (error: any) {
      console.error(`Error toggling vacation for store ${id}:`, error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to toggle vacation mode',
      };
    }
  }

  /**
   * Delete a store
   */
  async deleteStore(id: string): Promise<StoresServiceResponse<boolean>> {
    try {
      await storesApi.delete(id);
      return {
        success: true,
        data: true,
        message: 'Store deleted successfully',
      };
    } catch (error: any) {
      console.error(`Error deleting store ${id}:`, error);
      return {
        success: false,
        data: false,
        error: error.message || 'Failed to delete store',
      };
    }
  }

  /**
   * Get store status badge configuration
   */
  getStoreStatusBadgeConfig(status: StoreStatus) {
    const configs = {
      PENDING: { variant: 'secondary', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
      APPROVED: { variant: 'default', label: 'Approved', color: 'bg-green-100 text-green-800' },
      SUSPENDED: { variant: 'destructive', label: 'Suspended', color: 'bg-red-100 text-red-800' },
      CLOSED: { variant: 'outline', label: 'Closed', color: 'bg-gray-100 text-gray-800' },
    };

    return configs[status] || { variant: 'outline', label: status, color: 'bg-gray-100 text-gray-800' };
  }

  /**
   * Filter stores by search term
   */
  filterStoresBySearch(stores: Store[], searchTerm: string): Store[] {
    if (!searchTerm.trim()) return stores;

    const term = searchTerm.toLowerCase();
    return stores.filter(store =>
      store.name.toLowerCase().includes(term) ||
      store.description?.toLowerCase().includes(term) ||
      store.seller?.email.toLowerCase().includes(term) ||
      store.seller?.firstName?.toLowerCase().includes(term) ||
      store.seller?.lastName?.toLowerCase().includes(term)
    );
  }

  /**
   * Filter stores by status
   */
  filterStoresByStatus(stores: Store[], status: StoreStatus | 'all'): Store[] {
    if (status === 'all') return stores;
    return stores.filter(store => store.status === status);
  }

  /**
   * Sort stores by specified field
   */
  sortStores(stores: Store[], sortBy: string, sortOrder: 'asc' | 'desc' = 'desc'): Store[] {
    return [...stores].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'products':
          aValue = a._count?.products || 0;
          bValue = b._count?.products || 0;
          break;
        case 'orders':
          aValue = a._count?.orders || 0;
          bValue = b._count?.orders || 0;
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
   * Format store data for display
   */
  formatStoreForDisplay(store: Store) {
    return {
      ...store,
      sellerName: store.seller
        ? `${store.seller.firstName || ''} ${store.seller.lastName || ''}`.trim() || store.seller.email
        : 'Unknown Seller',
      formattedCreatedAt: new Date(store.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
      productsCount: store._count?.products || 0,
      ordersCount: store._count?.orders || 0,
    };
  }

  /**
   * Calculate store statistics
   */
  calculateStoreStats(stores: Store[]) {
    const stats = stores.reduce(
      (acc, store) => {
        acc.totalStores++;
        acc.totalProducts += store._count?.products || 0;
        acc.totalOrders += store._count?.orders || 0;

        switch (store.status) {
          case 'PENDING':
            acc.pendingStores++;
            break;
          case 'APPROVED':
            acc.approvedStores++;
            break;
          case 'SUSPENDED':
            acc.suspendedStores++;
            break;
          case 'CLOSED':
            acc.closedStores++;
            break;
        }

        if (store.isOnVacation) {
          acc.vacationStores++;
        }

        return acc;
      },
      {
        totalStores: 0,
        approvedStores: 0,
        pendingStores: 0,
        suspendedStores: 0,
        closedStores: 0,
        vacationStores: 0,
        totalProducts: 0,
        totalOrders: 0,
      }
    );

    return stats;
  }

  /**
   * Validate store data before submission
   */
  validateStoreData(data: CreateStoreFormData | UpdateStoreFormData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if ('name' in data && data.name) {
      if (data.name.length < 3) {
        errors.push('Store name must be at least 3 characters');
      }
      if (data.name.length > 100) {
        errors.push('Store name must be at most 100 characters');
      }
    }

    if (data.description && data.description.length > 500) {
      errors.push('Description must be at most 500 characters');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// Export singleton instance
export const storesService = new StoresService();
export default storesService;

