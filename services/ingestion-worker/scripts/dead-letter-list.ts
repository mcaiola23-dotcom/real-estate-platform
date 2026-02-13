import { getIngestionRuntimeReadiness, listDeadLetterQueueJobs } from '@real-estate/db/crm';

function shouldEmitJson(): boolean {
  return process.env.INGESTION_OUTPUT_JSON === '1';
}

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

  const result = {
    tenantId: tenantId ?? 'all',
    limit,
    offset,
    count: jobs.length,
    includePayload,
    jobs: output,
  };

  console.log('Dead-letter queue listing completed.');
  if (shouldEmitJson()) {
    console.log(JSON.stringify({ event: 'dead_letter_list_result', ...result }));
    return;
  }

  console.log(result);
}

run().catch((error) => {
  console.error('Dead-letter queue listing failed', error);
  process.exit(1);
});
