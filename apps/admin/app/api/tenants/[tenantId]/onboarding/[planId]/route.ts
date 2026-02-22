import { NextResponse } from 'next/server';

import { updateTenantOnboardingPlan } from '@real-estate/db/control-plane';
import {
  buildAuditRequestMetadata,
  enforceAdminMutationAccess,
  getMutationActorFromRequest,
  safeWriteAdminAuditLog,
  writeAdminAuditLog,
} from '../../../../lib/admin-access';

interface TenantOnboardingPlanRouteDependencies {
  updateTenantOnboardingPlan: typeof updateTenantOnboardingPlan;
  getMutationActorFromRequest?: typeof getMutationActorFromRequest;
  writeAdminAuditLog?: typeof writeAdminAuditLog;
}

const defaultDependencies: TenantOnboardingPlanRouteDependencies = {
  updateTenantOnboardingPlan,
};

export function createTenantOnboardingPlanPatchHandler(
  dependencies: TenantOnboardingPlanRouteDependencies = defaultDependencies
) {
  return async function PATCH(
    request: Request,
    context: { params: Promise<{ tenantId: string; planId: string }> }
  ) {
    const { tenantId, planId } = await context.params;
    const accessDependencies = {
      getMutationActorFromRequest: dependencies.getMutationActorFromRequest ?? getMutationActorFromRequest,
      writeAdminAuditLog: dependencies.writeAdminAuditLog ?? writeAdminAuditLog,
    };

    const access = await enforceAdminMutationAccess(
      request,
      { action: 'tenant.onboarding.plan.update', tenantId },
      accessDependencies
    );
    if (!access.ok) {
      return access.response;
    }

    let body: {
      status?: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
      targetLaunchDate?: string | null;
      pauseReason?: string | null;
    } | null = null;

    try {
      body = (await request.json()) as {
        status?: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
        targetLaunchDate?: string | null;
        pauseReason?: string | null;
      };
      const plan = await dependencies.updateTenantOnboardingPlan(tenantId, planId, {
        status: body?.status,
        targetLaunchDate: body?.targetLaunchDate,
        pauseReason: body?.pauseReason,
      });

      if (!plan) {
        return NextResponse.json({ ok: false, error: 'Onboarding plan not found.' }, { status: 404 });
      }

      await safeWriteAdminAuditLog(
        {
          action: 'tenant.onboarding.plan.update',
          actor: access.actor,
          status: 'succeeded',
          tenantId,
          metadata: buildAuditRequestMetadata(request, {
            changes: {
              planId: { after: planId },
              status: { after: body?.status ?? null },
              targetLaunchDate: { after: body?.targetLaunchDate ?? null },
              pauseReason: { after: body?.pauseReason ?? null },
            },
          }),
        },
        accessDependencies.writeAdminAuditLog
      );

      return NextResponse.json({ ok: true, plan });
    } catch (error) {
      await safeWriteAdminAuditLog(
        {
          action: 'tenant.onboarding.plan.update',
          actor: access.actor,
          status: 'failed',
          tenantId,
          error: error instanceof Error ? error.message : 'Onboarding plan update failed.',
          metadata: buildAuditRequestMetadata(request, {
            changes: {
              planId: { after: planId },
              status: { after: body?.status ?? null },
              targetLaunchDate: { after: body?.targetLaunchDate ?? null },
              pauseReason: { after: body?.pauseReason ?? null },
            },
          }),
        },
        accessDependencies.writeAdminAuditLog
      );
      return NextResponse.json(
        { ok: false, error: error instanceof Error ? error.message : 'Onboarding plan update failed.' },
        { status: 400 }
      );
    }
  };
}

export const PATCH = createTenantOnboardingPlanPatchHandler();
