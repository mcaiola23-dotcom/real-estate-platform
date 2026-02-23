import assert from 'node:assert/strict';
import test from 'node:test';

import type { CrmActivity, CrmContact, CrmLead, CrmShowing, CrmCommission, CrmCommissionSetting, CrmCampaign, CrmAdSpend, CrmTeamMember, TenantContext } from '@real-estate/types';

import type { LeadScoreExplanation, NextActionResult, LeadSummary, PredictiveScoreResult, LeadRoutingResult } from '@real-estate/ai/types';

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
import { createRemindersGetHandler } from '../ai/reminders/[leadId]/route';
import { createEscalationGetHandler } from '../ai/escalation/[leadId]/route';
import { createMarketDigestGetHandler } from '../ai/market-digest/route';
import { createListingDescriptionPostHandler } from '../ai/listing-description/route';
import { createPredictiveScoreGetHandler } from '../ai/predictive-score/[leadId]/route';
import { createLeadRoutingGetHandler } from '../ai/lead-routing/[leadId]/route';
import { createShowingsGetHandler, createShowingsPostHandler } from '../showings/route';
import { createCommissionsGetHandler, createCommissionsPostHandler } from '../commissions/route';
import { createCampaignsGetHandler, createCampaignsPostHandler } from '../campaigns/route';
import { createAdSpendGetHandler, createAdSpendPostHandler } from '../ad-spend/route';
import { createTeamGetHandler, createTeamPostHandler } from '../team/route';
import { createDailyDigestGetHandler } from '../ai/daily-digest/route';
import { createNlQueryPostHandler } from '../ai/natural-language/route';

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
    nextActionChannel: null,
    reminderSnoozedUntil: null,
    priceMin: null,
    priceMax: null,
    tags: [],
    closeReason: null,
    closeNotes: null,
    closedAt: null,
    assignedTo: null,
    referredBy: null,
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
    nextActionChannel: null,
    reminderSnoozedUntil: null,
    priceMin: null,
    priceMax: null,
    tags: [],
    closeReason: null,
    closeNotes: null,
    closedAt: null,
    assignedTo: null,
    referredBy: null,
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
    nextActionChannel: null,
    reminderSnoozedUntil: null,
    priceMin: null,
    priceMax: null,
    tags: [],
    closeReason: null,
    closeNotes: null,
    closedAt: null,
    assignedTo: null,
    referredBy: null,
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
    nextActionChannel: null,
    reminderSnoozedUntil: null,
    priceMin: null,
    priceMax: null,
    tags: [],
    closeReason: null,
    closeNotes: null,
    closedAt: null,
    assignedTo: null,
    referredBy: null,
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
  nextActionChannel: null,
  reminderSnoozedUntil: null,
  priceMin: null,
  priceMax: null,
  tags: [],
  closeReason: null,
  closeNotes: null,
  closedAt: null,
  assignedTo: null,
  referredBy: null,
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

// ---------------------------------------------------------------------------
// AI Reminders (Phase 9A)
// ---------------------------------------------------------------------------

test('AI reminders GET returns 401 when unauthorized', async () => {
  const handler = createRemindersGetHandler({
    requireTenantContext: unauthorizedContext,
    getLeadByIdForTenant: async () => null,
    listActivitiesByTenantId: async () => [],
    computeSmartReminders: async () => ({ leadId: '', tenantId: '', suggestions: [], provenance: {} as never }),
  });

  const response = await handler(
    new Request('http://crm.local/api/ai/reminders/lead_1'),
    { params: Promise.resolve({ leadId: 'lead_1' }) },
  );
  assert.equal(response.status, 401);
});

test('AI reminders GET returns 404 for missing lead', async () => {
  const handler = createRemindersGetHandler({
    requireTenantContext: authorizedContext,
    getLeadByIdForTenant: async () => null,
    listActivitiesByTenantId: async () => [],
    computeSmartReminders: async () => ({ leadId: '', tenantId: '', suggestions: [], provenance: {} as never }),
  });

  const response = await handler(
    new Request('http://crm.local/api/ai/reminders/lead_missing'),
    { params: Promise.resolve({ leadId: 'lead_missing' }) },
  );
  assert.equal(response.status, 404);
});

