import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useBusiness } from '../context/BusinessContext';

const IS_DEMO =
  !import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co';

export interface MonthlyPoint {
  month: string;
  rating: number;
  reviews: number;
  response_rate: number;
}

export interface RatingDist {
  rating: string;
  count: number;
  pct: number;
}

export interface PlatformStat {
  name: string;
  icon: string;
  reviews: number;
  positive: number;
  color: string;
}

export interface TopicStat {
  topic: string;
  count: number;
  positive: boolean;
}

export interface AnalyticsData {
  monthlyTrend: MonthlyPoint[];
  ratingDist: RatingDist[];
  platformData: PlatformStat[];
  topics: TopicStat[];
  loading: boolean;
}

// ── Static mock ────────────────────────────────────────────────────────────────

const MOCK_MONTHLY: MonthlyPoint[] = [
  { month: 'יול', rating: 4.3, reviews: 124, response_rate: 72 },
  { month: 'אוג', rating: 4.5, reviews: 148, response_rate: 78 },
  { month: 'ספט', rating: 4.4, reviews: 163, response_rate: 81 },
  { month: 'אוק', rating: 4.6, reviews: 201, response_rate: 85 },
  { month: 'נוב', rating: 4.7, reviews: 219, response_rate: 88 },
  { month: 'דצמ', rating: 4.8, reviews: 247, response_rate: 92 },
];

const MOCK_RATING_DIST: RatingDist[] = [
  { rating: '5 ★', count: 203, pct: 82 },
  { rating: '4 ★', count: 30,  pct: 12 },
  { rating: '3 ★', count: 7,   pct: 3  },
  { rating: '2 ★', count: 5,   pct: 2  },
  { rating: '1 ★', count: 2,   pct: 1  },
];

const MOCK_PLATFORMS: PlatformStat[] = [
  { name: 'Google',      icon: 'language',        reviews: 142, positive: 89, color: '#4285F4' },
  { name: 'Facebook',    icon: 'groups',           reviews: 67,  positive: 82, color: '#1877F2' },
  { name: 'TripAdvisor', icon: 'flight',           reviews: 28,  positive: 91, color: '#34E0A1' },
  { name: 'Wolt',        icon: 'delivery_dining',  reviews: 10,  positive: 70, color: '#FF6B35' },
];

const MOCK_TOPICS: TopicStat[] = [
  { topic: 'שירות לקוחות', count: 97, positive: true  },
  { topic: 'זמני המתנה',   count: 64, positive: false },
  { topic: 'איכות המוצר',  count: 81, positive: true  },
  { topic: 'מחיר',          count: 43, positive: false },
  { topic: 'אווירה',        count: 58, positive: true  },
  { topic: 'ניקיון',        count: 29, positive: true  },
];

const PLATFORM_META: Record<string, { icon: string; color: string }> = {
  google:      { icon: 'language',       color: '#4285F4' },
  facebook:    { icon: 'groups',         color: '#1877F2' },
  tripadvisor: { icon: 'flight',         color: '#34E0A1' },
  wolt:        { icon: 'delivery_dining',color: '#FF6B35' },
  other:       { icon: 'star',           color: '#871dd3' },
};

const HE_MONTHS = ['ינו','פבר','מרץ','אפר','מאי','יוני','יול','אוג','ספט','אוק','נוב','דצמ'];

export function useAnalytics(): AnalyticsData {
  const { business } = useBusiness();
  const [monthlyTrend, setMonthlyTrend]   = useState<MonthlyPoint[]>(MOCK_MONTHLY);
  const [ratingDist, setRatingDist]       = useState<RatingDist[]>(MOCK_RATING_DIST);
  const [platformData, setPlatformData]   = useState<PlatformStat[]>(MOCK_PLATFORMS);
  const [topics]                          = useState<TopicStat[]>(MOCK_TOPICS);
  const [loading, setLoading]             = useState(true);

  useEffect(() => {
    if (IS_DEMO || !business) { setLoading(false); return; }

    const run = async () => {
      setLoading(true);
      try {
        // ── Monthly trend (last 6 months) ──────────────────────────────────────
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const { data: reviews } = await supabase
          .from('reviews')
          .select('rating, sentiment, status, replied_at, created_at, platform')
          .eq('business_id', business.id)
          .gte('created_at', sixMonthsAgo.toISOString());

        if (reviews?.length) {
          // Group by month
          const byMonth: Record<string, { ratings: number[]; total: number; replied: number }> = {};
          reviews.forEach((r) => {
            const d = new Date(r.created_at);
            const key = `${d.getFullYear()}-${d.getMonth()}`;
            if (!byMonth[key]) byMonth[key] = { ratings: [], total: 0, replied: 0 };
            byMonth[key].ratings.push(r.rating);
            byMonth[key].total++;
            if (r.status === 'replied') byMonth[key].replied++;
          });

          const trend = Object.entries(byMonth)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, val]) => {
              const [, monthIdx] = key.split('-').map(Number);
              const avg = val.ratings.reduce((s, v) => s + v, 0) / val.ratings.length;
              return {
                month: HE_MONTHS[monthIdx],
                rating: Math.round(avg * 10) / 10,
                reviews: val.total,
                response_rate: Math.round((val.replied / val.total) * 100),
              };
            });
          setMonthlyTrend(trend);

          // Rating distribution
          const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
          reviews.forEach((r) => { dist[r.rating] = (dist[r.rating] ?? 0) + 1; });
          const total = reviews.length;
          setRatingDist(
            [5, 4, 3, 2, 1].map((stars) => ({
              rating: `${stars} ★`,
              count: dist[stars] ?? 0,
              pct: total > 0 ? Math.round(((dist[stars] ?? 0) / total) * 100) : 0,
            })),
          );

          // Platform breakdown
          const byPlatform: Record<string, { total: number; positive: number }> = {};
          reviews.forEach((r) => {
            const p = r.platform ?? 'other';
            if (!byPlatform[p]) byPlatform[p] = { total: 0, positive: 0 };
            byPlatform[p].total++;
            if (['positive', 'very_positive'].includes(r.sentiment ?? ''))
              byPlatform[p].positive++;
          });

          setPlatformData(
            Object.entries(byPlatform).map(([platform, val]) => ({
              name: platform.charAt(0).toUpperCase() + platform.slice(1),
              icon: PLATFORM_META[platform]?.icon ?? 'star',
              color: PLATFORM_META[platform]?.color ?? '#871dd3',
              reviews: val.total,
              positive:
                val.total > 0
                  ? Math.round((val.positive / val.total) * 100)
                  : 0,
            })),
          );
        }
      } catch {
        // silently keep mock data
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [business?.id]);

  return { monthlyTrend, ratingDist, platformData, topics, loading };
}
