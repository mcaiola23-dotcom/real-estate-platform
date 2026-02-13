import { createHash, randomUUID } from 'node:crypto';

import type {
  CrmActivity,
  CrmContact,
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

import { getPrismaClient } from './prisma-client';

function toIsoString(value: string | Date): string {
  return typeof value === 'string' ? value : value.toISOString();
}

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

export interface WebsiteEventIngestionResult {
  accepted: boolean;
  duplicate: boolean;
  reason?: 'prisma_unavailable' | 'ingestion_failed';
  ingestedEventId?: string;
  contactId?: string | null;
  leadId?: string | null;
  activityId?: string | null;
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