test('AI reminders GET returns tenant-scoped suggestions', async () => {
  const lead: CrmLead = {
    id: 'lead_reminder',
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
    nextActionAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    nextActionNote: 'Follow up call',
    nextActionChannel: 'call',
    reminderSnoozedUntil: null,
    priceMin: null,
    priceMax: null,
    tags: [],
    closeReason: null,
    closeNotes: null,
    closedAt: null,
    assignedTo: null,
    referredBy: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  let receivedTenantId = '';
  const handler = createRemindersGetHandler({
    requireTenantContext: authorizedContext,
    getLeadByIdForTenant: async (tid) => { receivedTenantId = tid; return lead; },
    listActivitiesByTenantId: async () => [],
    computeSmartReminders: async (tid, l, _a) => ({
      leadId: l.id,
      tenantId: tid,
      suggestions: [{
        suggestedAt: lead.nextActionAt!,
        channel: 'call' as const,
        urgency: 'overdue' as const,
        reason: 'Overdue follow-up.',
        aiEnhancedReason: null,
        snoozeOptions: [{ label: '1 hour', durationMs: 3600000 }],
        provenance: { source: 'rule_engine' as const, model: null, promptVersion: 'crm.reminder_suggest.v1', generatedAt: new Date().toISOString(), latencyMs: 5, cached: false },
      }],
      provenance: { source: 'rule_engine' as const, model: null, promptVersion: 'crm.reminder_suggest.v1', generatedAt: new Date().toISOString(), latencyMs: 5, cached: false },
    }),
  });

  const response = await handler(
    new Request('http://crm.local/api/ai/reminders/lead_reminder'),
    { params: Promise.resolve({ leadId: 'lead_reminder' }) },
  );
  assert.equal(response.status, 200);
  assert.equal(receivedTenantId, tenantContext.tenantId);
  const body = (await response.json()) as { ok: boolean; reminders: { suggestions: Array<{ urgency: string }> } };
  assert.equal(body.ok, true);
  assert.equal(body.reminders.suggestions.length, 1);
  assert.equal(body.reminders.suggestions[0]!.urgency, 'overdue');
});

// ---------------------------------------------------------------------------
// AI Escalation (Phase 9D)
// ---------------------------------------------------------------------------

test('AI escalation GET returns 401 when unauthorized', async () => {
  const handler = createEscalationGetHandler({
    requireTenantContext: unauthorizedContext,
    getLeadByIdForTenant: async () => null,
    listActivitiesByTenantId: async () => [],
    evaluateEscalation: async () => ({ leadId: '', tenantId: '', level: 0 as const, triggers: [], scoreDecayPercent: 0, recommendation: '', aiRecommendation: null, provenance: {} as never }),
  });

  const response = await handler(
    new Request('http://crm.local/api/ai/escalation/lead_1'),
    { params: Promise.resolve({ leadId: 'lead_1' }) },
  );
  assert.equal(response.status, 401);
});

test('AI escalation GET returns 404 for missing lead', async () => {
  const handler = createEscalationGetHandler({
    requireTenantContext: authorizedContext,
    getLeadByIdForTenant: async () => null,
    listActivitiesByTenantId: async () => [],
    evaluateEscalation: async () => ({ leadId: '', tenantId: '', level: 0 as const, triggers: [], scoreDecayPercent: 0, recommendation: '', aiRecommendation: null, provenance: {} as never }),
  });

  const response = await handler(
    new Request('http://crm.local/api/ai/escalation/lead_missing'),
    { params: Promise.resolve({ leadId: 'lead_missing' }) },
  );
  assert.equal(response.status, 404);
});

test('AI escalation GET returns tenant-scoped escalation result', async () => {
  const lead: CrmLead = {
    id: 'lead_esc',
    tenantId: tenantContext.tenantId,
    contactId: null,
    status: 'new',
    leadType: 'website_lead',
    source: 'website',
    timeframe: null,
    notes: null,
    listingId: null,
    listingUrl: null,
    listingAddress: '123 Main St',
    propertyType: null,
    beds: null,
    baths: null,
    sqft: null,
    lastContactAt: null,
    nextActionAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    nextActionNote: null,
    nextActionChannel: null,
    reminderSnoozedUntil: null,
    priceMin: null,
    priceMax: null,
    tags: [],
    closeReason: null,
    closeNotes: null,
    closedAt: null,
    assignedTo: null,
    referredBy: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  let receivedTenantId = '';
  const handler = createEscalationGetHandler({
    requireTenantContext: authorizedContext,
    getLeadByIdForTenant: async (tid) => { receivedTenantId = tid; return lead; },
    listActivitiesByTenantId: async () => [],
    evaluateEscalation: async (tid, l, _a) => ({
      leadId: l.id,
      tenantId: tid,
      level: 2 as const,
      triggers: [{
        trigger: 'overdue_followup' as const,
        detail: 'Follow-up is 5 days overdue.',
        daysOverdue: 5,
      }],
      scoreDecayPercent: 20,
      recommendation: 'Action needed: Follow-up is 5 days overdue.',
      aiRecommendation: null,
      provenance: { source: 'rule_engine' as const, model: null, promptVersion: 'crm.escalation.v1', generatedAt: new Date().toISOString(), latencyMs: 3, cached: false },
    }),
  });

  const response = await handler(
    new Request('http://crm.local/api/ai/escalation/lead_esc'),
    { params: Promise.resolve({ leadId: 'lead_esc' }) },
  );
  assert.equal(response.status, 200);
  assert.equal(receivedTenantId, tenantContext.tenantId);
  const body = (await response.json()) as { ok: boolean; escalation: { level: number; scoreDecayPercent: number; triggers: Array<{ trigger: string }> } };
  assert.equal(body.ok, true);
  assert.equal(body.escalation.level, 2);
  assert.equal(body.escalation.scoreDecayPercent, 20);
  assert.equal(body.escalation.triggers.length, 1);
  assert.equal(body.escalation.triggers[0]!.trigger, 'overdue_followup');
});

// ---------------------------------------------------------------------------
// AI Market Digest
// ---------------------------------------------------------------------------

test('AI market-digest GET returns 401 when unauthorized', async () => {
  const handler = createMarketDigestGetHandler({
    requireTenantContext: unauthorizedContext,
    searchCrmListings: () => ({ listings: [], total: 0, page: 1, pageSize: 12, totalPages: 0 }),
    generateMarketDigest: async () => ({
      tenantId: '', stats: {} as never, narrative: '', highlights: [], agentTakeaway: null,
      provenance: { source: 'fallback' as const, model: null, promptVersion: '', generatedAt: '', latencyMs: 0, cached: false },
    }),
  });
  const response = await handler(new Request('http://crm.local/api/ai/market-digest'));
  assert.equal(response.status, 401);
});

test('AI market-digest GET returns tenant-scoped digest', async () => {
  let receivedTenantId = '';
  const handler = createMarketDigestGetHandler({
    requireTenantContext: authorizedContext,
    searchCrmListings: () => ({
      listings: [
        {
          id: 'prop-1', status: 'active' as const, price: 500000, beds: 3, baths: 2, sqft: 2000,
          propertyType: 'single-family' as const,
          address: { street: '1 Main St', city: 'Fairfield', state: 'CT', zip: '06824' },
          photos: [], listedAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        },
      ],
      total: 1, page: 1, pageSize: 200, totalPages: 1,
    }),
    generateMarketDigest: async (tenantId, input) => {
      receivedTenantId = tenantId;
      return {
        tenantId,
        stats: { totalActive: 1, totalPending: 0, totalSold: 0, medianPrice: 500000, averagePrice: 500000, medianSqft: 2000, pricePerSqft: 250, newListingsThisWeek: 0, priceRange: { min: 500000, max: 500000 }, byPropertyType: { 'single-family': 1 }, byCity: { Fairfield: 1 }, highestPrice: { price: 500000, city: 'Fairfield' }, lowestPrice: { price: 500000, city: 'Fairfield' } },
        narrative: 'Test digest narrative.',
        highlights: ['1 active listing'],
        agentTakeaway: 'Review matches.',
        provenance: { source: 'fallback' as const, model: null, promptVersion: 'crm.market_digest.v1', generatedAt: new Date().toISOString(), latencyMs: 5, cached: false },
      };
    },
  });

  const response = await handler(new Request('http://crm.local/api/ai/market-digest'));
  assert.equal(response.status, 200);
  assert.equal(receivedTenantId, tenantContext.tenantId);
  const body = (await response.json()) as { ok: boolean; digest: { narrative: string; highlights: string[] } };
  assert.equal(body.ok, true);
  assert.equal(body.digest.narrative, 'Test digest narrative.');
  assert.equal(body.digest.highlights.length, 1);
});

// ---------------------------------------------------------------------------
// AI Listing Description Generator
// ---------------------------------------------------------------------------

test('AI listing-description POST returns 400 when required fields missing', async () => {
  const handler = createListingDescriptionPostHandler({
    requireTenantContext: authorizedContext,
    generateListingDescription: async () => ({
      tenantId: '', description: '', wordCount: 0, tone: 'luxury' as const,
      provenance: { source: 'fallback' as const, model: null, promptVersion: '', generatedAt: '', latencyMs: 0, cached: false },
    }),
  });

  const response = await handler(
    new Request('http://crm.local/api/ai/listing-description', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: '123 Main St' }),
    }),
  );
  assert.equal(response.status, 400);
});

