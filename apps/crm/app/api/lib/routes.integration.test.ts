import assert from 'node:assert/strict';
import test from 'node:test';

import type { CrmActivity, CrmContact, CrmLead, TenantContext } from '@real-estate/types';

import { createActivitiesGetHandler, createActivitiesPostHandler } from '../activities/route';
import { createContactsGetHandler, createContactsPostHandler } from '../contacts/route';
import { createLeadPatchHandler } from '../leads/[leadId]/route';
import { createLeadsGetHandler } from '../leads/route';

const tenantContext: TenantContext = {
  tenantId: 'tenant_fairfield',
  tenantSlug: 'fairfield',
  tenantDomain: 'fairfield.example.com',
  source: 'host_match',
};

function authorizedContext() {
  return Promise.resolve({
    tenantContext,
    unauthorizedResponse: null,
  });
}

function unauthorizedContext() {
  return Promise.resolve({
    tenantContext: null,
    unauthorizedResponse: new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    }),
  });
}

test('leads GET returns unauthorized when tenant context is missing', async () => {
  const handler = createLeadsGetHandler({
    requireTenantContext: unauthorizedContext,
    parseLeadListQuery: () => ({ limit: 10, offset: 0 }),
    listLeadsByTenantId: async () => [],
  });

  const response = await handler(new Request('http://crm.local/api/leads'));
  assert.equal(response.status, 401);
});

test('leads GET returns tenant-scoped pagination payload', async () => {
  const lead: CrmLead = {
    id: 'lead_1',
    tenantId: tenantContext.tenantId,
    contactId: null,
    status: 'new',
    leadType: 'website_lead',
    source: 'website',
    timeframe: null,
    notes: null,
    listingId: null,
    listingUrl: null,
    listingAddress: null,
    propertyType: null,
    beds: null,
    baths: null,
    sqft: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const handler = createLeadsGetHandler({
    requireTenantContext: authorizedContext,
    parseLeadListQuery: (params) => ({
      limit: Number(params.get('limit') ?? 50),
      offset: Number(params.get('offset') ?? 0),
    }),
    listLeadsByTenantId: async (tenantId) => {
      assert.equal(tenantId, tenantContext.tenantId);
      return [lead];
    },
  });

  const response = await handler(new Request('http://crm.local/api/leads?limit=10&offset=5'));
  assert.equal(response.status, 200);
  const body = (await response.json()) as {
    ok: boolean;
    tenantId: string;
    leads: CrmLead[];
    pagination: { limit: number; offset: number; nextOffset: number | null };
  };
  assert.equal(body.ok, true);
  assert.equal(body.tenantId, tenantContext.tenantId);
  assert.equal(body.leads.length, 1);
  assert.deepEqual(body.pagination, { limit: 10, offset: 5, nextOffset: null });
});

test('contacts GET returns tenant-scoped list with pagination', async () => {
  const contact: CrmContact = {
    id: 'contact_1',
    tenantId: tenantContext.tenantId,
    fullName: 'Test Contact',
    email: 'test@example.com',
    emailNormalized: 'test@example.com',
    phone: null,
    phoneNormalized: null,
    source: 'crm_manual',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const handler = createContactsGetHandler({
    requireTenantContext: authorizedContext,
    parseContactListQuery: () => ({ limit: 1, offset: 0 }),
    listContactsByTenantId: async () => [contact],
    createContactForTenant: async () => contact,
  });

  const response = await handler(new Request('http://crm.local/api/contacts'));
  assert.equal(response.status, 200);
  const body = (await response.json()) as {
    ok: boolean;
    contacts: CrmContact[];
    pagination: { limit: number; offset: number; nextOffset: number | null };
  };
  assert.equal(body.ok, true);
  assert.equal(body.contacts.length, 1);
  assert.deepEqual(body.pagination, { limit: 1, offset: 0, nextOffset: 1 });
});

test('contacts POST rejects invalid json payload', async () => {
  const handler = createContactsPostHandler({
    requireTenantContext: authorizedContext,
    parseContactListQuery: () => ({}),
    listContactsByTenantId: async () => [],
    createContactForTenant: async () => null,
  });

  const response = await handler(
    new Request('http://crm.local/api/contacts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{"fullName":',
    })
  );
  assert.equal(response.status, 400);
});

test('contacts POST creates contact with enforced crm_manual source', async () => {
  let receivedSource: string | null = null;
  const contact: CrmContact = {
    id: 'contact_2',
    tenantId: tenantContext.tenantId,
    fullName: 'Created Contact',
    email: 'created@example.com',
    emailNormalized: 'created@example.com',
    phone: null,
    phoneNormalized: null,
    source: 'crm_manual',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const handler = createContactsPostHandler({
    requireTenantContext: authorizedContext,
    parseContactListQuery: () => ({}),
    listContactsByTenantId: async () => [],
    createContactForTenant: async (_tenantId, input) => {
      receivedSource = input.source;
      return contact;
    },
  });

  const response = await handler(
    new Request('http://crm.local/api/contacts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ fullName: 'Created Contact', email: 'created@example.com' }),
    })
  );
  assert.equal(response.status, 201);
  assert.equal(receivedSource, 'crm_manual');
});

test('activities GET returns tenant-scoped list', async () => {
  const activity: CrmActivity = {
    id: 'activity_1',
    tenantId: tenantContext.tenantId,
    contactId: null,
    leadId: null,
    activityType: 'note',
    occurredAt: new Date().toISOString(),
    summary: 'Hello',
    metadataJson: null,
    createdAt: new Date().toISOString(),
  };

  const handler = createActivitiesGetHandler({
    requireTenantContext: authorizedContext,
    parseActivityListQuery: () => ({ limit: 5, offset: 0 }),
    listActivitiesByTenantId: async () => [activity],
    createActivityForTenant: async () => activity,
  });

  const response = await handler(new Request('http://crm.local/api/activities'));
  assert.equal(response.status, 200);
  const body = (await response.json()) as { activities: CrmActivity[] };
  assert.equal(body.activities.length, 1);
});

test('activities POST requires summary', async () => {
  const activity: CrmActivity = {
    id: 'activity_2',
    tenantId: tenantContext.tenantId,
    contactId: null,
    leadId: null,
    activityType: 'note',
    occurredAt: new Date().toISOString(),
    summary: 'Created',
    metadataJson: null,
    createdAt: new Date().toISOString(),
  };

  const handler = createActivitiesPostHandler({
    requireTenantContext: authorizedContext,
    parseActivityListQuery: () => ({}),
    listActivitiesByTenantId: async () => [],
    createActivityForTenant: async () => activity,
  });

  const response = await handler(
    new Request('http://crm.local/api/activities', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ summary: '   ' }),
    })
  );
  assert.equal(response.status, 400);
});

