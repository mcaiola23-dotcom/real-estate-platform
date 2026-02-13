import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';

import {
  enqueueWebsiteEvent,
  getIngestionQueueJobById,
  getIngestionRuntimeReadiness,
  processWebsiteEventQueueBatch,
  scheduleIngestionQueueJobNow,
} from '@real-estate/db/crm';
import type { WebsiteLeadSubmittedEvent } from '@real-estate/types/events';

interface CommandResult {
  status: number | null;
  stdout: string;
  stderr: string;
}

function parseJsonLine<T>(stdout: string, expectedEvent: string): T {
  const lines = stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith('{') && line.endsWith('}'));

  for (let index = lines.length - 1; index >= 0; index -= 1) {
    try {
      const parsed = JSON.parse(lines[index] as string) as { event?: string };
      if (parsed.event === expectedEvent) {
        return parsed as T;
      }
    } catch {
      continue;
    }
  }

  throw new Error(`Unable to find JSON payload for event "${expectedEvent}" in command output.`);
}

function runNpmScript(scriptName: string, extraEnv: Record<string, string>): CommandResult {
  const result = spawnSync('npm', ['run', scriptName], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      ...extraEnv,
    },
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });

  return {
    status: result.status,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
  };
}

async function ensureDeadLetterJob(jobId: string): Promise<void> {
  const maxLoops = 10;
  for (let i = 0; i < maxLoops; i += 1) {
    await scheduleIngestionQueueJobNow(jobId);
    await processWebsiteEventQueueBatch(200);

    const job = await getIngestionQueueJobById(jobId);
    assert.ok(job, `Expected queue job ${jobId} to exist`);
    if (job.status === 'dead_letter') {
      return;
    }
  }

  const finalJob = await getIngestionQueueJobById(jobId);
  assert.equal(finalJob?.status, 'dead_letter', `Expected queue job ${jobId} to be dead-lettered`);
}

