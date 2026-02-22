import { NextResponse } from 'next/server';

import {
  createTenantOnboardingPlanFromTemplate,
  getActiveTenantOnboardingPlanWithTasks,
} from '@real-estate/db/control-plane';
import type { TenantOnboardingPlanTaskSeedInput } from '@real-estate/types/control-plane';
import { PLAN_ONBOARDING_CHECKLIST_TEMPLATES } from '../../../../lib/commercial-baselines';
import {
  buildAuditRequestMetadata,
  enforceAdminMutationAccess,
  getMutationActorFromRequest,
  safeWriteAdminAuditLog,
  writeAdminAuditLog,
} from '../../../lib/admin-access';

interface TenantOnboardingRouteDependencies {
  getActiveTenantOnboardingPlanWithTasks: typeof getActiveTenantOnboardingPlanWithTasks;
  createTenantOnboardingPlanFromTemplate: typeof createTenantOnboardingPlanFromTemplate;
  getMutationActorFromRequest?: typeof getMutationActorFromRequest;
  writeAdminAuditLog?: typeof writeAdminAuditLog;
}

const defaultDependencies: TenantOnboardingRouteDependencies = {
  getActiveTenantOnboardingPlanWithTasks,
  createTenantOnboardingPlanFromTemplate,
};

function buildTemplateSeedTasks(planCode: string): TenantOnboardingPlanTaskSeedInput[] {
  const template =
    PLAN_ONBOARDING_CHECKLIST_TEMPLATES[planCode] ?? PLAN_ONBOARDING_CHECKLIST_TEMPLATES.starter ?? [];

  if (template.length === 0) {
    throw new Error(`No onboarding checklist template is configured for plan "${planCode}".`);
  }

  return template.map((item, index) => ({
    taskKey: item.id,
    title: item.label,
    required: item.status === 'required',
    ownerRole: item.owner,
    priority: item.status === 'required' ? 'high' : 'normal',
    sortOrder: index,
  }));
}

export function createTenantOnboardingGetHandler(dependencies: TenantOnboardingRouteDependencies = defaultDependencies) {
  return async function GET(_request: Request, context: { params: Promise<{ tenantId: string }> }) {
    const { tenantId } = await context.params;
    const onboarding = await dependencies.getActiveTenantOnboardingPlanWithTasks(tenantId);
    return NextResponse.json({ ok: true, onboarding });
  };
}

export function createTenantOnboardingPostHandler(dependencies: TenantOnboardingRouteDependencies = defaultDependencies) {
  return async function POST(request: Request, context: { params: Promise<{ tenantId: string }> }) {
    const { tenantId } = await context.params;
    const accessDependencies = {
      getMutationActorFromRequest: dependencies.getMutationActorFromRequest ?? getMutationActorFromRequest,
      writeAdminAuditLog: dependencies.writeAdminAuditLog ?? writeAdminAuditLog,
    };

    const access = await enforceAdminMutationAccess(
      request,
      { action: 'tenant.onboarding.plan.create', tenantId },
      accessDependencies
    );
    if (!access.ok) {
      return access.response;
    }

    let body:
      | {
          planCode?: string;
          targetLaunchDate?: string | null;
        }
      | null = null;

    try {
      body = (await request.json()) as {
        planCode?: string;
        targetLaunchDate?: string | null;
      };
      const planCode = typeof body.planCode === 'string' && body.planCode.trim().length > 0 ? body.planCode.trim() : 'starter';
      const onboarding = await dependencies.createTenantOnboardingPlanFromTemplate(tenantId, {
        planCode,
        targetLaunchDate: body.targetLaunchDate,
        tasks: buildTemplateSeedTasks(planCode),
      });

      await safeWriteAdminAuditLog(
        {
          action: 'tenant.onboarding.plan.create',
          actor: access.actor,
          status: 'succeeded',
          tenantId,
          metadata: buildAuditRequestMetadata(request, {
            changes: {
              planCode: { after: planCode },
              taskCount: { after: onboarding.tasks.length },
              targetLaunchDate: { after: body.targetLaunchDate ?? null },
            },
          }),
        },
        accessDependencies.writeAdminAuditLog
      );

      return NextResponse.json({ ok: true, onboarding });
    } catch (error) {
      await safeWriteAdminAuditLog(
        {
          action: 'tenant.onboarding.plan.create',
          actor: access.actor,
          status: 'failed',
          tenantId,
          error: error instanceof Error ? error.message : 'Onboarding plan creation failed.',
          metadata: buildAuditRequestMetadata(request, {
            changes: {
              planCode: { after: body?.planCode ?? null },
              targetLaunchDate: { after: body?.targetLaunchDate ?? null },
            },
          }),
        },
        accessDependencies.writeAdminAuditLog
      );
      return NextResponse.json(
        { ok: false, error: error instanceof Error ? error.message : 'Onboarding plan creation failed.' },
        { status: 400 }
      );
    }
  };
}

export const GET = createTenantOnboardingGetHandler();
export const POST = createTenantOnboardingPostHandler();