test('activities POST returns 400 when tenant-scoped lead linkage fails', async () => {
  let receivedLeadId: string | null = null;
  const handler = createActivitiesPostHandler({
    requireTenantContext: authorizedContext,
    parseActivityListQuery: () => ({}),
    listActivitiesByTenantId: async () => [],
    createActivityForTenant: async (_tenantId, input) => {
      receivedLeadId = input.leadId ?? null;
      return null;
    },
  });

  const response = await handler(
    new Request('http://crm.local/api/activities', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        summary: 'Attempt invalid lead linkage',
        leadId: ' lead_other_tenant ',
      }),
    })
  );

  assert.equal(response.status, 400);
  assert.equal(receivedLeadId, 'lead_other_tenant');
});

test('activities POST returns 400 when tenant-scoped contact linkage fails', async () => {
  let receivedContactId: string | null = null;
  const handler = createActivitiesPostHandler({
    requireTenantContext: authorizedContext,
    parseActivityListQuery: () => ({}),
    listActivitiesByTenantId: async () => [],
    createActivityForTenant: async (_tenantId, input) => {
      receivedContactId = input.contactId ?? null;
      return null;
    },
  });

  const response = await handler(
    new Request('http://crm.local/api/activities', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        summary: 'Attempt invalid contact linkage',
        contactId: ' contact_other_tenant ',
      }),
    })
  );

  assert.equal(response.status, 400);
  assert.equal(receivedContactId, 'contact_other_tenant');
});

test('lead PATCH returns 400 when no updatable fields are provided', async () => {
  const handler = createLeadPatchHandler({
    requireTenantContext: authorizedContext,
    updateLeadForTenant: async () => null,
    createActivityForTenant: async () => null,
  });

  const response = await handler(
    new Request('http://crm.local/api/leads/lead_1', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'invalid' }),
    }),
    { params: Promise.resolve({ leadId: 'lead_1' }) }
  );
  assert.equal(response.status, 400);
});

test('lead PATCH writes status-change activity when status is updated', async () => {
  const updatedLead: CrmLead = {
    id: 'lead_2',
    tenantId: tenantContext.tenantId,
    contactId: 'contact_2',
    status: 'qualified',
    leadType: 'website_lead',
    source: 'website',
    timeframe: null,
    notes: 'updated',
    listingId: null,
    listingUrl: null,
    listingAddress: null,
    propertyType: null,
    beds: null,
    baths: null,
    sqft: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  let activityWrites = 0;
  const handler = createLeadPatchHandler({
    requireTenantContext: authorizedContext,
    updateLeadForTenant: async () => updatedLead,
    createActivityForTenant: async () => {
      activityWrites += 1;
      return null;
    },
  });

  const response = await handler(
    new Request('http://crm.local/api/leads/lead_2', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'qualified' }),
    }),
    { params: Promise.resolve({ leadId: 'lead_2' }) }
  );
  assert.equal(response.status, 200);
  assert.equal(activityWrites, 1);
});