test('AI listing-description POST returns tenant-scoped result', async () => {
  let receivedTenantId = '';
  let receivedTone = '';
  const handler = createListingDescriptionPostHandler({
    requireTenantContext: authorizedContext,
    generateListingDescription: async (tenantId, input) => {
      receivedTenantId = tenantId;
      receivedTone = input.tone;
      return {
        tenantId,
        description: 'Beautiful home at 123 Main Street.',
        wordCount: 6,
        tone: input.tone,
        provenance: { source: 'fallback' as const, model: null, promptVersion: 'crm.listing_description.v1', generatedAt: new Date().toISOString(), latencyMs: 3, cached: false },
      };
    },
  });

  const response = await handler(
    new Request('http://crm.local/api/ai/listing-description', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: '123 Main Street',
        propertyType: 'single-family',
        beds: 3,
        baths: 2,
        sqft: 2000,
        tone: 'family-friendly',
        features: ['pool', 'garage'],
      }),
    }),
  );
  assert.equal(response.status, 200);
  assert.equal(receivedTenantId, tenantContext.tenantId);
  assert.equal(receivedTone, 'family-friendly');
  const body = (await response.json()) as { ok: boolean; result: { description: string; wordCount: number; tone: string } };
  assert.equal(body.ok, true);
  assert.equal(body.result.description, 'Beautiful home at 123 Main Street.');
  assert.equal(body.result.tone, 'family-friendly');
});

// ---------------------------------------------------------------------------
// AI Predictive Score
// ---------------------------------------------------------------------------

test('AI predictive-score GET returns 401 when unauthorized', async () => {
  const handler = createPredictiveScoreGetHandler({
    requireTenantContext: unauthorizedContext,
    getLeadByIdForTenant: async () => null,
    listLeadsByTenantId: async () => [],
    listActivitiesByTenantId: async () => [],
    predictLeadConversion: async () => ({
      leadId: '', tenantId: '', conversionProbability: 0, confidence: 'low' as const,
      insufficient: true, dataStats: null, topFactors: [], explanation: null,
      provenance: { source: 'rule_engine' as const, model: null, promptVersion: '', generatedAt: '', latencyMs: 0, cached: false },
    }),
  });
  const response = await handler(
    new Request('http://crm.local/api/ai/predictive-score/lead_1'),
    { params: Promise.resolve({ leadId: 'lead_1' }) },
  );
  assert.equal(response.status, 401);
});

test('AI predictive-score GET returns 404 for missing lead', async () => {
  const handler = createPredictiveScoreGetHandler({
    requireTenantContext: authorizedContext,
    getLeadByIdForTenant: async () => null,
    listLeadsByTenantId: async () => [],
    listActivitiesByTenantId: async () => [],
    predictLeadConversion: async () => ({
      leadId: '', tenantId: '', conversionProbability: 0, confidence: 'low' as const,
      insufficient: true, dataStats: null, topFactors: [], explanation: null,
      provenance: { source: 'rule_engine' as const, model: null, promptVersion: '', generatedAt: '', latencyMs: 0, cached: false },
    }),
  });
  const response = await handler(
    new Request('http://crm.local/api/ai/predictive-score/lead_missing'),
    { params: Promise.resolve({ leadId: 'lead_missing' }) },
  );
  assert.equal(response.status, 404);
});

test('AI predictive-score GET returns tenant-scoped prediction', async () => {
  let receivedTenantId = '';
  const testLead: CrmLead = {
    id: 'lead_ps1', tenantId: tenantContext.tenantId, contactId: null, status: 'new',
    leadType: 'buyer', source: 'website', timeframe: null, notes: null,
    listingId: null, listingUrl: null, listingAddress: '123 Elm St, Fairfield, CT',
    propertyType: 'single-family', beds: null, baths: null, sqft: null,
    lastContactAt: null, nextActionAt: null, nextActionNote: null, nextActionChannel: null,
    reminderSnoozedUntil: null, priceMin: null, priceMax: null, tags: [],
    closeReason: null, closeNotes: null, closedAt: null,
    assignedTo: null, referredBy: null,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };

  const handler = createPredictiveScoreGetHandler({
    requireTenantContext: authorizedContext,
    getLeadByIdForTenant: async () => testLead,
    listLeadsByTenantId: async () => [],
    listActivitiesByTenantId: async () => [],
    predictLeadConversion: async (tenantId) => {
      receivedTenantId = tenantId;
      return {
        leadId: 'lead_ps1', tenantId, conversionProbability: 65, confidence: 'medium' as const,
        insufficient: false, dataStats: { totalWon: 30, totalLost: 25 },
        topFactors: [{ feature: 'Activity Frequency', direction: 'positive' as const, impact: 0.4, detail: 'Activity Frequency: 4-8' }],
        explanation: 'This lead shows moderate conversion potential.',
        provenance: { source: 'fallback' as const, model: null, promptVersion: 'crm.predictive_score.v1', generatedAt: new Date().toISOString(), latencyMs: 8, cached: false },
      };
    },
  });

  const response = await handler(
    new Request('http://crm.local/api/ai/predictive-score/lead_ps1'),
    { params: Promise.resolve({ leadId: 'lead_ps1' }) },
  );
  assert.equal(response.status, 200);
  assert.equal(receivedTenantId, tenantContext.tenantId);
  const body = (await response.json()) as { ok: boolean; prediction: PredictiveScoreResult };
  assert.equal(body.ok, true);
  assert.equal(body.prediction.conversionProbability, 65);
  assert.equal(body.prediction.confidence, 'medium');
  assert.equal(body.prediction.topFactors.length, 1);
});

// ---------------------------------------------------------------------------
// AI Lead Routing
// ---------------------------------------------------------------------------

test('AI lead-routing GET returns 401 when unauthorized', async () => {
  const handler = createLeadRoutingGetHandler({
    requireTenantContext: unauthorizedContext,
    getLeadByIdForTenant: async () => null,
    listLeadsByTenantId: async () => [],
    listActivitiesByTenantId: async () => [],
    listTenantControlActors: async () => [],
    computeLeadRouting: async () => ({
      leadId: '', tenantId: '', mode: 'solo' as const, recommendations: [], explanation: null,
      provenance: { source: 'rule_engine' as const, model: null, promptVersion: '', generatedAt: '', latencyMs: 0, cached: false },
    }),
  });
  const response = await handler(
    new Request('http://crm.local/api/ai/lead-routing/lead_1'),
    { params: Promise.resolve({ leadId: 'lead_1' }) },
  );
  assert.equal(response.status, 401);
});

