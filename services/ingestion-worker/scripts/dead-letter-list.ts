import { getIngestionRuntimeReadiness, listDeadLetterQueueJobs } from '@real-estate/db/crm';

async function run() {
  const runtime = await getIngestionRuntimeReadiness();
  if (!runtime.ready) {
    throw new Error(`Ingestion runtime unavailable: ${runtime.message}`);
  }

  const tenantId = process.env.INGESTION_DEAD_LETTER_TENANT_ID?.trim() || undefined;
  const limit = Number.parseInt(process.env.INGESTION_DEAD_LETTER_LIMIT ?? '50', 10);
  const offset = Number.parseInt(process.env.INGESTION_DEAD_LETTER_OFFSET ?? '0', 10);
  const includePayload = process.env.INGESTION_DEAD_LETTER_INCLUDE_PAYLOAD === '1';

  const jobs = await listDeadLetterQueueJobs({ tenantId, limit, offset });
  const output = includePayload
    ? jobs
    : jobs.map((job) => ({
        id: job.id,
        tenantId: job.tenantId,
        eventType: job.eventType,
        attemptCount: job.attemptCount,
        lastError: job.lastError,
        deadLetteredAt: job.deadLetteredAt,
        nextAttemptAt: job.nextAttemptAt,
      }));

  console.log('Dead-letter queue listing completed.');
  console.log({
    tenantId: tenantId ?? 'all',
    limit,
    offset,
    count: jobs.length,
    includePayload,
    jobs: output,
  });
}

run().catch((error) => {
  console.error('Dead-letter queue listing failed', error);
  process.exit(1);
});
