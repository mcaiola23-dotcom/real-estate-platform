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

function parseOptionalText(value: string | null): string | null {
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
    value === 'tenant.status.update' ||
    value === 'tenant.domain.add' ||
    value === 'tenant.domain.update' ||
    value === 'tenant.settings.update' ||
    value === 'tenant.onboarding.plan.create' ||
    value === 'tenant.onboarding.plan.update' ||
    value === 'tenant.onboarding.task.update' ||
    value === 'tenant.billing.update' ||
    value === 'tenant.billing.sync' ||
    value === 'tenant.diagnostics.remediate' ||
    value === 'tenant.actor.add' ||
    value === 'tenant.actor.update' ||
    value === 'tenant.actor.remove' ||
    value === 'tenant.support-session.start' ||
    value === 'tenant.support-session.end'
  ) {
    return value;
  }

  return null;
}

function parseDateTimestamp(value: string | null, edge: 'start' | 'end'): number | null {
  const candidate = parseOptionalText(value);
  if (!candidate) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(candidate)) {
    const normalized = edge === 'start' ? `${candidate}T00:00:00.000Z` : `${candidate}T23:59:59.999Z`;
    const parsed = Date.parse(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  const parsed = Date.parse(candidate);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseErrorsOnly(value: string | null): boolean {
  return value === '1' || value === 'true';
}

function readMetadataString(event: ControlPlaneAdminAuditEvent, key: string): string | null {
  const metadataValue = event.metadata?.[key];
  if (typeof metadataValue === 'string' && metadataValue.trim().length > 0) {
    return metadataValue.trim();
  }

  if (key === 'requestId' || key === 'requestMethod' || key === 'requestPath') {
    const requestMetadata = event.metadata?.request;
    if (requestMetadata && typeof requestMetadata === 'object' && !Array.isArray(requestMetadata)) {
      const nested = (requestMetadata as Record<string, unknown>)[
        key === 'requestId' ? 'id' : key === 'requestMethod' ? 'method' : 'path'
      ];
      if (typeof nested === 'string' && nested.trim().length > 0) {
        return nested.trim();
      }
    }
  }

  return null;
}

function listChangedFields(event: ControlPlaneAdminAuditEvent): string[] {
  const changes = event.metadata?.changes;
  if (!changes || typeof changes !== 'object' || Array.isArray(changes)) {
    return [];
  }

  return Object.keys(changes as Record<string, unknown>);
}

function parseActorRole(value: string | null): string | null {
  const role = parseOptionalText(value);
  return role ? role.toLowerCase() : null;
}

interface AuditFilters {
  status: ControlPlaneAdminAuditStatus | null;
  action: ControlPlaneAdminAuditAction | null;
  actorRole: string | null;
  actorId: string | null;
  requestId: string | null;
  changedField: string | null;
  search: string | null;
  fromTimestamp: number | null;
  toTimestamp: number | null;
  errorsOnly: boolean;
}

function matchesSearch(event: ControlPlaneAdminAuditEvent, search: string | null): boolean {
  if (!search) {
    return true;
  }

  const normalized = search.toLowerCase();
  const fields = [
    event.id,
    event.action,
    event.status,
    event.actorRole,
    event.actorId ?? '',
    event.tenantId ?? '',
    event.domainId ?? '',
    event.error ?? '',
    event.createdAt,
    readMetadataString(event, 'requestId') ?? '',
    readMetadataString(event, 'requestPath') ?? '',
    readMetadataString(event, 'requestMethod') ?? '',
    ...listChangedFields(event),
  ];

  return fields.some((field) => field.toLowerCase().includes(normalized));
}

function filterEvents(events: ControlPlaneAdminAuditEvent[], filters: AuditFilters): ControlPlaneAdminAuditEvent[] {
  return events.filter((event) => {
    if (filters.status && event.status !== filters.status) {
      return false;
    }

    if (filters.action && event.action !== filters.action) {
      return false;
    }

    if (filters.actorRole && event.actorRole.toLowerCase() !== filters.actorRole) {
      return false;
    }

    if (filters.actorId && !(event.actorId ?? '').toLowerCase().includes(filters.actorId.toLowerCase())) {
      return false;
    }

    if (filters.requestId) {
      const requestId = readMetadataString(event, 'requestId');
      if (!requestId || !requestId.toLowerCase().includes(filters.requestId.toLowerCase())) {
        return false;
      }
    }

    if (filters.changedField) {
      const changedFields = listChangedFields(event);
      if (!changedFields.some((field) => field.toLowerCase() === filters.changedField?.toLowerCase())) {
        return false;
      }
    }

    const createdAtTimestamp = Date.parse(event.createdAt);
    if (Number.isFinite(createdAtTimestamp)) {
      if (filters.fromTimestamp !== null && createdAtTimestamp < filters.fromTimestamp) {
        return false;
      }
      if (filters.toTimestamp !== null && createdAtTimestamp > filters.toTimestamp) {
        return false;
      }
    }

    if (filters.errorsOnly && !event.error) {
      return false;
    }

    if (!matchesSearch(event, filters.search)) {
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
    const actorRole = parseActorRole(searchParams.get('actorRole'));
    const actorId = parseOptionalText(searchParams.get('actorId'));
    const requestId = parseOptionalText(searchParams.get('requestId'));
    const changedField = parseOptionalText(searchParams.get('changedField'));
    const search = parseOptionalText(searchParams.get('search'));
    const fromTimestamp = parseDateTimestamp(searchParams.get('from'), 'start');
    const toTimestamp = parseDateTimestamp(searchParams.get('to'), 'end');
    const errorsOnly = parseErrorsOnly(searchParams.get('errorsOnly'));
    const filters: AuditFilters = {
      status,
      action,
      actorRole,
      actorId,
      requestId,
      changedField,
      search,
      fromTimestamp,
      toTimestamp,
      errorsOnly,
    };

    if (tenantId) {
      const tenantEvents = await dependencies.listControlPlaneAdminAuditEventsByTenant(tenantId, limit);
      return NextResponse.json({
        ok: true,
        scope: 'tenant',
        tenantId,
        events: filterEvents(tenantEvents, filters),
      });
    }

    const snapshots = await dependencies.listTenantSnapshotsForAdmin();
    const upstreamLimit = Math.max(limit, Math.min(limit * 3, 300));
    const eventGroups = await Promise.all(
      snapshots.map((snapshot) => dependencies.listControlPlaneAdminAuditEventsByTenant(snapshot.tenant.id, upstreamLimit))
    );

    const globalEvents = filterEvents(
      eventGroups
      .flat()
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()),
      filters
    ).slice(0, limit);

    return NextResponse.json({
      ok: true,
      scope: 'global',
      tenantId: null,
      events: globalEvents,
    });
  };
}

export const GET = createAdminAuditGetHandler();
