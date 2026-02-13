import assert from 'node:assert/strict';

import {
  enqueueWebsiteEvent,
  getIngestionQueueJobById,
  getCrmLeadIngestionSummary,
  getIngestionRuntimeReadiness,
  listDeadLetterQueueJobs,
  processWebsiteEventQueueBatch,
  requeueDeadLetterQueueJob,
} from '@real-estate/db/crm';
import type { WebsiteLeadSubmittedEvent, WebsiteValuationRequestedEvent } from '@real-estate/types/events';

import { forceQueueJobAttempts, withTenantFixture } from './test-helpers';

async function run() {
  const runtime = await getIngestionRuntimeReadiness();
  if (!runtime.ready) {
    throw new Error(`Ingestion runtime unavailable: ${runtime.message}`);
  }

  await withTenantFixture('ingestion', async ({ now, runId, tenant }) => {
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
          phone: `+1 (203) 555-${runId.slice(0, 4)}`,
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

    const initialBatch = await processWebsiteEventQueueBatch(50);
    let after = await getCrmLeadIngestionSummary(tenant.tenantId);

    const maxDrainLoops = 8;
    let drainLoops = 0;
    while (drainLoops < maxDrainLoops) {
      const contactDelta = after.contactCount - before.contactCount;
      const leadDelta = after.leadCount - before.leadCount;
      const activityDelta = after.activityCount - before.activityCount;
      if (contactDelta >= 1 && leadDelta >= 2 && activityDelta >= 2) {
        break;
      }

      const drainResult = await processWebsiteEventQueueBatch(50);
      drainLoops += 1;
      if (drainResult.pickedCount === 0) {
        break;
      }
      after = await getCrmLeadIngestionSummary(tenant.tenantId);
    }

    assert.equal(after.contactCount - before.contactCount, 1, 'Tenant should gain exactly one contact from lead event');
    assert.equal(after.leadCount - before.leadCount, 2, 'Tenant should gain exactly two leads (lead + valuation)');
    assert.equal(after.activityCount - before.activityCount, 2, 'Tenant should gain exactly two activities');

    const invalidOccurredAt = new Date(now.getTime() + 3000).toISOString();
    const invalidEvent = {
      eventType: 'website.invalid.event',
      version: 1,
      occurredAt: invalidOccurredAt,
      tenant,
      payload: {
        source: 'integration-worker-test-invalid',
        note: `invalid-${runId}`,
      },
    } as unknown as WebsiteLeadSubmittedEvent;

    const invalidEnqueue = await enqueueWebsiteEvent(invalidEvent);
    assert.equal(invalidEnqueue.accepted, true, 'Invalid test event should still enqueue');
    assert.equal(invalidEnqueue.duplicate, false, 'Invalid test event should be unique');
    assert.ok(invalidEnqueue.jobId, 'Invalid test event should return a queue job id');

    const deadLetterBatch = await processWebsiteEventQueueBatch(50);
    assert.ok(deadLetterBatch.deadLetteredCount >= 1, 'Expected at least one dead-lettered job');

    const deadLetterJobs = await listDeadLetterQueueJobs({ tenantId: tenant.tenantId, limit: 200 });
    const invalidDeadLetter = deadLetterJobs.find((job) => job.id === invalidEnqueue.jobId);
    assert.ok(invalidDeadLetter, 'Expected invalid test event to exist in dead-letter queue');
    assert.equal(invalidDeadLetter?.lastError, 'invalid_payload', 'Expected invalid payload dead-letter reason');

    const requeueResult = await requeueDeadLetterQueueJob(invalidEnqueue.jobId as string);
    assert.equal(requeueResult, true, 'Expected dead-lettered invalid event to be requeued');

    const reprocessedBatch = await processWebsiteEventQueueBatch(50);
    assert.ok(reprocessedBatch.deadLetteredCount >= 1, 'Expected reprocessed invalid event to dead-letter again');

    const deadLetterJobsAfterRequeue = await listDeadLetterQueueJobs({ tenantId: tenant.tenantId, limit: 200 });
    const invalidDeadLetterAgain = deadLetterJobsAfterRequeue.find((job) => job.id === invalidEnqueue.jobId);
    assert.ok(invalidDeadLetterAgain, 'Expected invalid test event to return to dead-letter queue after reprocessing');

    const retryOccurredAt = new Date(now.getTime() + 4000).toISOString();
    const retryEvent = {
      eventType: 'website.lead.submitted',
      version: 1,
      occurredAt: retryOccurredAt,
      tenant,
      payload: {},
    } as unknown as WebsiteLeadSubmittedEvent;

    const retryEnqueue = await enqueueWebsiteEvent(retryEvent);
    assert.equal(retryEnqueue.accepted, true, 'Retry test event should enqueue');
    assert.equal(retryEnqueue.duplicate, false, 'Retry test event should be unique');
    assert.ok(retryEnqueue.jobId, 'Retry test event should return a queue job id');

    const retryBatchOne = await processWebsiteEventQueueBatch(50);
    assert.ok(retryBatchOne.requeuedCount >= 1, 'Expected failed retry test event to be requeued on first attempt');

    const retryJobAfterOne = await getIngestionQueueJobById(retryEnqueue.jobId as string);
    assert.ok(retryJobAfterOne, 'Retry test queue job should exist after first attempt');
    assert.equal(retryJobAfterOne?.status, 'pending');
    assert.equal(retryJobAfterOne?.attemptCount, 1);
    assert.equal(retryJobAfterOne?.lastError, 'ingestion_failed');
    assert.ok(
      new Date(retryJobAfterOne?.nextAttemptAt as string).getTime() > Date.now(),
      'Retry job nextAttemptAt should be in the future after first failure'
    );

    const retryImmediateDrain = await processWebsiteEventQueueBatch(50);
    assert.equal(retryImmediateDrain.pickedCount, 0, 'Retry job should not be immediately re-picked before nextAttemptAt');

    const retryForcedHistory = await forceQueueJobAttempts(retryEnqueue.jobId as string, 4, 50);
    assert.equal(retryForcedHistory.length, 4);
    assert.ok(retryForcedHistory[0]?.batch.requeuedCount >= 1);
    assert.ok(retryForcedHistory[1]?.batch.requeuedCount >= 1);
    assert.ok(retryForcedHistory[2]?.batch.requeuedCount >= 1);
    assert.ok(retryForcedHistory[3]?.batch.deadLetteredCount >= 1);

    const retryJobAfterFive = retryForcedHistory[3]?.job;
    assert.ok(retryJobAfterFive, 'Retry test queue job should exist after fifth attempt');
    assert.equal(retryJobAfterFive?.status, 'dead_letter');
    assert.equal(retryJobAfterFive?.attemptCount, 5);
    assert.equal(retryJobAfterFive?.lastError, 'ingestion_failed');
    assert.ok(retryJobAfterFive?.deadLetteredAt, 'Retry test job should have deadLetteredAt after max attempts');

    const badValuationOccurredAt = new Date(now.getTime() + 5000).toISOString();
    const badValuationEvent = {
      eventType: 'website.valuation.requested',
      version: 1,
      occurredAt: badValuationOccurredAt,
      tenant,
      payload: {},
    } as unknown as WebsiteValuationRequestedEvent;

    const badValuationEnqueue = await enqueueWebsiteEvent(badValuationEvent);
    assert.equal(badValuationEnqueue.accepted, true, 'Malformed valuation event should enqueue');
    assert.equal(badValuationEnqueue.duplicate, false, 'Malformed valuation event should be unique');
    assert.ok(badValuationEnqueue.jobId, 'Malformed valuation event should return queue job id');

    const badValuationBatchOne = await processWebsiteEventQueueBatch(50);
    assert.ok(badValuationBatchOne.requeuedCount >= 1, 'Expected malformed valuation event to requeue on first attempt');

    const badValuationJobAfterOne = await getIngestionQueueJobById(badValuationEnqueue.jobId as string);
    assert.ok(badValuationJobAfterOne, 'Malformed valuation queue job should exist after first attempt');
    assert.equal(badValuationJobAfterOne?.status, 'pending');
    assert.equal(badValuationJobAfterOne?.attemptCount, 1);
    assert.equal(badValuationJobAfterOne?.lastError, 'ingestion_failed');

    const badValuationForcedHistory = await forceQueueJobAttempts(badValuationEnqueue.jobId as string, 4, 50);
    assert.equal(badValuationForcedHistory.length, 4);
    assert.ok(badValuationForcedHistory[0]?.batch.requeuedCount >= 1);
    assert.ok(badValuationForcedHistory[1]?.batch.requeuedCount >= 1);
    assert.ok(badValuationForcedHistory[2]?.batch.requeuedCount >= 1);
    assert.ok(badValuationForcedHistory[3]?.batch.deadLetteredCount >= 1);

    const badValuationJobAfterFive = badValuationForcedHistory[3]?.job;
    assert.ok(badValuationJobAfterFive, 'Malformed valuation queue job should exist after fifth attempt');
    assert.equal(badValuationJobAfterFive?.status, 'dead_letter');
    assert.equal(badValuationJobAfterFive?.attemptCount, 5);
    assert.equal(badValuationJobAfterFive?.lastError, 'ingestion_failed');
    assert.ok(
      badValuationJobAfterFive?.deadLetteredAt,
      'Malformed valuation queue job should have deadLetteredAt after max attempts'
    );

    console.log('Ingestion enqueue->worker->CRM integration check passed.');
    console.log({
      runId,
      tenantId: tenant.tenantId,
      enqueueA,
      enqueueB,
      initialBatch,
      drainLoops,
      before,
      after,
      invalidEnqueue,
      deadLetterBatch,
      requeueResult,
      reprocessedBatch,
      retryEnqueue,
      retryBatchOne,
      retryImmediateDrain,
      retryForcedHistory,
      badValuationEnqueue,
      badValuationBatchOne,
      badValuationForcedHistory,
    });
  });
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