test('AI lead-routing GET returns 404 for missing lead', async () => {
  const handler = createLeadRoutingGetHandler({
    requireTenantContext: authorizedContext,
    getLeadByIdForTenant: async () => null,
    listLeadsByTenantId: async () => [],
    listActivitiesByTenantId: async () => [],
    listTenantControlActors: async () => [],
    computeLeadRouting: async () => ({
      leadId: '', tenantId: '', mode: 'solo' as const, recommendations: [], explanation: null,
      provenance: { source: 'rule_engine' as const, model: null, promptVersion: '', generatedAt: '', latencyMs: 0, cached: false },
    }),
  });
  const response = await handler(
    new Request('http://crm.local/api/ai/lead-routing/lead_missing'),
    { params: Promise.resolve({ leadId: 'lead_missing' }) },
  );
  assert.equal(response.status, 404);
});

test('AI lead-routing GET returns tenant-scoped routing (solo mode)', async () => {
  let receivedTenantId = '';
  const testLead: CrmLead = {
    id: 'lead_rt1', tenantId: tenantContext.tenantId, contactId: null, status: 'new',
    leadType: 'buyer', source: 'website', timeframe: null, notes: null,
    listingId: null, listingUrl: null, listingAddress: '10 Oak Ave, Fairfield, CT',
    propertyType: 'condo', beds: null, baths: null, sqft: null,
    lastContactAt: null, nextActionAt: null, nextActionNote: null, nextActionChannel: null,
    reminderSnoozedUntil: null, priceMin: null, priceMax: null, tags: [],
    closeReason: null, closeNotes: null, closedAt: null,
    assignedTo: null, referredBy: null,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };

  const handler = createLeadRoutingGetHandler({
    requireTenantContext: authorizedContext,
    getLeadByIdForTenant: async () => testLead,
    listLeadsByTenantId: async () => [],
    listActivitiesByTenantId: async () => [],
    listTenantControlActors: async () => [],
    computeLeadRouting: async (tenantId) => {
      receivedTenantId = tenantId;
      return {
        leadId: 'lead_rt1', tenantId, mode: 'solo' as const,
        recommendations: [{
          agentId: 'actor_1', agentName: 'Agent One', compositeScore: 72,
          factors: [{ factor: 'Pipeline Load', weight: 0.2, score: 80, detail: '3 active leads' }],
          isCurrentAssignee: false,
        }],
        explanation: 'Self-assessment: strong pipeline capacity.',
        provenance: { source: 'fallback' as const, model: null, promptVersion: 'crm.lead_routing.v1', generatedAt: new Date().toISOString(), latencyMs: 5, cached: false },
      };
    },
  });

  const response = await handler(
    new Request('http://crm.local/api/ai/lead-routing/lead_rt1'),
    { params: Promise.resolve({ leadId: 'lead_rt1' }) },
  );
  assert.equal(response.status, 200);
  assert.equal(receivedTenantId, tenantContext.tenantId);
  const body = (await response.json()) as { ok: boolean; routing: LeadRoutingResult };
  assert.equal(body.ok, true);
  assert.equal(body.routing.mode, 'solo');
  assert.equal(body.routing.recommendations.length, 1);
  assert.equal(body.routing.recommendations[0]!.compositeScore, 72);
});

// ============================================================
// Showings Routes (Sprint 3)
// ============================================================

test('showings GET returns 401 when unauthorized', async () => {
  const handler = createShowingsGetHandler({
    requireTenantContext: unauthorizedContext,
    listShowingsByTenantId: async () => [],
    createShowingForTenant: async () => null,
  });

  const response = await handler(new Request('http://crm.local/api/showings'));
  assert.equal(response.status, 401);
});

test('showings GET returns tenant-scoped list with pagination', async () => {
  const showing: CrmShowing = {
    id: 'showing_1',
    tenantId: tenantContext.tenantId,
    leadId: 'lead_1',
    contactId: null,
    propertyAddress: '42 Oak Lane, Fairfield CT',
    scheduledAt: new Date().toISOString(),
    duration: 30,
    status: 'scheduled',
    notes: null,
    calendarEventId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  let receivedTenantId = '';
  const handler = createShowingsGetHandler({
    requireTenantContext: authorizedContext,
    listShowingsByTenantId: async (tenantId) => {
      receivedTenantId = tenantId;
      return [showing];
    },
    createShowingForTenant: async () => null,
  });

  const response = await handler(new Request('http://crm.local/api/showings?limit=10&offset=0'));
  assert.equal(response.status, 200);
  assert.equal(receivedTenantId, tenantContext.tenantId);
  const body = (await response.json()) as {
    ok: boolean;
    tenantId: string;
    showings: CrmShowing[];
    pagination: { limit: number; offset: number; nextOffset: number | null };
  };
  assert.equal(body.ok, true);
  assert.equal(body.tenantId, tenantContext.tenantId);
  assert.equal(body.showings.length, 1);
  assert.equal(body.showings[0]!.propertyAddress, '42 Oak Lane, Fairfield CT');
});

test('showings POST returns 400 when propertyAddress is missing', async () => {
  const handler = createShowingsPostHandler({
    requireTenantContext: authorizedContext,
    listShowingsByTenantId: async () => [],
    createShowingForTenant: async () => null,
  });

  const response = await handler(
    new Request('http://crm.local/api/showings', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ scheduledAt: new Date().toISOString() }),
    })
  );
  assert.equal(response.status, 400);
  const body = (await response.json()) as { error: string };
  assert.match(body.error, /propertyAddress/);
});

test('showings POST returns 400 when scheduledAt is missing', async () => {
  const handler = createShowingsPostHandler({
    requireTenantContext: authorizedContext,
    listShowingsByTenantId: async () => [],
    createShowingForTenant: async () => null,
  });

  const response = await handler(
    new Request('http://crm.local/api/showings', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ propertyAddress: '10 Main St' }),
    })
  );
  assert.equal(response.status, 400);
  const body = (await response.json()) as { error: string };
  assert.match(body.error, /scheduledAt/);
});

