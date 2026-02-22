import assert from 'node:assert/strict';
import test from 'node:test';

import { buildActionCenterItems } from './action-center';

test('returns select-tenant prompt when no tenant is selected', () => {
  const items = buildActionCenterItems({
    hasSelectedTenant: false,
    hasPrimaryDomain: false,
    billingDriftCount: 0,
    diagnosticsLoaded: false,
    diagnosticsFailedCount: 0,
    diagnosticsWarningCount: 0,
    actorCount: 0,
  });

  assert.equal(items.length, 1);
  assert.equal(items[0]?.id, 'select-tenant');
  assert.equal(items[0]?.tab, 'launch');
});

test('prioritizes critical launch blockers before warnings/info', () => {
  const items = buildActionCenterItems({
    hasSelectedTenant: true,
    tenantStatus: 'archived',
    settingsStatus: 'archived',
    hasPrimaryDomain: true,
    dnsStatus: 'pending',
    certificateStatus: 'pending',
    billingDriftCount: 2,
    diagnosticsLoaded: true,
    diagnosticsFailedCount: 1,
    diagnosticsWarningCount: 2,
    actorCount: 0,
  });

  assert.ok(items.length >= 5);
  const severities = items.map((item) => item.severity);
  const firstWarningIndex = severities.indexOf('warning');
  const firstInfoIndex = severities.indexOf('info');
  if (firstWarningIndex !== -1) {
    assert.ok(severities.slice(0, firstWarningIndex).every((entry) => entry === 'critical'));
  }
  if (firstInfoIndex !== -1) {
    assert.ok(severities.slice(0, firstInfoIndex).every((entry) => entry !== 'info'));
  }

  assert.ok(items.some((item) => item.id === 'tenant-archived'));
  assert.ok(items.some((item) => item.id === 'settings-archived'));
  assert.ok(items.some((item) => item.id === 'dns-unverified'));
  assert.ok(items.some((item) => item.id === 'diagnostics-failed'));
  assert.ok(items.some((item) => item.id === 'billing-drift'));
});

test('returns launch-track info item when no blockers exist', () => {
  const items = buildActionCenterItems({
    hasSelectedTenant: true,
    tenantStatus: 'active',
    settingsStatus: 'active',
    hasPrimaryDomain: true,
    dnsStatus: 'verified',
    certificateStatus: 'ready',
    billingDriftCount: 0,
    diagnosticsLoaded: true,
    diagnosticsFailedCount: 0,
    diagnosticsWarningCount: 0,
    actorCount: 2,
    onboardingLoaded: true,
    onboardingPlanExists: true,
    onboardingPlanStatus: 'active',
    onboardingRequiredBlockedCount: 0,
    onboardingRequiredOverdueCount: 0,
    onboardingRequiredUnassignedCount: 0,
  });

  assert.deepEqual(items.map((item) => item.id), ['launch-track']);
});

test('adds onboarding task blockers and assignment items to launch priorities', () => {
  const items = buildActionCenterItems({
    hasSelectedTenant: true,
    tenantStatus: 'active',
    settingsStatus: 'active',
    hasPrimaryDomain: true,
    dnsStatus: 'verified',
    certificateStatus: 'ready',
    billingDriftCount: 0,
    diagnosticsLoaded: true,
    diagnosticsFailedCount: 0,
    diagnosticsWarningCount: 0,
    actorCount: 1,
    onboardingLoaded: true,
    onboardingPlanExists: true,
    onboardingPlanStatus: 'paused',
    onboardingRequiredBlockedCount: 2,
    onboardingRequiredOverdueCount: 1,
    onboardingRequiredUnassignedCount: 3,
  });

  assert.ok(items.some((item) => item.id === 'onboarding-plan-paused'));
  assert.ok(items.some((item) => item.id === 'onboarding-blocked-tasks'));
  assert.ok(items.some((item) => item.id === 'onboarding-overdue-tasks'));
  assert.ok(items.some((item) => item.id === 'onboarding-unassigned-tasks'));
});

test('adds persisted-onboarding-plan missing warning when onboarding has not been created yet', () => {
  const items = buildActionCenterItems({
    hasSelectedTenant: true,
    tenantStatus: 'active',
    settingsStatus: 'active',
    hasPrimaryDomain: true,
    dnsStatus: 'verified',
    certificateStatus: 'ready',
    billingDriftCount: 0,
    diagnosticsLoaded: true,
    diagnosticsFailedCount: 0,
    diagnosticsWarningCount: 0,
    actorCount: 1,
    onboardingLoaded: true,
    onboardingPlanExists: false,
  });

  assert.ok(items.some((item) => item.id === 'onboarding-plan-missing'));
});
