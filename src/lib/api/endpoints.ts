// API base URL from environment variables
// export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.allmart.fashion/api/v1';
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

// Centralized endpoint definitions for the e-commerce API
export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    ADMIN_LOGIN: '/auth/admin/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    PROFILE: '/auth/me',
    ADMIN_PROFILE: '/auth/admin/me',
    CHANGE_PASSWORD: '/auth/change-password',
    CSRF_TOKEN: '/auth/csrf-token',
  },
  
  USERS: {
    BASE: '/users',
    DETAIL: (id: string) => `/users/${id}`,
    STATUS: (id: string) => `/users/${id}/status`,
    ROLE: (id: string) => `/users/${id}/role`,
    ADDRESSES: (userId: string) => `/users/${userId}/addresses`,
    ADDRESS_DETAIL: (userId: string, addressId: string) => 
      `/users/${userId}/addresses/${addressId}`,
  },
  
  STORES: {
    BASE: '/stores',
    DETAIL: (id: string) => `/stores/${id}`,
    STATUS: (id: string) => `/stores/${id}/status`,
    VACATION: (id: string) => `/stores/${id}/vacation`,
  },
  
  BRANDS: {
    BASE: '/brands',
    DETAIL: (id: string) => `/brands/${id}`,
  },
  
  PRODUCTS: {
    BASE: '/products',
    DETAIL: (id: string) => `/products/${id}`,
    VARIANTS: (productId: string) => `/products/${productId}/variants`,
    VARIANT_DETAIL: (productId: string, variantId: string) => 
      `/products/${productId}/variants/${variantId}`,
    IMAGES: (productId: string) => `/products/${productId}/images`,
    TAGS: (productId: string) => `/products/${productId}/tags`,
    DEALS: (productId: string) => `/products/${productId}/deals`,
    DEAL_DETAIL: (productId: string, dealId: string) => 
      `/products/${productId}/deals/${dealId}`,
  },
  
  CATEGORIES: {
    BASE: '/categories',
    DETAIL: (id: string) => `/categories/${id}`,
    TREE: '/categories/tree',
  },
  
  TAGS: {
    BASE: '/tags',
    DETAIL: (id: string) => `/tags/${id}`,
  },
  
  SPECIFICATIONS: {
    TEMPLATES: '/specifications/templates',
    TEMPLATES_BY_CATEGORY: (categoryId: string) => 
      `/specifications/templates/category/${categoryId}`,
    TEMPLATE_DETAIL: (id: string) => `/specifications/templates/${id}`,
    PRODUCT: '/specifications/product',
    PRODUCT_BULK: '/specifications/product/bulk',
    PRODUCT_SPECIFICATIONS: (productId: string) => `/specifications/product/${productId}`,
    PRODUCT_SPECIFICATIONS_GROUPED: (productId: string) => 
      `/specifications/product/${productId}/grouped`,
    SPECIFICATION_DETAIL: (id: string) => `/specifications/product/${id}`,
    DELETE_ALL_PRODUCT_SPECS: (productId: string) => 
      `/specifications/product/${productId}/all`,
  },
  
  ORDERS: {
    BASE: '/orders',
    DETAIL: (id: string) => `/orders/${id}`,
    UPDATE_STATUS: (id: string) => `/orders/${id}/status`,
    TIMELINE: (id: string) => `/orders/${id}/timeline`,
  },
  
  INVENTORY: {
    BASE: '/inventory',
    DETAIL: (id: string) => `/inventory/${id}`,
    LOG: '/inventory/log',
    LOGS: '/inventory/logs',
  },
  
  UPLOAD: {
    IMAGE: '/uploads/image',
  },
  
  DEALS: {
    BASE: '/deals',
    DETAIL: (id: string) => `/deals/${id}`,
    PRODUCTS: (dealId: string) => `/deals/${dealId}/products`,
    PRODUCT_DETAIL: (dealId: string, productId: string) => 
      `/deals/${dealId}/products/${productId}`,
  },
  
  COUPONS: {
    BASE: '/coupons',
    DETAIL: (id: string) => `/coupons/${id}`,
    BY_CODE: (code: string) => `/coupons/code/${code}`,
    VALIDATE: '/coupons/validate',
    APPLY: '/coupons/apply',
  },

  REVIEWS: {
    BASE: '/reviews',
    DETAIL: (id: string) => `/reviews/${id}`,
    MY: '/reviews/my-reviews',
    STATS: '/reviews/stats',
    SELLER_ALL: '/reviews/seller/all', // Seller-specific: only reviews for seller's products
    ADMIN_ALL: '/reviews/admin/all',   // Admin-specific: all reviews
  },
  
  ANALYTICS: {
    DASHBOARD: '/analytics/dashboard',
    SALES: '/analytics/sales',
    PRODUCTS: '/analytics/products',
    CUSTOMERS: '/analytics/customers',
  },

  PROMO_BANNERS: {
    BASE: '/promo-banners',
    DETAIL: (id: string) => `/promo-banners/${id}`,
  },
}; 