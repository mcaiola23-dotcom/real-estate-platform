import { headers } from 'next/headers';
import { getCrmLeadIngestionSummary } from '@real-estate/db/crm';

import { getTenantContextFromHeaders } from './lib/tenant/resolve-tenant';
import { CrmWorkspace } from './components/crm-workspace';

export default async function HomePage() {
  const tenantContext = await getTenantContextFromHeaders(await headers());
  const hasClerkKey = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  const summary = await getCrmLeadIngestionSummary(tenantContext.tenantId);

  return (
    <main>
      <CrmWorkspace tenantContext={tenantContext} hasClerkKey={hasClerkKey} initialSummary={summary} />
    </main>
  );
}
