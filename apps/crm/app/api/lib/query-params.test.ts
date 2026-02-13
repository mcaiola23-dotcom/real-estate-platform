import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildPagination,
  parseActivityListQuery,
  parseContactListQuery,
  parseLeadListQuery,
  parsePaginationQuery,
} from './query-params';

test('parsePaginationQuery applies defaults and caps limit', () => {
  const parsed = parsePaginationQuery(new URLSearchParams('limit=999&offset=12'));
  assert.equal(parsed.limit, 200);
  assert.equal(parsed.offset, 12);
});

test('parseLeadListQuery normalizes unsupported status and leadType', () => {
  const parsed = parseLeadListQuery(
    new URLSearchParams('status=not_real&leadType=invalid&source=website&contactId=abc&limit=10&offset=3')
  );
  assert.equal(parsed.status, undefined);
  assert.equal(parsed.leadType, undefined);
  assert.equal(parsed.source, 'website');
  assert.equal(parsed.contactId, 'abc');
  assert.equal(parsed.limit, 10);
  assert.equal(parsed.offset, 3);
});

test('parseContactListQuery includes search and source filters', () => {
  const parsed = parseContactListQuery(new URLSearchParams('search=Fairfield&source=crm_manual'));
  assert.equal(parsed.search, 'Fairfield');
  assert.equal(parsed.source, 'crm_manual');
  assert.equal(parsed.limit, 50);
  assert.equal(parsed.offset, 0);
});

test('parseActivityListQuery includes activity and entity filters', () => {
  const parsed = parseActivityListQuery(
    new URLSearchParams('activityType=note&leadId=lead_1&contactId=contact_1&limit=20&offset=4')
  );
  assert.equal(parsed.activityType, 'note');
  assert.equal(parsed.leadId, 'lead_1');
  assert.equal(parsed.contactId, 'contact_1');
  assert.equal(parsed.limit, 20);
  assert.equal(parsed.offset, 4);
});

test('buildPagination returns nextOffset only for full pages', () => {
  assert.deepEqual(buildPagination(10, 0, 10), { limit: 10, offset: 0, nextOffset: 10 });
  assert.deepEqual(buildPagination(10, 10, 4), { limit: 10, offset: 10, nextOffset: null });
});
