import type { CrmLeadType, CrmLeadStatus } from '@real-estate/types/crm';

const LEAD_TYPE_LABELS: Record<CrmLeadType, string> = {
  website_lead: 'Website Lead',
  valuation_request: 'Valuation Request',
};

const SOURCE_LABELS: Record<string, string> = {
  website: 'Website',
  website_valuation: 'Valuation Request',
  crm_manual: 'CRM Manual',
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