test('showings POST creates tenant-scoped showing', async () => {
  const showing: CrmShowing = {
    id: 'showing_2',
    tenantId: tenantContext.tenantId,
    leadId: 'lead_1',
    contactId: null,
    propertyAddress: '100 Elm Street',
    scheduledAt: '2026-03-01T14:00:00Z',
    duration: 45,
    status: 'scheduled',
    notes: 'Buyer is interested in backyard',
    calendarEventId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  let receivedTenantId = '';
  const handler = createShowingsPostHandler({
    requireTenantContext: authorizedContext,
    listShowingsByTenantId: async () => [],
    createShowingForTenant: async (tenantId) => {
      receivedTenantId = tenantId;
      return showing;
    },
  });

  const response = await handler(
    new Request('http://crm.local/api/showings', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        propertyAddress: '100 Elm Street',
        scheduledAt: '2026-03-01T14:00:00Z',
        leadId: 'lead_1',
        duration: 45,
        notes: 'Buyer is interested in backyard',
      }),
    })
  );
  assert.equal(response.status, 201);
  assert.equal(receivedTenantId, tenantContext.tenantId);
  const body = (await response.json()) as { ok: boolean; showing: CrmShowing };
  assert.equal(body.ok, true);
  assert.equal(body.showing.propertyAddress, '100 Elm Street');
});

// ============================================================
// Commissions Routes (Sprint 3)
// ============================================================

test('commissions GET returns 401 when unauthorized', async () => {
  const handler = createCommissionsGetHandler({
    requireTenantContext: unauthorizedContext,
    listCommissionsByTenantId: async () => [],
    createCommissionForTenant: async () => null,
    getCommissionSettingForTenant: async () => null,
    upsertCommissionSettingForTenant: async () => null,
  });

  const response = await handler(new Request('http://crm.local/api/commissions'));
  assert.equal(response.status, 401);
});

test('commissions GET returns tenant-scoped commissions with settings', async () => {
  const commission: CrmCommission = {
    id: 'comm_1',
    tenantId: tenantContext.tenantId,
    transactionId: 'txn_1',
    leadId: 'lead_1',
    salePrice: 500000,
    commPct: 3.0,
    brokerageSplitPct: 70,
    marketingFees: 500,
    referralFees: 200,
    netAmount: 9800,
    notes: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const settings: CrmCommissionSetting = {
    id: 'cs_1',
    tenantId: tenantContext.tenantId,
    defaultCommPct: 3.0,
    brokerageSplitPct: 70,
    marketingFee: 500,
    referralFee: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  let receivedTenantId = '';
  const handler = createCommissionsGetHandler({
    requireTenantContext: authorizedContext,
    listCommissionsByTenantId: async (tenantId) => {
      receivedTenantId = tenantId;
      return [commission];
    },
    createCommissionForTenant: async () => null,
    getCommissionSettingForTenant: async () => settings,
    upsertCommissionSettingForTenant: async () => null,
  });

  const response = await handler(new Request('http://crm.local/api/commissions?limit=10&offset=0'));
  assert.equal(response.status, 200);
  assert.equal(receivedTenantId, tenantContext.tenantId);
  const body = (await response.json()) as {
    ok: boolean;
    tenantId: string;
    commissions: CrmCommission[];
    settings: CrmCommissionSetting;
    pagination: { limit: number; offset: number; nextOffset: number | null };
  };
  assert.equal(body.ok, true);
  assert.equal(body.commissions.length, 1);
  assert.equal(body.commissions[0]!.salePrice, 500000);
  assert.equal(body.settings.defaultCommPct, 3.0);
});

test('commissions POST returns 400 when transactionId is missing', async () => {
  const handler = createCommissionsPostHandler({
    requireTenantContext: authorizedContext,
    listCommissionsByTenantId: async () => [],
    createCommissionForTenant: async () => null,
    getCommissionSettingForTenant: async () => null,
    upsertCommissionSettingForTenant: async () => null,
  });

  const response = await handler(
    new Request('http://crm.local/api/commissions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ salePrice: 400000 }),
    })
  );
  assert.equal(response.status, 400);
  const body = (await response.json()) as { error: string };
  assert.match(body.error, /transactionId/);
});

test('commissions POST returns 400 when salePrice is invalid', async () => {
  const handler = createCommissionsPostHandler({
    requireTenantContext: authorizedContext,
    listCommissionsByTenantId: async () => [],
    createCommissionForTenant: async () => null,
    getCommissionSettingForTenant: async () => null,
    upsertCommissionSettingForTenant: async () => null,
  });

  const response = await handler(
    new Request('http://crm.local/api/commissions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ transactionId: 'txn_1', salePrice: -100 }),
    })
  );
  assert.equal(response.status, 400);
  const body = (await response.json()) as { error: string };
  assert.match(body.error, /salePrice/);
});

test('commissions POST creates tenant-scoped commission', async () => {
  const commission: CrmCommission = {
    id: 'comm_2',
    tenantId: tenantContext.tenantId,
    transactionId: 'txn_2',
    leadId: null,
    salePrice: 750000,
    commPct: 2.5,
    brokerageSplitPct: 70,
    marketingFees: 0,
    referralFees: 0,
    netAmount: 13125,
    notes: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  let receivedTenantId = '';
  const handler = createCommissionsPostHandler({
    requireTenantContext: authorizedContext,
    listCommissionsByTenantId: async () => [],
    createCommissionForTenant: async (tenantId) => {
      receivedTenantId = tenantId;
      return commission;
    },
    getCommissionSettingForTenant: async () => null,
    upsertCommissionSettingForTenant: async () => null,
  });

  const response = await handler(
    new Request('http://crm.local/api/commissions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        transactionId: 'txn_2',
        salePrice: 750000,
        commPct: 2.5,
      }),
    })
  );
  assert.equal(response.status, 201);
  assert.equal(receivedTenantId, tenantContext.tenantId);
  const body = (await response.json()) as { ok: boolean; commission: CrmCommission };
  assert.equal(body.ok, true);
  assert.equal(body.commission.salePrice, 750000);
});

test('commissions POST updates settings via action=update_settings', async () => {
  const setting: CrmCommissionSetting = {
    id: 'cs_2',
    tenantId: tenantContext.tenantId,
    defaultCommPct: 2.5,
    brokerageSplitPct: 65,
    marketingFee: 300,
    referralFee: 100,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  let receivedTenantId = '';
  const handler = createCommissionsPostHandler({
    requireTenantContext: authorizedContext,
    listCommissionsByTenantId: async () => [],
    createCommissionForTenant: async () => null,
    getCommissionSettingForTenant: async () => null,
    upsertCommissionSettingForTenant: async (tenantId) => {
      receivedTenantId = tenantId;
      return setting;
    },
  });

  const response = await handler(
    new Request('http://crm.local/api/commissions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        action: 'update_settings',
        defaultCommPct: 2.5,
        brokerageSplitPct: 65,
      }),
    })
  );
  assert.equal(response.status, 200);
  assert.equal(receivedTenantId, tenantContext.tenantId);
  const body = (await response.json()) as { ok: boolean; settings: CrmCommissionSetting };
  assert.equal(body.ok, true);
  assert.equal(body.settings.defaultCommPct, 2.5);
});

// ============================================================
// Campaigns Routes (Sprint 5)
// ============================================================

