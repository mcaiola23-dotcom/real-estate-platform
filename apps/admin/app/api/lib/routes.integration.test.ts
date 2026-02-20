import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import test from 'node:test';

import type {
  ControlPlaneAdminAuditEvent,
  ControlPlaneObservabilitySummary,
  ControlPlaneTenantSnapshot,
  TenantBillingProviderEventResult,
  TenantBillingSubscription,
  TenantControlActor,
  TenantSupportDiagnosticsSummary,
  TenantSupportRemediationResult,
} from '@real-estate/types/control-plane';

import { computeBillingDriftRemediation } from '../../lib/billing-drift-remediation';
import { createAdminAuditGetHandler } from '../admin-audit/route';
import { createBillingWebhookPostHandler } from '../billing/webhooks/route';
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
import { createBillingGetHandler, createBillingPatchHandler } from '../tenants/[tenantId]/billing/route';
import { createDiagnosticsGetHandler, createDiagnosticsPostHandler } from '../tenants/[tenantId]/diagnostics/route';
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
    billingDrift: {
      windowDays: 7,
      generatedAt: '2026-02-20T00:00:00.000Z',
      totals: {
        driftEvents: 3,
        tenantsWithDrift: 2,
        missingFlagCount: 4,
        extraFlagCount: 2,
        modeCounts: {
          compared: 2,
          provider_missing: 1,
          tenant_unresolved: 0,
        },
      },
      byTenant: [
        {
          tenantId: 'tenant_alpha',
          tenantName: 'Alpha Realty',
          tenantSlug: 'alpha',
          driftEvents: 2,
          missingFlagCount: 3,
          extraFlagCount: 1,
          modeCounts: {
            compared: 2,
            provider_missing: 0,
            tenant_unresolved: 0,
          },
          latestDriftAt: '2026-02-20T12:00:00.000Z',
        },
      ],
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

function buildDiagnosticsSummaryFixture(): TenantSupportDiagnosticsSummary {
  return {
    tenantId: 'tenant_alpha',
    generatedAt: '2026-02-20T00:00:00.000Z',
    overallStatus: 'warning',
    counts: {
      ok: 3,
      warning: 2,
      failed: 0,
    },
    checks: [
      {
        id: 'auth.clerk-key',
        category: 'auth',
        status: 'ok',
        label: 'Auth provider key',
        detail: 'configured',
        remediation: [],
      },
      {
        id: 'domain.primary-domain-verified',
        category: 'domain',
        status: 'warning',
        label: 'Primary domain verification',
        detail: 'pending',
        remediation: [
          {
            action: 'domain.mark_primary_verified',
            label: 'Mark primary domain verified',
            detail: 'Apply verified state.',
          },
        ],
      },
    ],
  };
}

function buildDiagnosticsRemediationFixture(
  overrides: Partial<TenantSupportRemediationResult> = {}
): TenantSupportRemediationResult {
  return {
    action: 'domain.mark_primary_verified',
    ok: true,
    message: 'done',
    changedCount: 1,
    ...overrides,
  };
}

function buildBillingSubscriptionFixture(
  overrides: Partial<TenantBillingSubscription> = {}
): TenantBillingSubscription {
  return {
    id: 'tenant_billing_subscription_tenant_alpha',
    tenantId: 'tenant_alpha',
    planCode: 'starter',
    status: 'trialing',
    paymentStatus: 'pending',
    billingProvider: 'manual',
    billingCustomerId: null,
    billingSubscriptionId: null,
    trialEndsAt: '2026-03-06T00:00:00.000Z',
    currentPeriodEndsAt: null,
    cancelAtPeriodEnd: false,
    createdAt: '2026-02-20T00:00:00.000Z',
    updatedAt: '2026-02-20T00:00:00.000Z',
    ...overrides,
  };
}

function buildBillingProviderEventResultFixture(
  overrides: Partial<TenantBillingProviderEventResult> = {}
): TenantBillingProviderEventResult {
  return {
    provider: 'stripe',
    eventId: 'evt_test_1',
    eventType: 'customer.subscription.updated',
    tenantId: 'tenant_alpha',
    duplicate: false,
    applied: true,
    message: 'Billing provider event reconciled.',
    subscription: buildBillingSubscriptionFixture({
      billingProvider: 'stripe',
      billingCustomerId: 'cus_alpha',
      billingSubscriptionId: 'sub_alpha',
      status: 'active',
      paymentStatus: 'paid',
    }),
    entitlementDrift: {
      mode: 'compared',
      evaluatedAt: '2026-02-20T00:00:00.000Z',
      hasDrift: false,
      providerEntitlementFlags: ['crm_pipeline', 'lead_capture'],
      persistedEntitlementFlags: ['crm_pipeline', 'lead_capture'],
      missingInTenantSettings: [],
      extraInTenantSettings: [],
    },
    ...overrides,
  };
}

function buildStripeSignatureHeader(payload: string, secret: string, timestamp = Math.floor(Date.now() / 1000)): string {
  const digest = createHmac('sha256', secret).update(`${timestamp}.${payload}`).digest('hex');
  return `t=${timestamp},v1=${digest}`;
}

test('billing drift remediation computes missing-flag additions and arms entitlement sync', () => {
  const result = computeBillingDriftRemediation({
    baselineFlags: ['crm_pipeline'],
    missingFlags: ['lead_capture', 'crm_pipeline'],
    extraFlags: ['crm_pipeline'],
    mode: 'missing',
  });

  assert.equal(result.actionable, true);
  assert.equal(result.shouldArmEntitlementSync, true);
  assert.equal(result.addedCount, 1);
  assert.equal(result.removedCount, 0);
  assert.deepEqual(result.nextFlags, ['crm_pipeline', 'lead_capture']);
});

test('billing drift remediation computes extra-flag removals and arms entitlement sync', () => {
  const result = computeBillingDriftRemediation({
    baselineFlags: ['crm_pipeline', 'lead_capture', 'legacy_flag'],
    missingFlags: [],
    extraFlags: ['legacy_flag', 'unknown_flag'],
    mode: 'extra',
  });

  assert.equal(result.actionable, true);
  assert.equal(result.shouldArmEntitlementSync, true);
  assert.equal(result.addedCount, 0);
  assert.equal(result.removedCount, 1);
  assert.deepEqual(result.nextFlags, ['crm_pipeline', 'lead_capture']);
});

test('billing drift remediation computes combined add/remove mutations in all mode', () => {
  const result = computeBillingDriftRemediation({
    baselineFlags: ['crm_pipeline', 'legacy_flag'],
    missingFlags: ['lead_capture'],
    extraFlags: ['legacy_flag'],
    mode: 'all',
  });

  assert.equal(result.actionable, true);
  assert.equal(result.shouldArmEntitlementSync, true);
  assert.equal(result.addedCount, 1);
  assert.equal(result.removedCount, 1);
  assert.deepEqual(result.nextFlags, ['crm_pipeline', 'lead_capture']);
});

test('billing drift remediation skips sync arming when no actionable flags are provided', () => {
  const result = computeBillingDriftRemediation({
    baselineFlags: ['crm_pipeline', 'crm_pipeline'],
    missingFlags: [' '],
    extraFlags: [''],
    mode: 'all',
  });

  assert.equal(result.actionable, false);
  assert.equal(result.shouldArmEntitlementSync, false);
  assert.equal(result.addedCount, 0);
  assert.equal(result.removedCount, 0);
  assert.deepEqual(result.nextFlags, ['crm_pipeline']);
});

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
  assert.equal(json.summary.billingDrift.totals.driftEvents, 3);
  assert.equal(json.summary.billingDrift.byTenant[0]?.tenantId, 'tenant_alpha');
});

