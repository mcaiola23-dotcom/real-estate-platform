import type { CrmContact, CrmLead, CrmLeadStatus } from '@real-estate/types/crm';
import type { LeadDraft } from './crm-types';

export function formatDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatTimeAgo(value: string) {
  const elapsed = Date.now() - new Date(value).getTime();
  const minute = 60_000;
  const hour = minute * 60;
  const day = hour * 24;

  if (elapsed < hour) {
    const minutes = Math.max(1, Math.floor(elapsed / minute));
    return `${minutes}m ago`;
  }

  if (elapsed < day) {
    return `${Math.floor(elapsed / hour)}h ago`;
  }

  return `${Math.floor(elapsed / day)}d ago`;
}

export function normalizeOptionalNotes(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? '';
  return trimmed.length > 0 ? trimmed : null;
}

export function normalizeOptionalString(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? '';
  return trimmed.length > 0 ? trimmed : null;
}

export function buildLeadDraft(lead: CrmLead): LeadDraft {
  return {
    status: lead.status,
    notes: lead.notes ?? '',
    timeframe: lead.timeframe ?? '',
    listingAddress: lead.listingAddress ?? '',
    propertyType: lead.propertyType ?? '',
    beds: lead.beds === null ? '' : String(lead.beds),
    baths: lead.baths === null ? '' : String(lead.baths),
    sqft: lead.sqft === null ? '' : String(lead.sqft),
    nextActionAt: lead.nextActionAt ?? '',
    nextActionNote: lead.nextActionNote ?? '',
    nextActionChannel: lead.nextActionChannel ?? '',
    reminderSnoozedUntil: lead.reminderSnoozedUntil ?? '',
    priceMin: lead.priceMin === null ? '' : String(lead.priceMin),
    priceMax: lead.priceMax === null ? '' : String(lead.priceMax),
    closeReason: lead.closeReason ?? '',
    closeNotes: lead.closeNotes ?? '',
    assignedTo: lead.assignedTo ?? '',
    referredBy: lead.referredBy ?? '',
  };
}

export function parseNullableNumber(value: string): number | null | undefined {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    return undefined;
  }
  return Math.round(parsed);
}

export function getLeadContactLabel(lead: CrmLead, contactById: Map<string, CrmContact>): string {
  if (!lead.contactId) {
    return 'No linked contact';
  }

  const linkedContact = contactById.get(lead.contactId);
  if (!linkedContact) {
    return 'Linked contact';
  }

  return linkedContact.fullName || linkedContact.email || linkedContact.phone || 'Linked contact';
}

export function formatPriceRange(minPrice: number | null, maxPrice: number | null): string {
  if (minPrice === null && maxPrice === null) {
    return '-';
  }

  const formatter = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });

  if (minPrice !== null && maxPrice !== null) {
    if (minPrice === maxPrice) {
      return formatter.format(minPrice);
    }
    return `${formatter.format(minPrice)} - ${formatter.format(maxPrice)}`;
  }

  return formatter.format((minPrice ?? maxPrice) as number);
}

export function getStatusGlyph(status: CrmLeadStatus): string {
  switch (status) {
    case 'new':
      return '★';
    case 'qualified':
      return '✓';
    case 'nurturing':
      return '◎';
    case 'won':
      return '🏆';
    case 'lost':
      return '—';
    default:
      return '•';
  }
}

export function getTimeGreeting(now = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) {
    return 'Good morning';
  }
  if (hour < 17) {
    return 'Good afternoon';
  }
  return 'Good evening';
}

export function passthroughImageLoader({ src }: { src: string }) {
  return src;
}
