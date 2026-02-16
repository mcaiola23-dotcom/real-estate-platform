import { NextResponse } from 'next/server';

import { listControlPlaneAdminAuditEventsByTenant } from '@real-estate/db/admin-audit';
import { listTenantSnapshotsForAdmin } from '@real-estate/db/control-plane';
import type { ControlPlaneAdminAuditAction, ControlPlaneAdminAuditEvent, ControlPlaneAdminAuditStatus } from '@real-estate/types/control-plane';

interface AdminAuditRouteDependencies {
  listControlPlaneAdminAuditEventsByTenant: typeof listControlPlaneAdminAuditEventsByTenant;
  listTenantSnapshotsForAdmin: typeof listTenantSnapshotsForAdmin;
}

const defaultDependencies: AdminAuditRouteDependencies = {
  listControlPlaneAdminAuditEventsByTenant,
  listTenantSnapshotsForAdmin,
};

function parseLimit(value: string | null): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 50;
  }

  return Math.max(1, Math.min(Math.trunc(parsed), 200));
}

function parseTenantId(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseStatus(value: string | null): ControlPlaneAdminAuditStatus | null {
  if (value === 'allowed' || value === 'denied' || value === 'succeeded' || value === 'failed') {
    return value;
  }

  return null;
}

function parseAction(value: string | null): ControlPlaneAdminAuditAction | null {
  if (
    value === 'tenant.provision' ||
    value === 'tenant.domain.add' ||
    value === 'tenant.domain.update' ||
    value === 'tenant.settings.update'
  ) {
    return value;
  }

  return null;
}

function filterEvents(
  events: ControlPlaneAdminAuditEvent[],
  filters: { status: ControlPlaneAdminAuditStatus | null; action: ControlPlaneAdminAuditAction | null }
): ControlPlaneAdminAuditEvent[] {
  return events.filter((event) => {
    if (filters.status && event.status !== filters.status) {
      return false;
    }

    if (filters.action && event.action !== filters.action) {
      return false;
    }

    return true;
  });
}

export function createAdminAuditGetHandler(dependencies: AdminAuditRouteDependencies = defaultDependencies) {
  return async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const tenantId = parseTenantId(searchParams.get('tenantId'));
    const limit = parseLimit(searchParams.get('limit'));
    const status = parseStatus(searchParams.get('status'));
    const action = parseAction(searchParams.get('action'));

    if (tenantId) {
      const tenantEvents = await dependencies.listControlPlaneAdminAuditEventsByTenant(tenantId, limit);
      return NextResponse.json({
        ok: true,
        scope: 'tenant',
        tenantId,
        events: filterEvents(tenantEvents, { status, action }),
      });
    }

    const snapshots = await dependencies.listTenantSnapshotsForAdmin();
    const eventGroups = await Promise.all(
      snapshots.map((snapshot) => dependencies.listControlPlaneAdminAuditEventsByTenant(snapshot.tenant.id, limit))
    );

    const globalEvents = eventGroups
      .flat()
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
      .slice(0, limit);

    return NextResponse.json({
      ok: true,
      scope: 'global',
      tenantId: null,
      events: filterEvents(globalEvents, { status, action }),
    });
  };
}

export const GET = createAdminAuditGetHandler();
