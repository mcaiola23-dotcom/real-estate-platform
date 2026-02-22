import type { CrmActivity, CrmContact, CrmLead } from '@real-estate/types/crm';
import type {
  LeadDraft,
  LeadListingSignal,
  LeadSearchSignal,
  LeadSourceFilter,
  LeadStatusFilter,
  LeadTypeFilter,
} from './crm-types';
import { ALL_LEAD_TYPE_FILTER, ALL_SOURCE_FILTER, ALL_STATUS_FILTER } from './crm-types';

function parseMetadataJson(metadataJson: string | null): Record<string, unknown> | null {
  if (!metadataJson) {
    return null;
  }

  try {
    const parsed = JSON.parse(metadataJson) as unknown;
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

function readObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  return value as Record<string, unknown>;
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function readNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function summarizeFilters(filtersJson: unknown): string | null {
  if (typeof filtersJson !== 'string') {
    return null;
  }

  try {
    const parsed = JSON.parse(filtersJson) as Record<string, unknown>;
    const entries = Object.entries(parsed)
      .filter(([, value]) => value !== null && value !== '' && value !== undefined)
      .slice(0, 3)
      .map(([key, value]) => `${key}: ${String(value)}`);
    return entries.length > 0 ? entries.join(', ') : 'No filters';
  } catch {
    return null;
  }
}

export function extractLeadSearchSignal(activity: CrmActivity): LeadSearchSignal | null {
  if (activity.activityType !== 'website_search_performed') {
    return null;
  }

  const metadata = parseMetadataJson(activity.metadataJson);
  if (!metadata) {
    return null;
  }

  const searchContext = readObject(metadata.searchContext);

  return {
    id: activity.id,
    occurredAt: activity.occurredAt,
    query: readString(searchContext?.query ?? null),
    filterSummary: summarizeFilters(searchContext?.filtersJson),
    resultCount: readNumber(metadata.resultCount),
    source: readString(metadata.source),
  };
}

export function extractLeadListingSignal(activity: CrmActivity): LeadListingSignal | null {
  let action: LeadListingSignal['action'];
  if (activity.activityType === 'website_listing_viewed') {
    action = 'viewed';
  } else if (activity.activityType === 'website_listing_favorited') {
    action = 'favorited';
  } else if (activity.activityType === 'website_listing_unfavorited') {
    action = 'unfavorited';
  } else {
    return null;
  }

  const metadata = parseMetadataJson(activity.metadataJson);
  if (!metadata) {
    return null;
  }

  const listing = readObject(metadata.listing);

  return {
    id: activity.id,
    occurredAt: activity.occurredAt,
    action,
    address: readString(listing?.address ?? null),
    price: readNumber(listing?.price),
    beds: readNumber(listing?.beds),
    baths: readNumber(listing?.baths),
    sqft: readNumber(listing?.sqft),
    source: readString(metadata.source),
  };
}

export function matchesLeadFilters(
  lead: CrmLead,
  search: string,
  statusFilter: LeadStatusFilter,
  sourceFilter: LeadSourceFilter,
  leadTypeFilter: LeadTypeFilter,
  contactById: Map<string, CrmContact>,
  draft: LeadDraft
) {
  if (statusFilter !== ALL_STATUS_FILTER && draft.status !== statusFilter) {
    return false;
  }

  if (sourceFilter !== ALL_SOURCE_FILTER && lead.source !== sourceFilter) {
    return false;
  }

  if (leadTypeFilter !== ALL_LEAD_TYPE_FILTER && lead.leadType !== leadTypeFilter) {
    return false;
  }

  if (!search) {
    return true;
  }

  const linkedContact = lead.contactId ? contactById.get(lead.contactId) : null;
  const haystack = [
    draft.listingAddress,
    lead.listingId,
    lead.listingUrl,
    lead.source,
    draft.propertyType,
    draft.timeframe,
    draft.notes,
    linkedContact?.fullName,
    linkedContact?.email,
    linkedContact?.phone,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return haystack.includes(search);
}
