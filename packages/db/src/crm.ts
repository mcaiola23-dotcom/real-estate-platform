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
  WebsiteListingFavoritedEvent,
  WebsiteListingUnfavoritedEvent,
  WebsiteListingViewedEvent,
  WebsiteSearchPerformedEvent,
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

function isNonNullObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isWebsiteLeadPayloadValid(payload: unknown): payload is WebsiteLeadSubmittedEvent['payload'] {
  if (!isNonNullObject(payload)) {
    return false;
  }

  const contact = payload.contact;
  const listing = payload.listing;
  if (!isNonNullObject(contact) || !isNonNullObject(listing)) {
    return false;
  }

  const hasValidName = contact.name === null || typeof contact.name === 'string';
  const hasValidEmail = typeof contact.email === 'string';
  const hasValidPhone = typeof contact.phone === 'string';
  const hasValidSource = typeof payload.source === 'string';
  const hasValidTimeframe = payload.timeframe === null || typeof payload.timeframe === 'string';
  const hasValidMessage = payload.message === null || typeof payload.message === 'string';

  if (
    !hasValidName ||
    !hasValidEmail ||
    !hasValidPhone ||
    !hasValidSource ||
    !hasValidTimeframe ||
    !hasValidMessage
  ) {
    return false;
  }

  const hasValidListingId = listing.id === null || typeof listing.id === 'string';
  const hasValidListingUrl = listing.url === null || typeof listing.url === 'string';
  const hasValidListingAddress = listing.address === null || typeof listing.address === 'string';
  if (!hasValidListingId || !hasValidListingUrl || !hasValidListingAddress) {
    return false;
  }

  const propertyDetails = payload.propertyDetails;
  if (propertyDetails === null) {
    return true;
  }
  if (!isNonNullObject(propertyDetails)) {
    return false;
  }

  const validPropertyTypes = new Set(['single-family', 'condo', 'multi-family']);
  return (
    validPropertyTypes.has(String(propertyDetails.propertyType)) &&
    typeof propertyDetails.beds === 'number' &&
    typeof propertyDetails.baths === 'number' &&
    (propertyDetails.sqft === null || typeof propertyDetails.sqft === 'number')
  );
}

function isWebsiteValuationPayloadValid(payload: unknown): payload is WebsiteValuationRequestedEvent['payload'] {
  if (!isNonNullObject(payload)) {
    return false;
  }

  const validPropertyTypes = new Set(['single-family', 'condo', 'multi-family']);
  return (
    typeof payload.address === 'string' &&
    validPropertyTypes.has(String(payload.propertyType)) &&
    typeof payload.beds === 'number' &&
    typeof payload.baths === 'number' &&
    (payload.sqft === null || typeof payload.sqft === 'number')
  );
}

function isWebsiteSearchPerformedPayloadValid(payload: unknown): payload is WebsiteSearchPerformedEvent['payload'] {
  if (!isNonNullObject(payload)) {
    return false;
  }

  if (typeof payload.source !== 'string' || !isNonNullObject(payload.searchContext)) {
    return false;
  }

  const searchContext = payload.searchContext;
  const hasValidQuery = searchContext.query === null || typeof searchContext.query === 'string';
  const hasValidFilters = searchContext.filtersJson === null || typeof searchContext.filtersJson === 'string';
  const hasValidSortField = searchContext.sortField === null || typeof searchContext.sortField === 'string';
  const hasValidSortOrder = searchContext.sortOrder === null || typeof searchContext.sortOrder === 'string';
  const hasValidPage = searchContext.page === null || typeof searchContext.page === 'number';
  const hasValidResultCount = payload.resultCount === null || typeof payload.resultCount === 'number';
  const hasValidActor = payload.actor === null || isNonNullObject(payload.actor);

  return (
    hasValidQuery &&
    hasValidFilters &&
    hasValidSortField &&
    hasValidSortOrder &&
    hasValidPage &&
    hasValidResultCount &&
    hasValidActor
  );
}

