import assert from 'node:assert/strict';
import test from 'node:test';

import type {
  ControlPlaneAdminAuditEvent,
  ControlPlaneObservabilitySummary,
  ControlPlaneTenantSnapshot,
  TenantControlActor,
} from '@real-estate/types/control-plane';

import { createAdminAuditGetHandler } from '../admin-audit/route';
import { createObservabilityGetHandler } from '../observability/route';
import { createTenantsGetHandler, createTenantsPostHandler } from '../tenants/route';
import { createTenantStatusPatchHandler } from '../tenants/[tenantId]/status/route';
import { createActorsGetHandler, createActorsPostHandler } from '../tenants/[tenantId]/actors/route';
import { createActorDeleteHandler, createActorPatchHandler } from '../tenants/[tenantId]/actors/[actorId]/route';
import {
  createSupportSessionDeleteHandler,
  createSupportSessionPostHandler,
} from '../tenants/[tenantId]/actors/[actorId]/support-session/route';
import { createDomainsPostHandler } from '../tenants/[tenantId]/domains/route';
import { createDomainPatchHandler } from '../tenants/[tenantId]/domains/[domainId]/route';
import { createDomainProbePostHandler } from '../tenants/[tenantId]/domains/probe/route';
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
      status: 'active',
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
    status: 'active',
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

function buildActorFixture(overrides: Partial<TenantControlActor> = {}): TenantControlActor {
  return {
    id: 'tenant_actor_alpha_1',
    tenantId: 'tenant_alpha',
    actorId: 'user_alpha_1',
    displayName: 'Alpha Operator',
    email: 'alpha.operator@example.com',
    role: 'operator',
    permissions: ['tenant.onboarding.manage', 'tenant.domain.manage', 'tenant.audit.read'],
    supportSessionActive: false,
    supportSessionStartedAt: null,
    supportSessionExpiresAt: null,
    createdAt: '2026-02-20T00:00:00.000Z',
    updatedAt: '2026-02-20T00:00:00.000Z',
    ...overrides,
  };
}

function buildObservabilitySummaryFixture(): ControlPlaneObservabilitySummary {
  return {
    generatedAt: '2026-02-20T00:00:00.000Z',
    totals: {
      tenants: 2,
      domains: 3,
      verifiedPrimaryDomains: 1,
      averageReadinessScore: 62.5,
    },
    mutationTrends: [
      { status: 'allowed', count: 5 },
      { status: 'denied', count: 1 },
      { status: 'succeeded', count: 4 },
      { status: 'failed', count: 2 },
    ],
    ingestion: {
      runtimeReady: true,
      runtimeReason: null,
      runtimeMessage: 'ready',
      queueStatusCounts: [
        { status: 'pending', count: 3 },
        { status: 'processing', count: 1 },
        { status: 'processed', count: 12 },
        { status: 'dead_letter', count: 2 },
      ],
      deadLetterCount: 2,
    },
    tenantReadiness: [
      {
        tenantId: 'tenant_alpha',
        tenantName: 'Alpha Realty',
        tenantSlug: 'alpha',
        score: 75,
        checks: [
          { label: 'Primary domain exists', ok: true },
          { label: 'Primary domain verified', ok: true },
          { label: 'Plan assigned', ok: true },
          { label: 'Feature flags configured', ok: false },
        ],
      },
    ],
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

test('tenant status PATCH archives tenant when body is valid', async () => {
  const patch = createTenantStatusPatchHandler({
    updateTenantLifecycleStatus: async (_tenantId: string, status) => ({
      ...snapshotFixture.tenant,
      status,
    }),
  });

  const response = await patch(
    new Request('http://localhost/api/tenants/tenant_alpha/status', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', 'x-admin-role': 'admin' },
      body: JSON.stringify({ status: 'archived' }),
    }),
    { params: Promise.resolve({ tenantId: 'tenant_alpha' }) }
  );

  assert.equal(response.status, 200);
  const json = (await response.json()) as { ok: true; tenant: { status: string } };
  assert.equal(json.tenant.status, 'archived');
});

test('tenant status PATCH validates status values', async () => {
  const patch = createTenantStatusPatchHandler({
    updateTenantLifecycleStatus: async () => snapshotFixture.tenant,
  });

  const response = await patch(
    new Request('http://localhost/api/tenants/tenant_alpha/status', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', 'x-admin-role': 'admin' },
      body: JSON.stringify({ status: 'deleted_forever' }),
    }),
    { params: Promise.resolve({ tenantId: 'tenant_alpha' }) }
  );

  assert.equal(response.status, 400);
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
        status: 'active',
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

test('domain PATCH supports lifecycle status updates', async () => {
  const patch = createDomainPatchHandler({
    updateTenantDomainStatus: async (_tenantId: string, _domainId: string, input) => ({
      ...snapshotFixture.domains[0]!,
      status: input.status ?? 'active',
    }),
  });

  const response = await patch(
    new Request('http://localhost/api/tenants/tenant_alpha/domains/tenant_domain_alpha_1', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', 'x-admin-role': 'admin' },
      body: JSON.stringify({ status: 'archived' }),
    }),
    { params: Promise.resolve({ tenantId: 'tenant_alpha', domainId: 'tenant_domain_alpha_1' }) }
  );

  assert.equal(response.status, 200);
  const json = (await response.json()) as { ok: true; domain: { status: string } };
  assert.equal(json.domain.status, 'archived');
});

test('domain probe POST returns 404 when tenant is missing', async () => {
  const probe = createDomainProbePostHandler({
    getTenantSnapshotForAdmin: async () => null,
    probeTenantDomainState: async () => {
      throw new Error('should_not_run');
    },
  });

  const response = await probe(
    new Request('http://localhost/api/tenants/tenant_missing/domains/probe', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    }),
    { params: Promise.resolve({ tenantId: 'tenant_missing' }) }
  );

  assert.equal(response.status, 404);
  const json = (await response.json()) as { ok: false; error: string };
  assert.equal(json.ok, false);
  assert.equal(json.error, 'Tenant not found.');
});

