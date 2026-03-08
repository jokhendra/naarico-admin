// Define inventory-related types for the application

export interface InventoryItem {
  id: string;
  productId: string;
  variantId: string | null;
  stockQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  threshold: number;
  lastRestockedAt: string | null;
  createdAt: string;
  updatedAt: string;
  isLowStock: boolean;
  title?: string;
  sku?: string;
  product?: {
    title: string;
    sku: string;
  };
  variant?: {
    variantName: string;
    sku: string;
  };
}

export interface InventoryLog {
  id: string;
  productId: string;
  variantId: string | null;
  changeType: 'RESTOCK' | 'SALE' | 'RETURN' | 'MANUAL';
  quantityChanged: number;
  note: string | null;
  createdAt: string;
  title?: string;
  sku?: string;
  product?: {
    title: string;
    sku: string;
  };
  variant?: {
    variantName: string;
    sku: string;
  };
}

export interface UpdateInventoryDto {
  stockQuantity?: number;
  reservedQuantity?: number;
  threshold?: number;
}

export interface CreateInventoryLogDto {
  productId: string;
  variantId?: string;
  changeType: 'RESTOCK' | 'SALE' | 'RETURN' | 'MANUAL';
  quantityChanged: number;
  note?: string;
}

export interface RestockDto {
  quantity: number;
  note?: string;
}

export interface AddStockDto {
  productId: string;
  variantId?: string;
  quantity: number;
  note?: string;
  threshold?: number;
}

export interface InventoryServiceResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

export type InventoryStatus = 'In Stock' | 'Low Stock' | 'Out of Stock';

export interface InventoryStats {
  total: number;
  lowStock: number;
  outOfStock: number;
  reserved: number;
}

export interface Product {
  id: string;
  title: string;
  sku?: string;
  stockQuantity?: number;
} 