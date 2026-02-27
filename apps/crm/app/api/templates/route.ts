import {
  listMessageTemplatesForTenant,
  createMessageTemplateForTenant,
} from '@real-estate/db/crm';
import type { TenantContext } from '@real-estate/types';
import { NextResponse } from 'next/server';

import { requireTenantContext } from '../lib/tenant-route';

interface RequireTenantContextResult {
  tenantContext: TenantContext | null;
  unauthorizedResponse: Response | null;
}

interface TemplatesRouteDeps {
  requireTenantContext: (request: Request) => Promise<RequireTenantContextResult>;
  listMessageTemplatesForTenant: typeof listMessageTemplatesForTenant;
  createMessageTemplateForTenant: typeof createMessageTemplateForTenant;
}

const defaultDeps: TemplatesRouteDeps = {
  requireTenantContext,
  listMessageTemplatesForTenant,
  createMessageTemplateForTenant,
};

export function createTemplatesGetHandler(deps: TemplatesRouteDeps = defaultDeps) {
  return async function GET(request: Request) {
    const { tenantContext, unauthorizedResponse } = await deps.requireTenantContext(request);
    if (unauthorizedResponse) return unauthorizedResponse;

    if (!tenantContext) {
      return NextResponse.json({ ok: false, error: 'Tenant resolution failed.' }, { status: 401 });
    }

    const url = new URL(request.url);
    const category = url.searchParams.get('category') || undefined;
    const channel = url.searchParams.get('channel') || undefined;
    const limit = url.searchParams.get('limit') ? Number(url.searchParams.get('limit')) : undefined;
    const offset = url.searchParams.get('offset') ? Number(url.searchParams.get('offset')) : undefined;

    const templates = await deps.listMessageTemplatesForTenant(tenantContext.tenantId, {
      category: category as never,
      channel: channel as never,
      limit,
      offset,
    });

    return NextResponse.json({
      ok: true,
      tenantId: tenantContext.tenantId,
      templates,
    });
  };
}

export function createTemplatesPostHandler(deps: TemplatesRouteDeps = defaultDeps) {
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

    const name = payload.name ? String(payload.name).trim() : '';
    const category = payload.category ? String(payload.category).trim() : '';
    const channel = payload.channel ? String(payload.channel).trim() : '';
    const body = payload.body ? String(payload.body).trim() : '';

    if (!name || !category || !channel || !body) {
      return NextResponse.json(
        { ok: false, error: 'name, category, channel, and body are required.' },
        { status: 400 }
      );
    }

    const template = await deps.createMessageTemplateForTenant(tenantContext.tenantId, {
      name,
      category,
      channel,
      subject: payload.subject != null ? String(payload.subject).trim() : null,
      body,
      description: payload.description ? String(payload.description).trim() : undefined,
      createdBy: payload.createdBy ? String(payload.createdBy).trim() : null,
    });

    if (!template) {
      return NextResponse.json({ ok: false, error: 'Failed to create template.' }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      tenantId: tenantContext.tenantId,
      template,
    }, { status: 201 });
  };
}

export const GET = createTemplatesGetHandler();
export const POST = createTemplatesPostHandler();
