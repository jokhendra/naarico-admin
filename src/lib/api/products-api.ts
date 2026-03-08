import { axiosClient } from './axios-client';
import { ENDPOINTS } from './endpoints';
import { logApiError } from './error-handler';

// Types
export interface Dimensions {
  length: number;
  width: number;
  height: number;
  unit?: string;
}

export interface ProductImage {
  id?: string;
  imageUrl: string;
  altText?: string;
  position: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductVariant {
  id?: string;
  variantName: string;
  sku: string;
  price: number;
  stockQuantity: number;
  additionalPrice?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Brand {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  logo?: string;
  createdAt?: string;
  updatedAt?: string;
  productCount?: number;
}

export interface Category {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  icon?: string;
  parentId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Review {
  id: string;
  rating: number;
  comment: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  name: string;
  createdAt?: string;
}

export interface Deal {
  id: string;
  dealType: string;
  discount: number;
  startTime: string;
  endTime: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  price: number;
  discountPrice?: number;
  currency?: string;
  stockQuantity: number;
  sku: string;
  barcode?: string | number;
  weight?: number;
  dimensions?: Dimensions;
  isActive: boolean;
  isFeatured: boolean;
  visibility: 'PUBLIC' | 'PRIVATE' | 'HIDDEN';
  averageRating?: number;
  reviewCount?: number;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  createdAt: string;
  updatedAt: string;
  brand?: Brand;
  category?: Category;
  subCategory?: Category;
  images?: ProductImage[];
  variants?: ProductVariant[];
  reviews?: Review[];
  tags?: Tag[];
  deals?: Deal[];
}

export interface CreateProductImageDto {
  imageUrl: string;
  altText?: string;
  position: number;
}

export interface CreateProductVariantDto {
  variantName: string;
  sku: string;
  price: number;
  additionalPrice?: number;
  stockQuantity: number;
  threshold?: number;
}

export interface CreateProductDto {
  title: string;
  description?: string;
  shortDescription?: string;
  price: number;
  discountPrice?: number;
  currency?: string;
  stockQuantity?: number;
  sku: string;
  barcode?: string;
  weight?: number;
  dimensions?: Dimensions;
  isActive?: boolean;
  isFeatured?: boolean;
  visibility?: 'PUBLIC' | 'PRIVATE' | 'HIDDEN';
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  sellerId?: string; // Admin can specify seller (optional for sellers - auto-assigned by backend)
  storeId: string; // Required for multi-tenancy
  brandId?: string;
  categoryId?: string;
  subCategoryId?: string;
  tagIds?: string[];
  images?: CreateProductImageDto[];
  variants?: CreateProductVariantDto[];
}

export interface UpdateProductDto extends Partial<CreateProductDto> {}

export interface ProductListParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
  isFeatured?: boolean;
}

export interface ProductListResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateProductDealDto {
  dealType: 'FLASH' | 'TRENDING' | 'DEAL_OF_DAY';
  discount: number;
  startTime: string;
  endTime: string;
}

// Products API service
export const productsApi = {
  // Get all products with optional filtering
  getProducts: async (params?: ProductListParams): Promise<ProductListResponse> => {
    try {
      const response = await axiosClient.get(ENDPOINTS.PRODUCTS.BASE, { params });
      
      // Extract data from the nested response structure
      if (response.data && response.data.data) {
        // API returns nested data structure: { data: { data: [...products], total, page, etc. } }
        const apiResponse = response.data.data;
        
        // Process products to ensure numeric types
        const processedProducts = (apiResponse.data || []).map((product: any) => ({
          ...product,
          // Convert string prices to numbers
          price: typeof product.price === 'string' ? parseFloat(product.price) : product.price,
          discountPrice: product.discountPrice ? 
            (typeof product.discountPrice === 'string' ? parseFloat(product.discountPrice) : product.discountPrice) 
            : null,
          // Ensure stockQuantity is a number
          stockQuantity: typeof product.stockQuantity === 'string' ? 
            parseInt(product.stockQuantity, 10) : product.stockQuantity
        }));
        
        // Return in the format expected by the frontend
        return {
          products: processedProducts,
          total: apiResponse.total || 0,
          page: apiResponse.page || 1,
          limit: apiResponse.limit || 10,
          totalPages: apiResponse.totalPages || 1
        };
      }
      
      // Fallback if response format is different
      return response.data;
    } catch (error) {
      logApiError(error);
      throw error;
    }
  },

  // Get product by ID
  getProductById: async (id: string): Promise<Product> => {
    try {
      const response = await axiosClient.get(ENDPOINTS.PRODUCTS.DETAIL(id));
      
      // Handle nested response structure
      let productData: any;
      if (response.data && response.data.data) {
        productData = response.data.data;
      } else {
        productData = response.data;
      }
      
      // Convert string numeric values to actual numbers
      if (productData) {
        // Convert price fields to numbers
        productData.price = typeof productData.price === 'string' ? 
          parseFloat(productData.price) : productData.price;
          
        if (productData.discountPrice) {
          productData.discountPrice = typeof productData.discountPrice === 'string' ? 
            parseFloat(productData.discountPrice) : productData.discountPrice;
        }
        
        // Ensure stockQuantity is a number
        productData.stockQuantity = typeof productData.stockQuantity === 'string' ? 
          parseInt(productData.stockQuantity, 10) : productData.stockQuantity;
      }
      
      return productData;
    } catch (error) {
      logApiError(error);
      throw error;
    }
  },

  // Create a new product
  createProduct: async (productData: CreateProductDto): Promise<Product> => {
    try {
      console.log('Creating product with data:', productData);
      const response = await axiosClient.post(ENDPOINTS.PRODUCTS.BASE, productData);
      console.log('Create product response:', response.data);
      
      // Handle nested response structure
      if (response.data && response.data.data) {
        return response.data.data;
      }
      
      return response.data;
    } catch (error) {
      console.error('Error creating product:', error);
      logApiError(error);
      throw error;
    }
  },

  // Update a product
  updateProduct: async (id: string, productData: UpdateProductDto): Promise<Product> => {
    try {
      const response = await axiosClient.patch(ENDPOINTS.PRODUCTS.DETAIL(id), productData);
      
      // Handle nested response structure
      if (response.data && response.data.data) {
        return response.data.data;
      }
      
      return response.data;
    } catch (error) {
      logApiError(error);
      throw error;
    }
  },

  // Delete a product
  deleteProduct: async (id: string): Promise<{ success: boolean }> => {
    try {
      const response = await axiosClient.delete(ENDPOINTS.PRODUCTS.DETAIL(id));
      
      // Handle nested response structure
      if (response.data && response.data.data) {
        return { 
          success: true,
          ...response.data.data 
        };
      }
      
      return response.data;
    } catch (error) {
      logApiError(error);
      throw error;
    }
  },

  // Product variants
  createVariant: async (productId: string, variantData: CreateProductVariantDto[]): Promise<ProductVariant> => {
    try {
      const response = await axiosClient.post(ENDPOINTS.PRODUCTS.VARIANTS(productId), variantData);
      
      // Handle nested response structure
      if (response.data && response.data.data) {
        return response.data.data;
      }
      
      return response.data;
    } catch (error) {
      logApiError(error);
      throw error;
    }
  },

  updateVariant: async (productId: string, variantId: string, variantData: Partial<CreateProductVariantDto>): Promise<ProductVariant> => {
    try {
      const response = await axiosClient.put(ENDPOINTS.PRODUCTS.VARIANT_DETAIL(productId, variantId), variantData);
      
      // Handle nested response structure
      if (response.data && response.data.data) {
        return response.data.data;
      }
      
      return response.data;
    } catch (error) {
      logApiError(error);
      throw error;
    }
  },

  deleteVariant: async (productId: string, variantId: string): Promise<{ success: boolean }> => {
    try {
      const response = await axiosClient.delete(ENDPOINTS.PRODUCTS.VARIANT_DETAIL(productId, variantId));
      
      // Handle nested response structure
      if (response.data && response.data.data) {
        return {
          success: true,
          ...response.data.data
        };
      }
      
      return response.data;
    } catch (error) {
      logApiError(error);
      throw error;
    }
  },

  // Product images
  addProductImage: async (productId: string, imageData: CreateProductImageDto): Promise<ProductImage> => {
    try {
      const response = await axiosClient.post(ENDPOINTS.PRODUCTS.IMAGES(productId), imageData);
      
      // Handle nested response structure
      if (response.data && response.data.data) {
        return response.data.data;
      }
      
      return response.data;
    } catch (error) {
      logApiError(error);
      throw error;
    }
  },

  deleteProductImage: async (productId: string, imageId: string): Promise<{ success: boolean }> => {
    try {
      const response = await axiosClient.delete(`${ENDPOINTS.PRODUCTS.IMAGES(productId)}/${imageId}`);
      
      // Handle nested response structure
      if (response.data && response.data.data) {
        return {
          success: true,
          ...response.data.data
        };
      }
      
      return response.data;
    } catch (error) {
      logApiError(error);
      throw error;
    }
  },

  // Update product tags
  updateProductTags: async (id: string, tagIds: string[]): Promise<Product> => {
    try {
      const response = await axiosClient.put(ENDPOINTS.PRODUCTS.TAGS(id), { tagIds });
      
      // Handle nested response structure
      if (response.data && response.data.data) {
        return response.data.data;
      }
      
      return response.data;
    } catch (error) {
      logApiError(error);
      throw error;
    }
  },

  // Product deals
  addDeal: async (productId: string, dealData: CreateProductDealDto): Promise<Product> => {
    try {
      const response = await axiosClient.post(ENDPOINTS.PRODUCTS.DEALS(productId), dealData);
      
      // Handle nested response structure
      if (response.data && response.data.data) {
        return response.data.data;
      }
      
      return response.data;
    } catch (error) {
      logApiError(error);
      throw error;
    }
  },

  removeDeal: async (productId: string, dealId: string): Promise<Product> => {
    try {
      const response = await axiosClient.delete(ENDPOINTS.PRODUCTS.DEAL_DETAIL(productId, dealId));
      
      // Handle nested response structure
      if (response.data && response.data.data) {
        return response.data.data;
      }
      
      return response.data;
    } catch (error) {
      logApiError(error);
      throw error;
    }
  },

  // Search products
  searchProducts: async (searchTerm: string = '', limit: number = 10): Promise<Product[]> => {
    try {
      const params: ProductListParams = {
        search: searchTerm,
        limit: limit,
        page: 1
      };
      
      const response = await productsApi.getProducts(params);
      return response.products;
    } catch (error) {
      logApiError(error);
      return [];
    }
  }
}; 