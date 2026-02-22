import { getLatestProcessedIngestionJob } from '@real-estate/db/crm';
import type { TenantContext } from '@real-estate/types';
import { NextResponse } from 'next/server';

import { requireTenantContext } from '../../lib/tenant-route';

type FeedStatus = 'healthy' | 'stale' | 'unknown';

interface FeedStatusResponse {
  ok: boolean;
  tenantId: string;
  lastSyncAt: string | null;
  status: FeedStatus;
  staleSinceHours: number | null;
}

interface RequireTenantContextResult {
  tenantContext: TenantContext | null;
  unauthorizedResponse: Response | null;
}

interface FeedStatusGetDeps {
  requireTenantContext: (request: Request) => Promise<RequireTenantContextResult>;
  getLatestProcessedIngestionJob: typeof getLatestProcessedIngestionJob;
}

const STALE_THRESHOLD_HOURS = 24;

const defaultDeps: FeedStatusGetDeps = {
  requireTenantContext,
  getLatestProcessedIngestionJob,
};

export function createFeedStatusGetHandler(deps: FeedStatusGetDeps = defaultDeps) {
  return async function GET(request: Request) {
    const { tenantContext, unauthorizedResponse } = await deps.requireTenantContext(request);
    if (unauthorizedResponse) {
      return unauthorizedResponse;
    }

    if (!tenantContext) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Tenant resolution failed.',
        },
        { status: 401 }
      );
    }

    const latestJob = await deps.getLatestProcessedIngestionJob(tenantContext.tenantId);

    if (!latestJob || !latestJob.processedAt) {
      const response: FeedStatusResponse = {
        ok: true,
        tenantId: tenantContext.tenantId,
        lastSyncAt: null,
        status: 'unknown',
        staleSinceHours: null,
      };
      return NextResponse.json(response);
    }

    const processedAt = new Date(latestJob.processedAt);
    const now = new Date();
    const hoursSinceSync = (now.getTime() - processedAt.getTime()) / (1000 * 60 * 60);
    const isStale = hoursSinceSync > STALE_THRESHOLD_HOURS;

    const response: FeedStatusResponse = {
      ok: true,
      tenantId: tenantContext.tenantId,
      lastSyncAt: latestJob.processedAt,
      status: isStale ? 'stale' : 'healthy',
      staleSinceHours: isStale ? Math.round(hoursSinceSync * 10) / 10 : null,
    };
    return NextResponse.json(response);
  };
}

export const GET = createFeedStatusGetHandler();