async function run() {
  const runtime = await getIngestionRuntimeReadiness();
  if (!runtime.ready) {
    throw new Error(`Ingestion runtime unavailable: ${runtime.message}`);
  }

  const runId = randomUUID().slice(0, 8);
  const tenant = {
    tenantId: `tenant_cmd_${runId}`,
    tenantSlug: `cmd-${runId}`,
    tenantDomain: `cmd-${runId}.localhost`,
  };

  const { PrismaClient } = await import('../../../packages/db/generated/prisma-client/index.js');
  const prisma = new PrismaClient();

  try {
    const now = new Date();
    await prisma.tenant.create({
      data: {
        id: tenant.tenantId,
        slug: tenant.tenantSlug,
        name: `Command Test ${runId}`,
        status: 'active',
        createdAt: now,
        updatedAt: now,
      },
    });

    await prisma.tenantDomain.create({
      data: {
        id: `tenant_domain_${runId}`,
        tenantId: tenant.tenantId,
        hostname: tenant.tenantDomain,
        hostnameNormalized: tenant.tenantDomain,
        isPrimary: true,
        isVerified: true,
        verifiedAt: now,
        createdAt: now,
        updatedAt: now,
      },
    });

    const invalidEventA = {
      eventType: 'website.invalid.event',
      version: 1,
      occurredAt: new Date(now.getTime() + 1000).toISOString(),
      tenant,
      payload: { source: 'dead-letter-command-test-a' },
    } as unknown as WebsiteLeadSubmittedEvent;

    const invalidEventB = {
      eventType: 'website.invalid.event',
      version: 1,
      occurredAt: new Date(now.getTime() + 2000).toISOString(),
      tenant,
      payload: { source: 'dead-letter-command-test-b' },
    } as unknown as WebsiteLeadSubmittedEvent;

    const enqueueA = await enqueueWebsiteEvent(invalidEventA);
    const enqueueB = await enqueueWebsiteEvent(invalidEventB);
    assert.equal(enqueueA.accepted, true);
    assert.equal(enqueueB.accepted, true);
    assert.ok(enqueueA.jobId);
    assert.ok(enqueueB.jobId);

    await ensureDeadLetterJob(enqueueA.jobId as string);
    await ensureDeadLetterJob(enqueueB.jobId as string);

    const listResult = runNpmScript('dead-letter:list', {
      INGESTION_DEAD_LETTER_TENANT_ID: tenant.tenantId,
      INGESTION_DEAD_LETTER_LIMIT: '10',
      INGESTION_DEAD_LETTER_OFFSET: '0',
      INGESTION_DEAD_LETTER_INCLUDE_PAYLOAD: '0',
      INGESTION_OUTPUT_JSON: '1',
    });
    assert.equal(listResult.status, 0, `dead-letter:list failed: ${listResult.stderr}`);
    assert.ok(listResult.stdout.includes('Dead-letter queue listing completed.'));
    const listPayload = parseJsonLine<{
      event: string;
      tenantId: string;
      limit: number;
      offset: number;
      count: number;
      includePayload: boolean;
      jobs: Array<{
        id: string;
        tenantId: string;
        eventType: string;
        attemptCount: number;
        lastError: string | null;
        deadLetteredAt: string | null;
        nextAttemptAt: string;
      }>;
    }>(listResult.stdout, 'dead_letter_list_result');
    assert.equal(listPayload.tenantId, tenant.tenantId);
    assert.equal(listPayload.includePayload, false);
    assert.ok(Array.isArray(listPayload.jobs));
    assert.ok(listPayload.jobs.length >= 2);
    assert.ok(listPayload.jobs.every((job) => job.tenantId === tenant.tenantId));

    const singleRequeueResult = runNpmScript('dead-letter:requeue', {
      INGESTION_DEAD_LETTER_JOB_ID: enqueueA.jobId as string,
      INGESTION_OUTPUT_JSON: '1',
    });
    assert.equal(singleRequeueResult.status, 0, `single dead-letter:requeue failed: ${singleRequeueResult.stderr}`);
    assert.ok(singleRequeueResult.stdout.includes('Dead-letter single-job requeue completed.'));
    const singlePayload = parseJsonLine<{
      event: string;
      jobId: string;
      requeued: boolean;
    }>(singleRequeueResult.stdout, 'dead_letter_requeue_single_result');
    assert.equal(singlePayload.jobId, enqueueA.jobId);
    assert.equal(singlePayload.requeued, true);

    const jobAAfterSingle = await getIngestionQueueJobById(enqueueA.jobId as string);
    assert.ok(jobAAfterSingle);
    assert.equal(jobAAfterSingle?.status, 'pending');

    await ensureDeadLetterJob(enqueueA.jobId as string);

    const batchRequeueResult = runNpmScript('dead-letter:requeue', {
      INGESTION_DEAD_LETTER_TENANT_ID: tenant.tenantId,
      INGESTION_DEAD_LETTER_LIMIT: '50',
      INGESTION_DEAD_LETTER_OFFSET: '0',
      INGESTION_OUTPUT_JSON: '1',
    });
    assert.equal(batchRequeueResult.status, 0, `batch dead-letter:requeue failed: ${batchRequeueResult.stderr}`);
    assert.ok(batchRequeueResult.stdout.includes('Dead-letter batch requeue completed.'));
    const batchPayload = parseJsonLine<{
      event: string;
      tenantId: string;
      limit: number;
      offset: number;
      requeuedCount: number;
      skippedCount: number;
    }>(batchRequeueResult.stdout, 'dead_letter_requeue_batch_result');
    assert.equal(batchPayload.tenantId, tenant.tenantId);
    assert.ok(batchPayload.requeuedCount >= 1);
    assert.equal(batchPayload.skippedCount, 0);

    const jobAAfterBatch = await getIngestionQueueJobById(enqueueA.jobId as string);
    const jobBAfterBatch = await getIngestionQueueJobById(enqueueB.jobId as string);
    assert.equal(jobAAfterBatch?.status, 'pending');
    assert.equal(jobBAfterBatch?.status, 'pending');

    console.log('Dead-letter command integration check passed.');
    console.log({
      runId,
      tenantId: tenant.tenantId,
      listStatus: listResult.status,
      singleRequeueStatus: singleRequeueResult.status,
      batchRequeueStatus: batchRequeueResult.status,
      jobA: enqueueA.jobId,
      jobB: enqueueB.jobId,
    });
  } finally {
    await prisma.tenant.deleteMany({
      where: { id: tenant.tenantId },
    });
    await prisma.$disconnect();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
