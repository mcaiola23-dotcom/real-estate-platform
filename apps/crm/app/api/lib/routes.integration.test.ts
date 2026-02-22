import assert from 'node:assert/strict';
import test from 'node:test';

import type { CrmActivity, CrmContact, CrmLead, TenantContext } from '@real-estate/types';

import type { LeadScoreExplanation, NextActionResult, LeadSummary } from '@real-estate/ai/types';

import { createActivitiesGetHandler, createActivitiesPostHandler } from '../activities/route';
import { createContactsGetHandler, createContactsPostHandler } from '../contacts/route';
import { createContactPatchHandler } from '../contacts/[contactId]/route';
import { createLeadGetHandler, createLeadPatchHandler } from '../leads/[leadId]/route';
import { createLeadsGetHandler } from '../leads/route';
import { createScoreExplainGetHandler } from '../ai/lead-score-explain/[leadId]/route';
import { createNextActionGetHandler } from '../ai/next-action/[leadId]/route';
import { createLeadSummaryGetHandler } from '../ai/lead-summary/[leadId]/route';
import { createDraftMessagePostHandler } from '../ai/draft-message/route';
import { createExtractInsightsPostHandler } from '../ai/extract-insights/route';

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
    lastContactAt: null,
    nextActionAt: null,
    nextActionNote: null,
    priceMin: null,
    priceMax: null,
    tags: [],
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
      receivedSource = input.source ?? null;
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

test('contact PATCH updates tenant-scoped contact fields', async () => {
  const contact: CrmContact = {
    id: 'contact_3',
    tenantId: tenantContext.tenantId,
    fullName: 'Updated Name',
    email: 'updated@example.com',
    emailNormalized: 'updated@example.com',
    phone: '2035551234',
    phoneNormalized: '2035551234',
    source: 'crm_manual',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const handler = createContactPatchHandler({
    requireTenantContext: authorizedContext,
    updateContactForTenant: async (_tenantId, contactId, input) => {
      assert.equal(contactId, 'contact_3');
      assert.equal(input.fullName, 'Updated Name');
      return contact;
    },
  });

  const response = await handler(
    new Request('http://crm.local/api/contacts/contact_3', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ fullName: ' Updated Name ' }),
    }),
    { params: Promise.resolve({ contactId: 'contact_3' }) }
  );

  assert.equal(response.status, 200);
});

test('contact PATCH returns 400 for invalid json body', async () => {
  const handler = createContactPatchHandler({
    requireTenantContext: authorizedContext,
    updateContactForTenant: async () => null,
  });

  const response = await handler(
    new Request('http://crm.local/api/contacts/contact_3', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: '{"fullName":',
    }),
    { params: Promise.resolve({ contactId: 'contact_3' }) }
  );

  assert.equal(response.status, 400);
});

test('contact PATCH returns 400 when payload has no updatable fields', async () => {
  const handler = createContactPatchHandler({
    requireTenantContext: authorizedContext,
    updateContactForTenant: async () => null,
  });

  const response = await handler(
    new Request('http://crm.local/api/contacts/contact_3', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ fullName: 123 }),
    }),
    { params: Promise.resolve({ contactId: 'contact_3' }) }
  );

  assert.equal(response.status, 400);
});

test('contact PATCH returns 404 when tenant-scoped contact update misses', async () => {
  const handler = createContactPatchHandler({
    requireTenantContext: authorizedContext,
    updateContactForTenant: async () => null,
  });

  const response = await handler(
    new Request('http://crm.local/api/contacts/contact_404', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ fullName: 'Missing Contact' }),
    }),
    { params: Promise.resolve({ contactId: 'contact_404' }) }
  );

  assert.equal(response.status, 404);
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
    getLeadByIdForTenant: async () => null,
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

