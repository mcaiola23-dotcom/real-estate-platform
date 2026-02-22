import test from 'node:test';
import assert from 'node:assert/strict';

import { isTenantActorRoleCompatibleWithOnboardingOwnerRole } from './onboarding-owner-assignment';

test('admin actors are compatible with non-client onboarding owner roles', () => {
  assert.equal(isTenantActorRoleCompatibleWithOnboardingOwnerRole('admin', 'sales'), true);
  assert.equal(isTenantActorRoleCompatibleWithOnboardingOwnerRole('admin', 'ops'), true);
  assert.equal(isTenantActorRoleCompatibleWithOnboardingOwnerRole('admin', 'build'), true);
});

test('operator actors are compatible with sales, ops, and build owner roles', () => {
  assert.equal(isTenantActorRoleCompatibleWithOnboardingOwnerRole('operator', 'sales'), true);
  assert.equal(isTenantActorRoleCompatibleWithOnboardingOwnerRole('operator', 'ops'), true);
  assert.equal(isTenantActorRoleCompatibleWithOnboardingOwnerRole('operator', 'build'), true);
});

test('support actors are only compatible with ops owner role', () => {
  assert.equal(isTenantActorRoleCompatibleWithOnboardingOwnerRole('support', 'ops'), true);
  assert.equal(isTenantActorRoleCompatibleWithOnboardingOwnerRole('support', 'sales'), false);
  assert.equal(isTenantActorRoleCompatibleWithOnboardingOwnerRole('support', 'build'), false);
});

test('viewer actors are not compatible with operator-owned onboarding tasks', () => {
  assert.equal(isTenantActorRoleCompatibleWithOnboardingOwnerRole('viewer', 'sales'), false);
  assert.equal(isTenantActorRoleCompatibleWithOnboardingOwnerRole('viewer', 'ops'), false);
  assert.equal(isTenantActorRoleCompatibleWithOnboardingOwnerRole('viewer', 'build'), false);
});

test('client owner role never accepts tenant control actor assignment', () => {
  assert.equal(isTenantActorRoleCompatibleWithOnboardingOwnerRole('admin', 'client'), false);
  assert.equal(isTenantActorRoleCompatibleWithOnboardingOwnerRole('operator', 'client'), false);
  assert.equal(isTenantActorRoleCompatibleWithOnboardingOwnerRole('support', 'client'), false);
  assert.equal(isTenantActorRoleCompatibleWithOnboardingOwnerRole('viewer', 'client'), false);
});
