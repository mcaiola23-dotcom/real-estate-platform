import type { TenantContext } from '@real-estate/types';
import { updateContactForTenant } from '@real-estate/db/crm';
import { NextResponse } from 'next/server';

import { requireTenantContext } from '../../lib/tenant-route';

interface RouteContext {
  params: Promise<{
    contactId: string;
  }>;
}

interface RequireTenantContextResult {
  tenantContext: TenantContext | null;
  unauthorizedResponse: Response | null;
}

interface ContactPatchDeps {
  requireTenantContext: (request: Request) => Promise<RequireTenantContextResult>;
  updateContactForTenant: typeof updateContactForTenant;
}

const defaultDeps: ContactPatchDeps = {
  requireTenantContext,
  updateContactForTenant,
};

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

export function createContactPatchHandler(deps: ContactPatchDeps = defaultDeps) {
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

    const { contactId } = await context.params;
    const payload = (await request.json().catch(() => null)) as
      | {
          fullName?: string | null;
          email?: string | null;
          phone?: string | null;
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

    const fullName = toNullableString(payload.fullName);
    const email = toNullableString(payload.email);
    const phone = toNullableString(payload.phone);

    if (fullName === undefined && email === undefined && phone === undefined) {
      return NextResponse.json(
        {
          ok: false,
          error: 'At least one updatable field is required.',
        },
        { status: 400 }
      );
    }

    const contact = await deps.updateContactForTenant(tenantContext.tenantId, contactId, {
      fullName,
      email,
      phone,
    });

    if (!contact) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Contact not found or update failed.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      tenantId: tenantContext.tenantId,
      contact,
    });
  };
}

export const PATCH = createContactPatchHandler();
