import type { CrmLeadType, CrmLeadStatus } from '@real-estate/types/crm';

const LEAD_TYPE_LABELS: Record<CrmLeadType, string> = {
  buyer: 'Buyer',
  seller: 'Seller',
  investor: 'Investor',
  renter: 'Renter',
  other: 'Other',
  website_lead: 'Website Lead',
  valuation_request: 'Valuation Request',
};

const SOURCE_LABELS: Record<string, string> = {
  website: 'Website',
  website_valuation: 'Valuation Request',
  crm_manual: 'CRM Manual',
  csv_import: 'CSV Import',
};

const ACTIVITY_LABELS: Record<string, string> = {
  lead_submitted: 'Lead Submitted',
  valuation_requested: 'Valuation Requested',
  website_search_performed: 'Website Search',
  website_listing_viewed: 'Listing Viewed',
  website_listing_favorited: 'Listing Favorited',
  website_listing_unfavorited: 'Listing Unfavorited',
  lead_status_changed: 'Status Updated',
  note: 'Note',
  call_logged: 'Call Logged',
  text_logged: 'Text Logged',
  email_logged: 'Email Logged',
  email_sent: 'Email Sent',
  showing_scheduled: 'Showing Scheduled',
};

export function formatLeadTypeLabel(leadType: CrmLeadType): string {
  return LEAD_TYPE_LABELS[leadType] ?? leadType;
}

export function formatLeadSourceLabel(source: string): string {
  return SOURCE_LABELS[source] ?? source;
}

export function formatLeadStatusLabel(status: CrmLeadStatus): string {
  return status.slice(0, 1).toUpperCase() + status.slice(1);
}

export function formatActivityTypeLabel(activityType: string): string {
  return ACTIVITY_LABELS[activityType] ?? activityType;
}

export function getLeadTypeColorClass(leadType: string): string {
  switch (leadType) {
    case 'buyer': return 'crm-lead-type-buyer';
    case 'seller': return 'crm-lead-type-seller';
    case 'renter': return 'crm-lead-type-renter';
    case 'investor': return 'crm-lead-type-investor';
    default: return 'crm-lead-type-other';
  }
}

const TIMEFRAME_LABELS: Record<string, string> = {
  now: 'Now / ASAP',
  '30_days': 'Within 30 days',
  '1_3_months': '1–3 months',
  '3_6_months': '3–6 months',
  '6_12_months': '6–12 months',
  '1_year_plus': '1 year+',
};

export function formatTimeframeLabel(value: string): string {
  return TIMEFRAME_LABELS[value] ?? value;
}

export function formatPropertyTypeLabels(csv: string | null): string[] {
  if (!csv) return [];
  const LABELS: Record<string, string> = {
    'single-family': 'Single Family',
    'condo': 'Condo / Townhome',
    'multi-family': 'Multifamily',
    'commercial': 'Commercial',
    'rental': 'Rental',
    'other': 'Other',
  };
  return csv.split(',').map((t) => t.trim()).filter(Boolean).map((t) => LABELS[t] ?? t);
}