test('billing webhook POST rejects unauthorized requests when secret is configured', async () => {
  const post = createBillingWebhookPostHandler({
    reconcileTenantBillingProviderEvent: async () => buildBillingProviderEventResultFixture(),
    webhookSecret: 'secret-abc',
  });

  const response = await post(
    new Request('http://localhost/api/billing/webhooks', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        provider: 'manual',
        eventId: 'evt_test_1',
        eventType: 'subscription.updated',
      }),
    })
  );

  assert.equal(response.status, 401);
});

test('billing webhook POST rejects normalized stripe payloads without provider-native signature flow', async () => {
  const post = createBillingWebhookPostHandler({
    reconcileTenantBillingProviderEvent: async () => buildBillingProviderEventResultFixture(),
    webhookSecret: 'secret-abc',
  });

  const response = await post(
    new Request('http://localhost/api/billing/webhooks', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-billing-webhook-secret': 'secret-abc' },
      body: JSON.stringify({
        provider: 'stripe',
        eventId: 'evt_test_2',
        eventType: 'customer.subscription.updated',
      }),
    })
  );

  assert.equal(response.status, 400);
});

test('billing webhook POST rejects Stripe events with invalid signatures', async () => {
  const post = createBillingWebhookPostHandler({
    reconcileTenantBillingProviderEvent: async () => buildBillingProviderEventResultFixture(),
    stripeWebhookSecret: 'whsec_test_123',
  });

  const stripePayload = JSON.stringify({
    id: 'evt_test_invalid_signature',
    type: 'customer.subscription.updated',
    data: {
      object: {
        object: 'subscription',
        id: 'sub_alpha',
        customer: 'cus_alpha',
      },
    },
  });

  const response = await post(
    new Request('http://localhost/api/billing/webhooks', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'stripe-signature': buildStripeSignatureHeader(stripePayload, 'different_secret'),
      },
      body: stripePayload,
    })
  );

  assert.equal(response.status, 401);
});

