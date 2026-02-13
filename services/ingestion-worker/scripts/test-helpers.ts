import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

import {
  getIngestionQueueJobById,
  processWebsiteEventQueueBatch,
  scheduleIngestionQueueJobNow,
} from '@real-estate/db/crm';
import type { WebsiteEventQueueProcessResult, WebsiteIngestionJob } from '@real-estate/types/ingestion';

export interface IngestionTestTenant {
  tenantId: string;
  tenantSlug: string;
  tenantDomain: string;
}

interface PrismaLike {
  tenant: {
    create: (args: unknown) => Promise<unknown>;
    deleteMany: (args: unknown) => Promise<unknown>;
    count: (args: unknown) => Promise<number>;
  };
  tenantDomain: {
    create: (args: unknown) => Promise<unknown>;
    count: (args: unknown) => Promise<number>;
  };
  $disconnect: () => Promise<void>;
}

export interface TenantFixtureContext {
  now: Date;
  runId: string;
  tenant: IngestionTestTenant;
}

export async function withTenantFixture(
  prefix: string,
  run: (fixture: TenantFixtureContext) => Promise<void>
): Promise<void> {
  const runId = randomUUID().slice(0, 8);
  const now = new Date();
  const tenant: IngestionTestTenant = {
    tenantId: `tenant_${prefix}_${runId}`,
    tenantSlug: `${prefix}-${runId}`,
    tenantDomain: `${prefix}-${runId}.localhost`,
  };

  const { PrismaClient } = await import('../../../packages/db/generated/prisma-client/index.js');
  const prisma = new PrismaClient() as PrismaLike;

  try {
    await prisma.tenant.create({
      data: {
        id: tenant.tenantId,
        slug: tenant.tenantSlug,
        name: `${prefix.toUpperCase()} Test ${runId}`,
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

    await run({ now, runId, tenant });
  } finally {
    await prisma.tenant.deleteMany({
      where: { id: tenant.tenantId },
    });

    const [remainingTenantCount, remainingDomainCount] = await Promise.all([
      prisma.tenant.count({ where: { id: tenant.tenantId } }),
      prisma.tenantDomain.count({ where: { tenantId: tenant.tenantId } }),
    ]);

    assert.equal(remainingTenantCount, 0, `Expected fixture tenant ${tenant.tenantId} to be removed after test`);
    assert.equal(remainingDomainCount, 0, `Expected fixture tenant domain for ${tenant.tenantId} to be removed after test`);

    await prisma.$disconnect();
  }
}

export interface ForcedQueueAttempt {
  batch: WebsiteEventQueueProcessResult;
  job: WebsiteIngestionJob;
}

export async function forceQueueJobAttemptNow(jobId: string, batchLimit = 50): Promise<ForcedQueueAttempt> {
  const scheduled = await scheduleIngestionQueueJobNow(jobId);
  assert.equal(scheduled, true, `Expected queue job ${jobId} to be schedulable for immediate retry`);

  const batch = await processWebsiteEventQueueBatch(batchLimit);
  const job = await getIngestionQueueJobById(jobId);
  assert.ok(job, `Expected queue job ${jobId} to exist after forced attempt`);

  return {
    batch,
    job,
  };
}

export async function forceQueueJobAttempts(
  jobId: string,
  attempts: number,
  batchLimit = 50
): Promise<ForcedQueueAttempt[]> {
  const history: ForcedQueueAttempt[] = [];

  for (let index = 0; index < attempts; index += 1) {
    history.push(await forceQueueJobAttemptNow(jobId, batchLimit));
  }

  return history;
}

export async function forceQueueJobToDeadLetter(jobId: string, batchLimit = 200, maxLoops = 10): Promise<void> {
  for (let index = 0; index < maxLoops; index += 1) {
    const job = await getIngestionQueueJobById(jobId);
    assert.ok(job, `Expected queue job ${jobId} to exist`);

    if (job.status === 'dead_letter') {
      return;
    }

    await forceQueueJobAttemptNow(jobId, batchLimit);
  }

  const finalJob = await getIngestionQueueJobById(jobId);
  assert.equal(finalJob?.status, 'dead_letter', `Expected queue job ${jobId} to be dead-lettered`);
}
