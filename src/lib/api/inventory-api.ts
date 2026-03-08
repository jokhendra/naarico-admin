import { axiosClient } from './axios-client';
import { ENDPOINTS } from './endpoints';
import { logApiError } from './error-handler';

// Types
export interface InventoryItem {
  id: string;
  productId: string;
  variantId: string | null;
  stockQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  threshold: number;
  lastRestockedAt: string | null;
  createdAt: string;
  updatedAt: string;
  isLowStock: boolean;
  product?: {
    title: string;
    sku: string;
  };
  variant?: {
    variantName: string;
    sku: string;
  };
}

export interface InventoryLog {
  id: string;
  productId: string;
  variantId: string | null;
  changeType: 'RESTOCK' | 'SALE' | 'RETURN' | 'MANUAL';
  quantityChanged: number;
  note: string | null;
  createdAt: string;
  product?: {
    title: string;
    sku: string;
  };
  variant?: {
    variantName: string;
    sku: string;
  };
}

export interface UpdateInventoryDto {
  stockQuantity?: number;
  reservedQuantity?: number;
  threshold?: number;
}

export interface CreateInventoryLogDto {
  productId: string;
  variantId?: string;
  changeType: 'RESTOCK' | 'SALE' | 'RETURN' | 'MANUAL';
  quantityChanged: number;
  note?: string;
}

export interface RestockDto {
  quantity: number;
  note?: string;
}

// Inventory API service
export const inventoryApi = {
  // Get all inventory items
  getInventory: async (): Promise<InventoryItem[]> => {
    try {
      const response = await axiosClient.get(ENDPOINTS.INVENTORY.BASE);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching inventory:', error);
      logApiError(error);
      throw error;
    }
  },

  // Get low stock inventory items
  getLowStockItems: async (): Promise<InventoryItem[]> => {
    try {
      const response = await axiosClient.get(`${ENDPOINTS.INVENTORY.BASE}/low-stock`);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching low stock inventory:', error);
      logApiError(error);
      throw error;
    }
  },

  // Get inventory for a specific product
  getProductInventory: async (productId: string): Promise<InventoryItem> => {
    try {
      const response = await axiosClient.get(`${ENDPOINTS.INVENTORY.BASE}/product/${productId}`);
      return response.data.data || response.data;
    } catch (error) {
      console.error(`Error fetching inventory for product ${productId}:`, error);
      logApiError(error);
      throw error;
    }
  },

  // Get inventory for a specific variant
  getVariantInventory: async (variantId: string): Promise<InventoryItem> => {
    try {
      const response = await axiosClient.get(`${ENDPOINTS.INVENTORY.BASE}/variant/${variantId}`);
      return response.data.data || response.data;
    } catch (error) {
      console.error(`Error fetching inventory for variant ${variantId}:`, error);
      logApiError(error);
      throw error;
    }
  },

  // Update product inventory
  updateProductInventory: async (productId: string, updateDto: UpdateInventoryDto): Promise<InventoryItem> => {
    try {
      const response = await axiosClient.patch(`${ENDPOINTS.INVENTORY.BASE}/product/${productId}`, updateDto);
      return response.data.data || response.data;
    } catch (error) {
      console.error(`Error updating inventory for product ${productId}:`, error);
      logApiError(error);
      throw error;
    }
  },

  // Update variant inventory
  updateVariantInventory: async (variantId: string, updateDto: UpdateInventoryDto): Promise<InventoryItem> => {
    try {
      const response = await axiosClient.patch(`${ENDPOINTS.INVENTORY.BASE}/variant/${variantId}`, updateDto);
      return response.data.data || response.data;
    } catch (error) {
      console.error(`Error updating inventory for variant ${variantId}:`, error);
      logApiError(error);
      throw error;
    }
  },

  // Restock a product
  restockProduct: async (productId: string, restockDto: RestockDto): Promise<InventoryItem> => {
    try {
      const response = await axiosClient.post(`${ENDPOINTS.INVENTORY.BASE}/restock/product/${productId}`, restockDto);
      return response.data.data || response.data;
    } catch (error) {
      console.error(`Error restocking product ${productId}:`, error);
      logApiError(error);
      throw error;
    }
  },

  // Restock a variant
  restockVariant: async (variantId: string, productId: string, restockDto: RestockDto): Promise<InventoryItem> => {
    try {
      const response = await axiosClient.post(
        `${ENDPOINTS.INVENTORY.BASE}/restock/variant/${variantId}`, 
        { ...restockDto, productId }
      );
      return response.data.data || response.data;
    } catch (error) {
      console.error(`Error restocking variant ${variantId}:`, error);
      logApiError(error);
      throw error;
    }
  },

  // Get inventory logs
  getInventoryLogs: async (productId?: string, variantId?: string): Promise<InventoryLog[]> => {
    try {
      const params: Record<string, string> = {};
      if (productId) params.productId = productId;
      if (variantId) params.variantId = variantId;
      
      const response = await axiosClient.get(`${ENDPOINTS.INVENTORY.BASE}/logs`, { params });
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching inventory logs:', error);
      logApiError(error);
      throw error;
    }
  },

  // Create inventory log
  createInventoryLog: async (createLogDto: CreateInventoryLogDto): Promise<InventoryLog> => {
    try {
      const response = await axiosClient.post(`${ENDPOINTS.INVENTORY.BASE}/logs`, createLogDto);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error creating inventory log:', error);
      logApiError(error);
      throw error;
    }
  }
}; 