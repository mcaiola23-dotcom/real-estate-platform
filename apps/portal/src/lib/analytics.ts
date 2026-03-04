/**
 * Analytics utility for SmartMLS AI Platform
 * 
 * Provides typed event tracking for the core user funnel:
 * - search_performed: User performs a property search
 * - ai_search_performed: User performs an AI natural language search
 * - listing_opened: User opens a listing detail modal
 * - parcel_opened: User opens an off-market parcel detail modal
 * - cta_clicked: User clicks a lead generation CTA
 * - lead_submitted: User successfully submits a lead form
 */

import posthog from 'posthog-js'

/**
 * Core funnel events for the SmartMLS AI Platform
 */
export type AnalyticsEvent =
    | 'search_performed'
    | 'ai_search_performed'
    | 'listing_opened'
    | 'parcel_opened'
    | 'cta_clicked'
    | 'lead_submitted'
    | 'page_view'

/**
 * Event properties for each event type
 */
export interface SearchPerformedProperties {
    query?: string
    filter_count?: number
    result_count?: number
    filter_hash?: string
    cities?: string[]
    property_types?: string[]
    price_min?: number
    price_max?: number
}

export interface AISearchPerformedProperties {
    query: string
    parsed_filters?: Record<string, unknown>
    result_count?: number
}

export interface ListingOpenedProperties {
    listing_id: number | string
    listing_id_str?: string
    source: 'search' | 'map' | 'card' | 'direct'
    city?: string
    price?: number
}

export interface ParcelOpenedProperties {
    parcel_id: string
    has_listing: boolean
    source: 'map' | 'search' | 'direct'
    city?: string
}

export interface CTAClickedProperties {
    cta_type: 'request_info' | 'schedule_tour' | 'ask_question' | 'get_valuation' | 'contact_agent'
    location: 'listing_modal' | 'parcel_modal' | 'card' | 'header' | 'hero'
    listing_id?: number | string
    parcel_id?: string
}

export interface LeadSubmittedProperties {
    intent: string
    source: string
    listing_id?: number | string
    parcel_id?: string
    has_phone?: boolean
    has_message?: boolean
}

type EventProperties =
    | SearchPerformedProperties
    | AISearchPerformedProperties
    | ListingOpenedProperties
    | ParcelOpenedProperties
    | CTAClickedProperties
    | LeadSubmittedProperties
    | Record<string, unknown>

/**
 * Track an analytics event
 * 
 * @param event - The event name from the AnalyticsEvent type
 * @param properties - Event-specific properties for segmentation
 */
export function trackEvent(event: AnalyticsEvent, properties?: EventProperties): void {
    // Check if PostHog is initialized
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
        posthog.capture(event, {
            ...properties,
            // Add common properties
            timestamp: new Date().toISOString(),
            page_url: window.location.href,
            page_path: window.location.pathname,
        })
    }

    // Also log to console in development for debugging
    if (process.env.NODE_ENV === 'development') {
        console.log(`[Analytics] ${event}`, properties)
    }
}

/**
 * Identify a user (for when we add authentication)
 */
export function identifyUser(userId: string, traits?: Record<string, unknown>): void {
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
        posthog.identify(userId, traits)
    }
}

/**
 * Reset user identity (e.g., on logout)
 */
export function resetUser(): void {
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
        posthog.reset()
    }
}

// Convenience functions for common events

export function trackSearch(properties: SearchPerformedProperties): void {
    trackEvent('search_performed', properties)
}

export function trackAISearch(properties: AISearchPerformedProperties): void {
    trackEvent('ai_search_performed', properties)
}

export function trackListingOpened(properties: ListingOpenedProperties): void {
    trackEvent('listing_opened', properties)
}

export function trackParcelOpened(properties: ParcelOpenedProperties): void {
    trackEvent('parcel_opened', properties)
}

export function trackCTAClicked(properties: CTAClickedProperties): void {
    trackEvent('cta_clicked', properties)
}

export function trackLeadSubmitted(properties: LeadSubmittedProperties): void {
    trackEvent('lead_submitted', properties)
}
