import { useCallback } from 'react';
import { api } from '@/lib/api';
import { Review, ReputationScore } from '@/models/types';

export const useReviews = () => {
  const createReview = useCallback(async (bookingId: string, rating: number, comment?: string) => {
    return api.post<Review>('/reviews', {
      booking_id: bookingId,
      rating,
      comment,
    }, { auth: true });
  }, []);

  const getProviderReviews = useCallback(async (providerId: string) => {
    return api.get<Review[]>(`/reviews/provider/${providerId}`);
  }, []);

  const getProviderReputation = useCallback(async (providerId: string) => {
    return api.get<ReputationScore>(`/reviews/reputation/${providerId}`);
  }, []);

  return {
    createReview,
    getProviderReviews,
    getProviderReputation,
  };
};

