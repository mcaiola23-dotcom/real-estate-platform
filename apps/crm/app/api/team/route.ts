import {
  createTeamMemberForTenant,
  listTeamMembersByTenantId,
  updateTeamMemberForTenant,
} from '@real-estate/db/crm';
import type { TenantContext } from '@real-estate/types';
import { NextResponse } from 'next/server';

import { buildPagination } from '../lib/query-params';
import { requireTenantContext } from '../lib/tenant-route';

interface RequireTenantContextResult {
  tenantContext: TenantContext | null;
  unauthorizedResponse: Response | null;
}

interface TeamRouteDeps {
  requireTenantContext: (request: Request) => Promise<RequireTenantContextResult>;
  listTeamMembersByTenantId: typeof listTeamMembersByTenantId;
  createTeamMemberForTenant: typeof createTeamMemberForTenant;
  updateTeamMemberForTenant: typeof updateTeamMemberForTenant;
}

const defaultDeps: TeamRouteDeps = {
  requireTenantContext,
  listTeamMembersByTenantId,
  createTeamMemberForTenant,
  updateTeamMemberForTenant,
};

export function createTeamGetHandler(deps: TeamRouteDeps = defaultDeps) {
  return async function GET(request: Request) {
    const { tenantContext, unauthorizedResponse } = await deps.requireTenantContext(request);
    if (unauthorizedResponse) return unauthorizedResponse;
    if (!tenantContext) {
      return NextResponse.json({ ok: false, error: 'Tenant resolution failed.' }, { status: 401 });
    }

    const url = new URL(request.url);
    const activeOnly = url.searchParams.get('activeOnly') === 'true';
    const limit = url.searchParams.has('limit') ? Number(url.searchParams.get('limit')) : 50;
    const offset = url.searchParams.has('offset') ? Number(url.searchParams.get('offset')) : 0;

    const members = await deps.listTeamMembersByTenantId(tenantContext.tenantId, { activeOnly, limit, offset });

    return NextResponse.json({
      ok: true,
      tenantId: tenantContext.tenantId,
      members,
      pagination: buildPagination(limit, offset, members.length),
    });
  };
}

export function createTeamPostHandler(deps: TeamRouteDeps = defaultDeps) {
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
    if (payload.action === 'update' && payload.memberId) {
      const updated = await deps.updateTeamMemberForTenant(
        tenantContext.tenantId,
        String(payload.memberId),
        {
          name: payload.name !== undefined ? String(payload.name) : undefined,
          email: payload.email !== undefined ? (payload.email ? String(payload.email) : null) : undefined,
          role: payload.role !== undefined ? String(payload.role) : undefined,
          isActive: payload.isActive !== undefined ? Boolean(payload.isActive) : undefined,
          leadCap: payload.leadCap !== undefined ? (payload.leadCap !== null ? Number(payload.leadCap) : null) : undefined,
        }
      );
      if (!updated) {
        return NextResponse.json({ ok: false, error: 'Team member update failed.' }, { status: 400 });
      }
      return NextResponse.json({ ok: true, tenantId: tenantContext.tenantId, member: updated });
    }

    // Create
    const name = String(payload.name || '').trim();
    if (!name) {
      return NextResponse.json({ ok: false, error: 'name is required.' }, { status: 400 });
    }

    const member = await deps.createTeamMemberForTenant(tenantContext.tenantId, {
      name,
      email: payload.email ? String(payload.email) : null,
      role: payload.role ? String(payload.role) : undefined,
      leadCap: payload.leadCap !== undefined ? Number(payload.leadCap) : undefined,
    });

    if (!member) {
      return NextResponse.json({ ok: false, error: 'Team member creation failed.' }, { status: 400 });
    }

    return NextResponse.json(
      { ok: true, tenantId: tenantContext.tenantId, member },
      { status: 201 }
    );
  };
}

export const GET = createTeamGetHandler();
export const POST = createTeamPostHandler();
