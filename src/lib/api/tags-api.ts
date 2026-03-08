import { axiosClient } from './axios-client';
import { ENDPOINTS } from './endpoints';
import { logApiError } from './error-handler';

// Types
export interface Tag {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  productCount?: number;
}

export interface CreateTagDto {
  name: string;
}

export interface TagsResponse {
  tags: Tag[];
  total: number;
}

// Tags API service
export const tagsApi = {
  // Get all tags
  getTags: async (): Promise<Tag[]> => {
    try {
      console.log('Fetching tags from:', ENDPOINTS.TAGS.BASE);
      const response = await axiosClient.get(ENDPOINTS.TAGS.BASE);
      
      console.log('Tags API raw response:', response);
      
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
      console.error('Error in getTags:', error);
      logApiError(error);
      throw error;
    }
  },

  // Get tag by ID
  getTagById: async (id: string): Promise<Tag> => {
    try {
      const response = await axiosClient.get(ENDPOINTS.TAGS.DETAIL(id));
      
      // Handle potential data wrapper
      return response.data.data || response.data;
    } catch (error) {
      logApiError(error);
      throw error;
    }
  },

  // Create a new tag
  createTag: async (tagData: CreateTagDto): Promise<Tag> => {
    try {
      console.log('Creating tag with data:', tagData);
      const response = await axiosClient.post(ENDPOINTS.TAGS.BASE, tagData);
      console.log('Create tag response:', response.data);
      
      // Handle potential data wrapper
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error creating tag:', error);
      logApiError(error);
      throw error;
    }
  },

  // Update tag
  updateTag: async (id: string, tagData: Partial<CreateTagDto>): Promise<Tag> => {
    try {
      const response = await axiosClient.put(ENDPOINTS.TAGS.DETAIL(id), tagData);
      
      // Handle potential data wrapper
      return response.data.data || response.data;
    } catch (error) {
      logApiError(error);
      throw error;
    }
  },

  // Delete tag
  deleteTag: async (id: string): Promise<{ id: string; deleted: boolean; message: string }> => {
    try {
      const response = await axiosClient.delete(ENDPOINTS.TAGS.DETAIL(id));
      
      // Handle potential data wrapper
      return response.data.data || response.data;
    } catch (error) {
      logApiError(error);
      throw error;
    }
  }
}; 