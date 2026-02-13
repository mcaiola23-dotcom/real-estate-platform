import { getIngestionRuntimeReadiness, processWebsiteEventQueueBatch } from '@real-estate/db/crm';

async function run() {
  const runtime = await getIngestionRuntimeReadiness();
  if (!runtime.ready) {
    throw new Error(`Ingestion runtime unavailable: ${runtime.message}`);
  }

  const limit = Number.parseInt(process.env.INGESTION_BATCH_SIZE ?? '25', 10);
  const maxLoops = Number.parseInt(process.env.INGESTION_MAX_LOOPS ?? '10', 10);

  let loops = 0;
  let totalPicked = 0;
  let totalProcessed = 0;
  let totalFailed = 0;
  let totalRequeued = 0;
  let totalDeadLettered = 0;

  while (loops < maxLoops) {
    loops += 1;
    const result = await processWebsiteEventQueueBatch(limit);
    totalPicked += result.pickedCount;
    totalProcessed += result.processedCount;
    totalFailed += result.failedCount;
    totalRequeued += result.requeuedCount;
    totalDeadLettered += result.deadLetteredCount;

    if (result.pickedCount === 0) {
      break;
    }
  }

  console.log('Ingestion worker drain completed.');
  console.log({
    loops,
    totalPicked,
    totalProcessed,
    totalFailed,
    totalRequeued,
    totalDeadLettered,
  });
}

run().catch((error) => {
  console.error('Ingestion worker failed', error);
  process.exit(1);
});
