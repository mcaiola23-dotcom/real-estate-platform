import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const SEED_TIMESTAMP = new Date('2026-02-12T00:00:00.000Z');

const tenants = [
  {
    id: 'tenant_fairfield',
    slug: 'fairfield',
    name: 'Fairfield Baseline',
    status: 'active',
  },
];

const domains = [
  {
    id: 'tenant_domain_fairfield_localhost',
    tenantId: 'tenant_fairfield',
    hostname: 'fairfield.localhost',
    hostnameNormalized: 'fairfield.localhost',
    isPrimary: true,
    isVerified: true,
    verifiedAt: SEED_TIMESTAMP,
  },
];

async function main() {
  for (const tenant of tenants) {
    await prisma.tenant.upsert({
      where: { id: tenant.id },
      update: {
        slug: tenant.slug,
        name: tenant.name,
        status: tenant.status,
        updatedAt: SEED_TIMESTAMP,
      },
      create: {
        ...tenant,
        createdAt: SEED_TIMESTAMP,
        updatedAt: SEED_TIMESTAMP,
      },
    });
  }

  for (const domain of domains) {
    await prisma.tenantDomain.upsert({
      where: { id: domain.id },
      update: {
        tenantId: domain.tenantId,
        hostname: domain.hostname,
        hostnameNormalized: domain.hostnameNormalized,
        isPrimary: domain.isPrimary,
        isVerified: domain.isVerified,
        verifiedAt: domain.verifiedAt,
        updatedAt: SEED_TIMESTAMP,
      },
      create: {
        ...domain,
        createdAt: SEED_TIMESTAMP,
        updatedAt: SEED_TIMESTAMP,
      },
    });
  }
}

main()
  .catch((error) => {
    console.error('Failed to seed tenant data:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
