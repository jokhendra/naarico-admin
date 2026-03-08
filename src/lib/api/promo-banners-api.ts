import { axiosClient } from './axios-client';
import { ENDPOINTS } from './endpoints';
import { logApiError } from './error-handler';

export type BannerPlacement =
  | 'HOME_TOP'
  | 'HOME_MIDDLE'
  | 'HOME_BOTTOM'
  | 'CATEGORY'
  | 'PRODUCT'
  | 'CHECKOUT'
  | 'GLOBAL';

export type BannerDevice = 'ALL' | 'DESKTOP' | 'MOBILE';

export interface PromoBannerDto {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  linkUrl?: string;
  ctaText?: string;
  backgroundColor?: string;
  textColor?: string;
  placement: BannerPlacement;
  device: BannerDevice;
  isActive: boolean;
  sortOrder: number;
  visibleFrom?: string | null;
  visibleTo?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PromoBannerListResponse {
  statusCode: number;
  message: string;
  data: PromoBannerDto[];
  timestamp: string;
  path: string;
}

export interface CreatePromoBannerPayload {
  title: string;
  subtitle?: string;
  imageUrl: string;
  linkUrl?: string;
  ctaText?: string;
  backgroundColor?: string;
  textColor?: string;
  placement: BannerPlacement;
  device?: BannerDevice;
  isActive?: boolean;
  sortOrder?: number;
  visibleFrom?: string;
  visibleTo?: string;
}

export const promoBannersApi = {
  async list(params: { placement?: BannerPlacement; device?: BannerDevice; isActive?: 'true' | 'false' | 'all' } = {}): Promise<PromoBannerDto[]> {
    try {
      const url = params && 'isActive' in params ? `${ENDPOINTS.PROMO_BANNERS.BASE}/admin` : ENDPOINTS.PROMO_BANNERS.BASE;
      const res = await axiosClient.get(url, { params });
      const data: PromoBannerListResponse = res.data;
      return data.data;
    } catch (error) {
      logApiError(error);
      throw error;
    }
  },

  async create(payload: CreatePromoBannerPayload): Promise<PromoBannerDto> {
    try {
      const res = await axiosClient.post(ENDPOINTS.PROMO_BANNERS.BASE, payload);
      return res.data.data;
    } catch (error) {
      logApiError(error);
      throw error;
    }
  },

  async update(id: string, payload: Partial<CreatePromoBannerPayload>): Promise<PromoBannerDto> {
    try {
      const res = await axiosClient.patch(ENDPOINTS.PROMO_BANNERS.DETAIL(id), payload);
      return res.data.data;
    } catch (error) {
      logApiError(error);
      throw error;
    }
  },

  async remove(id: string): Promise<{ id: string }> {
    try {
      const res = await axiosClient.delete(ENDPOINTS.PROMO_BANNERS.DETAIL(id));
      return res.data.data;
    } catch (error) {
      logApiError(error);
      throw error;
    }
  },
};

export default promoBannersApi;


