import { auth } from '@clerk/nextjs/server';
import { enqueueWebsiteEvent } from '@real-estate/db/crm';
import type {
  WebsiteEvent,
  WebsiteListingInteractionPayload,
  WebsiteSearchPerformedPayload,
} from '@real-estate/types/events';
import { NextResponse } from 'next/server';

import { getTenantContextFromRequest } from '../../lib/tenant/resolve-tenant';

type TrackableEventType =
  | 'website.search.performed'
  | 'website.listing.viewed'
  | 'website.listing.favorited'
  | 'website.listing.unfavorited';

interface WebsiteEventRequestBody {
  eventType?: TrackableEventType;
  payload?: WebsiteSearchPerformedPayload | WebsiteListingInteractionPayload;
}

type TrackableWebsiteEvent = Extract<WebsiteEvent, { eventType: TrackableEventType }>;

const TRACKABLE_EVENT_TYPES: Set<TrackableEventType> = new Set([
  'website.search.performed',
  'website.listing.viewed',
  'website.listing.favorited',
  'website.listing.unfavorited',
]);

function isTrackableEventType(value: unknown): value is TrackableEventType {
  return typeof value === 'string' && TRACKABLE_EVENT_TYPES.has(value as TrackableEventType);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as WebsiteEventRequestBody | null;
    if (!body || !isTrackableEventType(body.eventType) || !body.payload) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Invalid event payload.',
        },
        { status: 400 }
      );
    }

    const { userId } = await auth();
    const tenantContext = await getTenantContextFromRequest(request);
    const occurredAt = new Date().toISOString();

    const tenant = {
      tenantId: tenantContext.tenantId,
      tenantSlug: tenantContext.tenantSlug,
      tenantDomain: tenantContext.tenantDomain,
    };

    const payloadWithActor = {
      ...body.payload,
      actor: {
        ...(body.payload.actor ?? {}),
        clerkUserId: userId ?? body.payload.actor?.clerkUserId ?? null,
      },
    };

    let event: TrackableWebsiteEvent;
    if (body.eventType === 'website.search.performed') {
      event = {
        eventType: 'website.search.performed',
        version: 1,
        occurredAt,
        tenant,
        payload: payloadWithActor as WebsiteSearchPerformedPayload,
      };
    } else if (body.eventType === 'website.listing.viewed') {
      event = {
        eventType: 'website.listing.viewed',
        version: 1,
        occurredAt,
        tenant,
        payload: payloadWithActor as WebsiteListingInteractionPayload,
      };
    } else if (body.eventType === 'website.listing.favorited') {
      event = {
        eventType: 'website.listing.favorited',
        version: 1,
        occurredAt,
        tenant,
        payload: payloadWithActor as WebsiteListingInteractionPayload,
      };
    } else {
      event = {
        eventType: 'website.listing.unfavorited',
        version: 1,
        occurredAt,
        tenant,
        payload: payloadWithActor as WebsiteListingInteractionPayload,
      };
    }

    const result = await enqueueWebsiteEvent(event);

    if (!result.accepted) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Event enqueue failed.',
          reason: result.reason,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      duplicate: result.duplicate,
    });
  } catch (error) {
    console.error('Website event tracking route failure', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to process website event.',
      },
      { status: 500 }
    );
  }
}
