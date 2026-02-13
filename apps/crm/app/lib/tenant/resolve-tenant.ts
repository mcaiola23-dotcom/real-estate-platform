import { getDefaultTenantRecord, getTenantRecordByHostname } from '@real-estate/db';
import type { TenantContext, TenantRecord, TenantResolutionSource } from '@real-estate/types';

export const TENANT_HEADER_NAMES = {
  tenantId: 'x-tenant-id',
  tenantSlug: 'x-tenant-slug',
  tenantDomain: 'x-tenant-domain',
  tenantResolution: 'x-tenant-resolution',
} as const;

const LOCALHOST_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

function normalizeHost(hostHeader: string | null): string | null {
  if (!hostHeader) {
    return null;
  }

  const firstValue = hostHeader.split(',')[0]?.trim();
  if (!firstValue) {
    return null;
  }

  try {
    const parsed = new URL(`http://${firstValue}`);
    return parsed.hostname.toLowerCase();
  } catch {
    return null;
  }
}

function withSource(tenant: TenantRecord, source: TenantResolutionSource): TenantContext {
  return {
    ...tenant,
    source,
  };
}

function isTenantResolutionSource(value: string | null): value is TenantResolutionSource {
  return value === 'host_match' || value === 'localhost_fallback' || value === 'default_fallback';
}

export async function resolveTenantFromHost(hostHeader: string | null): Promise<TenantContext> {
  const normalizedHost = normalizeHost(hostHeader);
  const defaultTenant = await getDefaultTenantRecord();

  if (!normalizedHost) {
    return withSource(defaultTenant, 'default_fallback');
  }

  const directMatch = await getTenantRecordByHostname(normalizedHost);
  if (directMatch) {
    return withSource(directMatch, 'host_match');
  }

  if (normalizedHost.startsWith('www.')) {
    const withoutWww = normalizedHost.slice(4);
    const wwwStrippedMatch = await getTenantRecordByHostname(withoutWww);
    if (wwwStrippedMatch) {
      return withSource(wwwStrippedMatch, 'host_match');
    }
  }

  if (LOCALHOST_HOSTS.has(normalizedHost) || normalizedHost.endsWith('.localhost')) {
    return withSource(defaultTenant, 'localhost_fallback');
  }

  return withSource(defaultTenant, 'default_fallback');
}

export async function getTenantContextFromRequest(request: Request): Promise<TenantContext> {
  return getTenantContextFromHeaders(request.headers);
}

export async function getTenantContextFromHeaders(headers: Headers): Promise<TenantContext> {
  const tenantId = headers.get(TENANT_HEADER_NAMES.tenantId);
  const tenantSlug = headers.get(TENANT_HEADER_NAMES.tenantSlug);
  const tenantDomain = headers.get(TENANT_HEADER_NAMES.tenantDomain);
  const source = headers.get(TENANT_HEADER_NAMES.tenantResolution);

  if (tenantId && tenantSlug && tenantDomain && isTenantResolutionSource(source)) {
    return {
      tenantId,
      tenantSlug,
      tenantDomain,
      source,
    };
  }

  return resolveTenantFromHost(headers.get('host'));
}
