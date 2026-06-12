import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { MOCK_KPI, MOCK_SENTIMENT_WEEK } from '../lib/mockData';
import { useBusiness } from '../context/business-context';
import type { KPIData, SentimentPoint } from '../types';

const IS_DEMO =
  !import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co';

export interface DashboardData {
  kpi: KPIData;
  sentiment: SentimentPoint[];
  loading: boolean;
  error: string | null;
}

interface FetchResult {
  key: string;
  kpi: KPIData | null;
  sentiment: SentimentPoint[] | null;
  error: string | null;
}

export function useDashboard(): DashboardData {
  const { business } = useBusiness();
  const fetchKey = IS_DEMO || !business ? null : business.id;
  const [real, setReal] = useState<FetchResult | null>(null);

  useEffect(() => {
    if (!fetchKey) return;
    let cancelled = false;

    (async () => {
      const result: FetchResult = { key: fetchKey, kpi: null, sentiment: null, error: null };
      try {
        // KPI summary
        const { data: kpiRow, error: kpiErr } = await supabase
          .from('kpi_summary')
          .select('*')
          .eq('business_id', fetchKey)
          .single();

        if (!kpiErr && kpiRow) {
          const totalReviews = kpiRow.total_reviews ?? 0;
          const monthlyReviews = kpiRow.monthly_reviews ?? 0;
          const monthlyGrowth =
            totalReviews > 0
              ? Math.round((monthlyReviews / totalReviews) * 100)
              : 0;

          result.kpi = {
            avg_rating: kpiRow.avg_rating ?? 0,
            rating_trend: 0, // requires historical comparison — kept at 0 for now
            monthly_growth: monthlyGrowth,
            avg_response_time_hours: 1.2, // requires replied_at − created_at calc
            positive_pct: kpiRow.positive_pct ?? 0,
            positive_count: Math.round(
              ((kpiRow.positive_pct ?? 0) / 100) * totalReviews,
            ),
            pending_count: kpiRow.pending_count ?? 0,
          };
        }

        // Sentiment over last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data: sentRows, error: sentErr } = await supabase
          .from('sentiment_by_day')
          .select('*')
          .eq('business_id', fetchKey)
          .gte('day', sevenDaysAgo.toISOString().split('T')[0])
          .order('day', { ascending: true });

        if (!sentErr && sentRows?.length) {
          const DAY_LABELS = ["א'", "ב'", "ג'", "ד'", "ה'", "ו'", "ש'"];
          result.sentiment = sentRows.map((row) => ({
            day: DAY_LABELS[new Date(row.day).getDay()] ?? row.day,
            positive: row.positive_pct ?? 0,
            critical: row.critical_pct ?? 0,
          }));
        }
      } catch (e) {
        result.error = (e as Error).message; // mock data stays as fallback
      }
      if (!cancelled) setReal(result);
    })();

    return () => { cancelled = true; };
  }, [fetchKey]);

  const ready = real !== null && real.key === fetchKey;

  return {
    kpi: ready && real.kpi ? real.kpi : MOCK_KPI,
    sentiment: ready && real.sentiment ? real.sentiment : MOCK_SENTIMENT_WEEK,
    loading: fetchKey != null && !ready,
    error: ready ? real.error : null,
  };
}
