import {
  getIngestionRuntimeReadiness,
  requeueDeadLetterQueueJob,
  requeueDeadLetterQueueJobs,
} from '@real-estate/db/crm';

async function run() {
  const runtime = await getIngestionRuntimeReadiness();
  if (!runtime.ready) {
    throw new Error(`Ingestion runtime unavailable: ${runtime.message}`);
  }

  const jobId = process.env.INGESTION_DEAD_LETTER_JOB_ID?.trim();
  if (jobId) {
    const requeued = await requeueDeadLetterQueueJob(jobId);
    console.log('Dead-letter single-job requeue completed.');
    console.log({ jobId, requeued });
    if (!requeued) {
      process.exitCode = 1;
    }
    return;
  }

  const tenantId = process.env.INGESTION_DEAD_LETTER_TENANT_ID?.trim() || undefined;
  const limit = Number.parseInt(process.env.INGESTION_DEAD_LETTER_LIMIT ?? '50', 10);
  const offset = Number.parseInt(process.env.INGESTION_DEAD_LETTER_OFFSET ?? '0', 10);
  const result = await requeueDeadLetterQueueJobs({ tenantId, limit, offset });

  console.log('Dead-letter batch requeue completed.');
  console.log({
    tenantId: tenantId ?? 'all',
    limit,
    offset,
    ...result,
  });
}

run().catch((error) => {
  console.error('Dead-letter requeue failed', error);
  process.exit(1);
});
