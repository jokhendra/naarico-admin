import { axiosClient } from './axios-client';
import { ENDPOINTS } from './endpoints';
import { logApiError } from './error-handler';
import {
  Review,
  ReviewListParams,
  PaginatedReviewResponse,
  ReviewStats,
} from '@/types/review';

export const reviewsApi = {
  async getReviews(params: ReviewListParams = {}): Promise<PaginatedReviewResponse> {
    try {
      const response = await axiosClient.get(ENDPOINTS.REVIEWS.BASE, { params });
      const data = response.data?.data || response.data;
      const items: any[] = data?.data || data?.reviews || [];

      const reviews: Review[] = items.map((r: any) => ({
        id: r.id,
        product: r.product || null,
        user: r.user || null,
        rating: typeof r.rating === 'string' ? parseInt(r.rating, 10) : r.rating,
        title: r.title ?? null,
        comment: r.comment ?? null,
        helpfulCount: typeof r.helpfulCount === 'string' ? parseInt(r.helpfulCount, 10) : (r.helpfulCount ?? 0),
        isVerifiedPurchase: Boolean(r.isVerifiedPurchase),
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        orderId: r.orderId,
      }));

      return {
        reviews,
        total: data?.total ?? 0,
        page: data?.page ?? params.page ?? 1,
        limit: data?.limit ?? params.limit ?? 10,
        totalPages: data?.totalPages ?? 1,
      };
    } catch (error) {
      logApiError(error);
      throw error;
    }
  },

  // Seller-specific: Get reviews for seller's products only
  async getSellerReviews(params: ReviewListParams = {}): Promise<PaginatedReviewResponse> {
    try {
      const response = await axiosClient.get(ENDPOINTS.REVIEWS.SELLER_ALL, { params });
      const data = response.data?.data || response.data;
      const items: any[] = data?.data || data?.reviews || [];

      const reviews: Review[] = items.map((r: any) => ({
        id: r.id,
        product: r.product || null,
        user: r.user || null,
        rating: typeof r.rating === 'string' ? parseInt(r.rating, 10) : r.rating,
        title: r.title ?? null,
        comment: r.comment ?? null,
        helpfulCount: typeof r.helpfulCount === 'string' ? parseInt(r.helpfulCount, 10) : (r.helpfulCount ?? 0),
        isVerifiedPurchase: Boolean(r.isVerifiedPurchase),
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        orderId: r.orderId,
      }));

      return {
        reviews,
        total: data?.total ?? 0,
        page: data?.page ?? params.page ?? 1,
        limit: data?.limit ?? params.limit ?? 10,
        totalPages: data?.totalPages ?? 1,
      };
    } catch (error) {
      logApiError(error);
      throw error;
    }
  },

  // Admin-specific: Get all reviews
  async getAdminReviews(params: ReviewListParams = {}): Promise<PaginatedReviewResponse> {
    try {
      const response = await axiosClient.get(ENDPOINTS.REVIEWS.ADMIN_ALL, { params });
      const data = response.data?.data || response.data;
      const items: any[] = data?.data || data?.reviews || [];

      const reviews: Review[] = items.map((r: any) => ({
        id: r.id,
        product: r.product || null,
        user: r.user || null,
        rating: typeof r.rating === 'string' ? parseInt(r.rating, 10) : r.rating,
        title: r.title ?? null,
        comment: r.comment ?? null,
        helpfulCount: typeof r.helpfulCount === 'string' ? parseInt(r.helpfulCount, 10) : (r.helpfulCount ?? 0),
        isVerifiedPurchase: Boolean(r.isVerifiedPurchase),
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        orderId: r.orderId,
      }));

      return {
        reviews,
        total: data?.total ?? 0,
        page: data?.page ?? params.page ?? 1,
        limit: data?.limit ?? params.limit ?? 10,
        totalPages: data?.totalPages ?? 1,
      };
    } catch (error) {
      logApiError(error);
      throw error;
    }
  },

  async getReviewStats(params: Partial<Pick<ReviewListParams, 'productId' | 'userId'>> = {}): Promise<ReviewStats> {
    try {
      const response = await axiosClient.get(ENDPOINTS.REVIEWS.STATS, { params });
      const data = response.data?.data || response.data || {};
      return {
        total: data.total ?? 0,
        averageRating: data.averageRating ?? 0,
        pending: data.pending ?? 0,
        reported: data.reported ?? 0,
      };
    } catch (error) {
      logApiError(error);
      return { total: 0, averageRating: 0, pending: 0, reported: 0 };
    }
  },
};


