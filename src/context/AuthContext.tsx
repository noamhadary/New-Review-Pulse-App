import { useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { AuthContext } from './auth-context';

const DEMO_MODE =
  !import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  // In demo mode there is nothing to load — pretend we're logged in so the app is usable
  const [loading, setLoading] = useState(!DEMO_MODE);
  const [runtimeDemo, setRuntimeDemo] = useState(
    () => sessionStorage.getItem('rp_demo') === '1'
  );

  useEffect(() => {
    if (DEMO_MODE) return;

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const effectiveDemo = DEMO_MODE || runtimeDemo;

  const loginAsDemo = () => {
    sessionStorage.setItem('rp_demo', '1');
    setRuntimeDemo(true);
  };

  const signOut = async () => {
    if (!DEMO_MODE) await supabase.auth.signOut();
    sessionStorage.removeItem('rp_demo');
    setRuntimeDemo(false);
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        signOut,
        isDemo: effectiveDemo,
        loginAsDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
