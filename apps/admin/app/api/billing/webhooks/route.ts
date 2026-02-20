import { createHmac, timingSafeEqual } from 'node:crypto';

import { NextResponse } from 'next/server';

import { reconcileTenantBillingProviderEvent } from '@real-estate/db/control-plane';
import type {
  TenantBillingPaymentStatus,
  TenantBillingProvider,
  TenantBillingProviderEventInput,
  TenantBillingProviderEventResult,
  TenantBillingSubscriptionStatus,
} from '@real-estate/types/control-plane';
import { buildAuditRequestMetadata, safeWriteAdminAuditLog, writeAdminAuditLog } from '../../lib/admin-access';

interface BillingWebhookRouteDependencies {
  reconcileTenantBillingProviderEvent: typeof reconcileTenantBillingProviderEvent;
  writeAdminAuditLog?: typeof writeAdminAuditLog;
  webhookSecret?: string | null;
  stripeWebhookSecret?: string | null;
  stripeSignatureToleranceSeconds?: number;
}

const defaultDependencies: BillingWebhookRouteDependencies = {
  reconcileTenantBillingProviderEvent,
};

const DEFAULT_STRIPE_SIGNATURE_TOLERANCE_SECONDS = 300;

const STRIPE_STATUS_TO_BILLING_STATUS: Record<string, TenantBillingSubscriptionStatus> = {
  active: 'active',
  canceled: 'canceled',
  incomplete: 'past_due',
  incomplete_expired: 'canceled',
  past_due: 'past_due',
  paused: 'past_due',
  trialing: 'trialing',
  unpaid: 'past_due',
};

const STRIPE_STATUS_TO_PAYMENT_STATUS: Record<string, TenantBillingPaymentStatus> = {
  active: 'paid',
  canceled: 'unpaid',
  incomplete: 'pending',
  incomplete_expired: 'unpaid',
  paid: 'paid',
  past_due: 'past_due',
  pending: 'pending',
  trialing: 'pending',
  unpaid: 'unpaid',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function parseProvider(value: unknown): TenantBillingProvider | null {
  if (value === 'manual' || value === 'stripe') {
    return value;
  }
  return null;
}

function parseOptionalString(value: unknown): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  if (typeof value === 'string') {
    return value;
  }
  return undefined;
}

function parseEventBody(body: Record<string, unknown>): TenantBillingProviderEventInput | null {
  const provider = parseProvider(body.provider);
  if (!provider || typeof body.eventId !== 'string' || typeof body.eventType !== 'string') {
    return null;
  }

  if (provider === 'stripe') {
    return null;
  }

  const subscription =
    body.subscription && typeof body.subscription === 'object' && !Array.isArray(body.subscription)
      ? (body.subscription as TenantBillingProviderEventInput['subscription'])
      : undefined;

  return {
    provider,
    eventId: body.eventId,
    eventType: body.eventType,
    tenantId: typeof body.tenantId === 'string' ? body.tenantId : undefined,
    billingCustomerId: parseOptionalString(body.billingCustomerId),
    billingSubscriptionId: parseOptionalString(body.billingSubscriptionId),
    subscription,
    entitlementFlags: Array.isArray(body.entitlementFlags)
      ? body.entitlementFlags.filter((entry): entry is string => typeof entry === 'string')
      : undefined,
    syncEntitlements: typeof body.syncEntitlements === 'boolean' ? body.syncEntitlements : undefined,
    metadata: body.metadata && typeof body.metadata === 'object' && !Array.isArray(body.metadata)
      ? (body.metadata as Record<string, unknown>)
      : undefined,
  };
}

function isWebhookAuthorized(request: Request, configuredSecret: string | null | undefined): boolean {
  const requiredSecret = configuredSecret?.trim() ?? '';
  if (!requiredSecret) {
    return true;
  }

  const provided = request.headers.get('x-billing-webhook-secret')?.trim() ?? '';
  return provided.length > 0 && provided === requiredSecret;
}

function parseStripeSignatureHeader(headerValue: string): { timestamp: number | null; signatures: string[] } {
  const segments = headerValue
    .split(',')
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);
  let timestamp: number | null = null;
  const signatures: string[] = [];

  for (const segment of segments) {
    const [rawKey, rawValue] = segment.split('=', 2);
    if (!rawKey || !rawValue) {
      continue;
    }
    const key = rawKey.trim();
    const value = rawValue.trim();
    if (!value) {
      continue;
    }
    if (key === 't') {
      const parsed = Number(value);
      if (!Number.isNaN(parsed) && Number.isFinite(parsed)) {
        timestamp = parsed;
      }
      continue;
    }
    if (key === 'v1' && /^[a-fA-F0-9]+$/.test(value)) {
      signatures.push(value.toLowerCase());
    }
  }

  return { timestamp, signatures };
}

