import { axiosClient } from '@/lib/api/axios-client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { 
  InventoryItem, 
  InventoryLog, 
  UpdateInventoryDto, 
  RestockDto, 
  AddStockDto,
  InventoryServiceResponse,
  InventoryStats,
  Product
} from '@/types/inventory';
import { productsApi } from '@/lib/api/products-api';

/**
 * Service for handling inventory-related operations
 */
class InventoryService {
  /**
   * Get all inventory items
   */
  async getInventory(): Promise<InventoryServiceResponse<InventoryItem[]>> {
    try {
      const response = await axiosClient.get(ENDPOINTS.INVENTORY.BASE);
      return {
        success: true,
        data: response.data.data || response.data,
      };
    } catch (error: any) {
      console.error('Error fetching inventory:', error);
      return {
        success: false,
        data: [],
        error: error.message || 'Failed to fetch inventory'
      };
    }
  }

  /**
   * Get low stock inventory items
   */
  async getLowStockItems(): Promise<InventoryServiceResponse<InventoryItem[]>> {
    try {
      const response = await axiosClient.get(`${ENDPOINTS.INVENTORY.BASE}/low-stock`);
      return {
        success: true,
        data: response.data.data || response.data,
      };
    } catch (error: any) {
      console.error('Error fetching low stock inventory:', error);
      return {
        success: false,
        data: [],
        error: error.message || 'Failed to fetch low stock inventory'
      };
    }
  }

  /**
   * Get inventory for a specific product
   */
  async getProductInventory(productId: string): Promise<InventoryServiceResponse<InventoryItem>> {
    try {
      const response = await axiosClient.get(`${ENDPOINTS.INVENTORY.BASE}/product/${productId}`);
      return {
        success: true,
        data: response.data.data || response.data,
      };
    } catch (error: any) {
      console.error(`Error fetching inventory for product ${productId}:`, error);
      return {
        success: false,
        data: {} as InventoryItem,
        error: error.message || `Failed to fetch inventory for product ${productId}`
      };
    }
  }

  /**
   * Get inventory for a specific variant
   */
  async getVariantInventory(variantId: string): Promise<InventoryServiceResponse<InventoryItem>> {
    try {
      const response = await axiosClient.get(`${ENDPOINTS.INVENTORY.BASE}/variant/${variantId}`);
      return {
        success: true,
        data: response.data.data || response.data,
      };
    } catch (error: any) {
      console.error(`Error fetching inventory for variant ${variantId}:`, error);
      return {
        success: false,
        data: {} as InventoryItem,
        error: error.message || `Failed to fetch inventory for variant ${variantId}`
      };
    }
  }

  /**
   * Update product inventory
   */
  async updateProductInventory(productId: string, updateDto: UpdateInventoryDto): Promise<InventoryServiceResponse<InventoryItem>> {
    try {
      const response = await axiosClient.patch(`${ENDPOINTS.INVENTORY.BASE}/product/${productId}`, updateDto);
      return {
        success: true,
        data: response.data.data || response.data,
        message: 'Inventory updated successfully'
      };
    } catch (error: any) {
      console.error(`Error updating inventory for product ${productId}:`, error);
      return {
        success: false,
        data: {} as InventoryItem,
        error: error.message || `Failed to update inventory for product ${productId}`
      };
    }
  }

  /**
   * Update variant inventory
   */
  async updateVariantInventory(variantId: string, updateDto: UpdateInventoryDto): Promise<InventoryServiceResponse<InventoryItem>> {
    try {
      const response = await axiosClient.patch(`${ENDPOINTS.INVENTORY.BASE}/variant/${variantId}`, updateDto);
      return {
        success: true,
        data: response.data.data || response.data,
        message: 'Variant inventory updated successfully'
      };
    } catch (error: any) {
      console.error(`Error updating inventory for variant ${variantId}:`, error);
      return {
        success: false,
        data: {} as InventoryItem,
        error: error.message || `Failed to update inventory for variant ${variantId}`
      };
    }
  }

  /**
   * Restock a product
   */
  async restockProduct(productId: string, restockDto: RestockDto): Promise<InventoryServiceResponse<InventoryItem>> {
    try {
      const response = await axiosClient.post(`${ENDPOINTS.INVENTORY.BASE}/restock/product/${productId}`, restockDto);
      return {
        success: true,
        data: response.data.data || response.data,
        message: 'Product restocked successfully'
      };
    } catch (error: any) {
      console.error(`Error restocking product ${productId}:`, error);
      return {
        success: false,
        data: {} as InventoryItem,
        error: error.message || `Failed to restock product ${productId}`
      };
    }
  }