test('lead PATCH returns 400 for invalid json body', async () => {
  const handler = createLeadPatchHandler({
    requireTenantContext: authorizedContext,
    getLeadByIdForTenant: async () => null,
    updateLeadForTenant: async () => null,
    createActivityForTenant: async () => null,
  });

  const response = await handler(
    new Request('http://crm.local/api/leads/lead_1', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: '{"status":',
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
    lastContactAt: null,
    nextActionAt: null,
    nextActionNote: null,
    priceMin: null,
    priceMax: null,
    tags: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  let activityWrites = 0;
  const handler = createLeadPatchHandler({
    requireTenantContext: authorizedContext,
    getLeadByIdForTenant: async () => updatedLead,
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

test('lead PATCH does not write status-change activity when only notes are updated', async () => {
  const currentLead: CrmLead = {
    id: 'lead_4',
    tenantId: tenantContext.tenantId,
    contactId: 'contact_2',
    status: 'qualified',
    leadType: 'website_lead',
    source: 'website',
    timeframe: null,
    notes: 'existing',
    listingId: null,
    listingUrl: null,
    listingAddress: null,
    propertyType: null,
    beds: null,
    baths: null,
    sqft: null,
    lastContactAt: null,
    nextActionAt: null,
    nextActionNote: null,
    priceMin: null,
    priceMax: null,
    tags: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  let activityWrites = 0;
  const handler = createLeadPatchHandler({
    requireTenantContext: authorizedContext,
    getLeadByIdForTenant: async () => currentLead,
    updateLeadForTenant: async (_tenantId, _leadId, payload) => ({
      ...currentLead,
      notes: payload.notes ?? currentLead.notes,
      updatedAt: new Date().toISOString(),
    }),
    createActivityForTenant: async () => {
      activityWrites += 1;
      return null;
    },
  });

  const response = await handler(
    new Request('http://crm.local/api/leads/lead_4', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ notes: 'Updated notes only' }),
    }),
    { params: Promise.resolve({ leadId: 'lead_4' }) }
  );
  assert.equal(response.status, 200);
  assert.equal(activityWrites, 0);
});

test('lead PATCH returns 404 when tenant-scoped lead update misses', async () => {
  const handler = createLeadPatchHandler({
    requireTenantContext: authorizedContext,
    getLeadByIdForTenant: async () => null,
    updateLeadForTenant: async () => null,
    createActivityForTenant: async () => null,
  });

  const response = await handler(
    new Request('http://crm.local/api/leads/lead_404', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ notes: 'Missing lead' }),
    }),
    { params: Promise.resolve({ leadId: 'lead_404' }) }
  );
  assert.equal(response.status, 404);
});

test('lead GET returns tenant-scoped lead payload', async () => {
  const lead: CrmLead = {
    id: 'lead_3',
    tenantId: tenantContext.tenantId,
    contactId: null,
    status: 'new',
    leadType: 'valuation_request',
    source: 'website_valuation',
    timeframe: null,
    notes: null,
    listingId: null,
    listingUrl: null,
    listingAddress: '10 Main St',
    propertyType: null,
    beds: null,
    baths: null,
    sqft: null,
    lastContactAt: null,
    nextActionAt: null,
    nextActionNote: null,
    priceMin: null,
    priceMax: null,
    tags: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const handler = createLeadGetHandler({
    requireTenantContext: authorizedContext,
    getLeadByIdForTenant: async (tenantId, leadId) => {
      assert.equal(tenantId, tenantContext.tenantId);
      assert.equal(leadId, 'lead_3');
      return lead;
    },
    updateLeadForTenant: async () => null,
    createActivityForTenant: async () => null,
  });

  const response = await handler(new Request('http://crm.local/api/leads/lead_3'), {
    params: Promise.resolve({ leadId: 'lead_3' }),
  });
  assert.equal(response.status, 200);
});

test('lead GET returns 404 when tenant-scoped lead is missing', async () => {
  const handler = createLeadGetHandler({
    requireTenantContext: authorizedContext,
    getLeadByIdForTenant: async () => null,
    updateLeadForTenant: async () => null,
    createActivityForTenant: async () => null,
  });

  const response = await handler(new Request('http://crm.local/api/leads/missing'), {
    params: Promise.resolve({ leadId: 'missing' }),
  });

  assert.equal(response.status, 404);
});

// ============================================================
// AI Routes
// ============================================================

const testLead: CrmLead = {
  id: 'lead_ai_1',
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
  lastContactAt: null,
  nextActionAt: null,
  nextActionNote: null,
  priceMin: null,
  priceMax: null,
  tags: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

test('AI score-explain GET returns unauthorized when tenant context is missing', async () => {
  const handler = createScoreExplainGetHandler({
    requireTenantContext: unauthorizedContext,
    getLeadByIdForTenant: async () => testLead,
    listActivitiesByTenantId: async () => [],
    explainLeadScore: async () => ({} as LeadScoreExplanation),
  });

  const response = await handler(new Request('http://crm.local/api/ai/lead-score-explain/lead_ai_1'), {
    params: Promise.resolve({ leadId: 'lead_ai_1' }),
  });
  assert.equal(response.status, 401);
});

test('AI score-explain GET returns 404 when lead is missing', async () => {
  const handler = createScoreExplainGetHandler({
    requireTenantContext: authorizedContext,
    getLeadByIdForTenant: async () => null,
    listActivitiesByTenantId: async () => [],
    explainLeadScore: async () => ({} as LeadScoreExplanation),
  });

  const response = await handler(new Request('http://crm.local/api/ai/lead-score-explain/missing'), {
    params: Promise.resolve({ leadId: 'missing' }),
  });
  assert.equal(response.status, 404);
});

test('AI score-explain GET returns tenant-scoped explanation', async () => {
  const mockExplanation: LeadScoreExplanation = {
    leadId: 'lead_ai_1',
    tenantId: tenantContext.tenantId,
    score: 42,
    label: 'Interested',
    breakdown: [],
    naturalLanguage: 'Test explanation',
    provenance: {
      source: 'fallback',
      model: null,
      promptVersion: 'crm.lead_score_explain.v1',
      generatedAt: new Date().toISOString(),
      latencyMs: 5,
      cached: false,
    },
  };

  let receivedTenantId: string | null = null;
  const handler = createScoreExplainGetHandler({
    requireTenantContext: authorizedContext,
    getLeadByIdForTenant: async () => testLead,
    listActivitiesByTenantId: async () => [],
    explainLeadScore: async (tenantId: string) => {
      receivedTenantId = tenantId;
      return mockExplanation;
    },
  });

  const response = await handler(new Request('http://crm.local/api/ai/lead-score-explain/lead_ai_1'), {
    params: Promise.resolve({ leadId: 'lead_ai_1' }),
  });
  assert.equal(response.status, 200);
  assert.equal(receivedTenantId, tenantContext.tenantId);
  const body = (await response.json()) as { ok: boolean; explanation: LeadScoreExplanation };
  assert.equal(body.ok, true);
  assert.equal(body.explanation.score, 42);
  assert.equal(body.explanation.provenance.source, 'fallback');
});

test('AI next-action GET returns unauthorized when tenant context is missing', async () => {
  const handler = createNextActionGetHandler({
    requireTenantContext: unauthorizedContext,
    getLeadByIdForTenant: async () => testLead,
    listActivitiesByTenantId: async () => [],
    computeNextActions: async () => ({} as NextActionResult),
  });

  const response = await handler(new Request('http://crm.local/api/ai/next-action/lead_ai_1'), {
    params: Promise.resolve({ leadId: 'lead_ai_1' }),
  });
  assert.equal(response.status, 401);
});

test('AI next-action GET returns 404 when lead is missing', async () => {
  const handler = createNextActionGetHandler({
    requireTenantContext: authorizedContext,
    getLeadByIdForTenant: async () => null,
    listActivitiesByTenantId: async () => [],
    computeNextActions: async () => ({} as NextActionResult),
  });

  const response = await handler(new Request('http://crm.local/api/ai/next-action/missing'), {
    params: Promise.resolve({ leadId: 'missing' }),
  });
  assert.equal(response.status, 404);
});

test('AI next-action GET returns tenant-scoped suggestions', async () => {
  const mockResult: NextActionResult = {
    leadId: 'lead_ai_1',
    tenantId: tenantContext.tenantId,
    suggestions: [{
      patternId: 'overdue_followup',
      action: 'Follow up',
      reason: 'Overdue',
      urgency: 'high',
      aiEnhancedReason: null,
      provenance: {
        source: 'rule_engine',
        model: null,
        promptVersion: 'crm.next_action_enhance.v1',
        generatedAt: new Date().toISOString(),
        latencyMs: 2,
        cached: false,
      },
    }],
    provenance: {
      source: 'rule_engine',
      model: null,
      promptVersion: 'crm.next_action_enhance.v1',
      generatedAt: new Date().toISOString(),
      latencyMs: 2,
      cached: false,
    },
  };

  const handler = createNextActionGetHandler({
    requireTenantContext: authorizedContext,
    getLeadByIdForTenant: async () => testLead,
    listActivitiesByTenantId: async () => [],
    computeNextActions: async () => mockResult,
  });

  const response = await handler(new Request('http://crm.local/api/ai/next-action/lead_ai_1'), {
    params: Promise.resolve({ leadId: 'lead_ai_1' }),
  });
  assert.equal(response.status, 200);
  const body = (await response.json()) as { ok: boolean; result: NextActionResult };
  assert.equal(body.ok, true);
  assert.equal(body.result.suggestions.length, 1);
  assert.equal(body.result.suggestions[0]!.patternId, 'overdue_followup');
});

test('AI lead-summary GET returns 404 when lead is missing', async () => {
  const handler = createLeadSummaryGetHandler({
    requireTenantContext: authorizedContext,
    getLeadByIdForTenant: async () => null,
    listActivitiesByTenantId: async () => [],
    getContactByIdForTenant: async () => null,
    generateLeadSummary: async () => ({} as LeadSummary),
  });

  const response = await handler(new Request('http://crm.local/api/ai/lead-summary/missing'), {
    params: Promise.resolve({ leadId: 'missing' }),
  });
  assert.equal(response.status, 404);
});

test('AI lead-summary GET returns tenant-scoped summary', async () => {
  const mockSummary: LeadSummary = {
    leadId: 'lead_ai_1',
    tenantId: tenantContext.tenantId,
    summary: 'Test summary',
    keySignals: ['Signal 1'],
    recommendedApproach: 'Call them',
    provenance: {
      source: 'fallback',
      model: null,
      promptVersion: 'crm.lead_summary.v1',
      generatedAt: new Date().toISOString(),
      latencyMs: 3,
      cached: false,
    },
  };

  let receivedTenantId: string | null = null;
  const handler = createLeadSummaryGetHandler({
    requireTenantContext: authorizedContext,
    getLeadByIdForTenant: async () => testLead,
    listActivitiesByTenantId: async () => [],
    getContactByIdForTenant: async () => null,
    generateLeadSummary: async (tenantId: string) => {
      receivedTenantId = tenantId;
      return mockSummary;
    },
  });

  const response = await handler(new Request('http://crm.local/api/ai/lead-summary/lead_ai_1'), {
    params: Promise.resolve({ leadId: 'lead_ai_1' }),
  });
  assert.equal(response.status, 200);
  assert.equal(receivedTenantId, tenantContext.tenantId);
  const body = (await response.json()) as { ok: boolean; summary: LeadSummary };
  assert.equal(body.ok, true);
  assert.equal(body.summary.summary, 'Test summary');
});

test('AI draft-message POST returns 400 when leadId is missing', async () => {
  const handler = createDraftMessagePostHandler({
    requireTenantContext: authorizedContext,
    getLeadByIdForTenant: async () => testLead,
    listActivitiesByTenantId: async () => [],
    getContactByIdForTenant: async () => null,
    draftMessage: async () => ({ subject: null, body: '', tone: 'professional', provenance: {} as LeadSummary['provenance'] }),
  });

  const response = await handler(
    new Request('http://crm.local/api/ai/draft-message', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ context: 'Test' }),
    })
  );
  assert.equal(response.status, 400);
});

