// Order-related types for the e-commerce admin panel

// User information in order context
export interface OrderUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string | null;
}

// Product information in order context
export interface OrderProduct {
  id: string;
  title: string;
  slug: string;
  imageUrl: string | null;
}

// Product variant information in order context
export interface OrderVariant {
  id: string;
  variantName: string;
  sku: string;
}

// Order item details
export interface OrderItem {
  id: string;
  product: OrderProduct | null;
  variant: OrderVariant | null;
  currency: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  createdAt: string;
}

// Address structure
export interface OrderAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  mobileNumber?: string;
}

// Order status enum - matches backend
export enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  RETURNED = 'RETURNED',
  REFUNDED = 'REFUNDED'
}

// Payment status enum - matches backend  
export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED'
}

// Main order interface
export interface Order {
  id: string;
  orderNumber: string;
  user: OrderUser | null;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string | null;
  shippingAddress: OrderAddress;
  billingAddress: OrderAddress;
  subtotal: number;
  tax: number;
  shippingFee: number;
  discount: number;
  currency: string;
  total: number;
  items: OrderItem[];
  placedAt: string;
  updatedAt: string;
  timeline?: OrderTimeline[];
}

// Order filters for API requests
export interface OrderFilterDto {
  page?: number;
  limit?: number;
  userId?: string;
  orderNumber?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Paginated order response
export interface PaginatedOrderResponse {
  data: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Order creation DTO
export interface CreateOrderDto {
  userId?: string;
  items: Array<{
    productId: string;
    variantId?: string;
    quantity: number;
  }>;
  paymentMethod?: string;
  paymentStatus?: PaymentStatus;
  status?: OrderStatus;
  shippingAddress: OrderAddress;
  billingAddress?: OrderAddress;
  discountCode?: string;
}

// Order update DTO
export interface UpdateOrderDto {
  paymentMethod?: string;
  paymentStatus?: PaymentStatus;
  status?: OrderStatus;
  shippingAddress?: OrderAddress;
  billingAddress?: OrderAddress;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
}

// Order statistics for dashboard
export interface OrderStats {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  averageOrderValue: number;
}

// Order list parameters for API calls
export interface OrderListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: OrderStatus | 'all';
  paymentStatus?: PaymentStatus | 'all';
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  userId?: string;
}

// Order list response format
export interface OrderListResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Order action types for bulk operations
export interface OrderAction {
  type: 'update_status' | 'export' | 'delete';
  orderIds: string[];
  data?: any;
}

// Order export format
export interface OrderExportData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  status: string;
  paymentStatus: string;
  total: number;
  placedAt: string;
  itemsCount: number;
}

// Status badge color mapping
export interface StatusConfig {
  label: string;
  color: 'default' | 'secondary' | 'destructive' | 'success' | 'warning';
  bgColor: string;
  textColor: string;
}

export const ORDER_STATUS_CONFIG: Record<OrderStatus, StatusConfig> = {
  [OrderStatus.PENDING]: {
    label: 'Pending',
    color: 'warning',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800'
  },
  [OrderStatus.PROCESSING]: {
    label: 'Processing',
    color: 'default',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800'
  },
  [OrderStatus.SHIPPED]: {
    label: 'Shipped',
    color: 'secondary',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-800'
  },
  [OrderStatus.DELIVERED]: {
    label: 'Delivered',
    color: 'success',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800'
  },
  [OrderStatus.CANCELLED]: {
    label: 'Cancelled',
    color: 'destructive',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800'
  },
  [OrderStatus.RETURNED]: {
    label: 'Returned',
    color: 'secondary',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800'
  },
  [OrderStatus.REFUNDED]: {
    label: 'Refunded',
    color: 'secondary',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-800'
  }
};

export const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, StatusConfig> = {
  [PaymentStatus.PENDING]: {
    label: 'Pending',
    color: 'warning',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800'
  },
  [PaymentStatus.PAID]: {
    label: 'Paid',
    color: 'success',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800'
  },
  [PaymentStatus.FAILED]: {
    label: 'Failed',
    color: 'destructive',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800'
  },
  [PaymentStatus.REFUNDED]: {
    label: 'Refunded',
    color: 'secondary',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-800'
  }
}; 

export interface OrderTimeline {
  id: string;
  orderId: string;
  status: OrderStatus;
  note?: string | null;
  createdAt: string;
} 