export type CrmLeadStatus = 'new' | 'qualified' | 'nurturing' | 'won' | 'lost';
export type CrmLeadType = 'buyer' | 'seller' | 'investor' | 'renter' | 'other' | 'website_lead' | 'valuation_request';

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
  nextActionChannel: string | null;
  reminderSnoozedUntil: string | null;
  priceMin: number | null;
  priceMax: number | null;
  tags: string[];
  closeReason: string | null;
  closeNotes: string | null;
  closedAt: string | null;
  acreage: number | null;
  town: string | null;
  neighborhood: string | null;
  houseStyle: string | null;
  preferenceNotes: string | null;
  assignedTo: string | null;
  referredBy: string | null;
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

export interface CrmShowing {
  id: string;
  tenantId: string;
  leadId: string | null;
  contactId: string | null;
  propertyAddress: string;
  scheduledAt: string;
  duration: number | null;
  status: string;
  notes: string | null;
  calendarEventId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CrmShowingListQuery {
  leadId?: string;
  status?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

export interface CrmCommissionSetting {
  id: string;
  tenantId: string;
  defaultCommPct: number;
  brokerageSplitPct: number;
  marketingFee: number;
  referralFee: number;
  createdAt: string;
  updatedAt: string;
}

export interface CrmCommission {
  id: string;
  tenantId: string;
  transactionId: string;
  leadId: string | null;
  salePrice: number;
  commPct: number;
  brokerageSplitPct: number;
  marketingFees: number;
  referralFees: number;
  netAmount: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CrmCampaign {
  id: string;
  tenantId: string;
  name: string;
  status: string;
  stepsJson: string;
  createdAt: string;
  updatedAt: string;
}

export interface CrmCampaignEnrollment {
  id: string;
  tenantId: string;
  campaignId: string;
  leadId: string;
  currentStep: number;
  status: string;
  nextSendAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CrmAdSpend {
  id: string;
  tenantId: string;
  platform: string;
  amount: number;
  startDate: string;
  endDate: string;
  notes: string | null;
  createdAt: string;
}

export interface CrmTeamMember {
  id: string;
  tenantId: string;
  name: string;
  email: string | null;
  role: string;
  isActive: boolean;
  leadCap: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CrmESignatureRequest {
  id: string;
  tenantId: string;
  transactionId: string | null;
  documentName: string;
  recipientEmail: string;
  status: string;
  sentAt: string | null;
  signedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
