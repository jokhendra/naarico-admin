import { ordersApi } from '@/lib/api/orders-api';
import {
  Order,
  OrderListParams,
  OrderListResponse,
  UpdateOrderDto,
  CreateOrderDto,
  OrderStats,
  OrderStatus,
  PaymentStatus,
  OrderTimeline
} from '@/types/order';

/**
 * Generic service response structure
 */
export interface OrdersServiceResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  message?: string;
}

/**
 * Service for handling order-related operations
 */
class OrdersService {
  /**
   * Get all orders with pagination and filtering
   */
  async getOrders(params: OrderListParams = {}): Promise<OrdersServiceResponse<OrderListResponse>> {
    try {
      const response = await ordersApi.getOrders(params);
      return {
        success: true,
        data: response,
      };
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      return {
        success: false,
        data: {
          orders: [],
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false
        },
        error: error.message || 'Failed to fetch orders'
      };
    }
  }

  /**
   * Get order by ID
   */
  async getOrderById(id: string): Promise<OrdersServiceResponse<Order | null>> {
    try {
      const response = await ordersApi.getOrderById(id);
      return {
        success: true,
        data: response,
      };
    } catch (error: any) {
      console.error(`Error fetching order ${id}:`, error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to fetch order details'
      };
    }
  }

  /**
   * Create a new order
   */
  async createOrder(orderData: CreateOrderDto): Promise<OrdersServiceResponse<Order | null>> {
    try {
      const response = await ordersApi.createOrder(orderData);
      return {
        success: true,
        data: response,
        message: 'Order created successfully'
      };
    } catch (error: any) {
      console.error('Error creating order:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to create order'
      };
    }
  }

  /**
   * Update an existing order
   */
  async updateOrder(id: string, orderData: UpdateOrderDto): Promise<OrdersServiceResponse<Order | null>> {
    try {
      const response = await ordersApi.updateOrder(id, orderData);
      return {
        success: true,
        data: response,
        message: 'Order updated successfully'
      };
    } catch (error: any) {
      console.error(`Error updating order ${id}:`, error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to update order'
      };
    }
  }

  /**
   * Update order status
   */
  async updateOrderStatus(id: string, status: OrderStatus): Promise<OrdersServiceResponse<Order | null>> {
    try {
      const response = await ordersApi.updateOrderStatus(id, status);
      return {
        success: true,
        data: response,
        message: `Order status updated to ${status}`
      };
    } catch (error: any) {
      console.error(`Error updating order ${id} status:`, error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to update order status'
      };
    }
  }

  /**
   * Delete order
   */
  async deleteOrder(id: string): Promise<OrdersServiceResponse<boolean>> {
    try {
      await ordersApi.deleteOrder(id);
      return {
        success: true,
        data: true,
        message: 'Order deleted successfully'
      };
    } catch (error: any) {
      console.error(`Error deleting order ${id}:`, error);
      return {
        success: false,
        data: false,
        error: error.message || 'Failed to delete order'
      };
    }
  }

  /**
   * Get order statistics
   */
  async getOrderStats(): Promise<OrdersServiceResponse<OrderStats | null>> {
    try {
      const response = await ordersApi.getOrderStats();
      return {
        success: true,
        data: response,
      };
    } catch (error: any) {
      console.error('Error fetching order statistics:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to fetch order statistics'
      };
    }
  }

  /**
   * Export orders
   */
  async exportOrders(params: OrderListParams = {}): Promise<OrdersServiceResponse<{ downloadUrl?: string; data?: any[] }>> {
    try {
      const response = await ordersApi.exportOrders(params);
      return {
        success: true,
        data: response,
        message: 'Orders exported successfully'
      };
    } catch (error: any) {
      console.error('Error exporting orders:', error);
      return {
        success: false,
        data: {},
        error: error.message || 'Failed to export orders'
      };
    }
  }

  /**
   * Bulk update orders
   */
  async bulkUpdateOrders(
    orderIds: string[], 
    updates: Partial<UpdateOrderDto>
  ): Promise<OrdersServiceResponse<{ updated: number; failed: number }>> {
    try {
      const response = await ordersApi.bulkUpdateOrders(orderIds, updates);
      return {
        success: true,
        data: response,
        message: `Successfully updated ${response.updated} orders`
      };
    } catch (error: any) {
      console.error('Error bulk updating orders:', error);
      return {
        success: false,
        data: { updated: 0, failed: orderIds.length },
        error: error.message || 'Failed to bulk update orders'
      };
    }
  }

