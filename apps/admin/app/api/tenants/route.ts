import { NextResponse } from 'next/server';

import { listTenantSnapshotsForAdmin, provisionTenant } from '@real-estate/db/control-plane';

interface TenantsRouteDependencies {
  listTenantSnapshotsForAdmin: typeof listTenantSnapshotsForAdmin;
  provisionTenant: typeof provisionTenant;
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

      return NextResponse.json({ ok: true, tenant: snapshot });
    } catch (error) {
      return NextResponse.json(
        { ok: false, error: error instanceof Error ? error.message : 'Tenant provisioning failed.' },
        { status: 400 }
      );
    }
  };
}

export const GET = createTenantsGetHandler();
export const POST = createTenantsPostHandler();
