import { axiosClient } from './axios-client';
import { ENDPOINTS } from './endpoints';
import { logApiError } from './error-handler';

// Types
export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  productCount?: number;
}

export interface CategoryDetail extends Category {
  parent?: Category;
  children?: Category[];
}

export interface CategoryTree extends Category {
  children?: CategoryTree[];
}

export interface CreateCategoryDto {
  name: string;
  description?: string;
  icon?: string;
  parentId?: string;
}

export interface CategoriesResponse {
  categories: Category[];
  total: number;
}

// Categories API service
export const categoriesApi = {
  // Get all categories
  getCategories: async (): Promise<Category[]> => {
    try {
      console.log('Fetching categories from:', ENDPOINTS.CATEGORIES.BASE);
      const response = await axiosClient.get(ENDPOINTS.CATEGORIES.BASE);
      
      console.log('Categories API raw response:', response);
      console.log('Categories API response data type:', typeof response.data);
      console.log('Categories API response data:', response.data);
      
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
      console.error('Error in getCategories:', error);
      logApiError(error);
      throw error;
    }
  },

  // Get category tree structure
  getCategoryTree: async (): Promise<CategoryTree[]> => {
    try {
      const response = await axiosClient.get(ENDPOINTS.CATEGORIES.TREE);
      
      // Handle potential data wrapper
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error in getCategoryTree:', error);
      logApiError(error);
      throw error;
    }
  },

  // Get category by ID
  getCategoryById: async (id: string): Promise<CategoryDetail> => {
    try {
      const response = await axiosClient.get(ENDPOINTS.CATEGORIES.DETAIL(id));
      
      // Handle potential data wrapper
      return response.data.data || response.data;
    } catch (error) {
      logApiError(error);
      throw error;
    }
  },

  // Create a new category
  createCategory: async (categoryData: CreateCategoryDto): Promise<Category> => {
    try {
      console.log('Creating category with data:', categoryData);
      const response = await axiosClient.post(ENDPOINTS.CATEGORIES.BASE, categoryData);
      console.log('Create category response:', response.data);
      
      // Handle potential data wrapper
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error creating category:', error);
      logApiError(error);
      throw error;
    }
  },

  // Update category
  updateCategory: async (id: string, categoryData: Partial<CreateCategoryDto>): Promise<Category> => {
    try {
      const response = await axiosClient.patch(ENDPOINTS.CATEGORIES.DETAIL(id), categoryData);
      
      // Handle potential data wrapper
      return response.data.data || response.data;
    } catch (error) {
      logApiError(error);
      throw error;
    }
  },

  // Delete category
  deleteCategory: async (id: string): Promise<{ id: string; deleted: boolean; message: string }> => {
    try {
      const response = await axiosClient.delete(ENDPOINTS.CATEGORIES.DETAIL(id));
      
      // Handle potential data wrapper
      return response.data.data || response.data;
    } catch (error) {
      logApiError(error);
      throw error;
    }
  }
}; 