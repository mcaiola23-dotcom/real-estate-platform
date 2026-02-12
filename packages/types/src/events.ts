import type { TenantContext } from './tenant';

export type DomainEventVersion = 1;

export type TenantEventContext = Pick<TenantContext, 'tenantId' | 'tenantSlug' | 'tenantDomain'>;

export interface DomainEvent<TEventType extends string, TPayload> {
  eventType: TEventType;
  version: DomainEventVersion;
  occurredAt: string;
  tenant: TenantEventContext;
  payload: TPayload;
}

export type PropertyType = 'single-family' | 'condo' | 'multi-family';

export interface WebsiteLeadSubmittedPayload {
  source: string;
  contact: {
    name: string | null;
    email: string;
    phone: string;
  };
  timeframe: string | null;
  message: string | null;
  listing: {
    id: string | null;
    url: string | null;
    address: string | null;
  };
  propertyDetails: {
    propertyType: PropertyType;
    beds: number;
    baths: number;
    sqft: number | null;
  } | null;
}

export interface WebsiteValuationRequestedPayload {
  address: string;
  propertyType: PropertyType;
  beds: number;
  baths: number;
  sqft: number | null;
}

export type WebsiteLeadSubmittedEvent = DomainEvent<'website.lead.submitted', WebsiteLeadSubmittedPayload>;
export type WebsiteValuationRequestedEvent = DomainEvent<
  'website.valuation.requested',
  WebsiteValuationRequestedPayload
>;