function isWebsiteListingInteractionPayloadValid(
  payload: unknown
): payload is
  | WebsiteListingViewedEvent['payload']
  | WebsiteListingFavoritedEvent['payload']
  | WebsiteListingUnfavoritedEvent['payload'] {
  if (!isNonNullObject(payload) || typeof payload.source !== 'string' || !isNonNullObject(payload.listing)) {
    return false;
  }

  const listing = payload.listing;
  const hasValidListingId = typeof listing.id === 'string';
  const hasValidAddress = listing.address === null || typeof listing.address === 'string';
  const hasValidCity = listing.city === null || typeof listing.city === 'string';
  const hasValidState = listing.state === null || typeof listing.state === 'string';
  const hasValidZip = listing.zip === null || typeof listing.zip === 'string';
  const hasValidPrice = listing.price === null || typeof listing.price === 'number';
  const hasValidBeds = listing.beds === null || typeof listing.beds === 'number';
  const hasValidBaths = listing.baths === null || typeof listing.baths === 'number';
  const hasValidSqft = listing.sqft === null || typeof listing.sqft === 'number';
  const hasValidPropertyType = listing.propertyType === null || typeof listing.propertyType === 'string';
  const hasValidSearchContext = payload.searchContext === null || isNonNullObject(payload.searchContext);
  const hasValidActor = payload.actor === null || isNonNullObject(payload.actor);

  return (
    hasValidListingId &&
    hasValidAddress &&
    hasValidCity &&
    hasValidState &&
    hasValidZip &&
    hasValidPrice &&
    hasValidBeds &&
    hasValidBaths &&
    hasValidSqft &&
    hasValidPropertyType &&
    hasValidSearchContext &&
    hasValidActor
  );
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

function toNullableIso(value: string | Date | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  return toIsoString(value);
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
  lastContactAt?: string | Date | null;
  nextActionAt?: string | Date | null;
  nextActionNote?: string | null;
  priceMin?: number | null;
  priceMax?: number | null;
  tags?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}): CrmLead {
  let parsedTags: string[] = [];
  if (record.tags) {
    try { parsedTags = JSON.parse(record.tags); } catch { /* keep empty */ }
  }
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
    lastContactAt: toNullableIso(record.lastContactAt),
    nextActionAt: toNullableIso(record.nextActionAt),
    nextActionNote: record.nextActionNote ?? null,
    priceMin: record.priceMin ?? null,
    priceMax: record.priceMax ?? null,
    tags: parsedTags,
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
  timeframe?: string | null;
  listingAddress?: string | null;
  propertyType?: string | null;
  beds?: number | null;
  baths?: number | null;
  sqft?: number | null;
  lastContactAt?: string | Date | null;
  nextActionAt?: string | Date | null;
  nextActionNote?: string | null;
  priceMin?: number | null;
  priceMax?: number | null;
  tags?: string[];
}

export interface UpdateCrmContactInput {
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
}

export interface CreateCrmActivityInput {
  activityType: string;
  summary: string;
  leadId?: string | null;
  contactId?: string | null;
  metadataJson?: string | null;
  occurredAt?: string | Date;
}

export interface CreateCrmLeadInput {
  contactId?: string | null;
  status?: CrmLeadStatus;
  leadType?: CrmLeadType;
  source?: string;
  timeframe?: string | null;
  notes?: string | null;
  listingId?: string | null;
  listingUrl?: string | null;
  listingAddress?: string | null;
  propertyType?: string | null;
  beds?: number | null;
  baths?: number | null;
  sqft?: number | null;
  tags?: string[];
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

async function resolveLeadForListingInteraction(
  tx: any,
  tenantId: string,
  listing: {
    id: string;
    address: string | null;
  }
): Promise<{ id: string; contactId: string | null } | null> {
  const listingId = listing.id.trim();
  const listingAddress = listing.address?.trim();

  if (!listingId && !listingAddress) {
    return null;
  }

  const lead = await tx.lead.findFirst({
    where: {
      tenantId,
      OR: [
        ...(listingId ? [{ listingId }] : []),
        ...(listingAddress ? [{ listingAddress }] : []),
      ],
    },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      contactId: true,
    },
  });

