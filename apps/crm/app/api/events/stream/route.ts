import type { TenantContext } from '@real-estate/types';
import { NextResponse } from 'next/server';

import { requireTenantContext } from '../../lib/tenant-route';

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
// In-memory pub/sub for tenant-scoped SSE broadcasting
// ---------------------------------------------------------------------------

type Listener = (event: RealtimeEvent) => void;

class RealtimeEventBus {
  private listeners: Map<string, Set<Listener>> = new Map();

  subscribe(tenantId: string, listener: Listener): () => void {
    if (!this.listeners.has(tenantId)) {
      this.listeners.set(tenantId, new Set());
    }
    this.listeners.get(tenantId)!.add(listener);

    return () => {
      const set = this.listeners.get(tenantId);
      if (set) {
        set.delete(listener);
        if (set.size === 0) {
          this.listeners.delete(tenantId);
        }
      }
    };
  }

  publish(tenantId: string, event: RealtimeEvent): void {
    const set = this.listeners.get(tenantId);
    if (!set) return;
    for (const listener of set) {
      listener(event);
    }
  }
}

/** Singleton event bus shared across all SSE connections. */
export const realtimeEventBus = new RealtimeEventBus();

// ---------------------------------------------------------------------------
// SSE keepalive interval (ms)
// ---------------------------------------------------------------------------

const KEEPALIVE_INTERVAL_MS = 30_000;

// ---------------------------------------------------------------------------
// Dependency-injected GET handler
// ---------------------------------------------------------------------------

interface RequireTenantContextResult {
  tenantContext: TenantContext | null;
  unauthorizedResponse: Response | null;
}

interface StreamGetDeps {
  requireTenantContext: (request: Request) => Promise<RequireTenantContextResult>;
  eventBus: RealtimeEventBus;
  keepaliveMs: number;
}

const defaultDeps: StreamGetDeps = {
  requireTenantContext,
  eventBus: realtimeEventBus,
  keepaliveMs: KEEPALIVE_INTERVAL_MS,
};

export function createStreamGetHandler(deps: StreamGetDeps = defaultDeps) {
  return async function GET(request: Request) {
    const { tenantContext, unauthorizedResponse } =
      await deps.requireTenantContext(request);
    if (unauthorizedResponse) {
      return unauthorizedResponse;
    }

    if (!tenantContext) {
      return NextResponse.json(
        { ok: false, error: 'Tenant resolution failed.' },
        { status: 401 },
      );
    }

    const tenantId = tenantContext.tenantId;

    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();

        /** Encode and enqueue an SSE frame. */
        function send(event: RealtimeEvent): void {
          try {
            const data = JSON.stringify(event);
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          } catch {
            // Controller may already be closed — ignore.
          }
        }

        // Subscribe to tenant-scoped events
        const unsubscribe = deps.eventBus.subscribe(tenantId, send);

        // Keepalive ping
        const keepaliveTimer = setInterval(() => {
          send({
            type: 'ping',
            timestamp: new Date().toISOString(),
          });
        }, deps.keepaliveMs);

        // Send an initial ping so the client knows the connection is live
        send({ type: 'ping', timestamp: new Date().toISOString() });

        // Cleanup when the client disconnects
        request.signal.addEventListener('abort', () => {
          clearInterval(keepaliveTimer);
          unsubscribe();
          try {
            controller.close();
          } catch {
            // Already closed — ignore.
          }
        });
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  };
}

export const GET = createStreamGetHandler();
