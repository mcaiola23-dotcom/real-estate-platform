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

export interface WebsiteSearchContext {
  query: string | null;
  filtersJson: string | null;
  sortField: string | null;
  sortOrder: string | null;
  page: number | null;
}

export interface WebsiteActorContext {
  clerkUserId?: string | null;
  sessionId?: string | null;
}

export interface WebsiteListingInteractionPayload {
  source: string;
  listing: {
    id: string;
    address: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
    price: number | null;
    beds: number | null;
    baths: number | null;
    sqft: number | null;
    propertyType: string | null;
  };
  searchContext: WebsiteSearchContext | null;
  actor: WebsiteActorContext | null;
}

export interface WebsiteSearchPerformedPayload {
  source: string;
  searchContext: WebsiteSearchContext;
  resultCount: number | null;
  actor: WebsiteActorContext | null;
}

export type WebsiteLeadSubmittedEvent = DomainEvent<'website.lead.submitted', WebsiteLeadSubmittedPayload>;
export type WebsiteValuationRequestedEvent = DomainEvent<
  'website.valuation.requested',
  WebsiteValuationRequestedPayload
>;
export type WebsiteSearchPerformedEvent = DomainEvent<'website.search.performed', WebsiteSearchPerformedPayload>;
export type WebsiteListingViewedEvent = DomainEvent<'website.listing.viewed', WebsiteListingInteractionPayload>;
export type WebsiteListingFavoritedEvent = DomainEvent<'website.listing.favorited', WebsiteListingInteractionPayload>;
export type WebsiteListingUnfavoritedEvent = DomainEvent<'website.listing.unfavorited', WebsiteListingInteractionPayload>;

export type WebsiteEvent =
  | WebsiteLeadSubmittedEvent
  | WebsiteValuationRequestedEvent
  | WebsiteSearchPerformedEvent
  | WebsiteListingViewedEvent
  | WebsiteListingFavoritedEvent
  | WebsiteListingUnfavoritedEvent;