test('campaigns GET returns 401 when unauthorized', async () => {
  const handler = createCampaignsGetHandler({
    requireTenantContext: unauthorizedContext,
    listCampaignsByTenantId: async () => [],
    createCampaignForTenant: async () => null,
    updateCampaignForTenant: async () => null,
  });

  const response = await handler(new Request('http://crm.local/api/campaigns'));
  assert.equal(response.status, 401);
});

test('campaigns GET returns tenant-scoped list with pagination', async () => {
  const campaign: CrmCampaign = {
    id: 'camp_1',
    tenantId: tenantContext.tenantId,
    name: 'Welcome Drip',
    status: 'active',
    stepsJson: JSON.stringify([{ day: 0, action: 'email', template: 'welcome' }]),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  let receivedTenantId = '';
  const handler = createCampaignsGetHandler({
    requireTenantContext: authorizedContext,
    listCampaignsByTenantId: async (tenantId) => {
      receivedTenantId = tenantId;
      return [campaign];
    },
    createCampaignForTenant: async () => null,
    updateCampaignForTenant: async () => null,
  });

  const response = await handler(new Request('http://crm.local/api/campaigns?limit=20&offset=0'));
  assert.equal(response.status, 200);
  assert.equal(receivedTenantId, tenantContext.tenantId);
  const body = (await response.json()) as {
    ok: boolean;
    tenantId: string;
    campaigns: CrmCampaign[];
    pagination: { limit: number; offset: number; nextOffset: number | null };
  };
  assert.equal(body.ok, true);
  assert.equal(body.campaigns.length, 1);
  assert.equal(body.campaigns[0]!.name, 'Welcome Drip');
});

test('campaigns POST returns 400 when name is missing', async () => {
  const handler = createCampaignsPostHandler({
    requireTenantContext: authorizedContext,
    listCampaignsByTenantId: async () => [],
    createCampaignForTenant: async () => null,
    updateCampaignForTenant: async () => null,
  });

  const response = await handler(
    new Request('http://crm.local/api/campaigns', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'draft' }),
    })
  );
  assert.equal(response.status, 400);
  const body = (await response.json()) as { error: string };
  assert.match(body.error, /name/);
});

test('campaigns POST creates tenant-scoped campaign', async () => {
  const campaign: CrmCampaign = {
    id: 'camp_2',
    tenantId: tenantContext.tenantId,
    name: 'Re-engagement Series',
    status: 'draft',
    stepsJson: '[]',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  let receivedTenantId = '';
  const handler = createCampaignsPostHandler({
    requireTenantContext: authorizedContext,
    listCampaignsByTenantId: async () => [],
    createCampaignForTenant: async (tenantId) => {
      receivedTenantId = tenantId;
      return campaign;
    },
    updateCampaignForTenant: async () => null,
  });

  const response = await handler(
    new Request('http://crm.local/api/campaigns', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Re-engagement Series' }),
    })
  );
  assert.equal(response.status, 201);
  assert.equal(receivedTenantId, tenantContext.tenantId);
  const body = (await response.json()) as { ok: boolean; campaign: CrmCampaign };
  assert.equal(body.ok, true);
  assert.equal(body.campaign.name, 'Re-engagement Series');
});

test('campaigns POST updates existing campaign via action=update', async () => {
  const updated: CrmCampaign = {
    id: 'camp_1',
    tenantId: tenantContext.tenantId,
    name: 'Updated Campaign',
    status: 'active',
    stepsJson: '[]',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  let receivedCampaignId = '';
  const handler = createCampaignsPostHandler({
    requireTenantContext: authorizedContext,
    listCampaignsByTenantId: async () => [],
    createCampaignForTenant: async () => null,
    updateCampaignForTenant: async (_tenantId, campaignId) => {
      receivedCampaignId = campaignId;
      return updated;
    },
  });

  const response = await handler(
    new Request('http://crm.local/api/campaigns', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'update', campaignId: 'camp_1', name: 'Updated Campaign' }),
    })
  );
  assert.equal(response.status, 200);
  assert.equal(receivedCampaignId, 'camp_1');
  const body = (await response.json()) as { ok: boolean; campaign: CrmCampaign };
  assert.equal(body.ok, true);
  assert.equal(body.campaign.name, 'Updated Campaign');
});

// ============================================================
// Ad Spend Routes (Sprint 5)
// ============================================================

test('ad-spend GET returns 401 when unauthorized', async () => {
  const handler = createAdSpendGetHandler({
    requireTenantContext: unauthorizedContext,
    listAdSpendsByTenantId: async () => [],
    createAdSpendForTenant: async () => null,
  });

  const response = await handler(new Request('http://crm.local/api/ad-spend'));
  assert.equal(response.status, 401);
});

test('ad-spend GET returns tenant-scoped list with pagination', async () => {
  const adSpend: CrmAdSpend = {
    id: 'ads_1',
    tenantId: tenantContext.tenantId,
    platform: 'google',
    amount: 1500,
    startDate: '2026-01-01',
    endDate: '2026-01-31',
    notes: null,
    createdAt: new Date().toISOString(),
  };

  let receivedTenantId = '';
  const handler = createAdSpendGetHandler({
    requireTenantContext: authorizedContext,
    listAdSpendsByTenantId: async (tenantId) => {
      receivedTenantId = tenantId;
      return [adSpend];
    },
    createAdSpendForTenant: async () => null,
  });

  const response = await handler(new Request('http://crm.local/api/ad-spend?limit=10&offset=0'));
  assert.equal(response.status, 200);
  assert.equal(receivedTenantId, tenantContext.tenantId);
  const body = (await response.json()) as {
    ok: boolean;
    tenantId: string;
    adSpends: CrmAdSpend[];
    pagination: { limit: number; offset: number; nextOffset: number | null };
  };
  assert.equal(body.ok, true);
  assert.equal(body.adSpends.length, 1);
  assert.equal(body.adSpends[0]!.platform, 'google');
  assert.equal(body.adSpends[0]!.amount, 1500);
});

test('ad-spend POST returns 400 when platform is missing', async () => {
  const handler = createAdSpendPostHandler({
    requireTenantContext: authorizedContext,
    listAdSpendsByTenantId: async () => [],
    createAdSpendForTenant: async () => null,
  });

  const response = await handler(
    new Request('http://crm.local/api/ad-spend', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ amount: 1000, startDate: '2026-01-01', endDate: '2026-01-31' }),
    })
  );
  assert.equal(response.status, 400);
  const body = (await response.json()) as { error: string };
  assert.match(body.error, /platform/);
});

