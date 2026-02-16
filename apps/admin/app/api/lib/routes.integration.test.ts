import assert from 'node:assert/strict';
import test from 'node:test';

import type { ControlPlaneAdminAuditEvent, ControlPlaneTenantSnapshot } from '@real-estate/types/control-plane';

import { createAdminAuditGetHandler } from '../admin-audit/route';
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

const snapshotFixtureBravo: ControlPlaneTenantSnapshot = {
  ...snapshotFixture,
  tenant: {
    ...snapshotFixture.tenant,
    id: 'tenant_bravo',
    slug: 'bravo',
    name: 'Bravo Realty',
  },
};

function buildAuditEvent(overrides: Partial<ControlPlaneAdminAuditEvent> = {}): ControlPlaneAdminAuditEvent {
  return {
    id: 'admin_audit_default',
    action: 'tenant.settings.update',
    status: 'succeeded',
    actorId: 'admin_1',
    actorRole: 'admin',
    tenantId: 'tenant_alpha',
    domainId: null,
    error: null,
    metadata: null,
    createdAt: '2026-02-14T00:00:00.000Z',
    ...overrides,
  };
}

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
      headers: { 'content-type': 'application/json', 'x-admin-role': 'admin' },
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
      headers: { 'content-type': 'application/json', 'x-admin-role': 'admin' },
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
      headers: { 'content-type': 'application/json', 'x-admin-role': 'admin' },
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
      headers: { 'content-type': 'application/json', 'x-admin-role': 'admin' },
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
      headers: { 'content-type': 'application/json', 'x-admin-role': 'admin' },
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
      headers: { 'content-type': 'application/json', 'x-admin-role': 'admin' },
      body: JSON.stringify({ planCode: 'growth' }),
    }),
    { params: Promise.resolve({ tenantId: 'tenant_alpha' }) }
  );

  assert.equal(response.status, 400);
  const json = (await response.json()) as { ok: false; error: string };
  assert.equal(json.ok, false);
  assert.equal(json.error, 'boom');
});

test('tenants POST rejects non-admin actor and records denied audit event', async () => {
  const auditEvents: Array<{ status: string; action: string }> = [];
  const post = createTenantsPostHandler({
    listTenantSnapshotsForAdmin: async () => [snapshotFixture],
    provisionTenant: async () => snapshotFixture,
    getMutationActorFromRequest: async () => ({ actorId: 'user_1', role: 'viewer' }),
    writeAdminAuditLog: async (event) => {
      auditEvents.push({ status: event.status, action: event.action });
    },
  });

  const response = await post(
    new Request('http://localhost/api/tenants', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ slug: 'alpha', name: 'Alpha', primaryDomain: 'alpha.localhost' }),
    })
  );

  assert.equal(response.status, 403);
  assert.deepEqual(auditEvents, [{ status: 'denied', action: 'tenant.provision' }]);
});

test('settings PATCH rejects non-admin actor', async () => {
  const patch = createSettingsPatchHandler({
    getTenantControlSettings: async () => snapshotFixture.settings,
    updateTenantControlSettings: async () => snapshotFixture.settings,
    getMutationActorFromRequest: async () => ({ actorId: 'user_2', role: 'support' }),
  });

  const response = await patch(
    new Request('http://localhost/api/tenants/tenant_alpha/settings', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ planCode: 'growth' }),
    }),
    { params: Promise.resolve({ tenantId: 'tenant_alpha' }) }
  );

  assert.equal(response.status, 403);
  const json = (await response.json()) as { ok: false; error: string };
  assert.equal(json.error, 'Admin role is required for this mutation.');
});

