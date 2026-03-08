import { axiosClient as apiClient } from "./axios-client";
import { ENDPOINTS } from "./endpoints";

export enum CouponType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
  FREE_SHIPPING = 'FREE_SHIPPING',
}

export enum CouponStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  DISABLED = 'DISABLED',
}

export interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  value: string;
  description?: string;
  minimumPurchase?: string;
  usageLimit?: number;
  usageCount: number;
  perUserLimit?: number;
  startDate: string;
  endDate: string;
  status: CouponStatus;
  createdAt: string;
  updatedAt: string;
  categories?: CategoryDto[];
  products?: ProductDto[];
}

export interface CategoryDto {
  id: string;
  name: string;
}

export interface ProductDto {
  id: string;
  title: string;
}

export interface CouponListResponse {
  coupons: Coupon[];
  total: number;
  totalPages: number;
}

export interface CouponListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: CouponStatus;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface CreateCouponDto {
  code: string;
  type: CouponType;
  value: number;
  description?: string;
  minimumPurchase?: number;
  usageLimit?: number;
  perUserLimit?: number;
  startDate: string;
  endDate: string;
  categoryIds?: string[];
  productIds?: string[];
}

export interface UpdateCouponDto extends Partial<CreateCouponDto> {}

export const couponsApi = {
  // Get all coupons with pagination and filters
  getCoupons: async (params: CouponListParams = {}): Promise<Coupon[]> => {
    try {
      const response = await apiClient.get(ENDPOINTS.COUPONS.BASE, { params });
      // Handle the nested data structure from the API
      if (response.data && response.data.data) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error("Error fetching coupons:", error);
      throw error;
    }
  },

  // Get coupon by ID
  getCouponById: async (id: string): Promise<Coupon> => {
    try {
      const response = await apiClient.get(ENDPOINTS.COUPONS.DETAIL(id));
      // Handle the nested data structure from the API
      if (response.data && response.data.data) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error(`Error fetching coupon with ID ${id}:`, error);
      throw error;
    }
  },

  // Get coupon by code
  getCouponByCode: async (code: string): Promise<Coupon> => {
    try {
      const response = await apiClient.get(ENDPOINTS.COUPONS.BY_CODE(code));
      // Handle the nested data structure from the API
      if (response.data && response.data.data) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error(`Error fetching coupon with code ${code}:`, error);
      throw error;
    }
  },

  // Create a new coupon
  createCoupon: async (couponData: CreateCouponDto): Promise<Coupon> => {
    try {
      const response = await apiClient.post(ENDPOINTS.COUPONS.BASE, couponData);
      // Handle the nested data structure from the API
      if (response.data && response.data.data) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error("Error creating coupon:", error);
      throw error;
    }
  },

  // Update an existing coupon
  updateCoupon: async (id: string, couponData: UpdateCouponDto): Promise<Coupon> => {
    try {
      const response = await apiClient.patch(ENDPOINTS.COUPONS.DETAIL(id), couponData);
      // Handle the nested data structure from the API
      if (response.data && response.data.data) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error(`Error updating coupon with ID ${id}:`, error);
      throw error;
    }
  },

  // Delete a coupon
  deleteCoupon: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(ENDPOINTS.COUPONS.DETAIL(id));
    } catch (error) {
      console.error(`Error deleting coupon with ID ${id}:`, error);
      throw error;
    }
  },

  // Validate a coupon
  validateCoupon: async (code: string, userId?: string): Promise<{ valid: boolean; message?: string }> => {
    try {
      const response = await apiClient.post(ENDPOINTS.COUPONS.VALIDATE, {
        code,
        userId,
      });
      return response.data;
    } catch (error) {
      console.error(`Error validating coupon with code ${code}:`, error);
      throw error;
    }
  },
}; 