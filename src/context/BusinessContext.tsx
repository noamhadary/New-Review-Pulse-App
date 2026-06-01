import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import type { Business } from '../types';

const DEMO_BUSINESS: Business = {
  id: 'demo-business-1',
  owner_id: 'demo-user-1',
  name: 'העסק שלי',
  category: 'מסעדה',
  created_at: new Date().toISOString(),
};

interface BusinessContextValue {
  business: Business | null;
  loading: boolean;
  refetch: () => void;
}

const BusinessContext = createContext<BusinessContextValue>({
  business: null,
  loading: true,
  refetch: () => {},
});

export function BusinessProvider({ children }: { children: ReactNode }) {
  const { user, isDemo } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (isDemo) {
      setBusiness(DEMO_BUSINESS);
      setLoading(false);
      return;
    }
    if (!user) {
      setBusiness(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    supabase
      .from('businesses')
      .select('*')
      .eq('owner_id', user.id)
      .single()
      .then(({ data, error }) => {
        if (!error && data) setBusiness(data as Business);
        setLoading(false);
      });
  }, [user, isDemo, tick]);

  return (
    <BusinessContext.Provider
      value={{ business, loading, refetch: () => setTick((t) => t + 1) }}
    >
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  return useContext(BusinessContext);
}
