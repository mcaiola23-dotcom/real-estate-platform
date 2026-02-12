import type { Tenant, TenantDomain } from '@real-estate/types/tenant';

export const SEED_TIMESTAMP = '2026-02-12T00:00:00.000Z';
export const DEFAULT_TENANT_ID = 'tenant_fairfield';

export const SEED_TENANTS: Tenant[] = [
  {
    id: 'tenant_fairfield',
    slug: 'fairfield',
    name: 'Fairfield Baseline',
    status: 'active',
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
];

export const SEED_TENANT_DOMAINS: TenantDomain[] = [
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
