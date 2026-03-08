import { axiosClient as apiClient } from "./axios-client";
import { Product } from "./products-api";

export interface Deal {
  id: string;
  name: string;
  dealType: "FLASH" | "TRENDING" | "DEAL_OF_DAY";
  discount: number;
  startTime: string;
  endTime: string;
  status: "Active" | "Upcoming" | "Ended";
  productsCount: number;
}

export interface DealListResponse {
  deals: Deal[];
  total: number;
  totalPages: number;
}

export interface DealProductsResponse {
  products: Product[];
  total: number;
  totalPages: number;
}

export interface DealListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: "Active" | "Upcoming" | "Ended";
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface CreateDealDto {
  name: string;
  dealType: "FLASH" | "TRENDING" | "DEAL_OF_DAY";
  discount: number;
  startTime: string;
  endTime: string;
}

export interface UpdateDealDto extends Partial<CreateDealDto> {}

export const dealsApi = {
  // Get all deals with pagination and filters
  getDeals: async (params: DealListParams = {}): Promise<DealListResponse> => {
    try {
      const response = await apiClient.get("/deals", { params });
      // Handle the nested data structure from the API
      if (response.data && response.data.data) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error("Error fetching deals:", error);
      throw error;
    }
  },

  // Get deal by ID
  getDealById: async (id: string): Promise<Deal> => {
    try {
      const response = await apiClient.get(`/deals/${id}`);
      // Handle the nested data structure from the API
      if (response.data && response.data.data) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error(`Error fetching deal with ID ${id}:`, error);
      throw error;
    }
  },

  // Create a new deal
  createDeal: async (dealData: CreateDealDto): Promise<Deal> => {
    try {
      const response = await apiClient.post("/deals", dealData);
      // Handle the nested data structure from the API
      if (response.data && response.data.data) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error("Error creating deal:", error);
      throw error;
    }
  },

  // Update an existing deal
  updateDeal: async (id: string, dealData: UpdateDealDto): Promise<Deal> => {
    try {
      const response = await apiClient.patch(`/deals/${id}`, dealData);
      // Handle the nested data structure from the API
      if (response.data && response.data.data) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error(`Error updating deal with ID ${id}:`, error);
      throw error;
    }
  },

  // Delete a deal
  deleteDeal: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/deals/${id}`);
    } catch (error) {
      console.error(`Error deleting deal with ID ${id}:`, error);
      throw error;
    }
  },

  // Get products in a deal
  getDealProducts: async (dealId: string): Promise<DealProductsResponse> => {
    try {
      const response = await apiClient.get(`/deals/${dealId}/products`);
      // Handle the nested data structure from the API
      if (response.data && response.data.data) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error(`Error fetching products for deal ${dealId}:`, error);
      throw error;
    }
  },

  // Add product to a deal
  addProductToDeal: async (dealId: string, productId: string): Promise<void> => {
    try {
      console.log(`Calling API to add product ${productId} to deal ${dealId}`);
      const response = await apiClient.post(`/deals/${dealId}/products`, { productId });
      
      // Log success
      console.log(`Successfully added product to deal`, {
        dealId,
        productId,
        response: response.data
      });
      
      return response.data;
    } catch (error: any) {
      console.error(`Error adding product ${productId} to deal ${dealId}:`, {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        stack: error.stack?.split('\n').slice(0, 3).join('\n')
      });
      throw error;
    }
  },

  // Remove product from a deal
  removeProductFromDeal: async (dealId: string, productId: string): Promise<void> => {
    try {
      await apiClient.delete(`/deals/${dealId}/products/${productId}`);
    } catch (error) {
      console.error(`Error removing product ${productId} from deal ${dealId}:`, error);
      throw error;
    }
  },
}; 