test('ad-spend POST returns 400 when amount is invalid', async () => {
  const handler = createAdSpendPostHandler({
    requireTenantContext: authorizedContext,
    listAdSpendsByTenantId: async () => [],
    createAdSpendForTenant: async () => null,
  });

  const response = await handler(
    new Request('http://crm.local/api/ad-spend', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ platform: 'facebook', amount: -50 }),
    })
  );
  assert.equal(response.status, 400);
  const body = (await response.json()) as { error: string };
  assert.match(body.error, /amount/);
});

test('ad-spend POST creates tenant-scoped ad spend record', async () => {
  const adSpend: CrmAdSpend = {
    id: 'ads_2',
    tenantId: tenantContext.tenantId,
    platform: 'facebook',
    amount: 2000,
    startDate: '2026-02-01',
    endDate: '2026-02-28',
    notes: 'Buyer campaign',
    createdAt: new Date().toISOString(),
  };

  let receivedTenantId = '';
  const handler = createAdSpendPostHandler({
    requireTenantContext: authorizedContext,
    listAdSpendsByTenantId: async () => [],
    createAdSpendForTenant: async (tenantId) => {
      receivedTenantId = tenantId;
      return adSpend;
    },
  });

  const response = await handler(
    new Request('http://crm.local/api/ad-spend', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        platform: 'facebook',
        amount: 2000,
        startDate: '2026-02-01',
        endDate: '2026-02-28',
        notes: 'Buyer campaign',
      }),
    })
  );
  assert.equal(response.status, 201);
  assert.equal(receivedTenantId, tenantContext.tenantId);
  const body = (await response.json()) as { ok: boolean; adSpend: CrmAdSpend };
  assert.equal(body.ok, true);
  assert.equal(body.adSpend.platform, 'facebook');
  assert.equal(body.adSpend.amount, 2000);
});

// ============================================================
// Team Routes (Sprint 5)
// ============================================================

test('team GET returns 401 when unauthorized', async () => {
  const handler = createTeamGetHandler({
    requireTenantContext: unauthorizedContext,
    listTeamMembersByTenantId: async () => [],
    createTeamMemberForTenant: async () => null,
    updateTeamMemberForTenant: async () => null,
  });

  const response = await handler(new Request('http://crm.local/api/team'));
  assert.equal(response.status, 401);
});

test('team GET returns tenant-scoped members with pagination', async () => {
  const member: CrmTeamMember = {
    id: 'tm_1',
    tenantId: tenantContext.tenantId,
    name: 'Alice Agent',
    email: 'alice@fairfield.example.com',
    role: 'agent',
    isActive: true,
    leadCap: 25,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  let receivedTenantId = '';
  const handler = createTeamGetHandler({
    requireTenantContext: authorizedContext,
    listTeamMembersByTenantId: async (tenantId) => {
      receivedTenantId = tenantId;
      return [member];
    },
    createTeamMemberForTenant: async () => null,
    updateTeamMemberForTenant: async () => null,
  });

  const response = await handler(new Request('http://crm.local/api/team?limit=20&offset=0'));
  assert.equal(response.status, 200);
  assert.equal(receivedTenantId, tenantContext.tenantId);
  const body = (await response.json()) as {
    ok: boolean;
    tenantId: string;
    members: CrmTeamMember[];
    pagination: { limit: number; offset: number; nextOffset: number | null };
  };
  assert.equal(body.ok, true);
  assert.equal(body.members.length, 1);
  assert.equal(body.members[0]!.name, 'Alice Agent');
  assert.equal(body.members[0]!.role, 'agent');
});

test('team POST returns 400 when name is missing', async () => {
  const handler = createTeamPostHandler({
    requireTenantContext: authorizedContext,
    listTeamMembersByTenantId: async () => [],
    createTeamMemberForTenant: async () => null,
    updateTeamMemberForTenant: async () => null,
  });

  const response = await handler(
    new Request('http://crm.local/api/team', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'nobody@example.com' }),
    })
  );
  assert.equal(response.status, 400);
  const body = (await response.json()) as { error: string };
  assert.match(body.error, /name/);
});

test('team POST creates tenant-scoped team member', async () => {
  const member: CrmTeamMember = {
    id: 'tm_2',
    tenantId: tenantContext.tenantId,
    name: 'Bob Broker',
    email: 'bob@fairfield.example.com',
    role: 'broker',
    isActive: true,
    leadCap: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  let receivedTenantId = '';
  const handler = createTeamPostHandler({
    requireTenantContext: authorizedContext,
    listTeamMembersByTenantId: async () => [],
    createTeamMemberForTenant: async (tenantId) => {
      receivedTenantId = tenantId;
      return member;
    },
    updateTeamMemberForTenant: async () => null,
  });

  const response = await handler(
    new Request('http://crm.local/api/team', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Bob Broker',
        email: 'bob@fairfield.example.com',
        role: 'broker',
      }),
    })
  );
  assert.equal(response.status, 201);
  assert.equal(receivedTenantId, tenantContext.tenantId);
  const body = (await response.json()) as { ok: boolean; member: CrmTeamMember };
  assert.equal(body.ok, true);
  assert.equal(body.member.name, 'Bob Broker');
  assert.equal(body.member.role, 'broker');
});

test('team POST updates existing member via action=update', async () => {
  const updated: CrmTeamMember = {
    id: 'tm_1',
    tenantId: tenantContext.tenantId,
    name: 'Alice Agent',
    email: 'alice@fairfield.example.com',
    role: 'team_lead',
    isActive: true,
    leadCap: 30,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  let receivedMemberId = '';
  const handler = createTeamPostHandler({
    requireTenantContext: authorizedContext,
    listTeamMembersByTenantId: async () => [],
    createTeamMemberForTenant: async () => null,
    updateTeamMemberForTenant: async (_tenantId, memberId) => {
      receivedMemberId = memberId;
      return updated;
    },
  });

  const response = await handler(
    new Request('http://crm.local/api/team', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'update', memberId: 'tm_1', role: 'team_lead', leadCap: 30 }),
    })
  );
  assert.equal(response.status, 200);
  assert.equal(receivedMemberId, 'tm_1');
  const body = (await response.json()) as { ok: boolean; member: CrmTeamMember };
  assert.equal(body.ok, true);
  assert.equal(body.member.role, 'team_lead');
});

// ============================================================
// AI Daily Digest (Sprint 6)
// ============================================================

test('daily-digest GET returns 401 when unauthorized', async () => {
  const handler = createDailyDigestGetHandler({
    requireTenantContext: unauthorizedContext,
    listLeadsByTenantId: async () => [],
    listActivitiesByTenantId: async () => [],
  });

  const response = await handler(new Request('http://crm.local/api/ai/daily-digest'));
  assert.equal(response.status, 401);
});