test('settings PATCH succeeds even when audit sink fails', async () => {
  const patch = createSettingsPatchHandler({
    getTenantControlSettings: async () => snapshotFixture.settings,
    updateTenantControlSettings: async () => ({
      ...snapshotFixture.settings,
      planCode: 'growth',
    }),
    getMutationActorFromRequest: async () => ({ actorId: 'admin_1', role: 'admin' }),
    writeAdminAuditLog: async () => {
      throw new Error('audit_sink_down');
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

  assert.equal(response.status, 200);
  const json = (await response.json()) as { ok: true; settings: { planCode: string } };
  assert.equal(json.settings.planCode, 'growth');
});

test('admin audit GET returns tenant-scoped filtered timeline', async () => {
  const calls: Array<{ tenantId: string; limit: number }> = [];
  const get = createAdminAuditGetHandler({
    listTenantSnapshotsForAdmin: async () => [snapshotFixture, snapshotFixtureBravo],
    listControlPlaneAdminAuditEventsByTenant: async (tenantId: string, limit?: number) => {
      calls.push({ tenantId, limit: limit ?? 100 });
      return [
        buildAuditEvent({
          id: 'admin_audit_match',
          tenantId,
          status: 'succeeded',
          action: 'tenant.settings.update',
          createdAt: '2026-02-14T10:00:00.000Z',
        }),
        buildAuditEvent({
          id: 'admin_audit_filtered_status',
          tenantId,
          status: 'failed',
          action: 'tenant.settings.update',
          createdAt: '2026-02-14T11:00:00.000Z',
        }),
        buildAuditEvent({
          id: 'admin_audit_filtered_action',
          tenantId,
          status: 'succeeded',
          action: 'tenant.domain.add',
          createdAt: '2026-02-14T12:00:00.000Z',
        }),
      ];
    },
  });

  const response = await get(
    new Request(
      'http://localhost/api/admin-audit?tenantId=tenant_alpha&limit=7&status=succeeded&action=tenant.settings.update'
    )
  );

  assert.equal(response.status, 200);
  const json = (await response.json()) as {
    ok: true;
    scope: 'tenant';
    tenantId: string;
    events: ControlPlaneAdminAuditEvent[];
  };
  assert.equal(json.ok, true);
  assert.equal(json.scope, 'tenant');
  assert.equal(json.tenantId, 'tenant_alpha');
  assert.equal(json.events.length, 1);
  assert.equal(json.events[0]?.id, 'admin_audit_match');
  assert.deepEqual(calls, [{ tenantId: 'tenant_alpha', limit: 7 }]);
});

test('admin audit GET returns global recent feed across tenants with limit', async () => {
  const calls: Array<{ tenantId: string; limit: number }> = [];
  const get = createAdminAuditGetHandler({
    listTenantSnapshotsForAdmin: async () => [snapshotFixture, snapshotFixtureBravo],
    listControlPlaneAdminAuditEventsByTenant: async (tenantId: string, limit?: number) => {
      calls.push({ tenantId, limit: limit ?? 100 });

      if (tenantId === 'tenant_alpha') {
        return [
          buildAuditEvent({
            id: 'alpha_oldest',
            tenantId,
            createdAt: '2026-02-14T00:01:00.000Z',
          }),
          buildAuditEvent({
            id: 'alpha_latest',
            tenantId,
            createdAt: '2026-02-14T00:04:00.000Z',
          }),
        ];
      }

      return [
        buildAuditEvent({
          id: 'bravo_middle',
          tenantId,
          createdAt: '2026-02-14T00:03:00.000Z',
        }),
      ];
    },
  });

  const response = await get(new Request('http://localhost/api/admin-audit?limit=2'));

  assert.equal(response.status, 200);
  const json = (await response.json()) as {
    ok: true;
    scope: 'global';
    tenantId: null;
    events: ControlPlaneAdminAuditEvent[];
  };

  assert.equal(json.ok, true);
  assert.equal(json.scope, 'global');
  assert.equal(json.tenantId, null);
  assert.deepEqual(
    json.events.map((event) => event.id),
    ['alpha_latest', 'bravo_middle']
  );
  assert.deepEqual(calls, [
    { tenantId: 'tenant_alpha', limit: 2 },
    { tenantId: 'tenant_bravo', limit: 2 },
  ]);
});
