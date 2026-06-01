import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { MOCK_KPI, MOCK_SENTIMENT_WEEK } from '../lib/mockData';
import { useBusiness } from '../context/BusinessContext';
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

export function useDashboard(): DashboardData {
  const { business } = useBusiness();
  const [kpi, setKpi] = useState<KPIData>(MOCK_KPI);
  const [sentiment, setSentiment] = useState<SentimentPoint[]>(MOCK_SENTIMENT_WEEK);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (IS_DEMO || !business) {
      setKpi(MOCK_KPI);
      setSentiment(MOCK_SENTIMENT_WEEK);
      setLoading(false);
      return;
    }

    const fetchAll = async () => {
      setLoading(true);
      try {
        // KPI summary
        const { data: kpiRow, error: kpiErr } = await supabase
          .from('kpi_summary')
          .select('*')
          .eq('business_id', business.id)
          .single();

        if (!kpiErr && kpiRow) {
          const totalReviews = kpiRow.total_reviews ?? 0;
          const monthlyReviews = kpiRow.monthly_reviews ?? 0;
          const monthlyGrowth =
            totalReviews > 0
              ? Math.round((monthlyReviews / totalReviews) * 100)
              : 0;

          setKpi({
            avg_rating: kpiRow.avg_rating ?? 0,
            rating_trend: 0, // requires historical comparison — kept at 0 for now
            monthly_growth: monthlyGrowth,
            avg_response_time_hours: 1.2, // requires replied_at − created_at calc
            positive_pct: kpiRow.positive_pct ?? 0,
            positive_count: Math.round(
              ((kpiRow.positive_pct ?? 0) / 100) * totalReviews,
            ),
            pending_count: kpiRow.pending_count ?? 0,
          });
        }

        // Sentiment over last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data: sentRows, error: sentErr } = await supabase
          .from('sentiment_by_day')
          .select('*')
          .eq('business_id', business.id)
          .gte('day', sevenDaysAgo.toISOString().split('T')[0])
          .order('day', { ascending: true });

        if (!sentErr && sentRows?.length) {
          const DAY_LABELS = ["א'", "ב'", "ג'", "ד'", "ה'", "ו'", "ש'"];
          setSentiment(
            sentRows.map((row) => ({
              day: DAY_LABELS[new Date(row.day).getDay()] ?? row.day,
              positive: row.positive_pct ?? 0,
              critical: row.critical_pct ?? 0,
            })),
          );
        }
      } catch (e) {
        setError((e as Error).message);
        // keep mock data as fallback
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [business?.id]);

  return { kpi, sentiment, loading, error };
}