test('daily-digest GET returns tenant-scoped digest items', async () => {
  const now = new Date();
  const recentLead: CrmLead = {
    id: 'lead_dd_1',
    tenantId: tenantContext.tenantId,
    contactId: null,
    status: 'new',
    leadType: 'website_lead',
    source: 'website',
    timeframe: null,
    notes: null,
    listingId: null,
    listingUrl: null,
    listingAddress: '55 Maple Drive',
    propertyType: null,
    beds: null,
    baths: null,
    sqft: null,
    lastContactAt: null,
    nextActionAt: null,
    nextActionNote: null,
    nextActionChannel: null,
    reminderSnoozedUntil: null,
    priceMin: null,
    priceMax: null,
    tags: [],
    closeReason: null,
    closeNotes: null,
    closedAt: null,
    assignedTo: null,
    referredBy: null,
    createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    updatedAt: new Date().toISOString(),
  };

  const overdueLead: CrmLead = {
    id: 'lead_dd_2',
    tenantId: tenantContext.tenantId,
    contactId: null,
    status: 'qualified',
    leadType: 'buyer',
    source: 'referral',
    timeframe: null,
    notes: null,
    listingId: null,
    listingUrl: null,
    listingAddress: '77 Pine Road',
    propertyType: null,
    beds: null,
    baths: null,
    sqft: null,
    lastContactAt: null,
    nextActionAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    nextActionNote: 'Follow up call',
    nextActionChannel: 'call',
    reminderSnoozedUntil: null,
    priceMin: null,
    priceMax: null,
    tags: [],
    closeReason: null,
    closeNotes: null,
    closedAt: null,
    assignedTo: null,
    referredBy: null,
    createdAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  };

  let receivedTenantId = '';
  const handler = createDailyDigestGetHandler({
    requireTenantContext: authorizedContext,
    listLeadsByTenantId: async (tenantId) => {
      receivedTenantId = tenantId;
      return [recentLead, overdueLead];
    },
    listActivitiesByTenantId: async () => [],
  });

  const response = await handler(new Request('http://crm.local/api/ai/daily-digest'));
  assert.equal(response.status, 200);
  assert.equal(receivedTenantId, tenantContext.tenantId);
  const body = (await response.json()) as {
    ok: boolean;
    tenantId: string;
    items: Array<{ type: string; label: string; leadId: string }>;
    generatedAt: string;
  };
  assert.equal(body.ok, true);
  assert.equal(body.tenantId, tenantContext.tenantId);
  assert.ok(body.items.length >= 2, 'Expected at least 2 digest items (new lead + overdue)');
  const types = body.items.map((i) => i.type);
  assert.ok(types.includes('new_lead'), 'Expected a new_lead item');
  assert.ok(types.includes('overdue'), 'Expected an overdue item');
});

test('daily-digest GET returns empty items when no leads exist', async () => {
  const handler = createDailyDigestGetHandler({
    requireTenantContext: authorizedContext,
    listLeadsByTenantId: async () => [],
    listActivitiesByTenantId: async () => [],
  });

  const response = await handler(new Request('http://crm.local/api/ai/daily-digest'));
  assert.equal(response.status, 200);
  const body = (await response.json()) as {
    ok: boolean;
    items: Array<unknown>;
    generatedAt: string;
  };
  assert.equal(body.ok, true);
  assert.equal(body.items.length, 0);
  assert.ok(body.generatedAt);
});

// ============================================================
// AI Natural Language Query (Sprint 6)
// ============================================================

test('natural-language POST returns 401 when unauthorized', async () => {
  const handler = createNlQueryPostHandler({
    requireTenantContext: unauthorizedContext,
  });

  const response = await handler(
    new Request('http://crm.local/api/ai/natural-language', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: 'show me leads from zillow' }),
    })
  );
  assert.equal(response.status, 401);
});

test('natural-language POST returns 400 when query is missing', async () => {
  const handler = createNlQueryPostHandler({
    requireTenantContext: authorizedContext,
  });

  const response = await handler(
    new Request('http://crm.local/api/ai/natural-language', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    })
  );
  assert.equal(response.status, 400);
  const body = (await response.json()) as { error: string };
  assert.match(body.error, /query/);
});

test('natural-language POST returns 400 when query is empty whitespace', async () => {
  const handler = createNlQueryPostHandler({
    requireTenantContext: authorizedContext,
  });

  const response = await handler(
    new Request('http://crm.local/api/ai/natural-language', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: '   ' }),
    })
  );
  assert.equal(response.status, 400);
});

test('natural-language POST parses source-based filter intent', async () => {
  const handler = createNlQueryPostHandler({
    requireTenantContext: authorizedContext,
  });

  const response = await handler(
    new Request('http://crm.local/api/ai/natural-language', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: 'show me leads from zillow' }),
    })
  );
  assert.equal(response.status, 200);
  const body = (await response.json()) as {
    ok: boolean;
    tenantId: string;
    intent: { action: string; view: string; filters: Record<string, string> };
  };
  assert.equal(body.ok, true);
  assert.equal(body.tenantId, tenantContext.tenantId);
  assert.equal(body.intent.action, 'filter');
  assert.equal(body.intent.view, 'leads');
  assert.equal(body.intent.filters.source, 'zillow');
});

test('natural-language POST parses status-based filter intent', async () => {
  const handler = createNlQueryPostHandler({
    requireTenantContext: authorizedContext,
  });

  const response = await handler(
    new Request('http://crm.local/api/ai/natural-language', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: 'show me qualified leads' }),
    })
  );
  assert.equal(response.status, 200);
  const body = (await response.json()) as {
    ok: boolean;
    intent: { action: string; filters: Record<string, string> };
  };
  assert.equal(body.intent.action, 'filter');
  assert.equal(body.intent.filters.status, 'qualified');
});

test('natural-language POST parses navigation intent', async () => {
  const handler = createNlQueryPostHandler({
    requireTenantContext: authorizedContext,
  });

  const response = await handler(
    new Request('http://crm.local/api/ai/natural-language', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: 'go to dashboard' }),
    })
  );
  assert.equal(response.status, 200);
  const body = (await response.json()) as {
    ok: boolean;
    intent: { action: string; view: string };
  };
  assert.equal(body.intent.action, 'navigate');
  assert.equal(body.intent.view, 'dashboard');
});

test('natural-language POST falls back to search for unknown queries', async () => {
  const handler = createNlQueryPostHandler({
    requireTenantContext: authorizedContext,
  });

  const response = await handler(
    new Request('http://crm.local/api/ai/natural-language', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: 'find property on elm street' }),
    })
  );
  assert.equal(response.status, 200);
  const body = (await response.json()) as {
    ok: boolean;
    intent: { action: string; searchTerm: string };
  };
  assert.equal(body.intent.action, 'search');
  assert.ok(body.intent.searchTerm);
});
