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

const MOCK_LISTINGS = [
  { address: '99 Waterfront Way, Stamford', price: 875000, beds: 3, baths: 2, sqft: 2100 },
  { address: '14 Elm Street, Greenwich', price: 1250000, beds: 4, baths: 3, sqft: 3200 },
  { address: '221 Post Road, Fairfield', price: 649000, beds: 3, baths: 2, sqft: 1800 },
  { address: '508 Main Street, Westport', price: 1475000, beds: 5, baths: 4, sqft: 3800 },
  { address: '33 Beach Drive, Norwalk', price: 725000, beds: 3, baths: 2, sqft: 2050 },
  { address: '77 Ridge Road, Darien', price: 1650000, beds: 5, baths: 4, sqft: 4200 },
  { address: '162 Valley View, New Canaan', price: 980000, beds: 4, baths: 3, sqft: 2700 },
  { address: '45 Harbor Lane, Stamford', price: 550000, beds: 2, baths: 2, sqft: 1400 },
  { address: '310 Meadow Court, Wilton', price: 1125000, beds: 4, baths: 3, sqft: 3100 },
  { address: '88 Sunset Terrace, Greenwich', price: 2100000, beds: 6, baths: 5, sqft: 5200 },
];

const MOCK_SEARCHES = [
  { query: 'Waterfront homes in Stamford', filters: { minPrice: 700000, maxPrice: 1200000, beds: 3 } },
  { query: 'Condos near Greenwich train station', filters: { minPrice: 400000, maxPrice: 800000, beds: 2 } },
  { query: 'Single family Fairfield CT', filters: { minPrice: 500000, maxPrice: 900000, beds: 3 } },
  { query: 'Luxury homes Darien', filters: { minPrice: 1200000, maxPrice: 2500000, beds: 5 } },
  { query: 'Family homes top school districts', filters: { minPrice: 600000, maxPrice: 1100000, beds: 4 } },
];

