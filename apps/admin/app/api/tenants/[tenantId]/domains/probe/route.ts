import { NextResponse } from 'next/server';

import { getTenantSnapshotForAdmin } from '@real-estate/db/control-plane';
import type { TenantDomainProbeResult } from '@real-estate/types/control-plane';
import { probeTenantDomainState } from '../../../../lib/domain-probe';

interface DomainProbePostDependencies {
  getTenantSnapshotForAdmin: typeof getTenantSnapshotForAdmin;
  probeTenantDomainState: typeof probeTenantDomainState;
}

const defaultDependencies: DomainProbePostDependencies = {
  getTenantSnapshotForAdmin,
  probeTenantDomainState,
};

export function createDomainProbePostHandler(dependencies: DomainProbePostDependencies = defaultDependencies) {
  return async function POST(request: Request, context: { params: Promise<{ tenantId: string }> }) {
    const { tenantId } = await context.params;

    let domainIdFilter: string | null = null;
    try {
      const body = (await request.json()) as { domainId?: unknown };
      if (typeof body.domainId === 'string' && body.domainId.trim().length > 0) {
        domainIdFilter = body.domainId.trim();
      }
    } catch {
      // Body is optional for full-tenant probe runs.
    }

    const snapshot = await dependencies.getTenantSnapshotForAdmin(tenantId);
    if (!snapshot) {
      return NextResponse.json({ ok: false, error: 'Tenant not found.' }, { status: 404 });
    }

    const activeDomains = snapshot.domains.filter((domain) => domain.status === 'active');
    const domainsToProbe = domainIdFilter
      ? activeDomains.filter((domain) => domain.id === domainIdFilter)
      : activeDomains;

    if (domainIdFilter && domainsToProbe.length === 0) {
      return NextResponse.json({ ok: false, error: 'Domain not found for tenant.' }, { status: 404 });
    }

    const probes: TenantDomainProbeResult[] = await Promise.all(
      domainsToProbe.map((domain) => dependencies.probeTenantDomainState(domain))
    );

    const checkedAt = probes[0]?.checkedAt ?? new Date().toISOString();
    const primaryDomainProbe = probes.find((entry) => entry.isPrimary) ?? null;

    return NextResponse.json({
      ok: true,
      tenantId,
      checkedAt,
      probes,
      primaryDomainProbe,
    });
  };
}

export const POST = createDomainProbePostHandler();
