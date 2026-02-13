import { NextResponse } from 'next/server';

import { addTenantDomain } from '@real-estate/db/control-plane';

interface DomainsPostDependencies {
  addTenantDomain: typeof addTenantDomain;
}

const defaultDependencies: DomainsPostDependencies = {
  addTenantDomain,
};

export function createDomainsPostHandler(dependencies: DomainsPostDependencies = defaultDependencies) {
  return async function POST(request: Request, context: { params: Promise<{ tenantId: string }> }) {
    const { tenantId } = await context.params;

    try {
      const body = (await request.json()) as {
        hostname?: string;
        isPrimary?: boolean;
        isVerified?: boolean;
      };

      if (!body.hostname) {
        return NextResponse.json({ ok: false, error: 'hostname is required.' }, { status: 400 });
      }

      const domain = await dependencies.addTenantDomain(tenantId, {
        hostname: body.hostname,
        isPrimary: body.isPrimary,
        isVerified: body.isVerified,
      });

      return NextResponse.json({ ok: true, domain });
    } catch (error) {
      return NextResponse.json(
        { ok: false, error: error instanceof Error ? error.message : 'Domain add failed.' },
        { status: 400 }
      );
    }
  };
}

export const POST = createDomainsPostHandler();
