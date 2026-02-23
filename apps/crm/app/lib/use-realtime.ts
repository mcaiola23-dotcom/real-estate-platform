'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RealtimeEventType =
  | 'lead_created'
  | 'lead_updated'
  | 'activity_logged'
  | 'ping';

export interface RealtimeEvent {
  type: RealtimeEventType;
  payload?: Record<string, unknown>;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Backoff constants
// ---------------------------------------------------------------------------

const INITIAL_BACKOFF_MS = 1_000;
const MAX_BACKOFF_MS = 30_000;
const BACKOFF_MULTIPLIER = 2;

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useRealtimeEvents() {
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const backoffRef = useRef(INITIAL_BACKOFF_MS);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmountedRef = useRef(false);

  const connect = useCallback(() => {
    // Don't reconnect after unmount
    if (unmountedRef.current) return;

    // Close any existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    const es = new EventSource('/api/events/stream');
    eventSourceRef.current = es;

    es.onopen = () => {
      if (unmountedRef.current) return;
      setConnected(true);
      // Reset backoff on successful connection
      backoffRef.current = INITIAL_BACKOFF_MS;
    };

    es.onmessage = (event: MessageEvent) => {
      if (unmountedRef.current) return;

      try {
        const parsed = JSON.parse(event.data as string) as RealtimeEvent;
        setLastEvent(parsed);
      } catch {
        // Malformed event data — ignore
      }
    };

    es.onerror = () => {
      if (unmountedRef.current) return;

      setConnected(false);
      es.close();
      eventSourceRef.current = null;

      // Schedule reconnect with exponential backoff
      const delay = backoffRef.current;
      backoffRef.current = Math.min(
        backoffRef.current * BACKOFF_MULTIPLIER,
        MAX_BACKOFF_MS,
      );

      reconnectTimerRef.current = setTimeout(() => {
        reconnectTimerRef.current = null;
        connect();
      }, delay);
    };
  }, []);

  useEffect(() => {
    unmountedRef.current = false;
    connect();

    return () => {
      unmountedRef.current = true;

      // Clear pending reconnect timer
      if (reconnectTimerRef.current !== null) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }

      // Close the EventSource
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      setConnected(false);
    };
  }, [connect]);

  return { connected, lastEvent };
}
