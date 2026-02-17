import {
  createActivityForTenant,
  createContactForTenant,
  enqueueWebsiteEvent,
  listActivitiesByTenantId,
  listContactsByTenantId,
  listLeadsByTenantId,
  processWebsiteEventQueueBatch,
  updateLeadForTenant,
} from '@real-estate/db/crm';
import { getDefaultTenantRecord, getTenantRecordByHostname } from '@real-estate/db/tenants';
import type { WebsiteEvent } from '@real-estate/types/events';
import type { CrmLeadStatus } from '@real-estate/types/crm';

const MOCK_SOURCE = 'mock_seed';
const MOCK_ACTIVITY_PREFIX = '[Mock]';

interface LeadFixture {
  address: string;
  propertyType: 'single-family' | 'condo' | 'multi-family';
  beds: number;
  baths: number;
  sqft: number;
  name: string;
  email: string;
  phone: string;
  timeframe: string;
  note: string;
}

const LEAD_FIXTURES: LeadFixture[] = [
  {
    address: '123 Harbor Road, Stamford',
    propertyType: 'single-family',
    beds: 4,
    baths: 3,
    sqft: 3250,
    name: 'Sarah Mitchell',
    email: 'sarah.mitchell@example.com',
    phone: '(203) 555-0101',
    timeframe: '30 days',
    note: 'Requested private showing with waterfront preference.',
  },
  {
    address: '87 Shoreline Drive, Greenwich',
    propertyType: 'single-family',
    beds: 5,
    baths: 4,
    sqft: 4100,
    name: 'David Reynolds',
    email: 'david.reynolds@example.com',
    phone: '(203) 555-0102',
    timeframe: '60 days',
    note: 'Looking for renovated kitchen and home office.',
  },
  {
    address: '19 Maple Crest Lane, New Canaan',
    propertyType: 'single-family',
    beds: 4,
    baths: 3,
    sqft: 2900,
    name: 'Emily Carter',
    email: 'emily.carter@example.com',
    phone: '(203) 555-0103',
    timeframe: '90 days',
    note: 'Interested in top-rated school district options.',
  },
  {
    address: '442 Riverside Boulevard, Westport',
    propertyType: 'condo',
    beds: 3,
    baths: 2,
    sqft: 2150,
    name: 'Michael Quinn',
    email: 'michael.quinn@example.com',
    phone: '(203) 555-0104',
    timeframe: '30 days',
    note: 'Prefers walkable downtown area with low maintenance.',
  },
  {
    address: '311 Orchard Hill Road, Fairfield',
    propertyType: 'single-family',
    beds: 4,
    baths: 3,
    sqft: 3050,
    name: 'Jessica Park',
    email: 'jessica.park@example.com',
    phone: '(203) 555-0105',
    timeframe: '45 days',
    note: 'Needs fenced yard and short commute to Stamford.',
  },
  {
    address: '76 Pine Meadow Court, Darien',
    propertyType: 'single-family',
    beds: 5,
    baths: 4,
    sqft: 4300,
    name: 'Ryan Coleman',
    email: 'ryan.coleman@example.com',
    phone: '(203) 555-0106',
    timeframe: '90 days',
    note: 'Considering sale + purchase transition timeline.',
  },
  {
    address: '208 Seaview Avenue, Norwalk',
    propertyType: 'multi-family',
    beds: 4,
    baths: 3,
    sqft: 2800,
    name: 'Lauren Diaz',
    email: 'lauren.diaz@example.com',
    phone: '(203) 555-0107',
    timeframe: '120 days',
    note: 'Investor profile focused on rental cash flow.',
  },
  {
    address: '54 Willow Bend, Wilton',
    propertyType: 'single-family',
    beds: 4,
    baths: 3,
    sqft: 3120,
    name: 'Anthony Russo',
    email: 'anthony.russo@example.com',
    phone: '(203) 555-0108',
    timeframe: '60 days',
    note: 'Needs in-law suite and finished basement.',
  },
];

const VALUATION_FIXTURES = [
  { address: '15 Lantern Ridge, Ridgefield', propertyType: 'single-family' as const, beds: 4, baths: 3, sqft: 3340 },
  { address: '284 Beachside Avenue, Fairfield', propertyType: 'condo' as const, beds: 3, baths: 2, sqft: 1960 },
  { address: '902 King Street, Greenwich', propertyType: 'single-family' as const, beds: 5, baths: 4, sqft: 4580 },
  { address: '41 Harbor Point, Stamford', propertyType: 'condo' as const, beds: 2, baths: 2, sqft: 1410 },
];

const STATUS_ROTATION: CrmLeadStatus[] = ['new', 'qualified', 'nurturing', 'won', 'lost'];

function buildOccurredAt(baseTime: Date, minutesAgo: number): string {
  return new Date(baseTime.getTime() - minutesAgo * 60_000).toISOString();
}

async function drainQueue(maxLoops = 20): Promise<void> {
  for (let index = 0; index < maxLoops; index += 1) {
    const result = await processWebsiteEventQueueBatch(50);
    if (result.pickedCount === 0) {
      break;
    }
  }
}