test('billing webhook POST verifies and normalizes Stripe payloads before reconciliation', async () => {
  type CapturedProviderEventInput = {
    provider: string;
    eventId: string;
    eventType: string;
    tenantId?: string | null;
    billingCustomerId?: string | null;
    billingSubscriptionId?: string | null;
    subscription?: Record<string, unknown>;
    entitlementFlags?: string[];
    syncEntitlements?: boolean;
  };
  let capturedProviderEventInput: CapturedProviderEventInput | undefined;
  const post = createBillingWebhookPostHandler({
    reconcileTenantBillingProviderEvent: async (input) => {
      capturedProviderEventInput = input as unknown as CapturedProviderEventInput;
      return buildBillingProviderEventResultFixture({
        provider: input.provider,
        eventId: input.eventId,
        eventType: input.eventType,
      });
    },
    stripeWebhookSecret: 'whsec_test_123',
  });

  const stripePayload = JSON.stringify({
    id: 'evt_test_2',
    type: 'customer.subscription.updated',
    created: 1760000000,
    data: {
      object: {
        object: 'subscription',
        id: 'sub_alpha',
        customer: 'cus_alpha',
        status: 'active',
        trial_end: 1760604800,
        current_period_end: 1763196800,
        cancel_at_period_end: false,
        metadata: {
          tenantId: 'tenant_alpha',
          planCode: 'growth',
          entitlementFlags: 'crm_pipeline,lead_capture',
        },
        items: {
          data: [{ price: { lookup_key: 'growth', id: 'price_growth' } }],
        },
      },
    },
  });

  const response = await post(
    new Request('http://localhost/api/billing/webhooks', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'stripe-signature': buildStripeSignatureHeader(stripePayload, 'whsec_test_123'),
      },
      body: stripePayload,
    })
  );

  assert.equal(response.status, 200);
  assert.ok(capturedProviderEventInput);
  assert.equal(capturedProviderEventInput.provider, 'stripe');
  assert.equal(capturedProviderEventInput.eventId, 'evt_test_2');
  assert.equal(capturedProviderEventInput.eventType, 'customer.subscription.updated');
  assert.equal(capturedProviderEventInput.tenantId, 'tenant_alpha');
  assert.equal(capturedProviderEventInput.billingCustomerId, 'cus_alpha');
  assert.equal(capturedProviderEventInput.billingSubscriptionId, 'sub_alpha');

  const subscription = capturedProviderEventInput.subscription;
  assert.equal(subscription?.planCode, 'growth');
  assert.equal(subscription?.status, 'active');
  assert.equal(subscription?.paymentStatus, 'paid');
  assert.equal(subscription?.cancelAtPeriodEnd, false);

  assert.deepEqual(capturedProviderEventInput.entitlementFlags, ['crm_pipeline', 'lead_capture']);
  assert.equal(capturedProviderEventInput.syncEntitlements, true);

  const json = (await response.json()) as { ok: true; result: TenantBillingProviderEventResult };
  assert.equal(json.ok, true);
  assert.equal(json.result.applied, true);
  assert.equal(json.result.duplicate, false);
  assert.equal(json.result.eventId, 'evt_test_2');
});

