import { axiosClient } from './axios-client';
import { logApiError } from './error-handler';
import { ENDPOINTS } from './endpoints';
import {
  Order,
  OrderListParams,
  OrderListResponse,
  OrderFilterDto,
  PaginatedOrderResponse,
  CreateOrderDto,
  UpdateOrderDto,
  OrderStats,
  OrderTimeline
} from '@/types/order';

// Orders API service following the established patterns
export const ordersApi = {
  // Get all orders with pagination and filtering
  getOrders: async (params: OrderListParams = {}): Promise<OrderListResponse> => {
    try {
      console.log('Fetching orders from:', ENDPOINTS.ORDERS.BASE);
      console.log('Orders API params:', params);
      
      // Convert the params to match backend expectations
      const apiParams: Partial<OrderFilterDto> = {
        page: params.page || 1,
        limit: params.limit || 10,
        orderNumber: params.search,
        sortBy: params.sortBy || 'placedAt',
        sortOrder: params.sortOrder || 'desc'
      };

      // Add status filters if specified and not 'all'
      if (params.status && params.status !== 'all') {
        apiParams.status = params.status;
      }
      
      if (params.paymentStatus && params.paymentStatus !== 'all') {
        apiParams.paymentStatus = params.paymentStatus;
      }

      // Add date filters if specified
      if (params.startDate) {
        apiParams.startDate = params.startDate;
      }
      
      if (params.endDate) {
        apiParams.endDate = params.endDate;
      }

      // Add user filter if specified
      if (params.userId) {
        apiParams.userId = params.userId;
      }

      const response = await axiosClient.get(ENDPOINTS.ORDERS.BASE, { 
        params: apiParams 
      });
      
      console.log('Orders API raw response:', response);
      console.log('Orders API response data type:', typeof response.data);
      console.log('Orders API response data:', response.data);
      
      // Handle different response structures
      let ordersData: PaginatedOrderResponse;
      
      if (response.data && response.data.data) {
        // Backend returns nested structure: { data: PaginatedOrderResponse }
        ordersData = response.data.data;
      } else if (response.data) {
        // Direct response structure
        ordersData = response.data;
      } else {
        console.error('Unexpected API response format:', response.data);
        return {
          orders: [],
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false
        };
      }

      // Process orders to ensure proper data types
      const processedOrders = (ordersData.data || []).map((order: any) => ({
        ...order,
        // Convert string numeric values to actual numbers
        subtotal: typeof order.subtotal === 'string' ? parseFloat(order.subtotal) : order.subtotal,
        tax: typeof order.tax === 'string' ? parseFloat(order.tax) : order.tax,
        shippingFee: typeof order.shippingFee === 'string' ? parseFloat(order.shippingFee) : order.shippingFee,
        discount: typeof order.discount === 'string' ? parseFloat(order.discount) : order.discount,
        total: typeof order.total === 'string' ? parseFloat(order.total) : order.total,
        // Process order items
        items: (order.items || []).map((item: any) => ({
          ...item,
          unitPrice: typeof item.unitPrice === 'string' ? parseFloat(item.unitPrice) : item.unitPrice,
          totalPrice: typeof item.totalPrice === 'string' ? parseFloat(item.totalPrice) : item.totalPrice,
        }))
      }));
      
      // Return in the format expected by the frontend
      return {
        orders: processedOrders,
        total: ordersData.total || 0,
        page: ordersData.page || 1,
        limit: ordersData.limit || 10,
        totalPages: ordersData.totalPages || 1,
        hasNextPage: ordersData.hasNextPage || false,
        hasPreviousPage: ordersData.hasPreviousPage || false
      };
    } catch (error) {
      console.error('Error in getOrders:', error);
      logApiError(error);
      throw error;
    }
  },

  // Get order by ID
  getOrderById: async (id: string): Promise<Order> => {
    try {
      console.log(`Fetching order details for ID: ${id}`);
      const response = await axiosClient.get(ENDPOINTS.ORDERS.DETAIL(id));
      
      console.log('Order details API response:👌👌👌👌👌👌👌👌👌👌👌', response.data);
      
      // Handle nested response structure
      let orderData: any;
      if (response.data && response.data.data) {
        orderData = response.data.data;
      } else {
        orderData = response.data;
      }
      
      // Convert string numeric values to actual numbers
      if (orderData) {
        orderData.subtotal = typeof orderData.subtotal === 'string' ? parseFloat(orderData.subtotal) : orderData.subtotal;
        orderData.tax = typeof orderData.tax === 'string' ? parseFloat(orderData.tax) : orderData.tax;
        orderData.shippingFee = typeof orderData.shippingFee === 'string' ? parseFloat(orderData.shippingFee) : orderData.shippingFee;
        orderData.discount = typeof orderData.discount === 'string' ? parseFloat(orderData.discount) : orderData.discount;
        orderData.total = typeof orderData.total === 'string' ? parseFloat(orderData.total) : orderData.total;
        
        // Process order items
        if (orderData.items) {
          orderData.items = orderData.items.map((item: any) => ({
            ...item,
            unitPrice: typeof item.unitPrice === 'string' ? parseFloat(item.unitPrice) : item.unitPrice,
            totalPrice: typeof item.totalPrice === 'string' ? parseFloat(item.totalPrice) : item.totalPrice,
          }));
        }
      }
      
      return orderData;
    } catch (error) {
      console.error(`Error fetching order ${id}:`, error);
      logApiError(error);
      throw error;
    }
  },

  // Create a new order
  createOrder: async (orderData: CreateOrderDto): Promise<Order> => {
    try {
      console.log('Creating order with data:', orderData);
      const response = await axiosClient.post(ENDPOINTS.ORDERS.BASE, orderData);
      console.log('Create order response:', response.data);
      
      // Handle nested response structure
      if (response.data && response.data.data) {
        return response.data.data;
      }
      
      return response.data;
    } catch (error) {
      console.error('Error creating order:', error);
      logApiError(error);
      throw error;
    }
  },

  // Update order
  updateOrder: async (id: string, orderData: UpdateOrderDto): Promise<Order> => {
    try {
      console.log(`Updating order ${id} with data:`, orderData);
      const response = await axiosClient.patch(ENDPOINTS.ORDERS.DETAIL(id), orderData);
      console.log('Update order response:', response.data);
      
      // Handle nested response structure
      if (response.data && response.data.data) {
        return response.data.data;
      }
      
      return response.data;
    } catch (error) {
      console.error(`Error updating order ${id}:`, error);
      logApiError(error);
      throw error;
    }
  },

  // Update order status specifically
  updateOrderStatus: async (id: string, status: string): Promise<Order> => {
    try {
      console.log(`Updating order ${id} status to:`, status);
      const response = await axiosClient.patch(ENDPOINTS.ORDERS.UPDATE_STATUS(id), { status });
      console.log('Update order status response:', response.data);
      
      // Handle nested response structure
      if (response.data && response.data.data) {
        return response.data.data;
      }
      
      return response.data;
    } catch (error) {
      console.error(`Error updating order ${id} status:`, error);
      logApiError(error);
      throw error;
    }
  },

  // Delete order (soft delete)
  deleteOrder: async (id: string): Promise<{ id: string; deleted: boolean; message: string }> => {
    try {
      console.log(`Deleting order: ${id}`);
      const response = await axiosClient.delete(ENDPOINTS.ORDERS.DETAIL(id));
      console.log('Delete order response:', response.data);
      
      // Handle nested response structure
      if (response.data && response.data.data) {
        return response.data.data;
      }
      
      return response.data;
    } catch (error) {
      console.error(`Error deleting order ${id}:`, error);
      logApiError(error);
      throw error;
    }
  },

  // Get order statistics
  getOrderStats: async (): Promise<OrderStats> => {
    try {
      console.log('Fetching order statistics');
      const response = await axiosClient.get(`${ENDPOINTS.ORDERS.BASE}/stats`);
      console.log('Order stats response:', response.data);
      
      // Handle nested response structure
      if (response.data && response.data.data) {
        return response.data.data;
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching order stats:', error);
      logApiError(error);
      throw error;
    }
  },

  // Export orders (returns CSV download URL or data)
  exportOrders: async (params: OrderListParams = {}): Promise<{ downloadUrl?: string; data?: any[] }> => {
    try {
      console.log('Exporting orders with params:', params);
      const response = await axiosClient.get(`${ENDPOINTS.ORDERS.BASE}/export`, { 
        params: {
          ...params,
          format: 'csv'
        }
      });
      console.log('Export orders response:', response.data);
      
      // Handle nested response structure
      if (response.data && response.data.data) {
        return response.data.data;
      }
      
      return response.data;
    } catch (error) {
      console.error('Error exporting orders:', error);
      logApiError(error);
      throw error;
    }
  },

  // Bulk update orders
  bulkUpdateOrders: async (orderIds: string[], updates: Partial<UpdateOrderDto>): Promise<{ updated: number; failed: number }> => {
    try {
      console.log('Bulk updating orders:', orderIds, updates);
      const response = await axiosClient.patch(`${ENDPOINTS.ORDERS.BASE}/bulk`, {
        orderIds,
        updates
      });
      console.log('Bulk update orders response:', response.data);
      
      // Handle nested response structure
      if (response.data && response.data.data) {
        return response.data.data;
      }
      
      return response.data;
    } catch (error) {
      console.error('Error bulk updating orders:', error);
      logApiError(error);
      throw error;
    }
  },

  // Get order timeline
  getOrderTimeline: async (id: string): Promise<OrderTimeline[]> => {
    try {
      const response = await axiosClient.get(ENDPOINTS.ORDERS.TIMELINE(id));
      const events = response.data?.data || response.data || [];
      return events;
    } catch (error) {
      console.error(`Error fetching timeline for order ${id}:`, error);
      logApiError(error);
      throw error;
    }
  }
};

// Export individual functions for backward compatibility
export const {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  updateOrderStatus,
  deleteOrder,
  getOrderStats,
  exportOrders,
  bulkUpdateOrders,
  getOrderTimeline,
} = ordersApi; 