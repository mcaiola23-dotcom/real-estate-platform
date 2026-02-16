import { NextResponse } from 'next/server';

import { listTenantSnapshotsForAdmin, provisionTenant } from '@real-estate/db/control-plane';
import {
  enforceAdminMutationAccess,
  getMutationActorFromRequest,
  safeWriteAdminAuditLog,
  writeAdminAuditLog,
} from '../lib/admin-access';

interface TenantsRouteDependencies {
  listTenantSnapshotsForAdmin: typeof listTenantSnapshotsForAdmin;
  provisionTenant: typeof provisionTenant;
  getMutationActorFromRequest?: typeof getMutationActorFromRequest;
  writeAdminAuditLog?: typeof writeAdminAuditLog;
}

const defaultDependencies: TenantsRouteDependencies = {
  listTenantSnapshotsForAdmin,
  provisionTenant,
};

export function createTenantsGetHandler(dependencies: TenantsRouteDependencies = defaultDependencies) {
  return async function GET() {
    const tenants = await dependencies.listTenantSnapshotsForAdmin();
    return NextResponse.json({ tenants });
  };
}

export function createTenantsPostHandler(dependencies: TenantsRouteDependencies = defaultDependencies) {
  return async function POST(request: Request) {
    const accessDependencies = {
      getMutationActorFromRequest: dependencies.getMutationActorFromRequest ?? getMutationActorFromRequest,
      writeAdminAuditLog: dependencies.writeAdminAuditLog ?? writeAdminAuditLog,
    };

    const access = await enforceAdminMutationAccess(request, { action: 'tenant.provision' }, accessDependencies);
    if (!access.ok) {
      return access.response;
    }

    try {
      const body = (await request.json()) as {
        name?: string;
        slug?: string;
        primaryDomain?: string;
        planCode?: string;
        featureFlags?: string[];
      };

      if (!body.name || !body.slug || !body.primaryDomain) {
        return NextResponse.json({ ok: false, error: 'name, slug, and primaryDomain are required.' }, { status: 400 });
      }

      const snapshot = await dependencies.provisionTenant({
        name: body.name,
        slug: body.slug,
        primaryDomain: body.primaryDomain,
        planCode: body.planCode,
        featureFlags: Array.isArray(body.featureFlags) ? body.featureFlags : [],
      });

      await safeWriteAdminAuditLog(
        {
          action: 'tenant.provision',
          actor: access.actor,
          status: 'succeeded',
          tenantId: snapshot.tenant.id,
        },
        accessDependencies.writeAdminAuditLog
      );

      return NextResponse.json({ ok: true, tenant: snapshot });
    } catch (error) {
      await safeWriteAdminAuditLog(
        {
          action: 'tenant.provision',
          actor: access.actor,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Tenant provisioning failed.',
        },
        accessDependencies.writeAdminAuditLog
      );
      return NextResponse.json(
        { ok: false, error: error instanceof Error ? error.message : 'Tenant provisioning failed.' },
        { status: 400 }
      );
    }
  };
}

export const GET = createTenantsGetHandler();
export const POST = createTenantsPostHandler();
