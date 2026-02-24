import type { CSSProperties } from 'react';
import type { CrmLead, CrmLeadIngestionSummary, CrmLeadStatus } from '@real-estate/types/crm';
import type { TenantContext } from '@real-estate/types/tenant';

export interface CrmWorkspaceProps {
  tenantContext: TenantContext;
  hasClerkKey: boolean;
  devAuthBypassEnabled: boolean;
  initialSummary: CrmLeadIngestionSummary;
}

export interface WorkspaceToast {
  id: number;
  kind: 'success' | 'error';
  message: string;
}

export interface LeadDraft {
  status: CrmLeadStatus;
  notes: string;
  timeframe: string;
  listingAddress: string;
  propertyType: string;
  beds: string;
  baths: string;
  sqft: string;
  nextActionAt: string;
  nextActionNote: string;
  nextActionChannel: string;
  reminderSnoozedUntil: string;
  priceMin: string;
  priceMax: string;
  closeReason: string;
  closeNotes: string;
  assignedTo: string;
  referredBy: string;
}

export interface ContactDraft {
  fullName: string;
  email: string;
  phone: string;
}

export interface LeadSearchSignal {
  id: string;
  occurredAt: string;
  query: string | null;
  filterSummary: string | null;
  resultCount: number | null;
  source: string | null;
}

export interface LeadListingSignal {
  id: string;
  occurredAt: string;
  action: 'viewed' | 'favorited' | 'unfavorited';
  address: string | null;
  price: number | null;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  source: string | null;
  listingId?: string;
}

export interface LeadSearchSuggestion {
  id: string;
  leadId: string;
  label: string;
  detail: string;
  meta: string;
  status: CrmLeadStatus;
}

export interface LeadBehaviorStats {
  viewedCount: number;
  favoritedCount: number;
  unfavoritedCount: number;
  lastBehaviorAt: string | null;
  minPrice: number | null;
  maxPrice: number | null;
}

export interface BrandPreferences {
  brandName: string;
  accentColor: string;
  surfaceTint: string;
  customLogoUrl: string;
  useWebsiteFavicon: boolean;
  showTexture: boolean;
}

export interface AgentProfile {
  fullName: string;
  email: string;
  phone: string;
  brokerage: string;
  licenseNumber: string;
  headshotUrl: string;
  bio: string;
}

export interface DailyBreakdown {
  date: Date;
  label: string;
  total: number;
  newLeads: number;
  statusChanges: number;
  listingViews: number;
  searches: number;
  favorites: number;
  notes: number;
}

export type ThemeStyleVars = CSSProperties & Record<`--${string}`, string>;

export const LEAD_STATUSES: CrmLeadStatus[] = ['new', 'qualified', 'nurturing', 'won', 'lost'];
export const ALL_STATUS_FILTER = 'all';
export const ALL_SOURCE_FILTER = 'all';
export const ALL_LEAD_TYPE_FILTER = 'all';

export type LeadStatusFilter = CrmLeadStatus | typeof ALL_STATUS_FILTER;
export type LeadSourceFilter = string | typeof ALL_SOURCE_FILTER;
export type LeadTypeFilter = CrmLead['leadType'] | typeof ALL_LEAD_TYPE_FILTER;
