import { useEffect, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './auth-context';
import { BusinessContext } from './business-context';
import type { Business } from '../types';

const DEMO_BUSINESS: Business = {
  id: 'demo-business-1',
  owner_id: 'demo-user-1',
  name: 'מוסך עמי',
  category: 'שירותים',
  phone: '03-555-1234',
  website: 'https://mosek-ami.co.il',
  logo_url: '/demo-garage-logo.svg',
  description: 'מוסך מקצועי לטיפול ותיקון רכב בפתח תקווה. מעל 20 שנות ניסיון. מומחים בטיפולים שגרתיים, תיקוני מנוע, בלמים וחשמל רכב.',
  branches: [{ location: 'פתח תקווה, רחוב הרצל 12' }],
  created_at: new Date().toISOString(),
};

export function BusinessProvider({ children }: { children: ReactNode }) {
  const { user, isDemo } = useAuth();
  const [tick, setTick] = useState(0);
  const [fetched, setFetched] = useState<{ key: string; business: Business | null } | null>(null);

  const userId = user?.id ?? null;
  // null when there is nothing to fetch (demo / logged out); changes on refetch
  const fetchKey = isDemo || !userId ? null : `${userId}:${tick}`;

  useEffect(() => {
    if (!fetchKey || !userId) return;
    let cancelled = false;
    supabase
      .from('businesses')
      .select('*')
      .eq('owner_id', userId)
      .single()
      .then(({ data, error }) => {
        if (cancelled) return;
        setFetched({ key: fetchKey, business: !error && data ? (data as Business) : null });
      });
    return () => { cancelled = true; };
  }, [fetchKey, userId]);

  const business = isDemo ? DEMO_BUSINESS : userId ? (fetched?.business ?? null) : null;
  const loading = fetchKey != null && fetched?.key !== fetchKey;

  return (
    <BusinessContext.Provider
      value={{ business, loading, refetch: () => setTick((t) => t + 1) }}
    >
      {children}
    </BusinessContext.Provider>
  );
}
