import {
  updateReminderForTenant,
  deleteReminderForTenant,
} from '@real-estate/db/crm';
import type { TenantContext } from '@real-estate/types';
import { NextResponse } from 'next/server';

import { requireTenantContext } from '../../lib/tenant-route';

interface RouteContext {
  params: Promise<{ reminderId: string }>;
}

interface RequireTenantContextResult {
  tenantContext: TenantContext | null;
  unauthorizedResponse: Response | null;
}

interface ReminderRouteDeps {
  requireTenantContext: (request: Request) => Promise<RequireTenantContextResult>;
  updateReminderForTenant: typeof updateReminderForTenant;
  deleteReminderForTenant: typeof deleteReminderForTenant;
}

const defaultDeps: ReminderRouteDeps = {
  requireTenantContext,
  updateReminderForTenant,
  deleteReminderForTenant,
};

export function createReminderPatchHandler(deps: ReminderRouteDeps = defaultDeps) {
  return async function PATCH(request: Request, context: RouteContext) {
    const { tenantContext, unauthorizedResponse } = await deps.requireTenantContext(request);
    if (unauthorizedResponse) return unauthorizedResponse;

    if (!tenantContext) {
      return NextResponse.json({ ok: false, error: 'Tenant resolution failed.' }, { status: 401 });
    }

    const { reminderId } = await context.params;
    const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (!payload) {
      return NextResponse.json({ ok: false, error: 'Invalid JSON body.' }, { status: 400 });
    }

    const input: Record<string, unknown> = {};
    if (payload.scheduledFor !== undefined) input.scheduledFor = String(payload.scheduledFor);
    if (payload.note !== undefined) input.note = payload.note ? String(payload.note).trim() : null;
    if (payload.channel !== undefined) input.channel = payload.channel ? String(payload.channel).trim() : null;
    if (payload.status !== undefined) input.status = String(payload.status);
    if (payload.snoozedUntil !== undefined) input.snoozedUntil = payload.snoozedUntil ? String(payload.snoozedUntil) : null;

    if (Object.keys(input).length === 0) {
      return NextResponse.json(
        { ok: false, error: 'At least one updatable field is required.' },
        { status: 400 }
      );
    }

    const updated = await deps.updateReminderForTenant(tenantContext.tenantId, reminderId, input);
    if (!updated) {
      return NextResponse.json(
        { ok: false, error: 'Reminder not found or update failed.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      tenantId: tenantContext.tenantId,
      reminder: updated,
    });
  };
}

export function createReminderDeleteHandler(deps: ReminderRouteDeps = defaultDeps) {
  return async function DELETE(request: Request, context: RouteContext) {
    const { tenantContext, unauthorizedResponse } = await deps.requireTenantContext(request);
    if (unauthorizedResponse) return unauthorizedResponse;

    if (!tenantContext) {
      return NextResponse.json({ ok: false, error: 'Tenant resolution failed.' }, { status: 401 });
    }

    const { reminderId } = await context.params;
    const deleted = await deps.deleteReminderForTenant(tenantContext.tenantId, reminderId);
    if (!deleted) {
      return NextResponse.json(
        { ok: false, error: 'Reminder not found or delete failed.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, tenantId: tenantContext.tenantId });
  };
}

export const PATCH = createReminderPatchHandler();
export const DELETE = createReminderDeleteHandler();
