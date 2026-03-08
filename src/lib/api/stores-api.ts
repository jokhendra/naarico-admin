import { axiosClient } from './axios-client';
import { ENDPOINTS } from './endpoints';
import { logApiError } from './error-handler';
import { 
  Store, 
  CreateStoreFormData, 
  UpdateStoreFormData, 
  UpdateStoreStatusDto, 
  ToggleVacationDto 
} from '@/types/store';

export const storesApi = {
  /**
   * Get all stores
   * Admin sees all stores, Seller sees only their own stores
   */
  getAll: async (): Promise<Store[]> => {
    try {
      const response = await axiosClient.get(ENDPOINTS.STORES.BASE);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching stores:', error);
      logApiError(error);
      throw error;
    }
  },

  /**
   * Get single store by ID
   */
  getById: async (id: string): Promise<Store> => {
    try {
      const response = await axiosClient.get(ENDPOINTS.STORES.DETAIL(id));
      return response.data.data || response.data;
    } catch (error) {
      console.error(`Error fetching store ${id}:`, error);
      logApiError(error);
      throw error;
    }
  },

  /**
   * Create a new store (Seller only)
   */
  create: async (data: CreateStoreFormData): Promise<Store> => {
    try {
      const response = await axiosClient.post(ENDPOINTS.STORES.BASE, data);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error creating store:', error);
      logApiError(error);
      throw error;
    }
  },

  /**
   * Update store details (Seller for own, Admin for all)
   */
  update: async (id: string, data: UpdateStoreFormData): Promise<Store> => {
    try {
      const response = await axiosClient.patch(ENDPOINTS.STORES.DETAIL(id), data);
      return response.data.data || response.data;
    } catch (error) {
      console.error(`Error updating store ${id}:`, error);
      logApiError(error);
      throw error;
    }
  },

  /**
   * Update store status (Admin only)
   */
  updateStatus: async (id: string, data: UpdateStoreStatusDto): Promise<Store> => {
    try {
      const response = await axiosClient.patch(ENDPOINTS.STORES.STATUS(id), data);
      return response.data.data || response.data;
    } catch (error) {
      console.error(`Error updating store status ${id}:`, error);
      logApiError(error);
      throw error;
    }
  },

  /**
   * Toggle vacation mode (Seller for own, Admin for all)
   */
  toggleVacation: async (id: string, data: ToggleVacationDto): Promise<Store> => {
    try {
      const response = await axiosClient.patch(ENDPOINTS.STORES.VACATION(id), data);
      return response.data.data || response.data;
    } catch (error) {
      console.error(`Error toggling vacation mode for store ${id}:`, error);
      logApiError(error);
      throw error;
    }
  },

  /**
   * Delete a store (Seller for own, Admin for all)
   */
  delete: async (id: string): Promise<void> => {
    try {
      await axiosClient.delete(ENDPOINTS.STORES.DETAIL(id));
    } catch (error) {
      console.error(`Error deleting store ${id}:`, error);
      logApiError(error);
      throw error;
    }
  },
};