test('billing webhook POST reports entitlement drift summary from reconciliation', async () => {
  const post = createBillingWebhookPostHandler({
    reconcileTenantBillingProviderEvent: async () =>
      buildBillingProviderEventResultFixture({
        entitlementDrift: {
          mode: 'compared',
          evaluatedAt: '2026-02-20T16:00:00.000Z',
          hasDrift: true,
          providerEntitlementFlags: ['crm_pipeline', 'lead_capture'],
          persistedEntitlementFlags: ['crm_pipeline'],
          missingInTenantSettings: ['lead_capture'],
          extraInTenantSettings: [],
        },
      }),
    stripeWebhookSecret: 'whsec_test_123',
  });

  const stripePayload = JSON.stringify({
    id: 'evt_test_drift',
    type: 'customer.subscription.updated',
    data: {
      object: {
        object: 'subscription',
        id: 'sub_alpha',
        customer: 'cus_alpha',
      },
    },
  });

  const response = await post(
    new Request('http://localhost/api/billing/webhooks', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'stripe-signature': buildStripeSignatureHeader(stripePayload, 'whsec_test_123'),
      },
      body: stripePayload,
    })
  );

  assert.equal(response.status, 200);
  const json = (await response.json()) as { ok: true; result: TenantBillingProviderEventResult };
  assert.equal(json.ok, true);
  assert.ok(json.result.entitlementDrift);
  assert.equal(json.result.entitlementDrift?.hasDrift, true);
  assert.deepEqual(json.result.entitlementDrift?.missingInTenantSettings, ['lead_capture']);
});

test('billing webhook POST returns 202 for unresolved tenant mappings', async () => {
  const post = createBillingWebhookPostHandler({
    reconcileTenantBillingProviderEvent: async () =>
      buildBillingProviderEventResultFixture({
        applied: false,
        duplicate: false,
        tenantId: null,
        subscription: null,
        message: 'Unable to resolve tenant from billing provider identifiers.',
        entitlementDrift: {
          mode: 'tenant_unresolved',
          evaluatedAt: '2026-02-20T16:00:00.000Z',
          hasDrift: false,
          providerEntitlementFlags: [],
          persistedEntitlementFlags: [],
          missingInTenantSettings: [],
          extraInTenantSettings: [],
        },
      }),
    stripeWebhookSecret: 'whsec_test_123',
  });

  const stripePayload = JSON.stringify({
    id: 'evt_test_unresolved',
    type: 'customer.subscription.updated',
    data: {
      object: {
        object: 'subscription',
        id: 'sub_unknown',
        customer: 'cus_unknown',
      },
    },
  });

  const response = await post(
    new Request('http://localhost/api/billing/webhooks', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'stripe-signature': buildStripeSignatureHeader(stripePayload, 'whsec_test_123'),
      },
      body: stripePayload,
    })
  );

  assert.equal(response.status, 202);
  const json = (await response.json()) as { ok: true; result: TenantBillingProviderEventResult };
  assert.equal(json.ok, true);
  assert.equal(json.result.applied, false);
  assert.equal(json.result.tenantId, null);
});

test('diagnostics GET returns tenant diagnostics summary', async () => {
  const get = createDiagnosticsGetHandler({
    getTenantSupportDiagnosticsSummary: async () => buildDiagnosticsSummaryFixture(),
    runTenantSupportRemediationAction: async () => buildDiagnosticsRemediationFixture(),
  });

  const response = await get(new Request('http://localhost/api/tenants/tenant_alpha/diagnostics'), {
    params: Promise.resolve({ tenantId: 'tenant_alpha' }),
  });

  assert.equal(response.status, 200);
  const json = (await response.json()) as { ok: true; summary: TenantSupportDiagnosticsSummary };
  assert.equal(json.ok, true);
  assert.equal(json.summary.tenantId, 'tenant_alpha');
  assert.equal(json.summary.overallStatus, 'warning');
});

