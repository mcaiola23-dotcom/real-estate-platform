import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

import {
  enqueueWebsiteEvent,
  getCrmLeadIngestionSummary,
  getIngestionRuntimeReadiness,
  processWebsiteEventQueueBatch,
} from '@real-estate/db/crm';
import type { WebsiteLeadSubmittedEvent, WebsiteValuationRequestedEvent } from '@real-estate/types/events';

async function run() {
  const runtime = await getIngestionRuntimeReadiness();
  if (!runtime.ready) {
    throw new Error(`Ingestion runtime unavailable: ${runtime.message}`);
  }

  const tenant = {
    tenantId: 'tenant_fairfield',
    tenantSlug: 'fairfield',
    tenantDomain: 'fairfield.localhost',
  };

  const runId = randomUUID().slice(0, 8);
  const now = new Date();
  const leadOccurredAt = new Date(now.getTime() + 1000).toISOString();
  const valuationOccurredAt = new Date(now.getTime() + 2000).toISOString();

  const leadEvent: WebsiteLeadSubmittedEvent = {
    eventType: 'website.lead.submitted',
    version: 1,
    occurredAt: leadOccurredAt,
    tenant,
    payload: {
      source: 'integration-worker-test',
      contact: {
        name: `Worker Flow ${runId}`,
        email: `worker-flow-${runId}@example.com`,
        phone: '+1 (203) 555-0199',
      },
      timeframe: '0-3 months',
      message: 'Validate enqueue to CRM persistence path',
      listing: {
        id: `listing-${runId}`,
        url: `https://example.com/listing/${runId}`,
        address: '111 Queue Test Ave',
      },
      propertyDetails: {
        propertyType: 'single-family',
        beds: 3,
        baths: 2,
        sqft: 1700,
      },
    },
  };

  const valuationEvent: WebsiteValuationRequestedEvent = {
    eventType: 'website.valuation.requested',
    version: 1,
    occurredAt: valuationOccurredAt,
    tenant,
    payload: {
      address: '222 Isolation Blvd',
      propertyType: 'condo',
      beds: 2,
      baths: 2,
      sqft: 1200,
    },
  };

  const before = await getCrmLeadIngestionSummary(tenant.tenantId);

  const [enqueueA, enqueueB] = await Promise.all([enqueueWebsiteEvent(leadEvent), enqueueWebsiteEvent(valuationEvent)]);
  assert.equal(enqueueA.accepted, true, 'Lead enqueue should be accepted');
  assert.equal(enqueueB.accepted, true, 'Valuation enqueue should be accepted');

  const batch = await processWebsiteEventQueueBatch(50);
  assert.ok(batch.processedCount >= 2, `Expected at least 2 processed jobs, got ${batch.processedCount}`);

  const after = await getCrmLeadIngestionSummary(tenant.tenantId);

  assert.equal(after.contactCount - before.contactCount, 1, 'Tenant should gain exactly one contact from lead event');
  assert.equal(after.leadCount - before.leadCount, 2, 'Tenant should gain exactly two leads (lead + valuation)');
  assert.equal(after.activityCount - before.activityCount, 2, 'Tenant should gain exactly two activities');

  console.log('Ingestion enqueue->worker->CRM integration check passed.');
  console.log({ runId, enqueueA, enqueueB, batch, before, after });
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
