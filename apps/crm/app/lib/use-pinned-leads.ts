import { useCallback, useEffect, useState } from 'react';

function getStorageKey(tenantId: string): string {
  return `crm.pinned.${tenantId}`;
}

function readPinned(tenantId: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(getStorageKey(tenantId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function usePinnedLeads(tenantId: string, maxPins = 8) {
  const [pinnedIds, setPinnedIds] = useState<string[]>(() => readPinned(tenantId));

  useEffect(() => {
    localStorage.setItem(getStorageKey(tenantId), JSON.stringify(pinnedIds));
  }, [tenantId, pinnedIds]);

  const togglePin = useCallback((leadId: string) => {
    setPinnedIds((prev) => {
      if (prev.includes(leadId)) {
        return prev.filter((id) => id !== leadId);
      }
      if (prev.length >= maxPins) return prev;
      return [...prev, leadId];
    });
  }, [maxPins]);

  const isPinned = useCallback((leadId: string) => pinnedIds.includes(leadId), [pinnedIds]);

  return { pinnedIds, togglePin, isPinned };
}