  return lead ?? null;
}

function parseWebsiteEventFromQueueRecord(record: { payloadJson: string }): WebsiteEvent | null {
  try {
    const event = JSON.parse(record.payloadJson) as WebsiteEvent;
    if (
      event.eventType !== 'website.lead.submitted' &&
      event.eventType !== 'website.valuation.requested' &&
      event.eventType !== 'website.search.performed' &&
      event.eventType !== 'website.listing.viewed' &&
      event.eventType !== 'website.listing.favorited' &&
      event.eventType !== 'website.listing.unfavorited'
    ) {
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

export async function getIngestionQueueJobById(jobId: string): Promise<WebsiteIngestionJob | null> {
  const prisma = await getPrismaClient();
  if (!prisma) {
    return null;
  }

  try {
    const job = await prisma.ingestionQueueJob.findUnique({
      where: { id: jobId },
    });
    return job ? toWebsiteIngestionJob(job) : null;
  } catch {
    return null;
  }
}

export async function scheduleIngestionQueueJobNow(jobId: string): Promise<boolean> {
  const prisma = await getPrismaClient();
  if (!prisma) {
    return false;
  }

  const now = new Date();
  try {
    const existing = await prisma.ingestionQueueJob.findUnique({
      where: { id: jobId },
      select: { id: true, status: true },
    });
    if (!existing || existing.status !== 'pending') {
      return false;
    }

    await prisma.ingestionQueueJob.update({
      where: { id: jobId },
      data: {
        nextAttemptAt: now,
        updatedAt: now,
      },
    });
    return true;
  } catch {
    return false;
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

  if (event.eventType === 'website.lead.submitted' && !isWebsiteLeadPayloadValid(event.payload)) {
    return { accepted: false, duplicate: false, reason: 'ingestion_failed' };
  }
  if (event.eventType === 'website.valuation.requested' && !isWebsiteValuationPayloadValid(event.payload)) {
    return { accepted: false, duplicate: false, reason: 'ingestion_failed' };
  }
  if (event.eventType === 'website.search.performed' && !isWebsiteSearchPerformedPayloadValid(event.payload)) {
    return { accepted: false, duplicate: false, reason: 'ingestion_failed' };
  }
  if (
    (event.eventType === 'website.listing.viewed' ||
      event.eventType === 'website.listing.favorited' ||
      event.eventType === 'website.listing.unfavorited') &&
    !isWebsiteListingInteractionPayloadValid(event.payload)
  ) {
    return { accepted: false, duplicate: false, reason: 'ingestion_failed' };
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
      } else if (event.eventType === 'website.search.performed') {
        activityId = randomUUID();
        await tx.activity.create({
          data: {
            id: activityId,
            tenantId: event.tenant.tenantId,
            contactId: null,
            leadId: null,
            activityType: 'website_search_performed',
            occurredAt,
            summary: `Home search performed (${event.payload.resultCount ?? 0} results)`,
            metadataJson: JSON.stringify(event.payload),
            createdAt: now,
          },
        });
      } else if (
        event.eventType === 'website.listing.viewed' ||
        event.eventType === 'website.listing.favorited' ||
        event.eventType === 'website.listing.unfavorited'
      ) {
        const linkedLead = await resolveLeadForListingInteraction(tx, event.tenant.tenantId, {
          id: event.payload.listing.id,
          address: event.payload.listing.address,
        });

        const interactionSummary =
          event.eventType === 'website.listing.viewed'
            ? `Listing viewed: ${event.payload.listing.address || event.payload.listing.id}`
            : event.eventType === 'website.listing.favorited'
              ? `Listing favorited: ${event.payload.listing.address || event.payload.listing.id}`
              : `Listing unfavorited: ${event.payload.listing.address || event.payload.listing.id}`;

        activityId = randomUUID();
        await tx.activity.create({
          data: {
            id: activityId,
            tenantId: event.tenant.tenantId,
            contactId: linkedLead?.contactId ?? null,
            leadId: linkedLead?.id ?? null,
            activityType:
              event.eventType === 'website.listing.viewed'
                ? 'website_listing_viewed'
                : event.eventType === 'website.listing.favorited'
                  ? 'website_listing_favorited'
                  : 'website_listing_unfavorited',
            occurredAt,
            summary: interactionSummary,
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
        ...(options.tag ? { tags: { contains: `"${options.tag}"` } } : {}),
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

export async function createLeadForTenant(tenantId: string, input: CreateCrmLeadInput): Promise<CrmLead | null> {
  const prisma = await getPrismaClient();
  if (!prisma) {
    return null;
  }

  try {
    const now = new Date();
    const lead = await prisma.lead.create({
      data: {
        id: randomUUID(),
        tenantId,
        contactId: input.contactId || null,
        status: input.status || 'new',
        leadType: input.leadType || 'buyer',
        source: input.source || 'crm_manual',
        timeframe: input.timeframe?.trim() || null,
        notes: input.notes?.trim() || null,
        listingId: input.listingId?.trim() || null,
        listingUrl: input.listingUrl?.trim() || null,
        listingAddress: input.listingAddress?.trim() || null,
        propertyType: input.propertyType || null,
        beds: input.beds ?? null,
        baths: input.baths ?? null,
        sqft: input.sqft ?? null,
        tags: JSON.stringify(input.tags ?? []),
        createdAt: now,
        updatedAt: now,
      },
    });

    return toCrmLead(lead);
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
  if (input.timeframe !== undefined) {
    data.timeframe = input.timeframe;
  }
  if (input.listingAddress !== undefined) {
    data.listingAddress = input.listingAddress;
  }
  if (input.propertyType !== undefined) {
    data.propertyType = input.propertyType;
  }
  if (input.beds !== undefined) {
    data.beds = input.beds;
  }
  if (input.baths !== undefined) {
    data.baths = input.baths;
  }
  if (input.sqft !== undefined) {
    data.sqft = input.sqft;
  }
  if (input.lastContactAt !== undefined) {
    data.lastContactAt = input.lastContactAt ? new Date(input.lastContactAt) : null;
  }
  if (input.nextActionAt !== undefined) {
    data.nextActionAt = input.nextActionAt ? new Date(input.nextActionAt) : null;
  }
  if (input.nextActionNote !== undefined) {
    data.nextActionNote = input.nextActionNote;
  }
  if (input.priceMin !== undefined) {
    data.priceMin = input.priceMin;
  }
  if (input.priceMax !== undefined) {
    data.priceMax = input.priceMax;
  }
  if (input.tags !== undefined) {
    data.tags = JSON.stringify(input.tags);
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

export async function updateContactForTenant(
  tenantId: string,
  contactId: string,
  input: UpdateCrmContactInput
): Promise<CrmContact | null> {
  const prisma = await getPrismaClient();
  if (!prisma) {
    return null;
  }

  const data: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (input.fullName !== undefined) {
    data.fullName = input.fullName?.trim() || null;
  }
  if (input.email !== undefined) {
    const email = input.email?.trim() || null;
    data.email = email;
    data.emailNormalized = normalizeEmail(email);
  }
  if (input.phone !== undefined) {
    const phone = input.phone?.trim() || null;
    data.phone = phone;
    data.phoneNormalized = normalizePhone(phone);
  }

  try {
    const contactRecord = await prisma.contact.findFirst({
      where: { id: contactId, tenantId },
      select: { id: true },
    });
    if (!contactRecord) {
      return null;
    }

    const updated = await prisma.contact.update({
      where: { id: contactId },
      data,
    });
    return toCrmContact(updated);
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

export async function getLeadByIdForTenant(tenantId: string, leadId: string): Promise<CrmLead | null> {
  const prisma = await getPrismaClient();
  if (!prisma) {
    return null;
  }

  try {
    const lead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        tenantId,
      },
    });
    return lead ? toCrmLead(lead) : null;
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

export async function listAllLeadTagsForTenant(tenantId: string): Promise<string[]> {
  const prisma = await getPrismaClient();
  if (!prisma) {
    return [];
  }

  try {
    const leads = await prisma.lead.findMany({
      where: { tenantId },
      select: { tags: true },
    });

    const tagSet = new Set<string>();
    for (const lead of leads) {
      try {
        const parsed = JSON.parse(lead.tags) as string[];
        for (const t of parsed) {
          if (t) tagSet.add(t);
        }
      } catch { /* skip malformed */ }
    }
    return Array.from(tagSet).sort();
  } catch {
    return [];
  }
}

export interface DuplicateLeadMatch {
  lead: CrmLead;
  contact: CrmContact | null;
  matchReasons: string[];
}

export async function findPotentialDuplicateLeads(
  tenantId: string,
  opts: { excludeLeadId?: string; email?: string; phone?: string; address?: string }
): Promise<DuplicateLeadMatch[]> {
  const prisma = await getPrismaClient();
  if (!prisma) return [];

  const { excludeLeadId, email, phone, address } = opts;
  const normalizedEmail = email?.trim().toLowerCase() || null;
  const normalizedPhone = phone?.replace(/\D/g, '') || null;
  const normalizedAddress = address?.trim().toLowerCase() || null;

  if (!normalizedEmail && !normalizedPhone && !normalizedAddress) return [];

  try {
    // Find contacts matching email or phone
    const contactConditions: Array<Record<string, unknown>> = [];
    if (normalizedEmail) {
      contactConditions.push({ emailNormalized: normalizedEmail });
    }
    if (normalizedPhone) {
      contactConditions.push({ phoneNormalized: normalizedPhone });
    }

    const matchedContactIds = new Set<string>();
    if (contactConditions.length > 0) {
      const contacts = await prisma.contact.findMany({
        where: {
          tenantId,
          OR: contactConditions,
        },
        select: { id: true, emailNormalized: true, phoneNormalized: true },
      });
      for (const c of contacts) {
        matchedContactIds.add(c.id);
      }
    }

    // Build lead query conditions
    const leadOrConditions: Array<Record<string, unknown>> = [];
    if (matchedContactIds.size > 0) {
      leadOrConditions.push({ contactId: { in: Array.from(matchedContactIds) } });
    }
    if (normalizedAddress) {
      leadOrConditions.push({ listingAddress: { contains: normalizedAddress } });
    }

    if (leadOrConditions.length === 0) return [];

    const leads = await prisma.lead.findMany({
      where: {
        tenantId,
        ...(excludeLeadId ? { id: { not: excludeLeadId } } : {}),
        OR: leadOrConditions,
      },
      include: { contact: true },
      take: 10,
      orderBy: { createdAt: 'desc' },
    });

    const results: DuplicateLeadMatch[] = [];
    for (const row of leads) {
      const reasons: string[] = [];
      const contact = row.contact;

      if (contact && normalizedEmail && contact.emailNormalized === normalizedEmail) {
        reasons.push('Email match');
      }
      if (contact && normalizedPhone && contact.phoneNormalized === normalizedPhone) {
        reasons.push('Phone match');
      }
      if (normalizedAddress && row.listingAddress?.toLowerCase().includes(normalizedAddress)) {
        reasons.push('Address match');
      }

      if (reasons.length > 0) {
        results.push({
          lead: toCrmLead(row),
          contact: contact ? toCrmContact(contact) : null,
          matchReasons: reasons,
        });
      }
    }

    return results;
  } catch {
    return [];
  }
}
