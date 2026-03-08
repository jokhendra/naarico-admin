export interface Store {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  sellerId: string;
  status: StoreStatus;
  isOnVacation: boolean;
  vacationMessage?: string;
  commissionRate: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  seller?: SellerInfo;
  _count?: {
    products: number;
    orders: number;
  };
}

export type StoreStatus = 'PENDING' | 'APPROVED' | 'SUSPENDED' | 'CLOSED';

export interface SellerInfo {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

export interface CreateStoreFormData {
  name: string;
  description?: string;
  logo?: string;
}

export interface UpdateStoreFormData {
  name?: string;
  description?: string;
  logo?: string;
}

export interface UpdateStoreStatusDto {
  status: StoreStatus;
}

export interface ToggleVacationDto {
  isOnVacation: boolean;
  vacationMessage?: string;
}

