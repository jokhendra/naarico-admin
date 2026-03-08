export interface ReviewUser {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
}

export interface ReviewProduct {
  id: string;
  title: string;
}

export interface Review {
  id: string;
  product: ReviewProduct | null;
  user: ReviewUser | null;
  rating: number;
  title?: string | null;
  comment?: string | null;
  helpfulCount: number;
  isVerifiedPurchase: boolean;
  createdAt: string;
  updatedAt: string;
  orderId?: string;
}

export interface ReviewListParams {
  page?: number;
  limit?: number;
  productId?: string;
  userId?: string;
  orderId?: string;
  minRating?: number;
  maxRating?: number;
  verifiedOnly?: boolean;
  search?: string;
  sortBy?: 'createdAt' | 'rating' | 'helpfulCount';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedReviewResponse {
  reviews: Review[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ReviewStats {
  total: number;
  averageRating: number;
  pending: number;
  reported: number;
}