function constantTimeHexEquals(expectedHex: string, providedHex: string): boolean {
  if (expectedHex.length !== providedHex.length || expectedHex.length === 0 || expectedHex.length % 2 !== 0) {
    return false;
  }

  try {
    return timingSafeEqual(Buffer.from(expectedHex, 'hex'), Buffer.from(providedHex, 'hex'));
  } catch {
    return false;
  }
}

function verifyStripeWebhookSignature(
  request: Request,
  payload: string,
  configuredSecret: string | null | undefined,
  toleranceSeconds = DEFAULT_STRIPE_SIGNATURE_TOLERANCE_SECONDS
): boolean {
  const secret = configuredSecret?.trim() ?? '';
  if (!secret) {
    return false;
  }

  const signatureHeader = request.headers.get('stripe-signature')?.trim() ?? '';
  if (!signatureHeader) {
    return false;
  }

  const parsed = parseStripeSignatureHeader(signatureHeader);
  if (!parsed.timestamp || parsed.signatures.length === 0) {
    return false;
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSeconds - parsed.timestamp) > Math.max(0, toleranceSeconds)) {
    return false;
  }

  const expected = createHmac('sha256', secret).update(`${parsed.timestamp}.${payload}`).digest('hex');
  return parsed.signatures.some((signature) => constantTimeHexEquals(expected, signature));
}

function parseString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function parseUnixSecondsToIso(value: unknown): string | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return undefined;
  }
  return new Date(value * 1000).toISOString();
}

function parseIdLikeString(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return parseString(value);
  }
  if (!isRecord(value)) {
    return undefined;
  }
  return parseString(value.id);
}

function parseMetadata(value: unknown): Record<string, unknown> | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  return value;
}

function parseMetadataString(metadata: Record<string, unknown> | undefined, keys: string[]): string | undefined {
  if (!metadata) {
    return undefined;
  }

  for (const key of keys) {
    const value = parseString(metadata[key]);
    if (value) {
      return value;
    }
  }

  return undefined;
}

function parseEntitlementFlagsFromMetadata(metadata: Record<string, unknown> | undefined): string[] | undefined {
  if (!metadata) {
    return undefined;
  }

  const raw =
    metadata.entitlementFlags ?? metadata.entitlement_flags ?? metadata.entitlements ?? metadata.featureFlags;
  if (raw === undefined || raw === null) {
    return undefined;
  }

  if (Array.isArray(raw)) {
    const entries = raw.map((entry) => parseString(entry)).filter((entry): entry is string => Boolean(entry));
    return entries.length > 0 ? entries : undefined;
  }

  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) {
      return undefined;
    }

    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed) as unknown;
        if (Array.isArray(parsed)) {
          const entries = parsed
            .map((entry) => parseString(entry))
            .filter((entry): entry is string => Boolean(entry));
          return entries.length > 0 ? entries : undefined;
        }
      } catch {
        // Fall through to comma-delimited parsing.
      }
    }

    const entries = trimmed
      .split(',')
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
    return entries.length > 0 ? entries : undefined;
  }

  return undefined;
}

function parseStripeSubscriptionStatus(value: unknown): TenantBillingSubscriptionStatus | undefined {
  const normalized = parseString(value)?.toLowerCase();
  if (!normalized) {
    return undefined;
  }
  return STRIPE_STATUS_TO_BILLING_STATUS[normalized];
}

function parseStripePaymentStatus(value: unknown): TenantBillingPaymentStatus | undefined {
  const normalized = parseString(value)?.toLowerCase();
  if (!normalized) {
    return undefined;
  }
  return STRIPE_STATUS_TO_PAYMENT_STATUS[normalized];
}

