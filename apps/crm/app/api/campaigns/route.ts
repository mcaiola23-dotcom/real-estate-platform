import {
  createCampaignForTenant,
  listCampaignsByTenantId,
  updateCampaignForTenant,
} from '@real-estate/db/crm';
import type { TenantContext } from '@real-estate/types';
import { NextResponse } from 'next/server';

import { buildPagination } from '../lib/query-params';
import { requireTenantContext } from '../lib/tenant-route';

interface RequireTenantContextResult {
  tenantContext: TenantContext | null;
  unauthorizedResponse: Response | null;
}

interface CampaignsRouteDeps {
  requireTenantContext: (request: Request) => Promise<RequireTenantContextResult>;
  listCampaignsByTenantId: typeof listCampaignsByTenantId;
  createCampaignForTenant: typeof createCampaignForTenant;
  updateCampaignForTenant: typeof updateCampaignForTenant;
}

const defaultDeps: CampaignsRouteDeps = {
  requireTenantContext,
  listCampaignsByTenantId,
  createCampaignForTenant,
  updateCampaignForTenant,
};

export function createCampaignsGetHandler(deps: CampaignsRouteDeps = defaultDeps) {
  return async function GET(request: Request) {
    const { tenantContext, unauthorizedResponse } = await deps.requireTenantContext(request);
    if (unauthorizedResponse) return unauthorizedResponse;
    if (!tenantContext) {
      return NextResponse.json({ ok: false, error: 'Tenant resolution failed.' }, { status: 401 });
    }

    const url = new URL(request.url);
    const status = url.searchParams.get('status') || undefined;
    const limit = url.searchParams.has('limit') ? Number(url.searchParams.get('limit')) : 50;
    const offset = url.searchParams.has('offset') ? Number(url.searchParams.get('offset')) : 0;

    const campaigns = await deps.listCampaignsByTenantId(tenantContext.tenantId, { status, limit, offset });

    return NextResponse.json({
      ok: true,
      tenantId: tenantContext.tenantId,
      campaigns,
      pagination: buildPagination(limit, offset, campaigns.length),
    });
  };
}

export function createCampaignsPostHandler(deps: CampaignsRouteDeps = defaultDeps) {
  return async function POST(request: Request) {
    const { tenantContext, unauthorizedResponse } = await deps.requireTenantContext(request);
    if (unauthorizedResponse) return unauthorizedResponse;
    if (!tenantContext) {
      return NextResponse.json({ ok: false, error: 'Tenant resolution failed.' }, { status: 401 });
    }

    const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (!payload) {
      return NextResponse.json({ ok: false, error: 'Invalid JSON body.' }, { status: 400 });
    }

    // Handle update
    if (payload.action === 'update' && payload.campaignId) {
      const updated = await deps.updateCampaignForTenant(
        tenantContext.tenantId,
        String(payload.campaignId),
        {
          name: payload.name !== undefined ? String(payload.name) : undefined,
          stepsJson: payload.stepsJson !== undefined ? String(payload.stepsJson) : undefined,
          status: payload.status !== undefined ? String(payload.status) : undefined,
        }
      );
      if (!updated) {
        return NextResponse.json({ ok: false, error: 'Campaign update failed.' }, { status: 400 });
      }
      return NextResponse.json({ ok: true, tenantId: tenantContext.tenantId, campaign: updated });
    }

    // Create
    const name = String(payload.name || '').trim();
    if (!name) {
      return NextResponse.json({ ok: false, error: 'name is required.' }, { status: 400 });
    }

    const campaign = await deps.createCampaignForTenant(tenantContext.tenantId, {
      name,
      stepsJson: payload.stepsJson ? String(payload.stepsJson) : undefined,
      status: payload.status ? String(payload.status) : undefined,
    });

    if (!campaign) {
      return NextResponse.json({ ok: false, error: 'Campaign creation failed.' }, { status: 400 });
    }

    return NextResponse.json(
      { ok: true, tenantId: tenantContext.tenantId, campaign },
      { status: 201 }
    );
  };
}

export const GET = createCampaignsGetHandler();
export const POST = createCampaignsPostHandler();
