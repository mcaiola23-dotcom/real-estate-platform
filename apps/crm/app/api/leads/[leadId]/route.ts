import type { CrmLeadStatus } from '@real-estate/types/crm';
import type { TenantContext } from '@real-estate/types';
import { createActivityForTenant, getLeadByIdForTenant, updateLeadForTenant } from '@real-estate/db/crm';
import { NextResponse } from 'next/server';

import { requireTenantContext } from '../../lib/tenant-route';

const VALID_STATUSES: Set<CrmLeadStatus> = new Set(['new', 'qualified', 'nurturing', 'won', 'lost']);

interface RouteContext {
  params: Promise<{
    leadId: string;
  }>;
}

interface RequireTenantContextResult {
  tenantContext: TenantContext | null;
  unauthorizedResponse: Response | null;
}

interface LeadPatchDeps {
  requireTenantContext: (request: Request) => Promise<RequireTenantContextResult>;
  getLeadByIdForTenant: typeof getLeadByIdForTenant;
  updateLeadForTenant: typeof updateLeadForTenant;
  createActivityForTenant: typeof createActivityForTenant;
}

const defaultDeps: LeadPatchDeps = {
  requireTenantContext,
  getLeadByIdForTenant,
  updateLeadForTenant,
  createActivityForTenant,
};

export function createLeadGetHandler(deps: LeadPatchDeps = defaultDeps) {
  return async function GET(request: Request, context: RouteContext) {
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

    const { leadId } = await context.params;
    const lead = await deps.getLeadByIdForTenant(tenantContext.tenantId, leadId);
    if (!lead) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Lead not found.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      tenantId: tenantContext.tenantId,
      lead,
    });
  };
}

function toNullableString(value: unknown): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toNullableInt(value: unknown): number | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === null || value === '') {
    return null;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.round(value);
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return Math.round(parsed);
    }
  }
  return undefined;
}

export function createLeadPatchHandler(deps: LeadPatchDeps = defaultDeps) {
  return async function PATCH(request: Request, context: RouteContext) {
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

    const { leadId } = await context.params;
    const payload = (await request.json().catch(() => null)) as
      | {
          status?: string;
          notes?: string | null;
          timeframe?: string | null;
          listingAddress?: string | null;
          propertyType?: string | null;
          beds?: number | string | null;
          baths?: number | string | null;
          sqft?: number | string | null;
          lastContactAt?: string | null;
          nextActionAt?: string | null;
          nextActionNote?: string | null;
          priceMin?: number | string | null;
          priceMax?: number | string | null;
          tags?: string[];
        }
      | null;

    if (!payload) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Invalid JSON body.',
        },
        { status: 400 }
      );
    }

    const status =
      payload.status && VALID_STATUSES.has(payload.status as CrmLeadStatus)
        ? (payload.status as CrmLeadStatus)
        : undefined;
    const notes = toNullableString(payload.notes);
    const timeframe = toNullableString(payload.timeframe);
    const listingAddress = toNullableString(payload.listingAddress);
    const propertyType = toNullableString(payload.propertyType);
    const beds = toNullableInt(payload.beds);
    const baths = toNullableInt(payload.baths);
    const sqft = toNullableInt(payload.sqft);
    const lastContactAt = toNullableString(payload.lastContactAt);
    const nextActionAt = toNullableString(payload.nextActionAt);
    const nextActionNote = toNullableString(payload.nextActionNote);
    const priceMin = toNullableInt(payload.priceMin);
    const priceMax = toNullableInt(payload.priceMax);
    const tags = Array.isArray(payload.tags)
      ? payload.tags.filter((t): t is string => typeof t === 'string' && t.trim().length > 0).map((t) => t.trim())
      : undefined;

    if (
      status === undefined &&
      notes === undefined &&
      timeframe === undefined &&
      listingAddress === undefined &&
      propertyType === undefined &&
      beds === undefined &&
      baths === undefined &&
      sqft === undefined &&
      lastContactAt === undefined &&
      nextActionAt === undefined &&
      nextActionNote === undefined &&
      priceMin === undefined &&
      priceMax === undefined &&
      tags === undefined
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: 'At least one updatable field is required.',
        },
        { status: 400 }
      );
    }

    const updatedLead = await deps.updateLeadForTenant(tenantContext.tenantId, leadId, {
      status,
      notes,
      timeframe,
      listingAddress,
      propertyType,
      beds,
      baths,
      sqft,
      lastContactAt,
      nextActionAt,
      nextActionNote,
      priceMin,
      priceMax,
      tags,
    });

    if (!updatedLead) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Lead not found or update failed.',
        },
        { status: 404 }
      );
    }

    if (status) {
      await deps.createActivityForTenant(tenantContext.tenantId, {
        activityType: 'lead_status_changed',
        leadId,
        contactId: updatedLead.contactId,
        summary: `Lead status updated to ${status}`,
        metadataJson: JSON.stringify({ status }),
      });
    }

    return NextResponse.json({
      ok: true,
      tenantId: tenantContext.tenantId,
      lead: updatedLead,
    });
  };
}

export const PATCH = createLeadPatchHandler();
export const GET = createLeadGetHandler();
