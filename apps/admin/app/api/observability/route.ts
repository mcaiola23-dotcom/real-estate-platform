import { NextResponse } from 'next/server';

import { getControlPlaneObservabilitySummary } from '@real-estate/db/control-plane';

interface ObservabilityRouteDependencies {
  getControlPlaneObservabilitySummary: typeof getControlPlaneObservabilitySummary;
}

const defaultDependencies: ObservabilityRouteDependencies = {
  getControlPlaneObservabilitySummary,
};

function parseTenantLimit(value: string | null): number {
  if (!value) {
    return 25;
  }

  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    return 25;
  }

  return Math.min(Math.max(parsed, 1), 100);
}

export function createObservabilityGetHandler(dependencies: ObservabilityRouteDependencies = defaultDependencies) {
  return async function GET(request: Request) {
    try {
      const { searchParams } = new URL(request.url);
      const tenantLimit = parseTenantLimit(searchParams.get('tenantLimit'));
      const summary = await dependencies.getControlPlaneObservabilitySummary(tenantLimit);

      return NextResponse.json({ ok: true, summary });
    } catch (error) {
      return NextResponse.json(
        { ok: false, error: error instanceof Error ? error.message : 'Unable to load observability summary.' },
        { status: 500 }
      );
    }
  };
}

export const GET = createObservabilityGetHandler();
