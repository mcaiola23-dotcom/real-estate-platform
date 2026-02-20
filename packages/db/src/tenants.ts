import type { Tenant, TenantDomain, TenantRecord } from '@real-estate/types/tenant';

import { DEFAULT_TENANT_ID, SEED_TENANT_DOMAINS, SEED_TENANTS } from './seed-data';
import { getPrismaClient } from './prisma-client';

function normalizeHostname(hostname: string): string {
  return hostname.trim().toLowerCase();
}

type TenantIdentity = Pick<Tenant, 'id' | 'slug'>;
type DomainIdentity = Pick<TenantDomain, 'hostname'>;

function toTenantRecord(tenant: TenantIdentity, domain: DomainIdentity): TenantRecord {
  return {
    tenantId: tenant.id,
    tenantSlug: tenant.slug,
    tenantDomain: domain.hostname,
  };
}

function getPrimaryDomainForSeedTenant(tenantId: string): TenantDomain | undefined {
  return SEED_TENANT_DOMAINS.find(
    (domain) => domain.tenantId === tenantId && domain.status === 'active' && domain.isPrimary && domain.isVerified
  );
}

function resolveSeedDefaultTenantRecord(): TenantRecord {
  const tenant = SEED_TENANTS.find((entry) => entry.id === DEFAULT_TENANT_ID && entry.status === 'active') ?? SEED_TENANTS[0];
  if (!tenant) {
    throw new Error('Tenant seed is empty. Add at least one tenant record.');
  }

  const primaryDomain = getPrimaryDomainForSeedTenant(tenant.id);
  if (!primaryDomain) {
    throw new Error(`No primary domain found for tenant ${tenant.id}.`);
  }

  return toTenantRecord(tenant, primaryDomain);
}

function resolveSeedTenantRecordByHostname(hostname: string): TenantRecord | null {
  const domain = SEED_TENANT_DOMAINS.find(
    (entry) => normalizeHostname(entry.hostname) === hostname && entry.status === 'active' && entry.isVerified
  );
  if (!domain) {
    return null;
  }

  const tenant = SEED_TENANTS.find((entry) => entry.id === domain.tenantId && entry.status === 'active');
  if (!tenant) {
    return null;
  }

  return toTenantRecord(tenant, domain);
}

export async function getDefaultTenantRecord(): Promise<TenantRecord> {
  const prisma = await getPrismaClient();
  if (!prisma) {
    return resolveSeedDefaultTenantRecord();
  }
  const prismaAny = prisma as any;

  try {
    const byDefaultId = await prismaAny.tenant.findUnique({
      where: { id: DEFAULT_TENANT_ID },
      include: {
        domains: {
          where: {
            isPrimary: true,
            isVerified: true,
          },
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
      },
    });

    if (byDefaultId && byDefaultId.status === 'active' && byDefaultId.domains[0]) {
      return toTenantRecord(byDefaultId, byDefaultId.domains[0]);
    }

    const firstActiveTenant = await prismaAny.tenant.findFirst({
      where: { status: 'active' },
      include: {
        domains: {
          where: {
            isPrimary: true,
            isVerified: true,
          },
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    if (firstActiveTenant && firstActiveTenant.domains[0]) {
      return toTenantRecord(firstActiveTenant, firstActiveTenant.domains[0]);
    }
  } catch {
    return resolveSeedDefaultTenantRecord();
  }

  return resolveSeedDefaultTenantRecord();
}

export async function getTenantRecordByHostname(hostname: string): Promise<TenantRecord | null> {
  const normalized = normalizeHostname(hostname);
  const prisma = await getPrismaClient();
  if (prisma) {
    const prismaAny = prisma as any;
    try {
      const domain = await prismaAny.tenantDomain.findFirst({
        where: {
          hostnameNormalized: normalized,
          status: 'active',
          isVerified: true,
          tenant: {
            status: 'active',
          },
        },
        include: {
          tenant: {
            select: {
              id: true,
              slug: true,
            },
          },
        },
      });

      if (domain?.tenant) {
        return toTenantRecord(domain.tenant, domain);
      }
    } catch {
      return resolveSeedTenantRecordByHostname(normalized);
    }
  }

  return resolveSeedTenantRecordByHostname(normalized);
}

export function listTenantSeeds(): { tenants: Tenant[]; domains: TenantDomain[] } {
  return {
    tenants: [...SEED_TENANTS],
    domains: [...SEED_TENANT_DOMAINS],
  };
}
