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
import {
  createTransactionForTenant,
  addTransactionParty,
  addTransactionMilestone,
  listTransactionsForTenant,
} from '@real-estate/db/transactions';
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

function daysFromNow(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
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

// ── Enrich leads with price ranges, tags, reminders, win/loss data ──

interface LeadEnrichment {
  leadIndex: number;
  priceMin?: number;
  priceMax?: number;
  tags?: string[];
  nextActionAt?: string;
  nextActionNote?: string;
  nextActionChannel?: string;
  closeReason?: string;
  closeNotes?: string;
  closedAt?: string;
  assignedTo?: string;
  referredBy?: string;
  leadType?: string;
}

const LEAD_ENRICHMENTS: LeadEnrichment[] = [
  // Sarah Mitchell (index 0) — new, active buyer with high budget
  { leadIndex: 0, priceMin: 750000, priceMax: 1200000, tags: ['Pre-Approved', 'VIP', 'Waterfront'], nextActionAt: daysFromNow(1), nextActionNote: 'Follow up after showing at 123 Harbor Road', nextActionChannel: 'call' },
  // David Reynolds (index 1) — qualified, luxury buyer
  { leadIndex: 1, priceMin: 1200000, priceMax: 2200000, tags: ['Relocation', 'Luxury'], nextActionAt: daysFromNow(3), nextActionNote: 'Send curated luxury listings in Greenwich/Darien', nextActionChannel: 'email', referredBy: 'Client referral — James Whitfield' },
  // Emily Carter (index 2) — nurturing, family buyer
  { leadIndex: 2, priceMin: 550000, priceMax: 950000, tags: ['First-time Buyer', 'Family'], nextActionAt: daysAgo(2), nextActionNote: 'Check in about school district tour', nextActionChannel: 'call' },
  // Michael Quinn (index 3) — won, closed deal
  { leadIndex: 3, priceMin: 400000, priceMax: 650000, tags: ['Downsizer'], closeReason: 'Found property', closeNotes: 'Closed on 442 Riverside Blvd — loved the walkability and low HOA fees.', closedAt: daysAgo(5), leadType: 'buyer' },
  // Jessica Park (index 4) — lost
  { leadIndex: 4, priceMin: 500000, priceMax: 850000, tags: ['Commuter'], closeReason: 'Went with another agent', closeNotes: 'Chose a local Fairfield agent she met at an open house.', closedAt: daysAgo(10), leadType: 'buyer' },
  // Ryan Coleman (index 5) — new, seller lead
  { leadIndex: 5, priceMin: 800000, priceMax: 1100000, tags: ['Sell & Buy', 'Investor'], nextActionAt: daysFromNow(5), nextActionNote: 'Schedule CMA presentation for Pine Meadow Court', nextActionChannel: 'email', leadType: 'seller' },
  // Lauren Diaz (index 6) — qualified, investor
  { leadIndex: 6, priceMin: 350000, priceMax: 750000, tags: ['Investor', 'Multi-family'], nextActionAt: daysAgo(1), nextActionNote: 'Send cash-flow analysis for Seaview Avenue duplex', nextActionChannel: 'email', leadType: 'investor' },
  // Anthony Russo (index 7) — nurturing
  { leadIndex: 7, priceMin: 600000, priceMax: 900000, tags: ['In-Law Suite'], nextActionAt: daysFromNow(7), nextActionNote: 'Touch base about basement renovation options', nextActionChannel: 'text' },
];

async function enrichMockLeads(tenantId: string): Promise<void> {
  const mockLeads = await listLeadsByTenantId(tenantId, { source: MOCK_SOURCE, limit: 200 });
  if (mockLeads.length === 0) return;

  // Skip if already enriched (check if first lead has priceMin set)
  if (mockLeads[0] && mockLeads[0].priceMin !== null) return;

  for (const enrichment of LEAD_ENRICHMENTS) {
    const lead = mockLeads[enrichment.leadIndex];
    if (!lead) continue;

    const update: Record<string, unknown> = {};
    if (enrichment.priceMin !== undefined) update.priceMin = enrichment.priceMin;
    if (enrichment.priceMax !== undefined) update.priceMax = enrichment.priceMax;
    if (enrichment.nextActionAt !== undefined) update.nextActionAt = enrichment.nextActionAt;
    if (enrichment.nextActionNote !== undefined) update.nextActionNote = enrichment.nextActionNote;
    if (enrichment.nextActionChannel !== undefined) update.nextActionChannel = enrichment.nextActionChannel;
    if (enrichment.closeReason !== undefined) update.closeReason = enrichment.closeReason;
    if (enrichment.closeNotes !== undefined) update.closeNotes = enrichment.closeNotes;
    if (enrichment.closedAt !== undefined) update.closedAt = enrichment.closedAt;
    if (enrichment.assignedTo !== undefined) update.assignedTo = enrichment.assignedTo;
    if (enrichment.referredBy !== undefined) update.referredBy = enrichment.referredBy;
    if (enrichment.tags !== undefined) update.tags = enrichment.tags;

    await updateLeadForTenant(tenantId, lead.id, update);
  }
}

// ── Contact history (logged calls/texts/emails) ──

async function seedMockContactHistory(tenantId: string): Promise<void> {
  const existing = await listActivitiesByTenantId(tenantId, { limit: 500 });
  const hasContactHistory = existing.some((a) => a.activityType === 'call_logged');
  if (hasContactHistory) return;

  const mockLeads = await listLeadsByTenantId(tenantId, { source: MOCK_SOURCE, limit: 200 });
  if (mockLeads.length === 0) return;

  const contactLogs = [
    // Sarah Mitchell — active conversation
    { leadIndex: 0, type: 'call_logged', summary: 'Discussed waterfront options in Stamford. Very interested in Harbor Road area. Budget confirmed at $750K-$1.2M. Wants 4BR minimum.', daysAgo: 3 },
    { leadIndex: 0, type: 'email_logged', summary: 'Sent listing packet for 5 waterfront properties. Included market comparables for the area.', daysAgo: 2 },
    { leadIndex: 0, type: 'text_logged', summary: 'Confirmed showing for Saturday at 2pm — 123 Harbor Road.', daysAgo: 1 },
    // David Reynolds — building relationship
    { leadIndex: 1, type: 'call_logged', summary: 'Initial consultation. Relocating from NYC, needs home office + guest suite. Timeline is flexible but wants to close by summer.', daysAgo: 8 },
    { leadIndex: 1, type: 'email_logged', summary: 'Sent Greenwich/Darien neighborhood guide with school ratings and commute times.', daysAgo: 5 },
    // Emily Carter — nurturing
    { leadIndex: 2, type: 'call_logged', summary: 'Discussed school districts. Wants Saxon Academy area. Concerned about inventory levels. First-time buyer, needs hand-holding on process.', daysAgo: 12 },
    { leadIndex: 2, type: 'text_logged', summary: 'Quick check-in. Said still looking but not ready to commit yet. Suggested school district tour next week.', daysAgo: 4 },
    // Michael Quinn — won deal
    { leadIndex: 3, type: 'call_logged', summary: 'Offer accepted on 442 Riverside! Sale price $485K. Buyer thrilled with walkability score. Inspection scheduled for next Tuesday.', daysAgo: 20 },
    { leadIndex: 3, type: 'email_logged', summary: 'Sent closing timeline and document checklist. Connected with mortgage broker for final approval.', daysAgo: 15 },
    { leadIndex: 3, type: 'call_logged', summary: 'Final walkthrough completed. Everything looks good. Closing scheduled for Friday at 2pm.', daysAgo: 6 },
    // Lauren Diaz — investor conversations
    { leadIndex: 6, type: 'call_logged', summary: 'Reviewed rental market data for Norwalk. Cap rates around 5.2%. Interested in multi-family under $700K. Has financing pre-approved for investment properties.', daysAgo: 7 },
    { leadIndex: 6, type: 'email_logged', summary: 'Sent cash-flow projections for 3 multi-family listings. Highlighted Seaview Avenue as best ROI.', daysAgo: 3 },
    // Ryan Coleman — seller lead
    { leadIndex: 5, type: 'call_logged', summary: 'Discussed listing strategy for Pine Meadow Court. Home in excellent condition. Comparable sales suggest $950K-$1.05M listing price.', daysAgo: 6 },
    // Anthony Russo — early stage
    { leadIndex: 7, type: 'call_logged', summary: 'First call. Looking for homes with in-law suite or finished basement. Has aging parents who may move in. Budget around $600K-$900K.', daysAgo: 14 },
  ];

  for (const log of contactLogs) {
    const lead = mockLeads[log.leadIndex];
    if (!lead) continue;

    await createActivityForTenant(tenantId, {
      activityType: log.type,
      summary: log.summary,
      leadId: lead.id,
      contactId: lead.contactId ?? null,
      occurredAt: daysAgo(log.daysAgo),
    });
  }
}

// ── Transactions ──

async function seedMockTransactions(tenantId: string): Promise<void> {
  const existing = await listTransactionsForTenant(tenantId);
  if (existing.transactions.length > 0) return;

  const mockLeads = await listLeadsByTenantId(tenantId, { source: MOCK_SOURCE, limit: 200 });

  // Transaction 1: Michael Quinn's closed deal (won lead)
  const quinnLead = mockLeads.find((l) => l.listingAddress?.includes('Riverside'));
  const txn1 = await createTransactionForTenant(tenantId, {
    leadId: quinnLead?.id ?? null,
    contactId: quinnLead?.contactId ?? null,
    propertyAddress: '442 Riverside Boulevard, Westport, CT 06880',
    status: 'closing',
    side: 'buyer',
    listPrice: 499000,
    salePrice: 485000,
    contractDate: daysAgo(25),
    inspectionDate: daysAgo(18),
    appraisalDate: daysAgo(12),
    titleDate: daysAgo(7),
    closingDate: daysFromNow(3),
    notes: 'Smooth transaction. Buyer very happy with property condition. Inspection came back clean.',
  });

  await addTransactionParty(tenantId, txn1.id, { role: 'buyer', name: 'Michael Quinn', email: 'michael.quinn@example.com', phone: '(203) 555-0104' });
  await addTransactionParty(tenantId, txn1.id, { role: 'buyer_agent', name: 'Matt Caiola', email: 'matt@caiolarealtygroup.com', phone: '(203) 555-0001' });
  await addTransactionParty(tenantId, txn1.id, { role: 'seller_agent', name: 'Jennifer Walsh', email: 'j.walsh@kw.com', phone: '(203) 555-0200' });
  await addTransactionParty(tenantId, txn1.id, { role: 'lender', name: 'First National Mortgage', email: 'loans@fnmortgage.com', phone: '(203) 555-0300', company: 'First National Mortgage' });
  await addTransactionParty(tenantId, txn1.id, { role: 'attorney', name: 'Robert Chen, Esq.', email: 'rchen@chenlaw.com', phone: '(203) 555-0400', company: 'Chen & Associates' });

  await addTransactionMilestone(tenantId, txn1.id, { milestoneType: 'contract_signed', scheduledAt: daysAgo(25), completedAt: daysAgo(25) });
  await addTransactionMilestone(tenantId, txn1.id, { milestoneType: 'earnest_money_deposited', scheduledAt: daysAgo(23), completedAt: daysAgo(23) });
  await addTransactionMilestone(tenantId, txn1.id, { milestoneType: 'inspection_scheduled', scheduledAt: daysAgo(20), completedAt: daysAgo(20) });
  await addTransactionMilestone(tenantId, txn1.id, { milestoneType: 'inspection_completed', scheduledAt: daysAgo(18), completedAt: daysAgo(18) });
  await addTransactionMilestone(tenantId, txn1.id, { milestoneType: 'appraisal_ordered', scheduledAt: daysAgo(16), completedAt: daysAgo(16) });
  await addTransactionMilestone(tenantId, txn1.id, { milestoneType: 'appraisal_completed', scheduledAt: daysAgo(12), completedAt: daysAgo(12) });
  await addTransactionMilestone(tenantId, txn1.id, { milestoneType: 'loan_approval', scheduledAt: daysAgo(8), completedAt: daysAgo(8) });
  await addTransactionMilestone(tenantId, txn1.id, { milestoneType: 'title_search', scheduledAt: daysAgo(10), completedAt: daysAgo(7) });
  await addTransactionMilestone(tenantId, txn1.id, { milestoneType: 'title_cleared', scheduledAt: daysAgo(5), completedAt: daysAgo(5) });
  await addTransactionMilestone(tenantId, txn1.id, { milestoneType: 'final_walkthrough', scheduledAt: daysFromNow(2) });
  await addTransactionMilestone(tenantId, txn1.id, { milestoneType: 'closing_scheduled', scheduledAt: daysFromNow(3) });

  // Transaction 2: Sarah Mitchell's active deal — under contract, early stage
  const sarahLead = mockLeads.find((l) => l.listingAddress?.includes('Harbor Road'));
  const txn2 = await createTransactionForTenant(tenantId, {
    leadId: sarahLead?.id ?? null,
    contactId: sarahLead?.contactId ?? null,
    propertyAddress: '99 Waterfront Way, Stamford, CT 06902',
    status: 'inspection',
    side: 'buyer',
    listPrice: 875000,
    salePrice: 850000,
    contractDate: daysAgo(7),
    inspectionDate: daysFromNow(2),
    closingDate: daysFromNow(45),
    notes: 'Offer accepted after second round. Seller countered at $860K, settled at $850K.',
  });

  await addTransactionParty(tenantId, txn2.id, { role: 'buyer', name: 'Sarah Mitchell', email: 'sarah.mitchell@example.com', phone: '(203) 555-0101' });
  await addTransactionParty(tenantId, txn2.id, { role: 'buyer_agent', name: 'Matt Caiola', email: 'matt@caiolarealtygroup.com', phone: '(203) 555-0001' });
  await addTransactionParty(tenantId, txn2.id, { role: 'seller_agent', name: 'Patricia Holmes', email: 'p.holmes@compass.com', phone: '(203) 555-0210' });

  await addTransactionMilestone(tenantId, txn2.id, { milestoneType: 'contract_signed', scheduledAt: daysAgo(7), completedAt: daysAgo(7) });
  await addTransactionMilestone(tenantId, txn2.id, { milestoneType: 'earnest_money_deposited', scheduledAt: daysAgo(5), completedAt: daysAgo(5) });
  await addTransactionMilestone(tenantId, txn2.id, { milestoneType: 'inspection_scheduled', scheduledAt: daysFromNow(2) });
  await addTransactionMilestone(tenantId, txn2.id, { milestoneType: 'appraisal_ordered', scheduledAt: daysFromNow(10) });
  await addTransactionMilestone(tenantId, txn2.id, { milestoneType: 'closing_scheduled', scheduledAt: daysFromNow(45) });

  // Transaction 3: David Reynolds — luxury listing, appraisal stage
  const davidLead = mockLeads.find((l) => l.listingAddress?.includes('Shoreline'));
  const txn3 = await createTransactionForTenant(tenantId, {
    leadId: davidLead?.id ?? null,
    contactId: davidLead?.contactId ?? null,
    propertyAddress: '77 Ridge Road, Darien, CT 06820',
    status: 'appraisal',
    side: 'buyer',
    listPrice: 1650000,
    salePrice: 1590000,
    contractDate: daysAgo(18),
    inspectionDate: daysAgo(10),
    appraisalDate: daysFromNow(5),
    closingDate: daysFromNow(30),
    notes: 'High-value luxury purchase. Inspection found minor roof issues — seller agreed to $15K credit.',
  });

  await addTransactionParty(tenantId, txn3.id, { role: 'buyer', name: 'David Reynolds', email: 'david.reynolds@example.com', phone: '(203) 555-0102' });
  await addTransactionParty(tenantId, txn3.id, { role: 'buyer_agent', name: 'Matt Caiola', email: 'matt@caiolarealtygroup.com', phone: '(203) 555-0001' });
  await addTransactionParty(tenantId, txn3.id, { role: 'seller', name: 'Margaret & Harold Greene', email: 'greene.family@gmail.com', phone: '(203) 555-0220' });
  await addTransactionParty(tenantId, txn3.id, { role: 'lender', name: 'Wells Fargo Private Client', email: 'private.lending@wellsfargo.com', phone: '(800) 555-0500', company: 'Wells Fargo' });

  await addTransactionMilestone(tenantId, txn3.id, { milestoneType: 'contract_signed', scheduledAt: daysAgo(18), completedAt: daysAgo(18) });
  await addTransactionMilestone(tenantId, txn3.id, { milestoneType: 'earnest_money_deposited', scheduledAt: daysAgo(16), completedAt: daysAgo(16) });
  await addTransactionMilestone(tenantId, txn3.id, { milestoneType: 'inspection_completed', scheduledAt: daysAgo(10), completedAt: daysAgo(10) });
  await addTransactionMilestone(tenantId, txn3.id, { milestoneType: 'appraisal_ordered', scheduledAt: daysAgo(8), completedAt: daysAgo(8) });
  await addTransactionMilestone(tenantId, txn3.id, { milestoneType: 'appraisal_completed', scheduledAt: daysFromNow(5) });
  await addTransactionMilestone(tenantId, txn3.id, { milestoneType: 'closing_scheduled', scheduledAt: daysFromNow(30) });

  // Transaction 4: Ryan Coleman — seller-side listing, just listed
  const ryanLead = mockLeads.find((l) => l.listingAddress?.includes('Pine Meadow'));
  const txn4 = await createTransactionForTenant(tenantId, {
    leadId: ryanLead?.id ?? null,
    contactId: ryanLead?.contactId ?? null,
    propertyAddress: '76 Pine Meadow Court, Darien, CT 06820',
    status: 'under_contract',
    side: 'seller',
    listPrice: 1050000,
    salePrice: 1020000,
    contractDate: daysAgo(3),
    inspectionDate: daysFromNow(7),
    closingDate: daysFromNow(60),
    notes: 'Listing agent side. Multiple offers received — went with strongest terms (conventional, 20% down, flexible close).',
  });

  await addTransactionParty(tenantId, txn4.id, { role: 'seller', name: 'Ryan & Maria Coleman', email: 'ryan.coleman@example.com', phone: '(203) 555-0106' });
  await addTransactionParty(tenantId, txn4.id, { role: 'seller_agent', name: 'Matt Caiola', email: 'matt@caiolarealtygroup.com', phone: '(203) 555-0001' });
  await addTransactionParty(tenantId, txn4.id, { role: 'buyer_agent', name: 'Thomas Park', email: 't.park@sothebys.com', phone: '(203) 555-0230' });

  await addTransactionMilestone(tenantId, txn4.id, { milestoneType: 'contract_signed', scheduledAt: daysAgo(3), completedAt: daysAgo(3) });
  await addTransactionMilestone(tenantId, txn4.id, { milestoneType: 'earnest_money_deposited', scheduledAt: daysFromNow(1) });
  await addTransactionMilestone(tenantId, txn4.id, { milestoneType: 'inspection_scheduled', scheduledAt: daysFromNow(7) });

  // Transaction 5: A completed/closed historical deal
  const txn5 = await createTransactionForTenant(tenantId, {
    propertyAddress: '310 Meadow Court, Wilton, CT 06897',
    status: 'closed',
    side: 'buyer',
    listPrice: 1125000,
    salePrice: 1095000,
    contractDate: daysAgo(90),
    inspectionDate: daysAgo(82),
    appraisalDate: daysAgo(70),
    titleDate: daysAgo(50),
    closingDate: daysAgo(45),
    notes: 'Closed deal. Buyer was a relocation from Boston. Smooth transaction with no contingency issues.',
  });

  await addTransactionParty(tenantId, txn5.id, { role: 'buyer', name: 'Catherine & James Liu', email: 'liu.family@gmail.com', phone: '(617) 555-0900' });
  await addTransactionParty(tenantId, txn5.id, { role: 'buyer_agent', name: 'Matt Caiola', email: 'matt@caiolarealtygroup.com', phone: '(203) 555-0001' });

  await addTransactionMilestone(tenantId, txn5.id, { milestoneType: 'contract_signed', scheduledAt: daysAgo(90), completedAt: daysAgo(90) });
  await addTransactionMilestone(tenantId, txn5.id, { milestoneType: 'inspection_completed', scheduledAt: daysAgo(82), completedAt: daysAgo(82) });
  await addTransactionMilestone(tenantId, txn5.id, { milestoneType: 'appraisal_completed', scheduledAt: daysAgo(70), completedAt: daysAgo(70) });
  await addTransactionMilestone(tenantId, txn5.id, { milestoneType: 'loan_approval', scheduledAt: daysAgo(55), completedAt: daysAgo(55) });
  await addTransactionMilestone(tenantId, txn5.id, { milestoneType: 'title_cleared', scheduledAt: daysAgo(50), completedAt: daysAgo(50) });
  await addTransactionMilestone(tenantId, txn5.id, { milestoneType: 'closing_completed', scheduledAt: daysAgo(45), completedAt: daysAgo(45) });
  await addTransactionMilestone(tenantId, txn5.id, { milestoneType: 'possession_transferred', scheduledAt: daysAgo(44), completedAt: daysAgo(44) });
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

  // eslint-disable-next-line no-console
  console.log('[crm-mock-seed] Seeding events & leads...');
  await seedMockEvents(tenantRecord);
  await seedMockContacts(tenantRecord.tenantId);
  await updateMockLeadStatuses(tenantRecord.tenantId);

  // eslint-disable-next-line no-console
  console.log('[crm-mock-seed] Enriching leads with price ranges, tags, reminders, win/loss...');
  await enrichMockLeads(tenantRecord.tenantId);

  // eslint-disable-next-line no-console
  console.log('[crm-mock-seed] Seeding activities & behavior...');
  await seedMockActivities(tenantRecord.tenantId);
  await seedMockBehaviorActivities(tenantRecord.tenantId);

  // eslint-disable-next-line no-console
  console.log('[crm-mock-seed] Seeding contact history...');
  await seedMockContactHistory(tenantRecord.tenantId);

  // eslint-disable-next-line no-console
  console.log('[crm-mock-seed] Seeding transactions...');
  await seedMockTransactions(tenantRecord.tenantId);

  const [leads, contacts, activities] = await Promise.all([
    listLeadsByTenantId(tenantRecord.tenantId, { limit: 200 }),
    listContactsByTenantId(tenantRecord.tenantId, { limit: 200 }),
    listActivitiesByTenantId(tenantRecord.tenantId, { limit: 500 }),
  ]);
  const txns = await listTransactionsForTenant(tenantRecord.tenantId);

  const mockLeadCount = leads.filter((lead) => lead.source === MOCK_SOURCE).length;
  const mockContactCount = contacts.filter((contact) => contact.source === MOCK_SOURCE).length;

  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      {
        ok: true,
        tenantId: tenantRecord.tenantId,
        tenantDomain: tenantRecord.tenantDomain,
        mockLeadCount,
        mockContactCount,
        totalLeadCount: leads.length,
        totalContactCount: contacts.length,
        totalActivityCount: activities.length,
        totalTransactionCount: txns.transactions.length,
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
