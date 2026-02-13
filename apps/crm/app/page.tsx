import { headers } from 'next/headers';
import { getCrmLeadIngestionSummary, listRecentActivitiesByTenantId } from '@real-estate/db/crm';

import { getTenantContextFromHeaders } from './lib/tenant/resolve-tenant';

export default async function HomePage() {
  const tenantContext = await getTenantContextFromHeaders(await headers());
  const hasClerkKey = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  const summary = await getCrmLeadIngestionSummary(tenantContext.tenantId);
  const recentActivities = await listRecentActivitiesByTenantId(tenantContext.tenantId, 5);

  return (
    <main>
      <div className="crm-shell">
        <h1>CRM Workspace</h1>
        <p className="crm-muted">Tenant-scoped CRM entry point with Clerk middleware protection.</p>

        <p>
          Tenant: <span className="crm-chip">{tenantContext.tenantId}</span>{' '}
          <span className="crm-chip">{tenantContext.tenantSlug}</span>{' '}
          <span className="crm-chip">{tenantContext.tenantDomain}</span>{' '}
          <span className="crm-chip">{tenantContext.source}</span>
        </p>

        {hasClerkKey ? (
          <p className="crm-accent">Auth integration active via Clerk middleware and session API.</p>
        ) : (
          <p className="crm-muted">
            Clerk publishable key is not set. Configure NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY to enable sign-in UI.
          </p>
        )}

        <p className="crm-muted">
          CRM totals: contacts {summary.contactCount}, leads {summary.leadCount}, activities {summary.activityCount}
        </p>

        <h2>Recent Activity</h2>
        {recentActivities.length === 0 ? (
          <p className="crm-muted">No activity ingested yet for this tenant.</p>
        ) : (
          <ul>
            {recentActivities.map((activity) => (
              <li key={activity.id}>
                <span className="crm-chip">{activity.activityType}</span>{' '}
                <span>{activity.summary}</span>{' '}
                <span className="crm-muted">({new Date(activity.occurredAt).toLocaleString()})</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
