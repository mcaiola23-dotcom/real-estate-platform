import assert from 'node:assert/strict';
import test from 'node:test';

import type { CrmLeadStatus } from '@real-estate/types/crm';

import {
  doesStatusMatchPreset,
  getPipelineMoveNotice,
  resolveViewFromNav,
  toggleTableSortState,
} from './workspace-interactions';

test('resolveViewFromNav maps navigation to stable workspace views', () => {
  assert.equal(resolveViewFromNav('dashboard'), 'dashboard');
  assert.equal(resolveViewFromNav('pipeline'), 'pipeline');
  assert.equal(resolveViewFromNav('leads'), 'leads');
  assert.equal(resolveViewFromNav('settings'), 'settings');
  assert.equal(resolveViewFromNav('contacts'), 'dashboard');
  assert.equal(resolveViewFromNav('activity'), 'dashboard');
});

test('doesStatusMatchPreset gates lead statuses per table preset', () => {
  const statuses: CrmLeadStatus[] = ['new', 'qualified', 'nurturing', 'won', 'lost'];

  const allMatches = statuses.filter((status) => doesStatusMatchPreset(status, 'all'));
  const followUpMatches = statuses.filter((status) => doesStatusMatchPreset(status, 'follow_up'));
  const openPipelineMatches = statuses.filter((status) => doesStatusMatchPreset(status, 'open_pipeline'));
  const closedMatches = statuses.filter((status) => doesStatusMatchPreset(status, 'closed'));

  assert.deepEqual(allMatches, statuses);
  assert.deepEqual(followUpMatches, ['qualified', 'nurturing']);
  assert.deepEqual(openPipelineMatches, ['new', 'qualified', 'nurturing']);
  assert.deepEqual(closedMatches, ['won', 'lost']);
});

test('getPipelineMoveNotice only returns a notice when active status filter would hide moved cards', () => {
  assert.equal(getPipelineMoveNotice('Jordan Lee', 'qualified', 'all'), null);
  assert.equal(getPipelineMoveNotice('Jordan Lee', 'qualified', 'qualified'), null);
  assert.equal(getPipelineMoveNotice('Jordan Lee', 'won', 'qualified'), 'Jordan Lee moved to Won.');
});

test('toggleTableSortState toggles sort direction and resets to asc for new columns', () => {
  const initial = { column: 'updatedAt', direction: 'desc' } as const;
  const switchedColumn = toggleTableSortState(initial, 'name');
  const toggledDirection = toggleTableSortState(switchedColumn, 'name');

  assert.deepEqual(switchedColumn, { column: 'name', direction: 'asc' });
  assert.deepEqual(toggledDirection, { column: 'name', direction: 'desc' });
});