function parsePlanCodeFromStripeSubscriptionObject(
  stripeObject: Record<string, unknown>,
  metadata: Record<string, unknown> | undefined
): string | undefined {
  const fromMetadata = parseMetadataString(metadata, ['planCode', 'plan_code', 'plan']);
  if (fromMetadata) {
    return fromMetadata;
  }

  const items = stripeObject.items;
  if (!isRecord(items) || !Array.isArray(items.data)) {
    return undefined;
  }

  for (const item of items.data) {
    if (!isRecord(item) || !isRecord(item.price)) {
      continue;
    }
    const lookupKey = parseString(item.price.lookup_key);
    if (lookupKey) {
      return lookupKey;
    }
    const nickname = parseString(item.price.nickname);
    if (nickname) {
      return nickname;
    }
    const priceId = parseString(item.price.id);
    if (priceId) {
      return priceId;
    }
  }

  return undefined;
}

function parseTenantIdFromMetadata(metadata: Record<string, unknown> | undefined): string | undefined {
  return parseMetadataString(metadata, ['tenantId', 'tenant_id']);
}

function parseStripePaymentStatusFromEventType(eventType: string): TenantBillingPaymentStatus | undefined {
  if (eventType === 'invoice.payment_failed') {
    return 'past_due';
  }
  if (eventType === 'invoice.paid') {
    return 'paid';
  }
  return undefined;
}

function parseStripeStatusFromEventType(eventType: string): TenantBillingSubscriptionStatus | undefined {
  if (eventType === 'customer.subscription.deleted') {
    return 'canceled';
  }
  return undefined;
}

function normalizeStripeEventBody(body: Record<string, unknown>): TenantBillingProviderEventInput | null {
  const eventId = parseString(body.id);
  const eventType = parseString(body.type);
  const data = body.data;
  if (!eventId || !eventType || !isRecord(data) || !isRecord(data.object)) {
    return null;
  }

  const stripeObject = data.object;
  const objectType = parseString(stripeObject.object);
  const metadata = parseMetadata(stripeObject.metadata);

  const billingCustomerId =
    parseIdLikeString(stripeObject.customer) ??
    parseIdLikeString(stripeObject.customer_id) ??
    parseIdLikeString(stripeObject.customer_details);
  const billingSubscriptionId =
    parseIdLikeString(stripeObject.subscription) ??
    (objectType === 'subscription' ? parseIdLikeString(stripeObject.id) : undefined) ??
    parseMetadataString(metadata, ['billingSubscriptionId', 'billing_subscription_id', 'subscriptionId']);

  const status =
    parseStripeSubscriptionStatus(stripeObject.status) ?? parseStripeStatusFromEventType(eventType);
  const paymentStatus =
    parseStripePaymentStatus(stripeObject.payment_status) ??
    parseStripePaymentStatus(stripeObject.status) ??
    parseStripePaymentStatusFromEventType(eventType);

  const planCode = parsePlanCodeFromStripeSubscriptionObject(stripeObject, metadata);
  const trialEndsAt = parseUnixSecondsToIso(stripeObject.trial_end);
  const currentPeriodEndsAt = parseUnixSecondsToIso(stripeObject.current_period_end);
  const cancelAtPeriodEnd =
    typeof stripeObject.cancel_at_period_end === 'boolean' ? stripeObject.cancel_at_period_end : undefined;
  const entitlementFlags = parseEntitlementFlagsFromMetadata(metadata);

  return {
    provider: 'stripe',
    eventId,
    eventType,
    tenantId: parseTenantIdFromMetadata(metadata),
    billingCustomerId: billingCustomerId ?? null,
    billingSubscriptionId: billingSubscriptionId ?? null,
    subscription: {
      planCode,
      status,
      paymentStatus,
      trialEndsAt,
      currentPeriodEndsAt,
      cancelAtPeriodEnd,
    },
    entitlementFlags,
    syncEntitlements: entitlementFlags !== undefined,
    metadata: {
      source: 'stripe.webhook',
      stripeEventCreatedAt: parseUnixSecondsToIso(body.created),
      stripeObjectType: objectType ?? null,
      stripeObjectId: parseString(stripeObject.id) ?? null,
    },
  };
}

function isStripeEventPayload(body: Record<string, unknown>): boolean {
  return (
    typeof body.id === 'string' &&
    typeof body.type === 'string' &&
    isRecord(body.data) &&
    isRecord(body.data.object) &&
    parseProvider(body.provider) === null
  );
}

function statusCodeForResult(result: TenantBillingProviderEventResult): number {
  if (result.applied || result.duplicate) {
    return 200;
  }
  return 202;
}

