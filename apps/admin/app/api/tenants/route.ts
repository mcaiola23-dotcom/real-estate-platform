import { NextResponse } from 'next/server';

import { listTenantSnapshotsForAdmin, provisionTenant } from '@real-estate/db/control-plane';
import {
  buildAuditRequestMetadata,
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

    let body:
      | {
          name?: string;
          slug?: string;
          primaryDomain?: string;
          planCode?: string;
          featureFlags?: string[];
        }
      | null = null;

    try {
      body = (await request.json()) as {
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
          metadata: buildAuditRequestMetadata(request, {
            changes: {
              name: { after: body.name },
              slug: { after: body.slug },
              primaryDomain: { after: body.primaryDomain },
              planCode: { after: body.planCode ?? null },
              featureFlags: { after: Array.isArray(body.featureFlags) ? body.featureFlags : [] },
            },
          }),
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
          metadata: buildAuditRequestMetadata(request, {
            changes: {
              name: { after: body?.name ?? null },
              slug: { after: body?.slug ?? null },
              primaryDomain: { after: body?.primaryDomain ?? null },
            },
          }),
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
