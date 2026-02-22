export type CrmLeadStatus = 'new' | 'qualified' | 'nurturing' | 'won' | 'lost';
export type CrmLeadType = 'website_lead' | 'valuation_request';

export interface CrmContact {
  id: string;
  tenantId: string;
  fullName: string | null;
  email: string | null;
  emailNormalized: string | null;
  phone: string | null;
  phoneNormalized: string | null;
  source: string;
  createdAt: string;
  updatedAt: string;
}

export interface CrmLead {
  id: string;
  tenantId: string;
  contactId: string | null;
  status: CrmLeadStatus;
  leadType: CrmLeadType;
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
  lastContactAt: string | null;
  nextActionAt: string | null;
  nextActionNote: string | null;
  priceMin: number | null;
  priceMax: number | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CrmActivity {
  id: string;
  tenantId: string;
  contactId: string | null;
  leadId: string | null;
  activityType: string;
  occurredAt: string;
  summary: string;
  metadataJson: string | null;
  createdAt: string;
}

export interface CrmLeadIngestionSummary {
  tenantId: string;
  contactCount: number;
  leadCount: number;
  activityCount: number;
}

export interface CrmPagination {
  limit: number;
  offset: number;
  nextOffset: number | null;
}

export interface CrmLeadListQuery {
  status?: CrmLeadStatus;
  leadType?: CrmLeadType;
  source?: string;
  contactId?: string;
  tag?: string;
  limit?: number;
  offset?: number;
}

export interface CrmContactListQuery {
  source?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface CrmActivityListQuery {
  leadId?: string;
  contactId?: string;
  activityType?: string;
  limit?: number;
  offset?: number;
}