test('domain probe POST returns probe payload and supports domain filtering', async () => {
  const snapshotWithTwoDomains: ControlPlaneTenantSnapshot = {
    ...snapshotFixture,
    domains: [
      snapshotFixture.domains[0]!,
      {
        id: 'tenant_domain_alpha_2',
        tenantId: 'tenant_alpha',
        hostname: 'alpha-secondary.localhost',
        status: 'active',
        isPrimary: false,
        isVerified: false,
        verifiedAt: null,
        createdAt: '2026-02-13T00:00:00.000Z',
        updatedAt: '2026-02-13T00:00:00.000Z',
      },
    ],
  };

  const probedDomainIds: string[] = [];
  const probe = createDomainProbePostHandler({
    getTenantSnapshotForAdmin: async () => snapshotWithTwoDomains,
    probeTenantDomainState: async (domain) => {
      probedDomainIds.push(domain.id);
      return {
        domainId: domain.id,
        hostname: domain.hostname,
        isPrimary: domain.isPrimary,
        persistedVerified: domain.isVerified,
        checkedAt: '2026-02-19T20:00:00.000Z',
        dnsStatus: domain.isVerified ? 'verified' : 'pending',
        dnsMessage: 'dns probe',
        certificateStatus: domain.isVerified ? 'ready' : 'pending',
        certificateMessage: 'cert probe',
        certificateValidTo: null,
        observedRecords: [],
      };
    },
  });

  const response = await probe(
    new Request('http://localhost/api/tenants/tenant_alpha/domains/probe', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ domainId: 'tenant_domain_alpha_2' }),
    }),
    { params: Promise.resolve({ tenantId: 'tenant_alpha' }) }
  );

  assert.equal(response.status, 200);
  const json = (await response.json()) as {
    ok: true;
    tenantId: string;
    checkedAt: string;
    probes: Array<{ domainId: string }>;
    primaryDomainProbe: { domainId: string } | null;
  };
  assert.equal(json.ok, true);
  assert.equal(json.tenantId, 'tenant_alpha');
  assert.equal(json.checkedAt, '2026-02-19T20:00:00.000Z');
  assert.deepEqual(json.probes.map((entry) => entry.domainId), ['tenant_domain_alpha_2']);
  assert.equal(json.primaryDomainProbe, null);
  assert.deepEqual(probedDomainIds, ['tenant_domain_alpha_2']);
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

