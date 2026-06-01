import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { MOCK_REVIEWS } from '../lib/mockData';
import { useBusiness } from '../context/BusinessContext';
import type { Review, Platform, Sentiment, ReviewStatus } from '../types';

export interface ReviewFilters {
  platform: Platform | 'all';
  sentiment: Sentiment | 'all';
  status: ReviewStatus | 'all';
  search: string;
}

export interface UseReviewsResult {
  reviews: Review[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  updateReview: (id: string, patch: Partial<Review>) => void;
}

export function useReviews(filters?: Partial<ReviewFilters>): UseReviewsResult {
  const { business, isDemo } = { ...useBusiness(), isDemo: !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co' };
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (isDemo || !business) {
      // Demo mode — use mock data
      let data = [...MOCK_REVIEWS];
      if (filters?.platform && filters.platform !== 'all')
        data = data.filter((r) => r.platform === filters.platform);
      if (filters?.sentiment && filters.sentiment !== 'all')
        data = data.filter((r) => r.sentiment === filters.sentiment);
      if (filters?.status && filters.status !== 'all')
        data = data.filter((r) => r.status === filters.status);
      if (filters?.search)
        data = data.filter(
          (r) =>
            r.reviewer_name.includes(filters.search!) ||
            r.content.includes(filters.search!),
        );
      setReviews(data);
      setLoading(false);
      return;
    }

    try {
      let query = supabase
        .from('reviews')
        .select('*')
        .eq('business_id', business.id)
        .order('created_at', { ascending: false });

      if (filters?.platform && filters.platform !== 'all')
        query = query.eq('platform', filters.platform);
      if (filters?.sentiment && filters.sentiment !== 'all')
        query = query.eq('sentiment', filters.sentiment);
      if (filters?.status && filters.status !== 'all')
        query = query.eq('status', filters.status);
      if (filters?.search)
        query = query.or(
          `reviewer_name.ilike.%${filters.search}%,content.ilike.%${filters.search}%`,
        );

      const { data, error: err } = await query;
      if (err) throw err;
      setReviews((data ?? []) as Review[]);
    } catch (e) {
      setError((e as Error).message);
      setReviews(MOCK_REVIEWS); // fallback
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [business?.id, isDemo, tick,
    filters?.platform, filters?.sentiment, filters?.status, filters?.search]);

  useEffect(() => { fetch(); }, [fetch]);

  const updateReview = (id: string, patch: Partial<Review>) => {
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    );
  };

  return { reviews, loading, error, refetch: () => setTick((t) => t + 1), updateReview };
}
