'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';

const STORAGE_KEY = 'doortag_comparison';
const MAX_ITEMS = 4;

export interface ComparisonProperty {
  parcelId: string;
  listingId?: number;
  address: string;
  city: string;
  state: string;
  status: string;
  listPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  squareFeet?: number;
  lotSizeAcres?: number;
  yearBuilt?: number;
  propertyType?: string;
  photo?: string;
  taxAnnualAmount?: number;
  estimatedTaxAnnual?: number;
  hoaFee?: number;
  hoaFrequency?: string;
  avmEstimate?: number;
  avmConfidence?: number;
  schoolElementary?: string;
  schoolMiddle?: string;
  schoolHigh?: string;
  daysOnMarket?: number;
  pool?: string;
  garageSpaces?: number;
  style?: string;
}

interface ComparisonContextValue {
  items: ComparisonProperty[];
  add: (property: ComparisonProperty) => boolean;
  remove: (parcelId: string) => void;
  clear: () => void;
  has: (parcelId: string) => boolean;
  isFull: boolean;
  overlayOpen: boolean;
  setOverlayOpen: (open: boolean) => void;
}

const ComparisonContext = createContext<ComparisonContextValue | null>(null);

export function ComparisonProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ComparisonProperty[]>([]);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setItems(parsed.slice(0, MAX_ITEMS));
      }
    } catch {
      // localStorage unavailable
    }
    setHydrated(true);
  }, []);

  // Persist to localStorage
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // localStorage unavailable
    }
  }, [items, hydrated]);

  const add = useCallback(
    (property: ComparisonProperty): boolean => {
      if (items.length >= MAX_ITEMS) return false;
      if (items.some((p) => p.parcelId === property.parcelId)) return false;
      setItems((prev) => [...prev, property]);
      return true;
    },
    [items]
  );

  const remove = useCallback((parcelId: string) => {
    setItems((prev) => prev.filter((p) => p.parcelId !== parcelId));
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    setOverlayOpen(false);
  }, []);

  const has = useCallback(
    (parcelId: string) => items.some((p) => p.parcelId === parcelId),
    [items]
  );

  return (
    <ComparisonContext.Provider
      value={{
        items,
        add,
        remove,
        clear,
        has,
        isFull: items.length >= MAX_ITEMS,
        overlayOpen,
        setOverlayOpen,
      }}
    >
      {children}
    </ComparisonContext.Provider>
  );
}

export function useComparison() {
  const ctx = useContext(ComparisonContext);
  if (!ctx) throw new Error('useComparison must be used within ComparisonProvider');
  return ctx;
}
