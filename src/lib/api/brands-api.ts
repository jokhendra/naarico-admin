import { axiosClient } from './axios-client';
import { ENDPOINTS } from './endpoints';
import { logApiError } from './error-handler';

// Types
export interface Brand {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  website: string | null;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
  productCount?: number;
}

export interface CreateBrandDto {
  name: string;
  description?: string;
  logo?: string;
  website?: string;
  isFeatured?: boolean;
}

export interface BrandsResponse {
  brands: Brand[];
  total: number;
}

// Brands API service
export const brandsApi = {
  // Get all brands
  getBrands: async (): Promise<Brand[]> => {
    try {
      console.log('Fetching brands from:', ENDPOINTS.BRANDS.BASE);
      const response = await axiosClient.get(ENDPOINTS.BRANDS.BASE, {
        params: { includeProductCount: true } 
      });
      
      console.log('Brands API raw response:', response);
      console.log('Brands API response data type:', typeof response.data);
      console.log('Brands API response data:', response.data);
      
      // Handle different response structures
      if (Array.isArray(response.data)) {
        console.log('Response is an array with', response.data.length, 'items');
        return response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        // Some APIs wrap the data in a 'data' property
        console.log('Response has a data property with', response.data.data.length, 'items');
        return response.data.data;
      } else {
        console.error('Unexpected API response format:', response.data);
        return [];
      }
    } catch (error) {
      console.error('Error in getBrands:', error);
      logApiError(error);
      throw error;
    }
  },

  // Get brand by ID
  getBrandById: async (id: string): Promise<Brand> => {
    try {
      const response = await axiosClient.get(ENDPOINTS.BRANDS.DETAIL(id), {
        params: { includeProductCount: true }
      });
      
      // Handle potential data wrapper
      return response.data.data || response.data;
    } catch (error) {
      logApiError(error);
      throw error;
    }
  },

  // Create a new brand
  createBrand: async (brandData: CreateBrandDto): Promise<Brand> => {
    try {
      console.log('Creating brand with data:', brandData);
      const response = await axiosClient.post(ENDPOINTS.BRANDS.BASE, brandData);
      console.log('Create brand response:', response.data);
      
      // Handle potential data wrapper
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error creating brand:', error);
      logApiError(error);
      throw error;
    }
  },

  // Update brand
  updateBrand: async (id: string, brandData: Partial<CreateBrandDto>): Promise<Brand> => {
    try {
      const response = await axiosClient.put(ENDPOINTS.BRANDS.DETAIL(id), brandData);
      
      // Handle potential data wrapper
      return response.data.data || response.data;
    } catch (error) {
      logApiError(error);
      throw error;
    }
  },

  // Delete brand
  deleteBrand: async (id: string): Promise<{ id: string; deleted: boolean; message: string }> => {
    try {
      const response = await axiosClient.delete(ENDPOINTS.BRANDS.DETAIL(id));
      
      // Handle potential data wrapper
      return response.data.data || response.data;
    } catch (error) {
      logApiError(error);
      throw error;
    }
  }
}; 