test('settings PATCH supports lifecycle status updates', async () => {
  const patch = createSettingsPatchHandler({
    getTenantControlSettings: async () => snapshotFixture.settings,
    updateTenantControlSettings: async (_tenantId, input) => ({
      ...snapshotFixture.settings,
      status: input.status ?? 'active',
    }),
  });

  const response = await patch(
    new Request('http://localhost/api/tenants/tenant_alpha/settings', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', 'x-admin-role': 'admin' },
      body: JSON.stringify({ status: 'archived' }),
    }),
    { params: Promise.resolve({ tenantId: 'tenant_alpha' }) }
  );

  assert.equal(response.status, 200);
  const json = (await response.json()) as { ok: true; settings: { status: string } };
  assert.equal(json.settings.status, 'archived');
});

test('actors GET returns tenant-scoped actor list', async () => {
  const get = createActorsGetHandler({
    listTenantControlActors: async () => [buildActorFixture()],
    upsertTenantControlActor: async () => buildActorFixture(),
  });

  const response = await get(new Request('http://localhost/api/tenants/tenant_alpha/actors'), {
    params: Promise.resolve({ tenantId: 'tenant_alpha' }),
  });

  assert.equal(response.status, 200);
  const json = (await response.json()) as { ok: true; actors: TenantControlActor[] };
  assert.equal(json.ok, true);
  assert.equal(json.actors.length, 1);
  assert.equal(json.actors[0]?.actorId, 'user_alpha_1');
});

test('actors POST validates required actor fields', async () => {
  const post = createActorsPostHandler({
    listTenantControlActors: async () => [buildActorFixture()],
    upsertTenantControlActor: async () => buildActorFixture(),
  });

  const response = await post(
    new Request('http://localhost/api/tenants/tenant_alpha/actors', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-admin-role': 'admin' },
      body: JSON.stringify({ role: 'operator' }),
    }),
    { params: Promise.resolve({ tenantId: 'tenant_alpha' }) }
  );

  assert.equal(response.status, 400);
  const json = (await response.json()) as { ok: false; error: string };
  assert.equal(json.error, 'actorId and role are required.');
});

test('actor PATCH returns 404 when actor does not exist', async () => {
  const patch = createActorPatchHandler({
    updateTenantControlActor: async () => null,
    removeTenantControlActor: async () => false,
  });

  const response = await patch(
    new Request('http://localhost/api/tenants/tenant_alpha/actors/user_missing', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', 'x-admin-role': 'admin' },
      body: JSON.stringify({ role: 'viewer' }),
    }),
    { params: Promise.resolve({ tenantId: 'tenant_alpha', actorId: 'user_missing' }) }
  );

  assert.equal(response.status, 404);
});

test('actor DELETE removes actor when present', async () => {
  const del = createActorDeleteHandler({
    updateTenantControlActor: async () => buildActorFixture(),
    removeTenantControlActor: async () => true,
  });

  const response = await del(
    new Request('http://localhost/api/tenants/tenant_alpha/actors/user_alpha_1', {
      method: 'DELETE',
      headers: { 'x-admin-role': 'admin' },
    }),
    { params: Promise.resolve({ tenantId: 'tenant_alpha', actorId: 'user_alpha_1' }) }
  );

  assert.equal(response.status, 200);
  const json = (await response.json()) as { ok: true };
  assert.equal(json.ok, true);
});

test('support session POST starts support window for actor', async () => {
  const post = createSupportSessionPostHandler({
    setTenantSupportSessionState: async (_tenantId, _actorId, input) =>
      buildActorFixture({
        supportSessionActive: input.active,
        supportSessionStartedAt: input.active ? '2026-02-20T01:00:00.000Z' : null,
        supportSessionExpiresAt: input.active ? '2026-02-20T01:45:00.000Z' : null,
      }),
  });

  const response = await post(
    new Request('http://localhost/api/tenants/tenant_alpha/actors/user_alpha_1/support-session', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-admin-role': 'admin' },
      body: JSON.stringify({ durationMinutes: 45 }),
    }),
    { params: Promise.resolve({ tenantId: 'tenant_alpha', actorId: 'user_alpha_1' }) }
  );

  assert.equal(response.status, 200);
  const json = (await response.json()) as { ok: true; actor: TenantControlActor };
  assert.equal(json.ok, true);
  assert.equal(json.actor.supportSessionActive, true);
});

