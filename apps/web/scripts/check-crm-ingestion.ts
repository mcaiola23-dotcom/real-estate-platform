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

  const timestampLead = '2026-02-13T12:00:00.000Z';
  const timestampValuation = '2026-02-13T12:05:00.000Z';

  const leadEvent: WebsiteLeadSubmittedEvent = {
    eventType: 'website.lead.submitted',
    version: 1,
    occurredAt: timestampLead,
    tenant,
    payload: {
      source: 'check-script',
      contact: {
        name: 'CRM Check User',
        email: 'crm-check@example.com',
        phone: '+1 (203) 555-0101',
      },
      timeframe: '0-3 months',
      message: 'Validating ingestion pipeline',
      listing: {
        id: null,
        url: null,
        address: '123 Test Ave',
      },
      propertyDetails: {
        propertyType: 'single-family',
        beds: 3,
        baths: 2,
        sqft: 1800,
      },
    },
  };

  const valuationEvent: WebsiteValuationRequestedEvent = {
    eventType: 'website.valuation.requested',
    version: 1,
    occurredAt: timestampValuation,
    tenant,
    payload: {
      address: '456 Value St',
      propertyType: 'condo',
      beds: 2,
      baths: 2,
      sqft: 1200,
    },
  };

  const before = await getCrmLeadIngestionSummary(tenant.tenantId);
  const leadResult = await enqueueWebsiteEvent(leadEvent);
  const leadDuplicate = await enqueueWebsiteEvent(leadEvent);
  const valuationResult = await enqueueWebsiteEvent(valuationEvent);
  const processed = await processWebsiteEventQueueBatch(10);
  const after = await getCrmLeadIngestionSummary(tenant.tenantId);

  if (!leadResult.accepted || !valuationResult.accepted) {
    console.error('Lead result:', leadResult);
    console.error('Valuation result:', valuationResult);
    throw new Error('Enqueue failed');
  }

  if (!leadDuplicate.duplicate) {
    throw new Error('Idempotency check failed for duplicate lead event');
  }

  console.log('CRM ingestion check passed.');
  console.log('Queue processing summary:', processed);
  console.log('Before:', before);
  console.log('After:', after);
  console.log('Lead result:', leadResult);
  console.log('Duplicate lead result:', leadDuplicate);
  console.log('Valuation result:', valuationResult);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
