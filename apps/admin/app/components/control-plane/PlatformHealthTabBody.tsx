import type { ControlPlaneObservabilitySummary } from '@real-estate/types/control-plane';

interface PlatformHealthTabBodyProps {
  observabilitySummary: ControlPlaneObservabilitySummary | null;
  observabilityLoading: boolean;
  observabilityError: string | null;
  formatTimestamp: (value: string) => string;
}

export function PlatformHealthTabBody({
  observabilitySummary,
  observabilityLoading,
  observabilityError,
  formatTimestamp,
}: PlatformHealthTabBodyProps) {
  return (
    <>
      {observabilityError ? <p className="admin-error">{observabilityError}</p> : null}
      {observabilityLoading && !observabilitySummary ? <p className="admin-muted">Loading observability data...</p> : null}

      {observabilitySummary ? (
        <>
          <section className="admin-kpi-grid" aria-label="Observability summary metrics">
            <article className="admin-kpi-card">
              <p>Avg Tenant Readiness</p>
              <strong>{observabilitySummary.totals.averageReadinessScore}%</strong>
              <span>across tracked tenant readiness checks</span>
            </article>
            <article className="admin-kpi-card">
              <p>Audit Failures (7d)</p>
              <strong>{observabilitySummary.mutationTrends.find((entry) => entry.status === 'failed')?.count ?? 0}</strong>
              <span>admin mutation failures recorded in last seven days</span>
            </article>
            <article className="admin-kpi-card">
              <p>Dead-Letter Queue</p>
              <strong>{observabilitySummary.ingestion.deadLetterCount}</strong>
              <span>ingestion jobs awaiting operator action</span>
            </article>
            <article className="admin-kpi-card">
              <p>Billing Drift ({observabilitySummary.billingDrift.windowDays}d)</p>
              <strong>{observabilitySummary.billingDrift.totals.driftEvents}</strong>
              <span>billing sync events with entitlement mismatches</span>
            </article>
          </section>

          <div className="admin-observability-grid">
            <article className="admin-observability-panel">
              <h3>Mutation Trend (7 Days)</h3>
              <div className="admin-row">
                {observabilitySummary.mutationTrends.map((trend) => (
                  <span key={trend.status} className={`admin-chip admin-chip-status-${trend.status}`}>
                    {trend.status}: {trend.count}
                  </span>
                ))}
              </div>
            </article>

            <article className="admin-observability-panel">
              <h3>Ingestion Runtime Health</h3>
              <p className="admin-muted">{observabilitySummary.ingestion.runtimeMessage}</p>
              <div className="admin-row">
                <span
                  className={`admin-chip ${
                    observabilitySummary.ingestion.runtimeReady ? 'admin-chip-ok' : 'admin-chip-status-failed'
                  }`}
                >
                  runtime {observabilitySummary.ingestion.runtimeReady ? 'ready' : 'blocked'}
                </span>
                {observabilitySummary.ingestion.runtimeReason ? (
                  <span className="admin-chip">reason: {observabilitySummary.ingestion.runtimeReason}</span>
                ) : null}
              </div>
              <div className="admin-row">
                {observabilitySummary.ingestion.queueStatusCounts.map((entry) => (
                  <span key={entry.status} className="admin-chip">
                    {entry.status}: {entry.count}
                  </span>
                ))}
              </div>
            </article>

            <article className="admin-observability-panel">
              <h3>Billing Drift Summary</h3>
              <p className="admin-muted">
                Recent drift totals across billing sync events (window: {observabilitySummary.billingDrift.windowDays} days).
              </p>
              <div className="admin-row">
                <span className="admin-chip">tenants: {observabilitySummary.billingDrift.totals.tenantsWithDrift}</span>
                <span className="admin-chip">missing flags: {observabilitySummary.billingDrift.totals.missingFlagCount}</span>
                <span className="admin-chip">extra flags: {observabilitySummary.billingDrift.totals.extraFlagCount}</span>
              </div>
              <div className="admin-row">
                <span className="admin-chip">compared: {observabilitySummary.billingDrift.totals.modeCounts.compared}</span>
                <span className="admin-chip">
                  provider_missing: {observabilitySummary.billingDrift.totals.modeCounts.provider_missing}
                </span>
                <span className="admin-chip">
                  tenant_unresolved: {observabilitySummary.billingDrift.totals.modeCounts.tenant_unresolved}
                </span>
              </div>

              {observabilitySummary.billingDrift.byTenant.length === 0 ? (
                <p className="admin-muted">No billing drift events detected in the current window.</p>
              ) : (
                <ul className="admin-list">
                  {observabilitySummary.billingDrift.byTenant.map((entry) => (
                    <li key={entry.tenantId} className="admin-list-item">
                      <div className="admin-row admin-space-between">
                        <strong>{entry.tenantName}</strong>
                        <span className="admin-chip admin-chip-warn">drift events: {entry.driftEvents}</span>
                      </div>
                      <p className="admin-muted">{entry.tenantSlug}</p>
                      <div className="admin-row">
                        <span className="admin-chip">missing: {entry.missingFlagCount}</span>
                        <span className="admin-chip">extra: {entry.extraFlagCount}</span>
                        <span className="admin-chip">compared: {entry.modeCounts.compared}</span>
                        <span className="admin-chip">provider_missing: {entry.modeCounts.provider_missing}</span>
                        <span className="admin-chip">tenant_unresolved: {entry.modeCounts.tenant_unresolved}</span>
                      </div>
                      {entry.latestDriftAt ? <p className="admin-muted">latest drift: {formatTimestamp(entry.latestDriftAt)}</p> : null}
                    </li>
                  ))}
                </ul>
              )}
            </article>
          </div>

          <article className="admin-observability-panel">
            <h3>Tenant Readiness Scoreboard</h3>
            {observabilitySummary.tenantReadiness.length === 0 ? (
              <p className="admin-muted">No tenant readiness records available yet.</p>
            ) : (
              <ul className="admin-list">
                {observabilitySummary.tenantReadiness.map((entry) => (
                  <li key={entry.tenantId} className="admin-list-item">
                    <div className="admin-row admin-space-between">
                      <strong>{entry.tenantName}</strong>
                      <span className={`admin-chip ${entry.score >= 75 ? 'admin-chip-ok' : 'admin-chip-warn'}`}>
                        {entry.score}%
                      </span>
                    </div>
                    <p className="admin-muted">{entry.tenantSlug}</p>
                    <div className="admin-row">
                      {entry.checks.map((check) => (
                        <span
                          key={`${entry.tenantId}-${check.label}`}
                          className={`admin-chip ${check.ok ? 'admin-chip-ok' : 'admin-chip-warn'}`}
                        >
                          {check.label}
                        </span>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </>
      ) : null}
    </>
  );
}