async function seedMockEvents(tenant: { tenantId: string; tenantSlug: string; tenantDomain: string }): Promise<void> {
  const now = new Date();
  const events: WebsiteEvent[] = [];

  LEAD_FIXTURES.forEach((fixture, index) => {
    events.push({
      eventType: 'website.lead.submitted',
      version: 1,
      occurredAt: buildOccurredAt(now, 45 + index * 26),
      tenant,
      payload: {
        source: MOCK_SOURCE,
        contact: {
          name: fixture.name,
          email: fixture.email,
          phone: fixture.phone,
        },
        timeframe: fixture.timeframe,
        message: fixture.note,
        listing: {
          id: `mock-listing-${index + 1}`,
          url: `https://${tenant.tenantDomain}/listings/mock-${index + 1}`,
          address: fixture.address,
        },
        propertyDetails: {
          propertyType: fixture.propertyType,
          beds: fixture.beds,
          baths: fixture.baths,
          sqft: fixture.sqft,
        },
      },
    });
  });

  VALUATION_FIXTURES.forEach((fixture, index) => {
    events.push({
      eventType: 'website.valuation.requested',
      version: 1,
      occurredAt: buildOccurredAt(now, 25 + index * 40),
      tenant,
      payload: fixture,
    });
  });

  for (const event of events) {
    await enqueueWebsiteEvent(event);
  }

  await drainQueue();
}

async function seedMockContacts(tenantId: string): Promise<void> {
  const existingContacts = await listContactsByTenantId(tenantId, { source: MOCK_SOURCE, limit: 200 });
  if (existingContacts.length >= 10) {
    return;
  }

  await createContactForTenant(tenantId, {
    fullName: 'Peter Wallace',
    email: 'peter.wallace@example.com',
    phone: '(203) 555-0110',
    source: MOCK_SOURCE,
  });
  await createContactForTenant(tenantId, {
    fullName: 'Nina Brooks',
    email: 'nina.brooks@example.com',
    phone: '(203) 555-0111',
    source: MOCK_SOURCE,
  });
}

async function updateMockLeadStatuses(tenantId: string): Promise<void> {
  const mockLeads = await listLeadsByTenantId(tenantId, {
    source: MOCK_SOURCE,
    limit: 200,
  });

  for (const [index, lead] of mockLeads.entries()) {
    const nextStatus = STATUS_ROTATION[index % STATUS_ROTATION.length] ?? 'new';
    const nextNotes = `${MOCK_ACTIVITY_PREFIX} Lead reviewed in board pass ${index + 1}.`;
    await updateLeadForTenant(tenantId, lead.id, {
      status: nextStatus,
      notes: nextNotes,
    });
  }
}

async function seedMockActivities(tenantId: string): Promise<void> {
  const existing = await listActivitiesByTenantId(tenantId, { limit: 200 });
  const hasMockActivities = existing.some((activity) => activity.summary.startsWith(MOCK_ACTIVITY_PREFIX));
  if (hasMockActivities) {
    return;
  }

  const mockLeads = await listLeadsByTenantId(tenantId, { source: MOCK_SOURCE, limit: 200 });
  if (mockLeads.length === 0) {
    return;
  }

  const activitySummaries = [
    `${MOCK_ACTIVITY_PREFIX} New lead from website — ${mockLeads[0]?.listingAddress ?? 'Unknown property'}`,
    `${MOCK_ACTIVITY_PREFIX} Contact created for valuation request follow-up`,
    `${MOCK_ACTIVITY_PREFIX} Status changed to Qualified after introductory call`,
    `${MOCK_ACTIVITY_PREFIX} Scheduled open-house strategy session`,
    `${MOCK_ACTIVITY_PREFIX} Drafted outreach email with next-step timeline`,
    `${MOCK_ACTIVITY_PREFIX} Pipeline review completed for this week`,
  ];

  for (const [index, summary] of activitySummaries.entries()) {
    const lead = mockLeads[index % mockLeads.length];
    await createActivityForTenant(tenantId, {
      activityType: index % 2 === 0 ? 'lead_status_changed' : 'note',
      summary,
      leadId: lead?.id ?? null,
      contactId: lead?.contactId ?? null,
      occurredAt: buildOccurredAt(new Date(), 10 + index * 17),
    });
  }
}

async function main() {
  const tenantHost = process.env.CRM_MOCK_TENANT_HOST ?? 'fairfield.localhost';
  const tenantRecord = (await getTenantRecordByHostname(tenantHost)) ?? (await getDefaultTenantRecord());

  if (!tenantRecord) {
    throw new Error('Unable to resolve tenant for CRM mock seeding.');
  }

  await seedMockEvents(tenantRecord);
  await seedMockContacts(tenantRecord.tenantId);
  await updateMockLeadStatuses(tenantRecord.tenantId);
  await seedMockActivities(tenantRecord.tenantId);

  const [leads, contacts, activities] = await Promise.all([
    listLeadsByTenantId(tenantRecord.tenantId, { limit: 200 }),
    listContactsByTenantId(tenantRecord.tenantId, { limit: 200 }),
    listActivitiesByTenantId(tenantRecord.tenantId, { limit: 200 }),
  ]);

  const mockLeadCount = leads.filter((lead) => lead.source === MOCK_SOURCE).length;
  const mockContactCount = contacts.filter((contact) => contact.source === MOCK_SOURCE).length;
  const mockActivityCount = activities.filter((activity) => activity.summary.startsWith(MOCK_ACTIVITY_PREFIX)).length;

  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      {
        ok: true,
        tenantId: tenantRecord.tenantId,
        tenantDomain: tenantRecord.tenantDomain,
        mockLeadCount,
        mockContactCount,
        mockActivityCount,
        totalLeadCount: leads.length,
        totalContactCount: contacts.length,
        totalActivityCount: activities.length,
      },
      null,
      2
    )
  );
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  // eslint-disable-next-line no-console
  console.error(`[crm-mock-seed] ${message}`);
  process.exitCode = 1;
});
