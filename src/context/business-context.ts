import { createContext, useContext } from 'react';
import type { Business } from '../types';

export interface BusinessContextValue {
  business: Business | null;
  loading: boolean;
  refetch: () => void;
}

export const BusinessContext = createContext<BusinessContextValue>({
  business: null,
  loading: true,
  refetch: () => {},
});

export function useBusiness() {
  return useContext(BusinessContext);
}