test('support session DELETE ends support window for actor', async () => {
  const del = createSupportSessionDeleteHandler({
    setTenantSupportSessionState: async () =>
      buildActorFixture({
        supportSessionActive: false,
        supportSessionStartedAt: null,
        supportSessionExpiresAt: null,
      }),
  });

  const response = await del(
    new Request('http://localhost/api/tenants/tenant_alpha/actors/user_alpha_1/support-session', {
      method: 'DELETE',
      headers: { 'x-admin-role': 'admin' },
    }),
    { params: Promise.resolve({ tenantId: 'tenant_alpha', actorId: 'user_alpha_1' }) }
  );

  assert.equal(response.status, 200);
  const json = (await response.json()) as { ok: true; actor: TenantControlActor };
  assert.equal(json.ok, true);
  assert.equal(json.actor.supportSessionActive, false);
});

test('observability GET returns summary payload', async () => {
  const get = createObservabilityGetHandler({
    getControlPlaneObservabilitySummary: async (limit?: number) => {
      assert.equal(limit, 12);
      return buildObservabilitySummaryFixture();
    },
  });

  const response = await get(new Request('http://localhost/api/observability?tenantLimit=12'));

  assert.equal(response.status, 200);
  const json = (await response.json()) as { ok: true; summary: ControlPlaneObservabilitySummary };
  assert.equal(json.ok, true);
  assert.equal(json.summary.totals.tenants, 2);
  assert.equal(json.summary.ingestion.deadLetterCount, 2);
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
    { tenantId: 'tenant_alpha', limit: 6 },
    { tenantId: 'tenant_bravo', limit: 6 },
  ]);
});

test('admin audit GET applies actor/request/date/change and error filters', async () => {
  const get = createAdminAuditGetHandler({
    listTenantSnapshotsForAdmin: async () => [snapshotFixture],
    listControlPlaneAdminAuditEventsByTenant: async () => [
      buildAuditEvent({
        id: 'admin_audit_match_advanced',
        actorRole: 'admin',
        actorId: 'operator_77',
        action: 'tenant.settings.update',
        status: 'failed',
        error: 'plan validation failed',
        metadata: {
          requestId: 'req_abc_123',
          requestPath: '/api/tenants/tenant_alpha/settings',
          requestMethod: 'PATCH',
          changes: {
            planCode: { after: 'growth' },
          },
        },
        createdAt: '2026-02-14T10:30:00.000Z',
      }),
      buildAuditEvent({
        id: 'admin_audit_filtered_by_date',
        actorRole: 'admin',
        actorId: 'operator_77',
        status: 'failed',
        error: 'outside window',
        metadata: {
          requestId: 'req_abc_123',
          changes: { planCode: { after: 'starter' } },
        },
        createdAt: '2026-02-13T10:30:00.000Z',
      }),
      buildAuditEvent({
        id: 'admin_audit_filtered_by_role',
        actorRole: 'viewer',
        actorId: 'viewer_1',
        status: 'failed',
        error: 'role mismatch',
        metadata: {
          requestId: 'req_abc_123',
          changes: { planCode: { after: 'starter' } },
        },
        createdAt: '2026-02-14T10:30:00.000Z',
      }),
    ],
  });

  const response = await get(
    new Request(
      'http://localhost/api/admin-audit?tenantId=tenant_alpha&actorRole=admin&actorId=operator_77&requestId=req_abc_123&from=2026-02-14&to=2026-02-14&changedField=planCode&errorsOnly=true&search=settings'
    )
  );

  assert.equal(response.status, 200);
  const json = (await response.json()) as {
    ok: true;
    scope: 'tenant';
    tenantId: string;
    events: ControlPlaneAdminAuditEvent[];
  };
  assert.equal(json.events.length, 1);
  assert.equal(json.events[0]?.id, 'admin_audit_match_advanced');
});
