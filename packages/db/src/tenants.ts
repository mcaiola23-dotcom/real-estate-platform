import type { Tenant, TenantDomain, TenantRecord } from '@real-estate/types/tenant';

const SEED_TIMESTAMP = '2026-02-12T00:00:00.000Z';
const DEFAULT_TENANT_ID = 'tenant_fairfield';

const TENANTS: Tenant[] = [
  {
    id: 'tenant_fairfield',
    slug: 'fairfield',
    name: 'Fairfield Baseline',
    status: 'active',
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
];

const TENANT_DOMAINS: TenantDomain[] = [
  {
    id: 'tenant_domain_fairfield_localhost',
    tenantId: 'tenant_fairfield',
    hostname: 'fairfield.localhost',
    isPrimary: true,
    isVerified: true,
    verifiedAt: SEED_TIMESTAMP,
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
];

function normalizeHostname(hostname: string): string {
  return hostname.trim().toLowerCase();
}

function toTenantRecord(tenant: Tenant, domain: TenantDomain): TenantRecord {
  return {
    tenantId: tenant.id,
    tenantSlug: tenant.slug,
    tenantDomain: domain.hostname,
  };
}

function getPrimaryDomainForTenant(tenantId: string): TenantDomain | undefined {
  return TENANT_DOMAINS.find((domain) => domain.tenantId === tenantId && domain.isPrimary);
}

export function getDefaultTenantRecord(): TenantRecord {
  const tenant = TENANTS.find((entry) => entry.id === DEFAULT_TENANT_ID && entry.status === 'active') ?? TENANTS[0];
  if (!tenant) {
    throw new Error('Tenant seed is empty. Add at least one tenant record.');
  }

  const primaryDomain = getPrimaryDomainForTenant(tenant.id);
  if (!primaryDomain) {
    throw new Error(`No primary domain found for tenant ${tenant.id}.`);
  }

  return toTenantRecord(tenant, primaryDomain);
}

export function getTenantRecordByHostname(hostname: string): TenantRecord | null {
  const normalized = normalizeHostname(hostname);
  const domain = TENANT_DOMAINS.find((entry) => normalizeHostname(entry.hostname) === normalized && entry.isVerified);
  if (!domain) {
    return null;
  }

  const tenant = TENANTS.find((entry) => entry.id === domain.tenantId && entry.status === 'active');
  if (!tenant) {
    return null;
  }

  return toTenantRecord(tenant, domain);
}

export function listTenantSeeds(): { tenants: Tenant[]; domains: TenantDomain[] } {
  return {
    tenants: [...TENANTS],
    domains: [...TENANT_DOMAINS],
  };
}