  /**
   * Get order timeline
   */
  async getOrderTimeline(id: string): Promise<OrdersServiceResponse<OrderTimeline[]>> {
    try {
      const response = await ordersApi.getOrderTimeline(id);
      return {
        success: true,
        data: response,
      };
    } catch (error: any) {
      console.error(`Error fetching timeline for order ${id}:`, error);
      return {
        success: false,
        data: [],
        error: error.message || 'Failed to fetch order timeline',
      };
    }
  }

  /**
   * Calculate order statistics from order list
   */
  calculateOrderStats(orders: Order[]): OrderStats {
    const stats = orders.reduce(
      (acc, order) => {
        acc.totalOrders++;
        acc.totalRevenue += order.total;

        switch (order.status) {
          case OrderStatus.PENDING:
            acc.pendingOrders++;
            break;
          case OrderStatus.PROCESSING:
            acc.processingOrders++;
            break;
          case OrderStatus.SHIPPED:
            acc.shippedOrders++;
            break;
          case OrderStatus.DELIVERED:
            acc.deliveredOrders++;
            break;
          case OrderStatus.CANCELLED:
            acc.cancelledOrders++;
            break;
        }
        return acc;
      },
      {
        totalOrders: 0,
        totalRevenue: 0,
        pendingOrders: 0,
        processingOrders: 0,
        shippedOrders: 0,
        deliveredOrders: 0,
        cancelledOrders: 0,
        averageOrderValue: 0
      }
    );

    // Calculate average order value
    stats.averageOrderValue = stats.totalOrders > 0 ? stats.totalRevenue / stats.totalOrders : 0;

    return stats;
  }

  /**
   * Format order display data
   */
  formatOrderForDisplay(order: Order) {
    return {
      ...order,
      customerName: order.user 
        ? `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() || order.user.email
        : 'Guest Customer',
      formattedTotal: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(order.total),
      formattedDate: new Date(order.placedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
      itemsCount: order.items.length,
    };
  }

  /**
   * Filter orders by search term
   */
  filterOrdersBySearch(orders: Order[], searchTerm: string): Order[] {
    if (!searchTerm.trim()) return orders;

    const term = searchTerm.toLowerCase();
    return orders.filter(order => 
      order.orderNumber.toLowerCase().includes(term) ||
      order.user?.email.toLowerCase().includes(term) ||
      order.user?.firstName?.toLowerCase().includes(term) ||
      order.user?.lastName?.toLowerCase().includes(term) ||
      order.status.toLowerCase().includes(term) ||
      order.paymentStatus.toLowerCase().includes(term)
    );
  }

  /**
   * Sort orders by specified field
   */
  sortOrders(orders: Order[], sortBy: string, sortOrder: 'asc' | 'desc' = 'desc'): Order[] {
    return [...orders].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'orderNumber':
          aValue = a.orderNumber;
          bValue = b.orderNumber;
          break;
        case 'customerName':
          aValue = a.user?.firstName || a.user?.email || '';
          bValue = b.user?.firstName || b.user?.email || '';
          break;
        case 'total':
          aValue = a.total;
          bValue = b.total;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'placedAt':
        default:
          aValue = new Date(a.placedAt);
          bValue = new Date(b.placedAt);
          break;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }

  /**
   * Get order status badge configuration
   */
  getOrderStatusBadgeConfig(status: OrderStatus) {
    const configs = {
      [OrderStatus.PENDING]: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      [OrderStatus.PROCESSING]: { color: 'bg-blue-100 text-blue-800', label: 'Processing' },
      [OrderStatus.SHIPPED]: { color: 'bg-purple-100 text-purple-800', label: 'Shipped' },
      [OrderStatus.DELIVERED]: { color: 'bg-green-100 text-green-800', label: 'Delivered' },
      [OrderStatus.CANCELLED]: { color: 'bg-red-100 text-red-800', label: 'Cancelled' },
      [OrderStatus.RETURNED]: { color: 'bg-gray-100 text-gray-800', label: 'Returned' },
      [OrderStatus.REFUNDED]: { color: 'bg-orange-100 text-orange-800', label: 'Refunded' },
    };

    return configs[status] || { color: 'bg-gray-100 text-gray-800', label: status };
  }

  /**
   * Get payment status badge configuration
   */
  getPaymentStatusBadgeConfig(status: PaymentStatus) {
    const configs = {
      [PaymentStatus.PENDING]: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      [PaymentStatus.PAID]: { color: 'bg-green-100 text-green-800', label: 'Paid' },
      [PaymentStatus.FAILED]: { color: 'bg-red-100 text-red-800', label: 'Failed' },
      [PaymentStatus.REFUNDED]: { color: 'bg-orange-100 text-orange-800', label: 'Refunded' },
    };

    return configs[status] || { color: 'bg-gray-100 text-gray-800', label: status };
  }
}

// Export singleton instance
export const ordersService = new OrdersService();
export default ordersService; 