test('diagnostics POST runs remediation action and returns updated summary', async () => {
  const actions: string[] = [];
  const post = createDiagnosticsPostHandler({
    getTenantSupportDiagnosticsSummary: async () => buildDiagnosticsSummaryFixture(),
    runTenantSupportRemediationAction: async (_tenantId, action) => {
      actions.push(action);
      return buildDiagnosticsRemediationFixture({ action });
    },
  });

  const response = await post(
    new Request('http://localhost/api/tenants/tenant_alpha/diagnostics', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-admin-role': 'admin' },
      body: JSON.stringify({ action: 'domain.mark_primary_verified' }),
    }),
    { params: Promise.resolve({ tenantId: 'tenant_alpha' }) }
  );

  assert.equal(response.status, 200);
  const json = (await response.json()) as {
    ok: true;
    result: TenantSupportRemediationResult;
    summary: TenantSupportDiagnosticsSummary;
  };
  assert.equal(json.ok, true);
  assert.equal(json.result.action, 'domain.mark_primary_verified');
  assert.equal(json.summary.tenantId, 'tenant_alpha');
  assert.deepEqual(actions, ['domain.mark_primary_verified']);
});

test('diagnostics POST rejects non-admin actor', async () => {
  const post = createDiagnosticsPostHandler({
    getTenantSupportDiagnosticsSummary: async () => buildDiagnosticsSummaryFixture(),
    runTenantSupportRemediationAction: async () => buildDiagnosticsRemediationFixture(),
    getMutationActorFromRequest: async () => ({ actorId: 'user_viewer_1', role: 'viewer' }),
  });

  const response = await post(
    new Request('http://localhost/api/tenants/tenant_alpha/diagnostics', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'domain.mark_primary_verified' }),
    }),
    { params: Promise.resolve({ tenantId: 'tenant_alpha' }) }
  );

  assert.equal(response.status, 403);
});

test('billing GET returns tenant subscription snapshot', async () => {
  const get = createBillingGetHandler({
    getTenantBillingSubscription: async () => buildBillingSubscriptionFixture(),
    updateTenantBillingSubscription: async () => buildBillingSubscriptionFixture(),
  });

  const response = await get(new Request('http://localhost/api/tenants/tenant_alpha/billing'), {
    params: Promise.resolve({ tenantId: 'tenant_alpha' }),
  });

  assert.equal(response.status, 200);
  const json = (await response.json()) as { ok: true; subscription: TenantBillingSubscription };
  assert.equal(json.ok, true);
  assert.equal(json.subscription.planCode, 'starter');
});

test('billing PATCH updates subscription workflow and entitlement sync payload', async () => {
  const patch = createBillingPatchHandler({
    getTenantBillingSubscription: async () => buildBillingSubscriptionFixture(),
    updateTenantBillingSubscription: async (_tenantId, input) =>
      buildBillingSubscriptionFixture({
        planCode: input.planCode ?? 'starter',
        status: input.status ?? 'trialing',
        paymentStatus: input.paymentStatus ?? 'pending',
      }),
  });

  const response = await patch(
    new Request('http://localhost/api/tenants/tenant_alpha/billing', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', 'x-admin-role': 'admin' },
      body: JSON.stringify({
        planCode: 'growth',
        status: 'active',
        paymentStatus: 'paid',
        syncEntitlements: true,
        entitlementFlags: ['crm_pipeline', 'lead_capture'],
      }),
    }),
    { params: Promise.resolve({ tenantId: 'tenant_alpha' }) }
  );

  assert.equal(response.status, 200);
  const json = (await response.json()) as { ok: true; subscription: TenantBillingSubscription };
  assert.equal(json.ok, true);
  assert.equal(json.subscription.planCode, 'growth');
  assert.equal(json.subscription.status, 'active');
  assert.equal(json.subscription.paymentStatus, 'paid');
});

test('billing PATCH rejects non-admin actor', async () => {
  const patch = createBillingPatchHandler({
    getTenantBillingSubscription: async () => buildBillingSubscriptionFixture(),
    updateTenantBillingSubscription: async () => buildBillingSubscriptionFixture(),
    getMutationActorFromRequest: async () => ({ actorId: 'support_1', role: 'support' }),
  });

  const response = await patch(
    new Request('http://localhost/api/tenants/tenant_alpha/billing', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ planCode: 'growth' }),
    }),
    { params: Promise.resolve({ tenantId: 'tenant_alpha' }) }
  );

  assert.equal(response.status, 403);
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
