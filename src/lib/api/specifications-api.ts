import { axiosClient } from './axios-client';
import { ENDPOINTS } from './endpoints';
import { logApiError } from './error-handler';

export interface SpecificationDataType {
  STRING: 'string';
  NUMBER: 'number';
  BOOLEAN: 'boolean';
  DATE: 'date';
  ENUM: 'enum';
}

export interface SpecificationTemplate {
  id: string;
  categoryId: string;
  specKey: string;
  displayName: string;
  specGroup: string;
  sortOrder: number;
  isRequired: boolean;
  isFilterable: boolean;
  dataType: string;
  options: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSpecificationTemplateDto {
  categoryId: string;
  specKey: string;
  displayName: string;
  specGroup: string;
  sortOrder?: number;
  isRequired?: boolean;
  isFilterable?: boolean;
  dataType?: string;
  options?: Record<string, any>;
}

export interface ProductSpecification {
  id: string;
  productId: string;
  specKey: string;
  specValue: string;
  specGroup: string;
  sortOrder: number;
  isFilterable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductSpecificationDto {
  productId: string;
  specKey: string;
  specValue: string;
  specGroup: string;
  sortOrder?: number;
  isFilterable?: boolean;
}

export interface GroupedProductSpecificationsDto {
  title: string;
  specs: ProductSpecification[];
}

export const specificationsApi = {
  // Template Endpoints
  createSpecificationTemplate: async (
    data: CreateSpecificationTemplateDto
  ): Promise<SpecificationTemplate> => {
    try {
      const response = await axiosClient.post<SpecificationTemplate>(
        ENDPOINTS.SPECIFICATIONS.TEMPLATES,
        data
      );
      return response.data;
    } catch (error) {
      logApiError(error);
      throw error;
    }
  },

  getSpecificationTemplatesByCategory: async (
    categoryId: string
  ): Promise<SpecificationTemplate[]> => {
    try {
      const response = await axiosClient.get<SpecificationTemplate[]>(
        ENDPOINTS.SPECIFICATIONS.TEMPLATES_BY_CATEGORY(categoryId)
      );
      return response.data;
    } catch (error) {
      logApiError(error);
      throw error;
    }
  },

  deleteSpecificationTemplate: async (id: string): Promise<void> => {
    try {
      await axiosClient.delete(ENDPOINTS.SPECIFICATIONS.TEMPLATE_DETAIL(id));
    } catch (error) {
      logApiError(error);
      throw error;
    }
  },

  // Product Specification Endpoints
  createProductSpecification: async (
    data: CreateProductSpecificationDto
  ): Promise<ProductSpecification> => {
    try {
      const response = await axiosClient.post<ProductSpecification>(
        ENDPOINTS.SPECIFICATIONS.PRODUCT,
        data
      );
      return response.data;
    } catch (error) {
      logApiError(error);
      throw error;
    }
  },

  createProductSpecificationsBulk: async (
    specifications: CreateProductSpecificationDto[]
  ): Promise<ProductSpecification[]> => {
    try {
      const response = await axiosClient.post<ProductSpecification[]>(
        ENDPOINTS.SPECIFICATIONS.PRODUCT_BULK,
        specifications
      );
      return response.data;
    } catch (error) {
      logApiError(error);
      throw error;
    }
  },

  getProductSpecifications: async (
    productId: string
  ): Promise<ProductSpecification[]> => {
    try {
      const response = await axiosClient.get<ProductSpecification[]>(
        ENDPOINTS.SPECIFICATIONS.PRODUCT_SPECIFICATIONS(productId)
      );
      return response.data;
    } catch (error) {
      logApiError(error);
      throw error;
    }
  },

  getGroupedProductSpecifications: async (
    productId: string
  ): Promise<GroupedProductSpecificationsDto[]> => {
    try {
      const response = await axiosClient.get<GroupedProductSpecificationsDto[]>(
        ENDPOINTS.SPECIFICATIONS.PRODUCT_SPECIFICATIONS_GROUPED(productId)
      );
      return response.data;
    } catch (error) {
      logApiError(error);
      throw error;
    }
  },

  updateProductSpecification: async (
    id: string,
    data: Partial<CreateProductSpecificationDto>
  ): Promise<ProductSpecification> => {
    try {
      const response = await axiosClient.patch<ProductSpecification>(
        ENDPOINTS.SPECIFICATIONS.SPECIFICATION_DETAIL(id),
        data
      );
      return response.data;
    } catch (error) {
      logApiError(error);
      throw error;
    }
  },

  deleteProductSpecification: async (id: string): Promise<void> => {
    try {
      await axiosClient.delete(ENDPOINTS.SPECIFICATIONS.SPECIFICATION_DETAIL(id));
    } catch (error) {
      logApiError(error);
      throw error;
    }
  },

  deleteAllProductSpecifications: async (productId: string): Promise<void> => {
    try {
      await axiosClient.delete(ENDPOINTS.SPECIFICATIONS.DELETE_ALL_PRODUCT_SPECS(productId));
    } catch (error) {
      logApiError(error);
      throw error;
    }
  },
}; 