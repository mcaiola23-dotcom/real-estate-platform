import {
  getMessageTemplateByIdForTenant,
  updateMessageTemplateForTenant,
  deleteMessageTemplateForTenant,
  incrementTemplateUseCount,
} from '@real-estate/db/crm';
import type { TenantContext } from '@real-estate/types';
import { NextResponse } from 'next/server';

import { requireTenantContext } from '../../lib/tenant-route';

interface RouteContext {
  params: Promise<{ templateId: string }>;
}

interface RequireTenantContextResult {
  tenantContext: TenantContext | null;
  unauthorizedResponse: Response | null;
}

interface TemplateRouteDeps {
  requireTenantContext: (request: Request) => Promise<RequireTenantContextResult>;
  getMessageTemplateByIdForTenant: typeof getMessageTemplateByIdForTenant;
  updateMessageTemplateForTenant: typeof updateMessageTemplateForTenant;
  deleteMessageTemplateForTenant: typeof deleteMessageTemplateForTenant;
  incrementTemplateUseCount: typeof incrementTemplateUseCount;
}

const defaultDeps: TemplateRouteDeps = {
  requireTenantContext,
  getMessageTemplateByIdForTenant,
  updateMessageTemplateForTenant,
  deleteMessageTemplateForTenant,
  incrementTemplateUseCount,
};

export function createTemplateGetHandler(deps: TemplateRouteDeps = defaultDeps) {
  return async function GET(request: Request, context: RouteContext) {
    const { tenantContext, unauthorizedResponse } = await deps.requireTenantContext(request);
    if (unauthorizedResponse) return unauthorizedResponse;

    if (!tenantContext) {
      return NextResponse.json({ ok: false, error: 'Tenant resolution failed.' }, { status: 401 });
    }

    const { templateId } = await context.params;
    const template = await deps.getMessageTemplateByIdForTenant(tenantContext.tenantId, templateId);
    if (!template) {
      return NextResponse.json({ ok: false, error: 'Template not found.' }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      tenantId: tenantContext.tenantId,
      template,
    });
  };
}

export function createTemplatePatchHandler(deps: TemplateRouteDeps = defaultDeps) {
  return async function PATCH(request: Request, context: RouteContext) {
    const { tenantContext, unauthorizedResponse } = await deps.requireTenantContext(request);
    if (unauthorizedResponse) return unauthorizedResponse;

    if (!tenantContext) {
      return NextResponse.json({ ok: false, error: 'Tenant resolution failed.' }, { status: 401 });
    }

    const { templateId } = await context.params;
    const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (!payload) {
      return NextResponse.json({ ok: false, error: 'Invalid JSON body.' }, { status: 400 });
    }

    // Handle use-count increment as a special action
    if (payload.action === 'use') {
      await deps.incrementTemplateUseCount(tenantContext.tenantId, templateId);
      return NextResponse.json({ ok: true, tenantId: tenantContext.tenantId });
    }

    const input: Record<string, unknown> = {};
    if (payload.name !== undefined) input.name = String(payload.name).trim();
    if (payload.category !== undefined) input.category = String(payload.category).trim();
    if (payload.channel !== undefined) input.channel = String(payload.channel).trim();
    if (payload.subject !== undefined) input.subject = payload.subject != null ? String(payload.subject).trim() : null;
    if (payload.body !== undefined) input.body = String(payload.body).trim();
    if (payload.description !== undefined) input.description = String(payload.description).trim();
    if (payload.isFavorite !== undefined) input.isFavorite = Boolean(payload.isFavorite);

    if (Object.keys(input).length === 0) {
      return NextResponse.json(
        { ok: false, error: 'At least one updatable field is required.' },
        { status: 400 }
      );
    }

    const updated = await deps.updateMessageTemplateForTenant(tenantContext.tenantId, templateId, input);
    if (!updated) {
      return NextResponse.json(
        { ok: false, error: 'Template not found or update failed.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      tenantId: tenantContext.tenantId,
      template: updated,
    });
  };
}

export function createTemplateDeleteHandler(deps: TemplateRouteDeps = defaultDeps) {
  return async function DELETE(request: Request, context: RouteContext) {
    const { tenantContext, unauthorizedResponse } = await deps.requireTenantContext(request);
    if (unauthorizedResponse) return unauthorizedResponse;

    if (!tenantContext) {
      return NextResponse.json({ ok: false, error: 'Tenant resolution failed.' }, { status: 401 });
    }

    const { templateId } = await context.params;
    const deleted = await deps.deleteMessageTemplateForTenant(tenantContext.tenantId, templateId);
    if (!deleted) {
      return NextResponse.json(
        { ok: false, error: 'Template not found or delete failed.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, tenantId: tenantContext.tenantId });
  };
}

export const GET = createTemplateGetHandler();
export const PATCH = createTemplatePatchHandler();
export const DELETE = createTemplateDeleteHandler();
