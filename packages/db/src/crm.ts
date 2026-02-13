import { createHash, randomUUID } from 'node:crypto';

import type {
  CrmActivityListQuery,
  CrmActivity,
  CrmContactListQuery,
  CrmContact,
  CrmLeadListQuery,
  CrmLead,
  CrmLeadIngestionSummary,
  CrmLeadStatus,
  CrmLeadType,
} from '@real-estate/types/crm';
import type {
  WebsiteEvent,
  WebsiteLeadSubmittedEvent,
  WebsiteValuationRequestedEvent,
} from '@real-estate/types/events';
import type {
  WebsiteEventEnqueueResult,
  WebsiteEventQueueProcessResult,
  WebsiteIngestionJob,
  WebsiteIngestionJobStatus,
} from '@real-estate/types/ingestion';

import { getPrismaClient, getPrismaClientAvailability } from './prisma-client';

function toIsoString(value: string | Date): string {
  return typeof value === 'string' ? value : value.toISOString();
}

const MAX_QUEUE_ATTEMPTS = 5;
const RETRY_DELAY_SECONDS = [30, 120, 600, 1800];

function normalizeEmail(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

function normalizePhone(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.replace(/\D/g, '');
  return normalized.length > 0 ? normalized : null;
}

function buildEventKey(event: WebsiteEvent): string {
  const fingerprint = JSON.stringify({
    eventType: event.eventType,
    occurredAt: event.occurredAt,
    tenant: event.tenant,
    payload: event.payload,
  });

  return createHash('sha256').update(fingerprint).digest('hex');
}

function computeNextRetryAt(attemptCount: number, now: Date): Date {
  const delayIndex = Math.max(0, Math.min(attemptCount - 1, RETRY_DELAY_SECONDS.length - 1));
  const delaySeconds = RETRY_DELAY_SECONDS[delayIndex] ?? RETRY_DELAY_SECONDS[RETRY_DELAY_SECONDS.length - 1];
  return new Date(now.getTime() + delaySeconds * 1000);
}

function toCrmContact(record: {
  id: string;
  tenantId: string;
  fullName: string | null;
  email: string | null;
  emailNormalized: string | null;
  phone: string | null;
  phoneNormalized: string | null;
  source: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}): CrmContact {
  return {
    id: record.id,
    tenantId: record.tenantId,
    fullName: record.fullName,
    email: record.email,
    emailNormalized: record.emailNormalized,
    phone: record.phone,
    phoneNormalized: record.phoneNormalized,
    source: record.source,
    createdAt: toIsoString(record.createdAt),
    updatedAt: toIsoString(record.updatedAt),
  };
}

function toCrmLead(record: {
  id: string;
  tenantId: string;
  contactId: string | null;
  status: string;
  leadType: string;
  source: string;
  timeframe: string | null;
  notes: string | null;
  listingId: string | null;
  listingUrl: string | null;
  listingAddress: string | null;
  propertyType: string | null;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}): CrmLead {
  return {
    id: record.id,
    tenantId: record.tenantId,
    contactId: record.contactId,
    status: record.status as CrmLeadStatus,
    leadType: record.leadType as CrmLeadType,
    source: record.source,
    timeframe: record.timeframe,
    notes: record.notes,
    listingId: record.listingId,
    listingUrl: record.listingUrl,
    listingAddress: record.listingAddress,
    propertyType: record.propertyType,
    beds: record.beds,
    baths: record.baths,
    sqft: record.sqft,
    createdAt: toIsoString(record.createdAt),
    updatedAt: toIsoString(record.updatedAt),
  };
}

function toCrmActivity(record: {
  id: string;
  tenantId: string;
  contactId: string | null;
  leadId: string | null;
  activityType: string;
  occurredAt: string | Date;
  summary: string;
  metadataJson: string | null;
  createdAt: string | Date;
}): CrmActivity {
  return {
    id: record.id,
    tenantId: record.tenantId,
    contactId: record.contactId,
    leadId: record.leadId,
    activityType: record.activityType,
    occurredAt: toIsoString(record.occurredAt),
    summary: record.summary,
    metadataJson: record.metadataJson,
    createdAt: toIsoString(record.createdAt),
  };
}

export type ListCrmLeadsOptions = CrmLeadListQuery;
export type ListCrmContactsOptions = CrmContactListQuery;
export type ListCrmActivitiesOptions = CrmActivityListQuery;

export interface CreateCrmContactInput {
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
  source?: string;
}

export interface UpdateCrmLeadInput {
  status?: CrmLeadStatus;
  notes?: string | null;
}

export interface CreateCrmActivityInput {
  activityType: string;
  summary: string;
  leadId?: string | null;
  contactId?: string | null;
  metadataJson?: string | null;
  occurredAt?: string | Date;
}

async function resolveOrCreateContact(tx: any, event: WebsiteLeadSubmittedEvent): Promise<string | null> {
  const emailNormalized = normalizeEmail(event.payload.contact.email);
  const phoneNormalized = normalizePhone(event.payload.contact.phone);
  const fullName = event.payload.contact.name;

  let existing = null;
  if (emailNormalized) {
    existing = await tx.contact.findUnique({
      where: {
        tenantId_emailNormalized: {
          tenantId: event.tenant.tenantId,
          emailNormalized,
        },
      },
    });
  }

  if (!existing && phoneNormalized) {
    existing = await tx.contact.findUnique({
      where: {
        tenantId_phoneNormalized: {
          tenantId: event.tenant.tenantId,
          phoneNormalized,
        },
      },
    });
  }

  if (existing) {
    await tx.contact.update({
      where: { id: existing.id },
      data: {
        fullName: existing.fullName || fullName,
        email: existing.email || event.payload.contact.email || null,
        emailNormalized: existing.emailNormalized || emailNormalized,
        phone: existing.phone || event.payload.contact.phone || null,
        phoneNormalized: existing.phoneNormalized || phoneNormalized,
        source: existing.source || event.payload.source || 'website',
        updatedAt: new Date(),
      },
    });
    return existing.id;
  }

  if (!emailNormalized && !phoneNormalized) {
    return null;
  }

  const contactId = randomUUID();
  await tx.contact.create({
    data: {
      id: contactId,
      tenantId: event.tenant.tenantId,
      fullName,
      email: event.payload.contact.email || null,
      emailNormalized,
      phone: event.payload.contact.phone || null,
      phoneNormalized,
      source: event.payload.source || 'website',
      createdAt: new Date(event.occurredAt),
      updatedAt: new Date(event.occurredAt),
    },
  });

  return contactId;
}

function parseWebsiteEventFromQueueRecord(record: { payloadJson: string }): WebsiteEvent | null {
  try {
    const event = JSON.parse(record.payloadJson) as WebsiteEvent;
    if (event.eventType !== 'website.lead.submitted' && event.eventType !== 'website.valuation.requested') {
      return null;
    }
    return event;
  } catch {
    return null;
  }
}

function toWebsiteIngestionJob(record: {
  id: string;
  tenantId: string;
  eventType: WebsiteEvent['eventType'];
  eventKey: string;
  occurredAt: string | Date;
  payloadJson: string;
  status: WebsiteIngestionJobStatus;
  attemptCount: number;
  lastError: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  processedAt: string | Date | null;
  nextAttemptAt: string | Date;
  deadLetteredAt: string | Date | null;
}): WebsiteIngestionJob {
  return {
    id: record.id,
    tenantId: record.tenantId,
    eventType: record.eventType,
    eventKey: record.eventKey,
    occurredAt: toIsoString(record.occurredAt),
    payloadJson: record.payloadJson,
    status: record.status,
    attemptCount: record.attemptCount,
    lastError: record.lastError,
    createdAt: toIsoString(record.createdAt),
    updatedAt: toIsoString(record.updatedAt),
    processedAt: record.processedAt ? toIsoString(record.processedAt) : null,
    nextAttemptAt: toIsoString(record.nextAttemptAt),
    deadLetteredAt: record.deadLetteredAt ? toIsoString(record.deadLetteredAt) : null,
  };
}

export interface WebsiteEventIngestionResult {
  accepted: boolean;
  duplicate: boolean;
  reason?: 'prisma_unavailable' | 'ingestion_failed';
  ingestedEventId?: string;
  contactId?: string | null;
  leadId?: string | null;
  activityId?: string | null;
}

export interface IngestionRuntimeReadiness {
  ready: boolean;
  reason: 'prisma_unavailable' | 'missing_engine' | 'import_failed' | 'edge_runtime' | null;
  message: string;
}

export interface ListDeadLetterQueueJobsOptions {
  tenantId?: string;
  limit?: number;
  offset?: number;
}

export interface RequeueDeadLetterQueueJobsResult {
  requeuedCount: number;
  skippedCount: number;
}

export async function getIngestionRuntimeReadiness(): Promise<IngestionRuntimeReadiness> {
  await getPrismaClient();
  const availability = getPrismaClientAvailability();
  if (availability.available) {
    return {
      ready: true,
      reason: null,
      message: 'Prisma runtime is available for ingestion scripts.',
    };
  }

  return {
    ready: false,
    reason: availability.reason ? (availability.reason as IngestionRuntimeReadiness['reason']) : 'prisma_unavailable',
    message:
      availability.message ||
      'Prisma runtime is unavailable. Ensure DATABASE_URL is valid and generate Prisma client with full engine artifacts.',
  };
}

export async function enqueueWebsiteEvent(event: WebsiteEvent): Promise<WebsiteEventEnqueueResult> {
  const prisma = await getPrismaClient();
  if (!prisma) {
    return { accepted: false, duplicate: false, reason: 'prisma_unavailable' };
  }

  const eventKey = buildEventKey(event);
  const now = new Date();

  try {
    const existing = await prisma.ingestionQueueJob.findUnique({
      where: {
        tenantId_eventKey: {
          tenantId: event.tenant.tenantId,
          eventKey,
        },
      },
      select: { id: true },
    });

    if (existing) {
      return {
        accepted: true,
        duplicate: true,
        jobId: existing.id,
      };
    }

    const created = await prisma.ingestionQueueJob.create({
      data: {
        id: randomUUID(),
        tenantId: event.tenant.tenantId,
        eventType: event.eventType,
        eventKey,
        occurredAt: new Date(event.occurredAt),
        payloadJson: JSON.stringify(event),
        status: 'pending',
        attemptCount: 0,
        lastError: null,
        nextAttemptAt: now,
        deadLetteredAt: null,
        createdAt: now,
        updatedAt: now,
      },
      select: { id: true },
    });

    return {
      accepted: true,
      duplicate: false,
      jobId: created.id,
    };
  } catch (error) {
    console.error('CRM enqueue failure', error);
    return { accepted: false, duplicate: false, reason: 'enqueue_failed' };
  }
}

export async function processWebsiteEventQueueBatch(limit = 25): Promise<WebsiteEventQueueProcessResult> {
  const prisma = await getPrismaClient();
  if (!prisma) {
    return {
      pickedCount: 0,
      processedCount: 0,
      failedCount: 0,
      requeuedCount: 0,
      deadLetteredCount: 0,
    };
  }

  const take = Math.min(Math.max(limit, 1), 200);
  let jobs: any[] = [];
  const now = new Date();
  try {
    jobs = await prisma.ingestionQueueJob.findMany({
      where: {
        status: 'pending' as WebsiteIngestionJobStatus,
        nextAttemptAt: { lte: now },
      },
      orderBy: { createdAt: 'asc' },
      take,
    });
  } catch {
    return {
      pickedCount: 0,
      processedCount: 0,
      failedCount: 0,
      requeuedCount: 0,
      deadLetteredCount: 0,
    };
  }

  let processedCount = 0;
  let failedCount = 0;
  let requeuedCount = 0;
  let deadLetteredCount = 0;

  for (const job of jobs) {
    const attemptCount = (job.attemptCount || 0) + 1;
    await prisma.ingestionQueueJob.update({
      where: { id: job.id },
      data: {
        status: 'processing',
        updatedAt: now,
        attemptCount,
      },
    });

    const event = parseWebsiteEventFromQueueRecord({ payloadJson: job.payloadJson });
    if (!event) {
      await prisma.ingestionQueueJob.update({
        where: { id: job.id },
        data: {
          status: 'dead_letter',
          lastError: 'invalid_payload',
          deadLetteredAt: now,
          updatedAt: now,
        },
      });
      failedCount += 1;
      deadLetteredCount += 1;
      continue;
    }

    const result = await ingestWebsiteEvent(event);
    if (result.accepted) {
      await prisma.ingestionQueueJob.update({
        where: { id: job.id },
        data: {
          status: 'processed',
          processedAt: now,
          lastError: null,
          updatedAt: now,
        },
      });
      processedCount += 1;
      continue;
    }

    if (attemptCount >= MAX_QUEUE_ATTEMPTS) {
      await prisma.ingestionQueueJob.update({
        where: { id: job.id },
        data: {
          status: 'dead_letter',
          lastError: result.reason || 'ingestion_failed',
          deadLetteredAt: now,
          updatedAt: now,
        },
      });
      failedCount += 1;
      deadLetteredCount += 1;
      continue;
    }

    const nextAttemptAt = computeNextRetryAt(attemptCount, now);
    await prisma.ingestionQueueJob.update({
      where: { id: job.id },
      data: {
        status: 'pending',
        lastError: result.reason || 'ingestion_failed',
        nextAttemptAt,
        updatedAt: now,
      },
    });
    requeuedCount += 1;
  }

  return {
    pickedCount: jobs.length,
    processedCount,
    failedCount,
    requeuedCount,
    deadLetteredCount,
  };
}

export async function listDeadLetterQueueJobs(
  options: ListDeadLetterQueueJobsOptions = {}
): Promise<WebsiteIngestionJob[]> {
  const prisma = await getPrismaClient();
  if (!prisma) {
    return [];
  }

  const take = Math.min(Math.max(options.limit ?? 50, 1), 200);
  const skip = Math.max(options.offset ?? 0, 0);

  try {
    const jobs = await prisma.ingestionQueueJob.findMany({
      where: {
        status: 'dead_letter' as WebsiteIngestionJobStatus,
        ...(options.tenantId ? { tenantId: options.tenantId } : {}),
      },
      orderBy: { deadLetteredAt: 'desc' },
      take,
      skip,
    });

    return jobs.map(toWebsiteIngestionJob);
  } catch {
    return [];
  }
}

export async function requeueDeadLetterQueueJob(jobId: string): Promise<boolean> {
  const prisma = await getPrismaClient();
  if (!prisma) {
    return false;
  }

  const now = new Date();
  try {
    const existing = await prisma.ingestionQueueJob.findUnique({
      where: { id: jobId },
      select: { id: true, status: true, tenantId: true },
    });
    if (!existing || existing.status !== 'dead_letter') {
      return false;
    }

    await prisma.ingestionQueueJob.update({
      where: { id: existing.id },
      data: {
        status: 'pending',
        attemptCount: 0,
        lastError: null,
        nextAttemptAt: now,
        deadLetteredAt: null,
        updatedAt: now,
      },
    });
    return true;
  } catch {
    return false;
  }
}

export async function requeueDeadLetterQueueJobs(
  options: ListDeadLetterQueueJobsOptions = {}
): Promise<RequeueDeadLetterQueueJobsResult> {
  const prisma = await getPrismaClient();
  if (!prisma) {
    return { requeuedCount: 0, skippedCount: 0 };
  }

  const now = new Date();
  const take = Math.min(Math.max(options.limit ?? 50, 1), 200);
  const skip = Math.max(options.offset ?? 0, 0);

  try {
    const jobs = await prisma.ingestionQueueJob.findMany({
      where: {
        status: 'dead_letter' as WebsiteIngestionJobStatus,
        ...(options.tenantId ? { tenantId: options.tenantId } : {}),
      },
      orderBy: { deadLetteredAt: 'asc' },
      take,
      skip,
      select: { id: true },
    });

    if (jobs.length === 0) {
      return { requeuedCount: 0, skippedCount: 0 };
    }

    const result = await prisma.ingestionQueueJob.updateMany({
      where: {
        id: { in: jobs.map((job: { id: string }) => job.id) },
        status: 'dead_letter' as WebsiteIngestionJobStatus,
      },
      data: {
        status: 'pending',
        attemptCount: 0,
        lastError: null,
        nextAttemptAt: now,
        deadLetteredAt: null,
        updatedAt: now,
      },
    });

    return {
      requeuedCount: result.count,
      skippedCount: jobs.length - result.count,
    };
  } catch {
    return { requeuedCount: 0, skippedCount: 0 };
  }
}

export async function ingestWebsiteEvent(event: WebsiteEvent): Promise<WebsiteEventIngestionResult> {
  const prisma = await getPrismaClient();
  if (!prisma) {
    return { accepted: false, duplicate: false, reason: 'prisma_unavailable' };
  }

  const eventKey = buildEventKey(event);
  const now = new Date();
  const occurredAt = new Date(event.occurredAt);

  try {
    return await prisma.$transaction(async (tx: any) => {
      const existing = await tx.ingestedEvent.findUnique({
        where: {
          tenantId_eventKey: {
            tenantId: event.tenant.tenantId,
            eventKey,
          },
        },
      });

      if (existing) {
        return {
          accepted: true,
          duplicate: true,
          ingestedEventId: existing.id,
        };
      }

      let contactId: string | null = null;
      let leadId: string | null = null;
      let activityId: string | null = null;

      if (event.eventType === 'website.lead.submitted') {
        contactId = await resolveOrCreateContact(tx, event);
        leadId = randomUUID();
        await tx.lead.create({
          data: {
            id: leadId,
            tenantId: event.tenant.tenantId,
            contactId,
            status: 'new',
            leadType: 'website_lead',
            source: event.payload.source || 'website',
            timeframe: event.payload.timeframe,
            notes: event.payload.message,
            listingId: event.payload.listing.id,
            listingUrl: event.payload.listing.url,
            listingAddress: event.payload.listing.address,
            propertyType: event.payload.propertyDetails?.propertyType || null,
            beds: event.payload.propertyDetails?.beds || null,
            baths: event.payload.propertyDetails?.baths || null,
            sqft: event.payload.propertyDetails?.sqft || null,
            createdAt: occurredAt,
            updatedAt: occurredAt,
          },
        });

        activityId = randomUUID();
        await tx.activity.create({
          data: {
            id: activityId,
            tenantId: event.tenant.tenantId,
            contactId,
            leadId,
            activityType: 'lead_submitted',
            occurredAt,
            summary: `Lead submitted from ${event.payload.source || 'website'}`,
            metadataJson: JSON.stringify(event.payload),
            createdAt: now,
          },
        });
      } else if (event.eventType === 'website.valuation.requested') {
        leadId = randomUUID();
        await tx.lead.create({
          data: {
            id: leadId,
            tenantId: event.tenant.tenantId,
            contactId: null,
            status: 'new',
            leadType: 'valuation_request',
            source: 'website_valuation',
            timeframe: null,
            notes: null,
            listingId: null,
            listingUrl: null,
            listingAddress: event.payload.address,
            propertyType: event.payload.propertyType,
            beds: event.payload.beds,
            baths: event.payload.baths,
            sqft: event.payload.sqft,
            createdAt: occurredAt,
            updatedAt: occurredAt,
          },
        });

        activityId = randomUUID();
        await tx.activity.create({
          data: {
            id: activityId,
            tenantId: event.tenant.tenantId,
            contactId: null,
            leadId,
            activityType: 'valuation_requested',
            occurredAt,
            summary: 'Website valuation request received',
            metadataJson: JSON.stringify(event.payload),
            createdAt: now,
          },
        });
      }

      const ingestedEventId = randomUUID();
      await tx.ingestedEvent.create({
        data: {
          id: ingestedEventId,
          tenantId: event.tenant.tenantId,
          eventType: event.eventType,
          eventKey,
          occurredAt,
          payloadJson: JSON.stringify(event.payload),
          processedAt: now,
          createdAt: now,
        },
      });

      return {
        accepted: true,
        duplicate: false,
        ingestedEventId,
        contactId,
        leadId,
        activityId,
      };
    });
  } catch (error) {
    console.error('CRM ingestion failure', error);
    return { accepted: false, duplicate: false, reason: 'ingestion_failed' };
  }
}

export async function getCrmLeadIngestionSummary(tenantId: string): Promise<CrmLeadIngestionSummary> {
  const prisma = await getPrismaClient();
  if (!prisma) {
    return {
      tenantId,
      contactCount: 0,
      leadCount: 0,
      activityCount: 0,
    };
  }

  try {
    const [contactCount, leadCount, activityCount] = await Promise.all([
      prisma.contact.count({ where: { tenantId } }),
      prisma.lead.count({ where: { tenantId } }),
      prisma.activity.count({ where: { tenantId } }),
    ]);

    return {
      tenantId,
      contactCount,
      leadCount,
      activityCount,
    };
  } catch {
    return {
      tenantId,
      contactCount: 0,
      leadCount: 0,
      activityCount: 0,
    };
  }
}

export async function listRecentLeadsByTenantId(tenantId: string, limit = 20): Promise<CrmLead[]> {
  const prisma = await getPrismaClient();
  if (!prisma) {
    return [];
  }

  try {
    const leads = await prisma.lead.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return leads.map(toCrmLead);
  } catch {
    return [];
  }
}

export async function listLeadsByTenantId(tenantId: string, options: ListCrmLeadsOptions = {}): Promise<CrmLead[]> {
  const prisma = await getPrismaClient();
  if (!prisma) {
    return [];
  }

  const take = Math.min(Math.max(options.limit ?? 50, 1), 200);
  const skip = Math.max(options.offset ?? 0, 0);

  try {
    const leads = await prisma.lead.findMany({
      where: {
        tenantId,
        ...(options.status ? { status: options.status } : {}),
        ...(options.leadType ? { leadType: options.leadType } : {}),
        ...(options.source ? { source: options.source } : {}),
        ...(options.contactId ? { contactId: options.contactId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    });
    return leads.map(toCrmLead);
  } catch {
    return [];
  }
}

export async function listContactsByTenantId(
  tenantId: string,
  options: ListCrmContactsOptions = {}
): Promise<CrmContact[]> {
  const prisma = await getPrismaClient();
  if (!prisma) {
    return [];
  }

  const take = Math.min(Math.max(options.limit ?? 50, 1), 200);
  const skip = Math.max(options.offset ?? 0, 0);
  const search = options.search?.trim();

  try {
    const contacts = await prisma.contact.findMany({
      where: {
        tenantId,
        ...(options.source ? { source: options.source } : {}),
        ...(search
          ? {
              OR: [
                { fullName: { contains: search } },
                { email: { contains: search } },
                { phone: { contains: search } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    });
    return contacts.map(toCrmContact);
  } catch {
    return [];
  }
}

export async function listRecentActivitiesByTenantId(tenantId: string, limit = 20): Promise<CrmActivity[]> {
  const prisma = await getPrismaClient();
  if (!prisma) {
    return [];
  }

  try {
    const activities = await prisma.activity.findMany({
      where: { tenantId },
      orderBy: { occurredAt: 'desc' },
      take: limit,
    });
    return activities.map(toCrmActivity);
  } catch {
    return [];
  }
}

export async function listActivitiesByTenantId(
  tenantId: string,
  options: ListCrmActivitiesOptions = {}
): Promise<CrmActivity[]> {
  const prisma = await getPrismaClient();
  if (!prisma) {
    return [];
  }

  const take = Math.min(Math.max(options.limit ?? 50, 1), 200);
  const skip = Math.max(options.offset ?? 0, 0);

  try {
    const activities = await prisma.activity.findMany({
      where: {
        tenantId,
        ...(options.leadId ? { leadId: options.leadId } : {}),
        ...(options.contactId ? { contactId: options.contactId } : {}),
        ...(options.activityType ? { activityType: options.activityType } : {}),
      },
      orderBy: { occurredAt: 'desc' },
      take,
      skip,
    });
    return activities.map(toCrmActivity);
  } catch {
    return [];
  }
}

export async function createContactForTenant(tenantId: string, input: CreateCrmContactInput): Promise<CrmContact | null> {
  const prisma = await getPrismaClient();
  if (!prisma) {
    return null;
  }

  const fullName = input.fullName?.trim() || null;
  const email = input.email?.trim() || null;
  const phone = input.phone?.trim() || null;
  const emailNormalized = normalizeEmail(email);
  const phoneNormalized = normalizePhone(phone);

  if (!emailNormalized && !phoneNormalized) {
    return null;
  }

  try {
    const now = new Date();
    const contact = await prisma.contact.create({
      data: {
        id: randomUUID(),
        tenantId,
        fullName,
        email,
        emailNormalized,
        phone,
        phoneNormalized,
        source: input.source || 'crm_manual',
        createdAt: now,
        updatedAt: now,
      },
    });

    return toCrmContact(contact);
  } catch {
    return null;
  }
}

export async function updateLeadForTenant(
  tenantId: string,
  leadId: string,
  input: UpdateCrmLeadInput
): Promise<CrmLead | null> {
  const prisma = await getPrismaClient();
  if (!prisma) {
    return null;
  }

  const data: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (input.status) {
    data.status = input.status;
  }
  if (input.notes !== undefined) {
    data.notes = input.notes;
  }

  try {
    const leadRecord = await prisma.lead.findFirst({
      where: { id: leadId, tenantId },
      select: { id: true },
    });
    if (!leadRecord) {
      return null;
    }

    const lead = await prisma.lead.update({
      where: {
        id: leadId,
      },
      data,
    });
    return toCrmLead(lead);
  } catch {
    return null;
  }
}

export async function createActivityForTenant(
  tenantId: string,
  input: CreateCrmActivityInput
): Promise<CrmActivity | null> {
  const prisma = await getPrismaClient();
  if (!prisma) {
    return null;
  }

  const summary = input.summary.trim();
  if (!summary) {
    return null;
  }

  try {
    if (input.leadId) {
      const lead = await prisma.lead.findFirst({
        where: { id: input.leadId, tenantId },
        select: { id: true },
      });
      if (!lead) {
        return null;
      }
    }

    if (input.contactId) {
      const contact = await prisma.contact.findFirst({
        where: { id: input.contactId, tenantId },
        select: { id: true },
      });
      if (!contact) {
        return null;
      }
    }

    const now = new Date();
    const created = await prisma.activity.create({
      data: {
        id: randomUUID(),
        tenantId,
        leadId: input.leadId || null,
        contactId: input.contactId || null,
        activityType: input.activityType,
        summary,
        metadataJson: input.metadataJson || null,
        occurredAt: input.occurredAt ? new Date(input.occurredAt) : now,
        createdAt: now,
      },
    });

    return toCrmActivity(created);
  } catch {
    return null;
  }
}

export async function getContactById(contactId: string): Promise<CrmContact | null> {
  const prisma = await getPrismaClient();
  if (!prisma) {
    return null;
  }

  try {
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
    });
    return contact ? toCrmContact(contact) : null;
  } catch {
    return null;
  }
}

export async function getContactByIdForTenant(tenantId: string, contactId: string): Promise<CrmContact | null> {
  const prisma = await getPrismaClient();
  if (!prisma) {
    return null;
  }

  try {
    const contact = await prisma.contact.findFirst({
      where: {
        id: contactId,
        tenantId,
      },
    });
    return contact ? toCrmContact(contact) : null;
  } catch {
    return null;
  }
}
