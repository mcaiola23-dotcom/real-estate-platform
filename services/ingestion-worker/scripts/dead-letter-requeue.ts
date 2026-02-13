import {
  getIngestionRuntimeReadiness,
  requeueDeadLetterQueueJob,
  requeueDeadLetterQueueJobs,
} from '@real-estate/db/crm';

function shouldEmitJson(): boolean {
  return process.env.INGESTION_OUTPUT_JSON === '1';
}

async function run() {
  const runtime = await getIngestionRuntimeReadiness();
  if (!runtime.ready) {
    throw new Error(`Ingestion runtime unavailable: ${runtime.message}`);
  }

  const jobId = process.env.INGESTION_DEAD_LETTER_JOB_ID?.trim();
  if (jobId) {
    const requeued = await requeueDeadLetterQueueJob(jobId);
    console.log('Dead-letter single-job requeue completed.');
    const result = { jobId, requeued };
    if (shouldEmitJson()) {
      console.log(JSON.stringify({ event: 'dead_letter_requeue_single_result', ...result }));
    } else {
      console.log(result);
    }
    if (!requeued) {
      process.exitCode = 1;
    }
    return;
  }

  const tenantId = process.env.INGESTION_DEAD_LETTER_TENANT_ID?.trim() || undefined;
  const limit = Number.parseInt(process.env.INGESTION_DEAD_LETTER_LIMIT ?? '50', 10);
  const offset = Number.parseInt(process.env.INGESTION_DEAD_LETTER_OFFSET ?? '0', 10);
  const batchResult = await requeueDeadLetterQueueJobs({ tenantId, limit, offset });

  const result = {
    tenantId: tenantId ?? 'all',
    limit,
    offset,
    ...batchResult,
  };

  console.log('Dead-letter batch requeue completed.');
  if (shouldEmitJson()) {
    console.log(JSON.stringify({ event: 'dead_letter_requeue_batch_result', ...result }));
    return;
  }
  console.log(result);
}

run().catch((error) => {
  console.error('Dead-letter requeue failed', error);
  process.exit(1);
});
