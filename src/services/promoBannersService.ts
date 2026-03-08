import { promoBannersApi, PromoBannerDto, CreatePromoBannerPayload, BannerPlacement, BannerDevice } from '@/lib/api/promo-banners-api';

export interface ServiceResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

class PromoBannersService {
  async list(params: { placement?: BannerPlacement; device?: BannerDevice; isActive?: 'true' | 'false' | 'all' } = {}): Promise<ServiceResponse<PromoBannerDto[]>> {
    try {
      const data = await promoBannersApi.list(params);
      return { success: true, data };
    } catch (e: any) {
      return { success: false, data: [], error: e?.message || 'Failed to load promo banners' };
    }
  }

  async create(payload: CreatePromoBannerPayload): Promise<ServiceResponse<PromoBannerDto>> {
    try {
      const data = await promoBannersApi.create(payload);
      return { success: true, data };
    } catch (e: any) {
      return { success: false, data: {} as PromoBannerDto, error: e?.message || 'Failed to create banner' };
    }
  }

  async update(id: string, payload: Partial<CreatePromoBannerPayload>): Promise<ServiceResponse<PromoBannerDto>> {
    try {
      const data = await promoBannersApi.update(id, payload);
      return { success: true, data };
    } catch (e: any) {
      return { success: false, data: {} as PromoBannerDto, error: e?.message || 'Failed to update banner' };
    }
  }

  async remove(id: string): Promise<ServiceResponse<{ id: string }>> {
    try {
      const data = await promoBannersApi.remove(id);
      return { success: true, data };
    } catch (e: any) {
      return { success: false, data: { id }, error: e?.message || 'Failed to delete banner' };
    }
  }
}

export const promoBannersService = new PromoBannersService();


