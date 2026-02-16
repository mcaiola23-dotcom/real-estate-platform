import { NextResponse } from 'next/server';

import { getTenantControlSettings, updateTenantControlSettings } from '@real-estate/db/control-plane';
import {
  enforceAdminMutationAccess,
  getMutationActorFromRequest,
  safeWriteAdminAuditLog,
  writeAdminAuditLog,
} from '../../../lib/admin-access';

interface SettingsRouteDependencies {
  getTenantControlSettings: typeof getTenantControlSettings;
  updateTenantControlSettings: typeof updateTenantControlSettings;
  getMutationActorFromRequest?: typeof getMutationActorFromRequest;
  writeAdminAuditLog?: typeof writeAdminAuditLog;
}

const defaultDependencies: SettingsRouteDependencies = {
  getTenantControlSettings,
  updateTenantControlSettings,
};

export function createSettingsGetHandler(dependencies: SettingsRouteDependencies = defaultDependencies) {
  return async function GET(_request: Request, context: { params: Promise<{ tenantId: string }> }) {
    const { tenantId } = await context.params;
    const settings = await dependencies.getTenantControlSettings(tenantId);

    return NextResponse.json({ ok: true, settings });
  };
}

export function createSettingsPatchHandler(dependencies: SettingsRouteDependencies = defaultDependencies) {
  return async function PATCH(request: Request, context: { params: Promise<{ tenantId: string }> }) {
    const { tenantId } = await context.params;
    const accessDependencies = {
      getMutationActorFromRequest: dependencies.getMutationActorFromRequest ?? getMutationActorFromRequest,
      writeAdminAuditLog: dependencies.writeAdminAuditLog ?? writeAdminAuditLog,
    };

    const access = await enforceAdminMutationAccess(
      request,
      { action: 'tenant.settings.update', tenantId },
      accessDependencies
    );
    if (!access.ok) {
      return access.response;
    }

    try {
      const body = (await request.json()) as {
        planCode?: string;
        featureFlags?: string[];
      };

      const settings = await dependencies.updateTenantControlSettings(tenantId, {
        planCode: body.planCode,
        featureFlags: Array.isArray(body.featureFlags) ? body.featureFlags : undefined,
      });

      await safeWriteAdminAuditLog(
        {
          action: 'tenant.settings.update',
          actor: access.actor,
          status: 'succeeded',
          tenantId,
        },
        accessDependencies.writeAdminAuditLog
      );

      return NextResponse.json({ ok: true, settings });
    } catch (error) {
      await safeWriteAdminAuditLog(
        {
          action: 'tenant.settings.update',
          actor: access.actor,
          status: 'failed',
          tenantId,
          error: error instanceof Error ? error.message : 'Settings update failed.',
        },
        accessDependencies.writeAdminAuditLog
      );
      return NextResponse.json(
        { ok: false, error: error instanceof Error ? error.message : 'Settings update failed.' },
        { status: 400 }
      );
    }
  };
}

export const GET = createSettingsGetHandler();
export const PATCH = createSettingsPatchHandler();
