import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { MOCK_REVIEWS } from '../lib/mockData';
import { useBusiness } from '../context/business-context';
import type { Review, Platform, Sentiment, ReviewStatus } from '../types';

const IS_DEMO =
  !import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co';

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

function applyFilters(data: Review[], filters?: Partial<ReviewFilters>): Review[] {
  let out = data;
  if (filters?.platform && filters.platform !== 'all')
    out = out.filter((r) => r.platform === filters.platform);
  if (filters?.sentiment && filters.sentiment !== 'all')
    out = out.filter((r) => r.sentiment === filters.sentiment);
  if (filters?.status && filters.status !== 'all')
    out = out.filter((r) => r.status === filters.status);
  if (filters?.search)
    out = out.filter(
      (r) =>
        r.reviewer_name.includes(filters.search!) ||
        r.content.includes(filters.search!),
    );
  return out;
}

export function useReviews(filters?: Partial<ReviewFilters>): UseReviewsResult {
  const { business } = useBusiness();
  const [tick, setTick] = useState(0);
  const [fetched, setFetched] = useState<{ key: string; reviews: Review[]; error: string | null } | null>(null);
  // Local optimistic updates (e.g. marking a review as replied), applied on top of the data
  const [patches, setPatches] = useState<Record<string, Partial<Review>>>({});

  const demo = IS_DEMO || !business;
  // Everything the fetch needs is encoded in the key, so the effect depends only on it
  const fetchKey = demo
    ? null
    : JSON.stringify({
        businessId: business.id,
        tick,
        platform: filters?.platform ?? 'all',
        sentiment: filters?.sentiment ?? 'all',
        status: filters?.status ?? 'all',
        search: filters?.search ?? '',
      });

  useEffect(() => {
    if (!fetchKey) return;
    const { businessId, platform, sentiment, status, search } = JSON.parse(fetchKey);
    let cancelled = false;

    (async () => {
      try {
        let query = supabase
          .from('reviews')
          .select('*')
          .eq('business_id', businessId)
          .order('created_at', { ascending: false });

        if (platform !== 'all') query = query.eq('platform', platform);
        if (sentiment !== 'all') query = query.eq('sentiment', sentiment);
        if (status !== 'all') query = query.eq('status', status);
        if (search)
          query = query.or(
            `reviewer_name.ilike.%${search}%,content.ilike.%${search}%`,
          );

        const { data, error: err } = await query;
        if (err) throw err;
        if (!cancelled) setFetched({ key: fetchKey, reviews: (data ?? []) as Review[], error: null });
      } catch (e) {
        if (!cancelled) setFetched({ key: fetchKey, reviews: MOCK_REVIEWS, error: (e as Error).message }); // fallback
      }
    })();

    return () => { cancelled = true; };
  }, [fetchKey]);

  const base = demo
    ? applyFilters(MOCK_REVIEWS, filters)
    : fetched?.key === fetchKey
      ? fetched.reviews
      : [];

  const reviews = base.map((r) => (patches[r.id] ? { ...r, ...patches[r.id] } : r));
  const loading = fetchKey != null && fetched?.key !== fetchKey;
  const error = !demo && fetched?.key === fetchKey ? fetched.error : null;

  const updateReview = (id: string, patch: Partial<Review>) => {
    setPatches((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  };

  return { reviews, loading, error, refetch: () => setTick((t) => t + 1), updateReview };
}
