import type { WebsiteEvent } from './events';

export type WebsiteIngestionJobStatus = 'pending' | 'processing' | 'processed' | 'failed' | 'dead_letter';

export interface WebsiteIngestionJob {
  id: string;
  tenantId: string;
  eventType: WebsiteEvent['eventType'];
  eventKey: string;
  occurredAt: string;
  payloadJson: string;
  status: WebsiteIngestionJobStatus;
  attemptCount: number;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
  processedAt: string | null;
  nextAttemptAt: string;
  deadLetteredAt: string | null;
}

export interface WebsiteEventEnqueueResult {
  accepted: boolean;
  duplicate: boolean;
  jobId?: string;
  reason?: 'prisma_unavailable' | 'enqueue_failed';
}

export interface WebsiteEventQueueProcessResult {
  pickedCount: number;
  processedCount: number;
  failedCount: number;
  requeuedCount: number;
  deadLetteredCount: number;
}