test('AI draft-message POST returns 404 when lead is missing', async () => {
  const handler = createDraftMessagePostHandler({
    requireTenantContext: authorizedContext,
    getLeadByIdForTenant: async () => null,
    listActivitiesByTenantId: async () => [],
    getContactByIdForTenant: async () => null,
    draftMessage: async () => ({ subject: null, body: '', tone: 'professional', provenance: {} as LeadSummary['provenance'] }),
  });

  const response = await handler(
    new Request('http://crm.local/api/ai/draft-message', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ leadId: 'missing_lead', context: 'Follow up' }),
    })
  );
  assert.equal(response.status, 404);
});

test('AI extract-insights POST returns 400 when text is missing', async () => {
  const handler = createExtractInsightsPostHandler({
    requireTenantContext: authorizedContext,
    extractInsights: async () => ({ tenantId: '', leadId: null, insights: [], provenance: {} as LeadSummary['provenance'] }),
  });

  const response = await handler(
    new Request('http://crm.local/api/ai/extract-insights', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    })
  );
  assert.equal(response.status, 400);
});

test('AI extract-insights POST returns tenant-scoped insights', async () => {
  let receivedTenantId: string | null = null;
  const handler = createExtractInsightsPostHandler({
    requireTenantContext: authorizedContext,
    extractInsights: async (tenantId: string) => {
      receivedTenantId = tenantId;
      return {
        tenantId,
        leadId: null,
        insights: [{ category: 'budget' as const, value: '$500k', confidence: 0.8 }],
        provenance: {
          source: 'fallback' as const,
          model: null,
          promptVersion: 'crm.extract_insights.v1',
          generatedAt: new Date().toISOString(),
          latencyMs: 1,
          cached: false,
        },
      };
    },
  });

  const response = await handler(
    new Request('http://crm.local/api/ai/extract-insights', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: 'Budget is around $500k' }),
    })
  );
  assert.equal(response.status, 200);
  assert.equal(receivedTenantId, tenantContext.tenantId);
  const body = (await response.json()) as { ok: boolean; result: { insights: Array<{ value: string }> } };
  assert.equal(body.ok, true);
  assert.equal(body.result.insights.length, 1);
  assert.equal(body.result.insights[0]!.value, '$500k');
});
