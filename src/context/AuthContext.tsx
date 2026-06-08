import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  /** True when running without Supabase credentials (demo mode) */
  isDemo: boolean;
  /** Activate demo session at runtime (e.g. "try demo" button) */
  loginAsDemo: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
  isDemo: false,
  loginAsDemo: () => {},
});

const DEMO_MODE =
  !import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [runtimeDemo, setRuntimeDemo] = useState(
    () => sessionStorage.getItem('rp_demo') === '1'
  );

  useEffect(() => {
    if (DEMO_MODE) {
      // In demo mode pretend we're logged in so the app is usable
      setLoading(false);
      return;
    }

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

export function useAuth() {
  return useContext(AuthContext);
}