async function seedMockBehaviorActivities(tenantId: string): Promise<void> {
  const existing = await listActivitiesByTenantId(tenantId, { limit: 500 });
  const hasBehavior = existing.some((a) => a.activityType === 'website_listing_viewed');
  if (hasBehavior) {
    return;
  }

  const mockLeads = await listLeadsByTenantId(tenantId, { source: MOCK_SOURCE, limit: 200 });
  if (mockLeads.length === 0) {
    return;
  }

  const now = new Date();

  // Listing view / favorite events spread over past 30 days
  const behaviorActivities: Array<{
    leadIndex: number;
    type: 'website_listing_viewed' | 'website_listing_favorited' | 'website_search_performed';
    listingIndex?: number;
    searchIndex?: number;
    daysAgo: number;
    hoursOffset: number;
  }> = [
      // Sarah Mitchell — active buyer, lots of views
      { leadIndex: 0, type: 'website_listing_viewed', listingIndex: 0, daysAgo: 1, hoursOffset: 2 },
      { leadIndex: 0, type: 'website_listing_viewed', listingIndex: 1, daysAgo: 2, hoursOffset: 4 },
      { leadIndex: 0, type: 'website_listing_favorited', listingIndex: 0, daysAgo: 1, hoursOffset: 6 },
      { leadIndex: 0, type: 'website_listing_viewed', listingIndex: 3, daysAgo: 4, hoursOffset: 1 },
      { leadIndex: 0, type: 'website_listing_viewed', listingIndex: 4, daysAgo: 5, hoursOffset: 3 },
      { leadIndex: 0, type: 'website_listing_viewed', listingIndex: 6, daysAgo: 7, hoursOffset: 2 },
      { leadIndex: 0, type: 'website_listing_favorited', listingIndex: 3, daysAgo: 4, hoursOffset: 5 },
      { leadIndex: 0, type: 'website_search_performed', searchIndex: 0, daysAgo: 1, hoursOffset: 1 },
      { leadIndex: 0, type: 'website_search_performed', searchIndex: 4, daysAgo: 3, hoursOffset: 2 },
      { leadIndex: 0, type: 'website_listing_viewed', listingIndex: 8, daysAgo: 10, hoursOffset: 4 },
      { leadIndex: 0, type: 'website_listing_viewed', listingIndex: 2, daysAgo: 14, hoursOffset: 6 },
      { leadIndex: 0, type: 'website_search_performed', searchIndex: 2, daysAgo: 15, hoursOffset: 1 },
      // David Reynolds — moderate activity
      { leadIndex: 1, type: 'website_listing_viewed', listingIndex: 1, daysAgo: 3, hoursOffset: 3 },
      { leadIndex: 1, type: 'website_listing_viewed', listingIndex: 5, daysAgo: 5, hoursOffset: 1 },
      { leadIndex: 1, type: 'website_listing_favorited', listingIndex: 5, daysAgo: 5, hoursOffset: 4 },
      { leadIndex: 1, type: 'website_listing_viewed', listingIndex: 9, daysAgo: 8, hoursOffset: 2 },
      { leadIndex: 1, type: 'website_search_performed', searchIndex: 3, daysAgo: 4, hoursOffset: 3 },
      { leadIndex: 1, type: 'website_listing_viewed', listingIndex: 7, daysAgo: 12, hoursOffset: 5 },
      // Jessica Park — some activity
      { leadIndex: 4, type: 'website_listing_viewed', listingIndex: 2, daysAgo: 2, hoursOffset: 1 },
      { leadIndex: 4, type: 'website_listing_viewed', listingIndex: 4, daysAgo: 6, hoursOffset: 3 },
      { leadIndex: 4, type: 'website_listing_favorited', listingIndex: 2, daysAgo: 3, hoursOffset: 2 },
      { leadIndex: 4, type: 'website_search_performed', searchIndex: 2, daysAgo: 2, hoursOffset: 5 },
      { leadIndex: 4, type: 'website_listing_viewed', listingIndex: 6, daysAgo: 9, hoursOffset: 4 },
      // Emily Carter — light activity
      { leadIndex: 2, type: 'website_listing_viewed', listingIndex: 6, daysAgo: 8, hoursOffset: 2 },
      { leadIndex: 2, type: 'website_search_performed', searchIndex: 4, daysAgo: 10, hoursOffset: 1 },
      { leadIndex: 2, type: 'website_listing_viewed', listingIndex: 8, daysAgo: 18, hoursOffset: 6 },
      // Michael Quinn — recent burst
      { leadIndex: 3, type: 'website_listing_viewed', listingIndex: 7, daysAgo: 0, hoursOffset: 1 },
      { leadIndex: 3, type: 'website_listing_viewed', listingIndex: 2, daysAgo: 0, hoursOffset: 3 },
      { leadIndex: 3, type: 'website_listing_favorited', listingIndex: 7, daysAgo: 0, hoursOffset: 5 },
      { leadIndex: 3, type: 'website_listing_viewed', listingIndex: 4, daysAgo: 1, hoursOffset: 2 },
      { leadIndex: 3, type: 'website_search_performed', searchIndex: 1, daysAgo: 0, hoursOffset: 0 },
    ];

  for (const entry of behaviorActivities) {
    const lead = mockLeads[entry.leadIndex];
    if (!lead) continue;

    const minutesAgo = entry.daysAgo * 24 * 60 + entry.hoursOffset * 60;

    if (entry.type === 'website_search_performed') {
      const search = MOCK_SEARCHES[entry.searchIndex ?? 0];
      if (!search) continue;
      await createActivityForTenant(tenantId, {
        activityType: 'website_search_performed',
        summary: `Searched: ${search.query}`,
        leadId: lead.id,
        contactId: lead.contactId ?? null,
        occurredAt: buildOccurredAt(now, minutesAgo),
        metadataJson: JSON.stringify({
          source: MOCK_SOURCE,
          searchContext: {
            query: search.query,
            filtersJson: JSON.stringify(search.filters),
          },
          resultCount: Math.floor(Math.random() * 30) + 5,
        }),
      });
    } else {
      const listing = MOCK_LISTINGS[entry.listingIndex ?? 0];
      if (!listing) continue;
      const action = entry.type === 'website_listing_favorited' ? 'Favorited' : 'Viewed';
      await createActivityForTenant(tenantId, {
        activityType: entry.type,
        summary: `${action} listing: ${listing.address} ($${listing.price.toLocaleString()})`,
        leadId: lead.id,
        contactId: lead.contactId ?? null,
        occurredAt: buildOccurredAt(now, minutesAgo),
        metadataJson: JSON.stringify({
          source: MOCK_SOURCE,
          listing: {
            address: listing.address,
            price: listing.price,
            beds: listing.beds,
            baths: listing.baths,
            sqft: listing.sqft,
          },
        }),
      });
    }
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
  await seedMockBehaviorActivities(tenantRecord.tenantId);

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
