'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// Use a simple fallback for UUID if crypto not available
function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

export interface OfflineQueueItem {
  id: string;
  tenantId: string;
  activityType: string;
  summary: string;
  leadId: string | null;
  contactId: string | null;
  occurredAt: string;
  queuedAt: string;
  status: 'queued' | 'syncing' | 'failed';
  retryCount: number;
  lastError?: string;
}

const STORAGE_KEY = 'crm_offline_queue';
const PING_INTERVAL = 15_000; // 15 seconds

function readQueue(): OfflineQueueItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as OfflineQueueItem[]) : [];
  } catch {
    return [];
  }
}

function writeQueue(items: OfflineQueueItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage full or unavailable — silently fail
  }
}

export function useOfflineQueue(tenantId: string) {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [queue, setQueue] = useState<OfflineQueueItem[]>(() => readQueue());
  const syncingRef = useRef(false);

  // Listen for online/offline events
  useEffect(() => {
    function handleOnline() { setIsOnline(true); }
    function handleOffline() { setIsOnline(false); }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Periodic connectivity check
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/leads?limit=1', {
          method: 'HEAD',
          cache: 'no-store',
        });
        setIsOnline(response.ok);
      } catch {
        setIsOnline(false);
      }
    }, PING_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  // Enqueue an activity for later sync
  const enqueue = useCallback(
    (item: Omit<OfflineQueueItem, 'id' | 'queuedAt' | 'status' | 'retryCount' | 'tenantId'>) => {
      const newItem: OfflineQueueItem = {
        ...item,
        id: generateId(),
        tenantId,
        queuedAt: new Date().toISOString(),
        status: 'queued',
        retryCount: 0,
      };
      setQueue((prev) => {
        const updated = [...prev, newItem];
        writeQueue(updated);
        return updated;
      });
      return newItem.id;
    },
    [tenantId]
  );

  // Sync queued items when online
  const syncQueue = useCallback(async () => {
    if (syncingRef.current || !isOnline) return;
    const pending = readQueue().filter((item) => item.status === 'queued' || item.status === 'failed');
    if (pending.length === 0) return;

    syncingRef.current = true;

    const updatedItems = [...readQueue()];

    for (const item of pending) {
      const idx = updatedItems.findIndex((i) => i.id === item.id);
      if (idx === -1) continue;

      updatedItems[idx] = { ...updatedItems[idx], status: 'syncing' };
      writeQueue(updatedItems);
      setQueue([...updatedItems]);

      try {
        const response = await fetch('/api/activities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            activityType: item.activityType,
            summary: item.summary,
            leadId: item.leadId || undefined,
            contactId: item.contactId || undefined,
            occurredAt: item.occurredAt,
          }),
        });

        if (response.ok) {
          // Remove synced item
          updatedItems.splice(idx, 1);
        } else {
          updatedItems[idx] = {
            ...updatedItems[idx],
            status: 'failed',
            retryCount: (updatedItems[idx].retryCount || 0) + 1,
            lastError: `HTTP ${response.status}`,
          };
        }
      } catch (err) {
        updatedItems[idx] = {
          ...updatedItems[idx],
          status: 'failed',
          retryCount: (updatedItems[idx].retryCount || 0) + 1,
          lastError: err instanceof Error ? err.message : 'Network error',
        };
      }

      writeQueue(updatedItems);
      setQueue([...updatedItems]);
    }

    syncingRef.current = false;
  }, [isOnline]);

  // Auto-sync when coming online
  useEffect(() => {
    if (isOnline && queue.some((item) => item.status === 'queued' || item.status === 'failed')) {
      void syncQueue();
    }
  }, [isOnline, syncQueue, queue]);

  const pendingCount = queue.filter(
    (item) => item.status === 'queued' || item.status === 'failed'
  ).length;

  const clearSynced = useCallback(() => {
    setQueue((prev) => {
      const remaining = prev.filter((item) => item.status !== 'queued');
      writeQueue(remaining);
      return remaining;
    });
  }, []);

  return {
    isOnline,
    queue,
    pendingCount,
    enqueue,
    syncQueue,
    clearSynced,
  };
}
