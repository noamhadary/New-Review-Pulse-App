import { createContext, useContext } from 'react';
import type { Session, User } from '@supabase/supabase-js';

export interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  /** True when running without Supabase credentials (demo mode) */
  isDemo: boolean;
  /** Activate demo session at runtime (e.g. "try demo" button) */
  loginAsDemo: () => void;
}

export const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
  isDemo: false,
  loginAsDemo: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}