export function createBillingWebhookPostHandler(dependencies: BillingWebhookRouteDependencies = defaultDependencies) {
  return async function POST(request: Request) {
    let parsedEvent: TenantBillingProviderEventInput | null = null;

    try {
      const rawBody = await request.text();
      const body = JSON.parse(rawBody) as unknown;
      if (!isRecord(body)) {
        return NextResponse.json({ ok: false, error: 'Webhook payload must be a JSON object.' }, { status: 400 });
      }

      if (isStripeEventPayload(body)) {
        const stripeSecret =
          dependencies.stripeWebhookSecret ?? process.env.ADMIN_BILLING_STRIPE_WEBHOOK_SECRET ?? null;
        const toleranceSeconds =
          dependencies.stripeSignatureToleranceSeconds ??
          Number(process.env.ADMIN_BILLING_STRIPE_WEBHOOK_TOLERANCE_SECONDS ?? DEFAULT_STRIPE_SIGNATURE_TOLERANCE_SECONDS);
        if (!verifyStripeWebhookSignature(request, rawBody, stripeSecret, toleranceSeconds)) {
          return NextResponse.json({ ok: false, error: 'Unauthorized Stripe webhook request.' }, { status: 401 });
        }

        parsedEvent = normalizeStripeEventBody(body);
        if (!parsedEvent) {
          return NextResponse.json({ ok: false, error: 'Unsupported Stripe webhook payload.' }, { status: 400 });
        }
      } else {
        const accessSecret = dependencies.webhookSecret ?? process.env.ADMIN_BILLING_WEBHOOK_SECRET ?? null;
        if (!isWebhookAuthorized(request, accessSecret)) {
          return NextResponse.json({ ok: false, error: 'Unauthorized billing webhook request.' }, { status: 401 });
        }

        parsedEvent = parseEventBody(body);
        if (!parsedEvent) {
          return NextResponse.json(
            { ok: false, error: 'provider, eventId, and eventType are required.' },
            { status: 400 }
          );
        }
      }

      const result = await dependencies.reconcileTenantBillingProviderEvent(parsedEvent);
      const writeAudit = dependencies.writeAdminAuditLog ?? writeAdminAuditLog;
      await safeWriteAdminAuditLog(
        {
          action: 'tenant.billing.sync',
          actor: {
            actorId: `billing-webhook:${result.provider}`,
            role: 'system',
          },
          status: result.applied || result.duplicate ? 'succeeded' : 'failed',
          tenantId: result.tenantId ?? undefined,
          error: result.applied || result.duplicate ? undefined : result.message,
          metadata: buildAuditRequestMetadata(request, {
            changes: {
              provider: { after: result.provider },
              eventId: { after: result.eventId },
              eventType: { after: result.eventType },
              duplicate: { after: result.duplicate },
              applied: { after: result.applied },
              entitlementDriftMode: { after: result.entitlementDrift?.mode ?? null },
              entitlementDriftDetected: { after: result.entitlementDrift?.hasDrift ?? false },
              entitlementMissingCount: { after: result.entitlementDrift?.missingInTenantSettings.length ?? 0 },
              entitlementExtraCount: { after: result.entitlementDrift?.extraInTenantSettings.length ?? 0 },
              entitlementMissingFlags: { after: result.entitlementDrift?.missingInTenantSettings ?? [] },
              entitlementExtraFlags: { after: result.entitlementDrift?.extraInTenantSettings ?? [] },
            },
          }),
        },
        writeAudit
      );

      return NextResponse.json(
        {
          ok: true,
          result,
        },
        { status: statusCodeForResult(result) }
      );
    } catch (error) {
      const writeAudit = dependencies.writeAdminAuditLog ?? writeAdminAuditLog;
      await safeWriteAdminAuditLog(
        {
          action: 'tenant.billing.sync',
          actor: {
            actorId: `billing-webhook:${parsedEvent?.provider ?? 'unknown'}`,
            role: 'system',
          },
          status: 'failed',
          tenantId: parsedEvent?.tenantId,
          error: error instanceof Error ? error.message : 'Billing webhook reconciliation failed.',
          metadata: buildAuditRequestMetadata(request, {
            changes: {
              provider: { after: parsedEvent?.provider ?? null },
              eventId: { after: parsedEvent?.eventId ?? null },
              eventType: { after: parsedEvent?.eventType ?? null },
            },
          }),
        },
        writeAudit
      );

      return NextResponse.json(
        { ok: false, error: error instanceof Error ? error.message : 'Billing webhook reconciliation failed.' },
        { status: 400 }
      );
    }
  };
}

export const POST = createBillingWebhookPostHandler();