  /**
   * Restock a variant
   */
  async restockVariant(variantId: string, productId: string, restockDto: RestockDto): Promise<InventoryServiceResponse<InventoryItem>> {
    try {
      const response = await axiosClient.post(
        `${ENDPOINTS.INVENTORY.BASE}/restock/variant/${variantId}`, 
        { ...restockDto, productId }
      );
      return {
        success: true,
        data: response.data.data || response.data,
        message: 'Variant restocked successfully'
      };
    } catch (error: any) {
      console.error(`Error restocking variant ${variantId}:`, error);
      return {
        success: false,
        data: {} as InventoryItem,
        error: error.message || `Failed to restock variant ${variantId}`
      };
    }
  }

  /**
   * Add new stock for a product that doesn't have inventory yet
   */
  async addStock(addStockDto: AddStockDto): Promise<InventoryServiceResponse<InventoryItem>> {
    try {
      const response = await axiosClient.post(`${ENDPOINTS.INVENTORY.BASE}/add`, addStockDto);
      return {
        success: true,
        data: response.data.data || response.data,
        message: 'Stock added successfully'
      };
    } catch (error: any) {
      console.error(`Error adding stock for product ${addStockDto.productId}:`, error);
      return {
        success: false,
        data: {} as InventoryItem,
        error: error.message || `Failed to add stock for product ${addStockDto.productId}`
      };
    }
  }

  /**
   * Get inventory logs
   */
  async getInventoryLogs(productId?: string, variantId?: string): Promise<InventoryServiceResponse<InventoryLog[]>> {
    try {
      const params: Record<string, string> = {};
      if (productId) params.productId = productId;
      if (variantId) params.variantId = variantId;
      
      const response = await axiosClient.get(`${ENDPOINTS.INVENTORY.BASE}/logs`, { params });
      return {
        success: true,
        data: response.data.data || response.data
      };
    } catch (error: any) {
      console.error('Error fetching inventory logs:', error);
      return {
        success: false,
        data: [],
        error: error.message || 'Failed to fetch inventory logs'
      };
    }
  }

  /**
   * Calculate inventory statistics
   */
  getInventoryStats(inventory: InventoryItem[]): InventoryStats {
    const lowStock = inventory.filter(item => item.isLowStock).length;
    const outOfStock = inventory.filter(item => item.stockQuantity === 0).length;
    const reserved = inventory.reduce((total, item) => total + item.reservedQuantity, 0);

    return {
      total: inventory.length,
      lowStock,
      outOfStock,
      reserved
    };
  }

  /**
   * Get inventory status for an item
   */
  getInventoryStatus(item: InventoryItem): 'In Stock' | 'Low Stock' | 'Out of Stock' {
    if (item.stockQuantity === 0) return 'Out of Stock';
    if (item.isLowStock) return 'Low Stock';
    return 'In Stock';
  }

  /**
   * Search products for adding stock
   */
  async searchProducts(searchTerm: string = ''): Promise<InventoryServiceResponse<Product[]>> {
    try {
      const products = await productsApi.searchProducts(searchTerm, 20);
      
      // Transform the response data to match our Product interface
      const transformedProducts: Product[] = products.map(prod => ({
        id: prod.id,
        title: prod.title,
        sku: prod.sku || 'N/A',
        stockQuantity: prod.stockQuantity || 0
      }));

      return {
        success: true,
        data: transformedProducts
      };
    } catch (error: any) {
      console.error('Error searching products:', error);
      return {
        success: false,
        data: [],
        error: error.message || 'Failed to search products'
      };
    }
  }

  /**
   * Get product details by ID
   */
  async getProductDetails(productId: string): Promise<InventoryServiceResponse<Product>> {
    try {
      const product = await productsApi.getProductById(productId);
      
      // Transform the data to match our Product interface
      const transformedProduct: Product = {
        id: product.id,
        title: product.title,
        sku: product.sku || 'N/A',
        stockQuantity: product.stockQuantity || 0
      };

      return {
        success: true,
        data: transformedProduct
      };
    } catch (error: any) {
      console.error(`Error fetching product details for ${productId}:`, error);
      return {
        success: false,
        data: {} as Product,
        error: error.message || `Failed to fetch product details for ${productId}`
      };
    }
  }
}

// Create a singleton instance
export const inventoryService = new InventoryService(); 