import assert from 'node:assert/strict';
import test from 'node:test';

import type { ControlPlaneTenantSnapshot } from '@real-estate/types/control-plane';

import { createTenantsGetHandler, createTenantsPostHandler } from '../tenants/route';
import { createDomainsPostHandler } from '../tenants/[tenantId]/domains/route';
import { createDomainPatchHandler } from '../tenants/[tenantId]/domains/[domainId]/route';
import { createSettingsGetHandler, createSettingsPatchHandler } from '../tenants/[tenantId]/settings/route';

const snapshotFixture: ControlPlaneTenantSnapshot = {
  tenant: {
    id: 'tenant_alpha',
    slug: 'alpha',
    name: 'Alpha Realty',
    status: 'active',
    createdAt: '2026-02-13T00:00:00.000Z',
    updatedAt: '2026-02-13T00:00:00.000Z',
  },
  domains: [
    {
      id: 'tenant_domain_alpha_1',
      tenantId: 'tenant_alpha',
      hostname: 'alpha.localhost',
      isPrimary: true,
      isVerified: true,
      verifiedAt: '2026-02-13T00:00:00.000Z',
      createdAt: '2026-02-13T00:00:00.000Z',
      updatedAt: '2026-02-13T00:00:00.000Z',
    },
  ],
  settings: {
    id: 'tenant_control_settings_tenant_alpha',
    tenantId: 'tenant_alpha',
    planCode: 'starter',
    featureFlags: [],
    createdAt: '2026-02-13T00:00:00.000Z',
    updatedAt: '2026-02-13T00:00:00.000Z',
  },
};

test('tenants GET returns snapshots', async () => {
  const get = createTenantsGetHandler({
    listTenantSnapshotsForAdmin: async () => [snapshotFixture],
    provisionTenant: async () => snapshotFixture,
  });

  const response = await get();
  assert.equal(response.status, 200);

  const json = (await response.json()) as { tenants: ControlPlaneTenantSnapshot[] };
  assert.equal(json.tenants.length, 1);
  assert.equal(json.tenants[0]?.tenant.id, 'tenant_alpha');
});

test('tenants POST validates required body fields', async () => {
  const post = createTenantsPostHandler({
    listTenantSnapshotsForAdmin: async () => [snapshotFixture],
    provisionTenant: async () => snapshotFixture,
  });

  const response = await post(
    new Request('http://localhost/api/tenants', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ slug: 'alpha' }),
    })
  );

  assert.equal(response.status, 400);
  const json = (await response.json()) as { ok: false; error: string };
  assert.equal(json.ok, false);
  assert.equal(json.error, 'name, slug, and primaryDomain are required.');
});

test('tenants POST provisions tenant when body is valid', async () => {
  const post = createTenantsPostHandler({
    listTenantSnapshotsForAdmin: async () => [snapshotFixture],
    provisionTenant: async (input: { slug: string; name: string; planCode?: string; featureFlags?: string[] }) => {
      return {
        ...snapshotFixture,
        tenant: {
          ...snapshotFixture.tenant,
          slug: input.slug,
          name: input.name,
        },
        settings: {
          ...snapshotFixture.settings,
          planCode: input.planCode ?? snapshotFixture.settings.planCode,
          featureFlags: input.featureFlags ?? [],
        },
      };
    },
  });

  const response = await post(
    new Request('http://localhost/api/tenants', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        slug: 'alpha',
        name: 'Alpha Realty',
        primaryDomain: 'alpha.localhost',
        planCode: 'growth',
        featureFlags: ['beta_ui'],
      }),
    })
  );

  assert.equal(response.status, 200);
  const json = (await response.json()) as { ok: true; tenant: ControlPlaneTenantSnapshot };
  assert.equal(json.tenant.tenant.slug, 'alpha');
  assert.deepEqual(json.tenant.settings.featureFlags, ['beta_ui']);
});

test('domains POST validates hostname', async () => {
  const post = createDomainsPostHandler({
    addTenantDomain: async () => snapshotFixture.domains[0]!,
  });

  const response = await post(
    new Request('http://localhost/api/tenants/tenant_alpha/domains', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ isPrimary: true }),
    }),
    { params: Promise.resolve({ tenantId: 'tenant_alpha' }) }
  );

  assert.equal(response.status, 400);
});

test('domains POST creates domain for tenant', async () => {
  const post = createDomainsPostHandler({
    addTenantDomain: async (
      _tenantId: string,
      input: { hostname: string; isPrimary?: boolean; isVerified?: boolean }
    ) => {
      return {
        id: 'tenant_domain_alpha_2',
        tenantId: 'tenant_alpha',
        hostname: input.hostname,
        isPrimary: false,
        isVerified: false,
        verifiedAt: null,
        createdAt: '2026-02-13T00:00:00.000Z',
        updatedAt: '2026-02-13T00:00:00.000Z',
      };
    },
  });

  const response = await post(
    new Request('http://localhost/api/tenants/tenant_alpha/domains', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ hostname: 'alpha-secondary.localhost' }),
    }),
    { params: Promise.resolve({ tenantId: 'tenant_alpha' }) }
  );

  assert.equal(response.status, 200);
  const json = (await response.json()) as { ok: true; domain: { hostname: string } };
  assert.equal(json.domain.hostname, 'alpha-secondary.localhost');
});

test('domain PATCH returns 404 when domain missing', async () => {
  const patch = createDomainPatchHandler({
    updateTenantDomainStatus: async () => null,
  });

  const response = await patch(
    new Request('http://localhost/api/tenants/tenant_alpha/domains/domain_missing', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ isVerified: true }),
    }),
    { params: Promise.resolve({ tenantId: 'tenant_alpha', domainId: 'domain_missing' }) }
  );

  assert.equal(response.status, 404);
});

test('settings GET returns tenant settings', async () => {
  const get = createSettingsGetHandler({
    getTenantControlSettings: async () => snapshotFixture.settings,
    updateTenantControlSettings: async () => snapshotFixture.settings,
  });

  const response = await get(new Request('http://localhost/api/tenants/tenant_alpha/settings'), {
    params: Promise.resolve({ tenantId: 'tenant_alpha' }),
  });

  assert.equal(response.status, 200);
  const json = (await response.json()) as { ok: true; settings: { planCode: string } };
  assert.equal(json.settings.planCode, 'starter');
});

test('settings PATCH maps failures to 400', async () => {
  const patch = createSettingsPatchHandler({
    getTenantControlSettings: async () => snapshotFixture.settings,
    updateTenantControlSettings: async () => {
      throw new Error('boom');
    },
  });

  const response = await patch(
    new Request('http://localhost/api/tenants/tenant_alpha/settings', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ planCode: 'growth' }),
    }),
    { params: Promise.resolve({ tenantId: 'tenant_alpha' }) }
  );

  assert.equal(response.status, 400);
  const json = (await response.json()) as { ok: false; error: string };
  assert.equal(json.ok, false);
  assert.equal(json.error, 'boom');
});
