import { NextResponse } from 'next/server';

import { getTenantBillingSubscription, updateTenantBillingSubscription } from '@real-estate/db/control-plane';
import type {
  TenantBillingPaymentStatus,
  TenantBillingSubscriptionStatus,
  UpdateTenantBillingSubscriptionInput,
} from '@real-estate/types/control-plane';
import {
  buildAuditRequestMetadata,
  enforceAdminMutationAccess,
  getMutationActorFromRequest,
  safeWriteAdminAuditLog,
  writeAdminAuditLog,
} from '../../../lib/admin-access';

interface TenantBillingRouteDependencies {
  getTenantBillingSubscription: typeof getTenantBillingSubscription;
  updateTenantBillingSubscription: typeof updateTenantBillingSubscription;
  getMutationActorFromRequest?: typeof getMutationActorFromRequest;
  writeAdminAuditLog?: typeof writeAdminAuditLog;
}

const defaultDependencies: TenantBillingRouteDependencies = {
  getTenantBillingSubscription,
  updateTenantBillingSubscription,
};

function parseSubscriptionStatus(value: unknown): TenantBillingSubscriptionStatus | undefined {
  if (value === 'trialing' || value === 'active' || value === 'past_due' || value === 'canceled') {
    return value;
  }

  return undefined;
}

function parsePaymentStatus(value: unknown): TenantBillingPaymentStatus | undefined {
  if (value === 'pending' || value === 'paid' || value === 'past_due' || value === 'unpaid') {
    return value;
  }

  return undefined;
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

function parseOptionalDateString(value: unknown): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  if (typeof value !== 'string') {
    return undefined;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }

  return parsed.toISOString();
}

function parseBody(input: Record<string, unknown>): UpdateTenantBillingSubscriptionInput {
  return {
    planCode: typeof input.planCode === 'string' ? input.planCode : undefined,
    status: parseSubscriptionStatus(input.status),
    paymentStatus: parsePaymentStatus(input.paymentStatus),
    billingProvider: typeof input.billingProvider === 'string' ? input.billingProvider : undefined,
    billingCustomerId: parseOptionalString(input.billingCustomerId),
    billingSubscriptionId: parseOptionalString(input.billingSubscriptionId),
    trialEndsAt: parseOptionalDateString(input.trialEndsAt),
    currentPeriodEndsAt: parseOptionalDateString(input.currentPeriodEndsAt),
    cancelAtPeriodEnd: typeof input.cancelAtPeriodEnd === 'boolean' ? input.cancelAtPeriodEnd : undefined,
    entitlementFlags: Array.isArray(input.entitlementFlags)
      ? input.entitlementFlags.filter((entry): entry is string => typeof entry === 'string')
      : undefined,
    syncEntitlements: typeof input.syncEntitlements === 'boolean' ? input.syncEntitlements : undefined,
  };
}

export function createBillingGetHandler(dependencies: TenantBillingRouteDependencies = defaultDependencies) {
  return async function GET(_request: Request, context: { params: Promise<{ tenantId: string }> }) {
    const { tenantId } = await context.params;
    const subscription = await dependencies.getTenantBillingSubscription(tenantId);
    return NextResponse.json({ ok: true, subscription });
  };
}

export function createBillingPatchHandler(dependencies: TenantBillingRouteDependencies = defaultDependencies) {
  return async function PATCH(request: Request, context: { params: Promise<{ tenantId: string }> }) {
    const { tenantId } = await context.params;
    const accessDependencies = {
      getMutationActorFromRequest: dependencies.getMutationActorFromRequest ?? getMutationActorFromRequest,
      writeAdminAuditLog: dependencies.writeAdminAuditLog ?? writeAdminAuditLog,
    };
    const access = await enforceAdminMutationAccess(
      request,
      { action: 'tenant.billing.update', tenantId },
      accessDependencies
    );
    if (!access.ok) {
      return access.response;
    }

    let body: Record<string, unknown> | null = null;
    let updates: UpdateTenantBillingSubscriptionInput | null = null;

    try {
      body = (await request.json()) as Record<string, unknown>;
      updates = parseBody(body);
      const subscription = await dependencies.updateTenantBillingSubscription(tenantId, updates);

      await safeWriteAdminAuditLog(
        {
          action: 'tenant.billing.update',
          actor: access.actor,
          status: 'succeeded',
          tenantId,
          metadata: buildAuditRequestMetadata(request, {
            changes: {
              planCode: { after: updates.planCode ?? null },
              status: { after: updates.status ?? null },
              paymentStatus: { after: updates.paymentStatus ?? null },
              billingProvider: { after: updates.billingProvider ?? null },
              syncEntitlements: { after: updates.syncEntitlements ?? false },
            },
          }),
        },
        accessDependencies.writeAdminAuditLog
      );

      return NextResponse.json({ ok: true, subscription });
    } catch (error) {
      await safeWriteAdminAuditLog(
        {
          action: 'tenant.billing.update',
          actor: access.actor,
          status: 'failed',
          tenantId,
          error: error instanceof Error ? error.message : 'Billing update failed.',
          metadata: buildAuditRequestMetadata(request, {
            changes: {
              planCode: { after: updates?.planCode ?? (typeof body?.planCode === 'string' ? body.planCode : null) },
              status: { after: updates?.status ?? parseSubscriptionStatus(body?.status) ?? null },
              paymentStatus: { after: updates?.paymentStatus ?? parsePaymentStatus(body?.paymentStatus) ?? null },
              syncEntitlements: { after: updates?.syncEntitlements ?? false },
            },
          }),
        },
        accessDependencies.writeAdminAuditLog
      );

      return NextResponse.json(
        { ok: false, error: error instanceof Error ? error.message : 'Billing update failed.' },
        { status: 400 }
      );
    }
  };
}

export const GET = createBillingGetHandler();
export const PATCH = createBillingPatchHandler();
