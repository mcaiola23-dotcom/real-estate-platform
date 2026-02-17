import type {
  WebsiteListingInteractionPayload,
  WebsiteSearchPerformedPayload,
} from '@real-estate/types/events';

type TrackableWebsiteEvent =
  | {
      eventType: 'website.search.performed';
      payload: WebsiteSearchPerformedPayload;
    }
  | {
      eventType: 'website.listing.viewed' | 'website.listing.favorited' | 'website.listing.unfavorited';
      payload: WebsiteListingInteractionPayload;
    };

export async function trackWebsiteEvent(event: TrackableWebsiteEvent): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    await fetch('/api/website-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    });
  } catch (error) {
    console.warn('Website event tracking failed:', error);
  }
}

