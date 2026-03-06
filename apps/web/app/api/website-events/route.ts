import { auth } from '@clerk/nextjs/server';
import { enqueueWebsiteEvent } from '@real-estate/db/crm';
import type {
  WebsiteEvent,
  WebsiteListingInteractionPayload,
  WebsiteSearchPerformedPayload,
} from '@real-estate/types/events';
import { NextResponse } from 'next/server';

import {
  enforceWebsiteApiGuard,
  readJsonBodyWithLimit,
} from '../../lib/api-security';
import { getTenantContextFromRequest } from '../../lib/tenant/resolve-tenant';
import { WebsiteEventRequestSchema } from '../../lib/validators';

type TrackableEventType =
  | 'website.search.performed'
  | 'website.listing.viewed'
  | 'website.listing.favorited'
  | 'website.listing.unfavorited';

type TrackableWebsiteEvent = Extract<WebsiteEvent, { eventType: TrackableEventType }>;

const WEBSITE_EVENTS_ROUTE_POLICY = {
  routeId: 'website-events',
  maxRequests: 120,
  windowMs: 60_000,
  maxBodyBytes: 24_576,
} as const;

function withSearchActor(
  payload: WebsiteSearchPerformedPayload,
  clerkUserId: string | null
): WebsiteSearchPerformedPayload {
  return {
    ...payload,
    actor: {
      ...(payload.actor ?? {}),
      clerkUserId: clerkUserId ?? payload.actor?.clerkUserId ?? null,
    },
  };
}

function withListingActor(
  payload: WebsiteListingInteractionPayload,
  clerkUserId: string | null
): WebsiteListingInteractionPayload {
  return {
    ...payload,
    actor: {
      ...(payload.actor ?? {}),
      clerkUserId: clerkUserId ?? payload.actor?.clerkUserId ?? null,
    },
  };
}

export async function POST(request: Request) {
  try {
    const guardResponse = enforceWebsiteApiGuard(request, WEBSITE_EVENTS_ROUTE_POLICY);
    if (guardResponse) {
      return guardResponse;
    }

    const bodyResult = await readJsonBodyWithLimit(request, WEBSITE_EVENTS_ROUTE_POLICY.maxBodyBytes);
    if (!bodyResult.ok) {
      return bodyResult.response;
    }

    const validationResult = WebsiteEventRequestSchema.safeParse(bodyResult.body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Invalid event payload.',
          issues: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { eventType, payload } = validationResult.data;
    const { userId } = await auth();
    const tenantContext = await getTenantContextFromRequest(request);
    const occurredAt = new Date().toISOString();

    const tenant = {
      tenantId: tenantContext.tenantId,
      tenantSlug: tenantContext.tenantSlug,
      tenantDomain: tenantContext.tenantDomain,
    };

    let event: TrackableWebsiteEvent;
    if (eventType === 'website.search.performed') {
      const payloadWithActor = withSearchActor(payload, userId ?? null);
      event = {
        eventType: 'website.search.performed',
        version: 1,
        occurredAt,
        tenant,
        payload: payloadWithActor,
      };
    } else if (eventType === 'website.listing.viewed') {
      const payloadWithActor = withListingActor(payload, userId ?? null);
      event = {
        eventType: 'website.listing.viewed',
        version: 1,
        occurredAt,
        tenant,
        payload: payloadWithActor,
      };
    } else if (eventType === 'website.listing.favorited') {
      const payloadWithActor = withListingActor(payload, userId ?? null);
      event = {
        eventType: 'website.listing.favorited',
        version: 1,
        occurredAt,
        tenant,
        payload: payloadWithActor,
      };
    } else {
      const payloadWithActor = withListingActor(payload, userId ?? null);
      event = {
        eventType: 'website.listing.unfavorited',
        version: 1,
        occurredAt,
        tenant,
        payload: payloadWithActor,
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
