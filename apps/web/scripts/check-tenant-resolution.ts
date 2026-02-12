import { resolveTenantFromHost } from '../app/lib/tenant/resolve-tenant';

type Expected = {
  tenantId: string;
  tenantSlug: string;
  tenantDomain: string;
  source: 'host_match' | 'localhost_fallback' | 'default_fallback';
};

async function assertTenantResolution(host: string | null, expected: Expected): Promise<void> {
  const actual = await resolveTenantFromHost(host);
  const isMatch =
    actual.tenantId === expected.tenantId &&
    actual.tenantSlug === expected.tenantSlug &&
    actual.tenantDomain === expected.tenantDomain &&
    actual.source === expected.source;

  if (!isMatch) {
    throw new Error(
      [
        `resolveTenantFromHost failed for host "${host}"`,
        `expected=${JSON.stringify(expected)}`,
        `actual=${JSON.stringify(actual)}`,
      ].join('\n')
    );
  }
}

async function main(): Promise<void> {
  await assertTenantResolution('fairfield.localhost', {
    tenantId: 'tenant_fairfield',
    tenantSlug: 'fairfield',
    tenantDomain: 'fairfield.localhost',
    source: 'host_match',
  });

  await assertTenantResolution('www.fairfield.localhost', {
    tenantId: 'tenant_fairfield',
    tenantSlug: 'fairfield',
    tenantDomain: 'fairfield.localhost',
    source: 'host_match',
  });

  await assertTenantResolution('localhost:3000', {
    tenantId: 'tenant_fairfield',
    tenantSlug: 'fairfield',
    tenantDomain: 'fairfield.localhost',
    source: 'localhost_fallback',
  });

  await assertTenantResolution('example.com', {
    tenantId: 'tenant_fairfield',
    tenantSlug: 'fairfield',
    tenantDomain: 'fairfield.localhost',
    source: 'default_fallback',
  });

  await assertTenantResolution(null, {
    tenantId: 'tenant_fairfield',
    tenantSlug: 'fairfield',
    tenantDomain: 'fairfield.localhost',
    source: 'default_fallback',
  });

  console.log('Tenant resolution checks passed.');
}

void main();
