export const TENANT_HEADER_NAMES = {
  tenantId: 'x-tenant-id',
  tenantSlug: 'x-tenant-slug',
  tenantDomain: 'x-tenant-domain',
  tenantResolution: 'x-tenant-resolution',
} as const;

export type TenantResolutionSource = 'host_match' | 'localhost_fallback' | 'default_fallback';

export interface TenantContext {
  tenantId: string;
  tenantSlug: string;
  tenantDomain: string;
  source: TenantResolutionSource;
}

type TenantRecord = Omit<TenantContext, 'source'>;

const DEFAULT_TENANT: TenantRecord = {
  tenantId: 'tenant_fairfield',
  tenantSlug: 'fairfield',
  tenantDomain: 'fairfield.localhost',
};

const TENANTS_BY_HOST: Record<string, TenantRecord> = {
  'fairfield.localhost': DEFAULT_TENANT,
};

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

export function resolveTenantFromHost(hostHeader: string | null): TenantContext {
  const normalizedHost = normalizeHost(hostHeader);

  if (!normalizedHost) {
    return withSource(DEFAULT_TENANT, 'default_fallback');
  }

  const directMatch = TENANTS_BY_HOST[normalizedHost];
  if (directMatch) {
    return withSource(directMatch, 'host_match');
  }

  if (normalizedHost.startsWith('www.')) {
    const withoutWww = normalizedHost.slice(4);
    const wwwStrippedMatch = TENANTS_BY_HOST[withoutWww];
    if (wwwStrippedMatch) {
      return withSource(wwwStrippedMatch, 'host_match');
    }
  }

  if (LOCALHOST_HOSTS.has(normalizedHost) || normalizedHost.endsWith('.localhost')) {
    return withSource(DEFAULT_TENANT, 'localhost_fallback');
  }

  return withSource(DEFAULT_TENANT, 'default_fallback');
}

export function getTenantContextFromRequest(request: Request): TenantContext {
  const tenantId = request.headers.get(TENANT_HEADER_NAMES.tenantId);
  const tenantSlug = request.headers.get(TENANT_HEADER_NAMES.tenantSlug);
  const tenantDomain = request.headers.get(TENANT_HEADER_NAMES.tenantDomain);
  const source = request.headers.get(TENANT_HEADER_NAMES.tenantResolution);

  if (tenantId && tenantSlug && tenantDomain && isTenantResolutionSource(source)) {
    return {
      tenantId,
      tenantSlug,
      tenantDomain,
      source,
    };
  }

  return resolveTenantFromHost(request.headers.get('host'));
}
