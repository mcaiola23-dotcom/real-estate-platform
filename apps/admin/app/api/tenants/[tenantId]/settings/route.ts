import { NextResponse } from 'next/server';

import { getTenantControlSettings, updateTenantControlSettings } from '@real-estate/db/control-plane';

interface SettingsRouteDependencies {
  getTenantControlSettings: typeof getTenantControlSettings;
  updateTenantControlSettings: typeof updateTenantControlSettings;
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

    try {
      const body = (await request.json()) as {
        planCode?: string;
        featureFlags?: string[];
      };

      const settings = await dependencies.updateTenantControlSettings(tenantId, {
        planCode: body.planCode,
        featureFlags: Array.isArray(body.featureFlags) ? body.featureFlags : undefined,
      });

      return NextResponse.json({ ok: true, settings });
    } catch (error) {
      return NextResponse.json(
        { ok: false, error: error instanceof Error ? error.message : 'Settings update failed.' },
        { status: 400 }
      );
    }
  };
}

export const GET = createSettingsGetHandler();
export const PATCH = createSettingsPatchHandler();
