import { useEffect, useMemo, useState } from 'react';

import type { ControlPlaneObservabilitySummary } from '@real-estate/types/control-plane';
import {
  ADMIN_BULK_ENDPOINT_RECOMMENDATION_THRESHOLDS,
  ADMIN_USAGE_TELEMETRY_POLICY,
  buildAdminBulkEndpointRecommendation,
  buildAdminUsageTelemetryPublishAggregate,
  buildAdminUsageTelemetryRollupAlignmentNote,
  clearAdminUsageTelemetrySnapshot,
  readAdminUsageTelemetrySnapshot,
  type AdminUsageTelemetrySnapshot,
} from '../../lib/admin-usage-telemetry';

interface PlatformHealthTabBodyProps {
  observabilitySummary: ControlPlaneObservabilitySummary | null;
  observabilityLoading: boolean;
  observabilityError: string | null;
  formatTimestamp: (value: string) => string;
  onOpenTenantLaunch?: (tenantId: string, source: 'readiness' | 'triage') => void;
  onPublishUsageTelemetryAggregate?: (
    aggregate: ReturnType<typeof buildAdminUsageTelemetryPublishAggregate>
  ) => Promise<{ ok: true; accepted: true } | { ok: false; error: string }>;
}

export function PlatformHealthTabBody({
  observabilitySummary,
  observabilityLoading,
  observabilityError,
  formatTimestamp,
  onOpenTenantLaunch,
  onPublishUsageTelemetryAggregate,
}: PlatformHealthTabBodyProps) {
  const [triageFilter, setTriageFilter] = useState<'all' | 'blocked' | 'overdue' | 'unassigned' | 'paused' | 'no_plan'>(
    'all'
  );
  const [triageSort, setTriageSort] = useState<
    'risk_desc' | 'score_asc' | 'blocked_desc' | 'overdue_desc' | 'unassigned_desc'
  >('risk_desc');
  const [usageTelemetry, setUsageTelemetry] = useState<AdminUsageTelemetrySnapshot | null>(null);
  const [usageTelemetryPublishState, setUsageTelemetryPublishState] = useState<{
    status: 'idle' | 'publishing' | 'success' | 'error';
    message: string | null;
  }>({ status: 'idle', message: null });

  const onboardingTriageRows = useMemo(() => {
    if (!observabilitySummary) {
      return [];
    }

    const rows = observabilitySummary.tenantReadiness.filter((entry) => {
      if (triageFilter === 'blocked') {
        return entry.onboarding.blockedRequiredTasks > 0;
      }
      if (triageFilter === 'overdue') {
        return entry.onboarding.overdueRequiredTasks > 0;
      }
      if (triageFilter === 'unassigned') {
        return entry.onboarding.unassignedRequiredTasks > 0;
      }
      if (triageFilter === 'paused') {
        return entry.onboarding.planStatus === 'paused';
      }
      if (triageFilter === 'no_plan') {
        return entry.onboarding.planStatus === 'none';
      }
      return true;
    });

    const riskScore = (entry: ControlPlaneObservabilitySummary['tenantReadiness'][number]) =>
      entry.onboarding.blockedRequiredTasks * 100 +
      entry.onboarding.overdueRequiredTasks * 10 +
      entry.onboarding.unassignedRequiredTasks * 5 +
      (entry.onboarding.planStatus === 'paused' ? 50 : 0) +
      (entry.onboarding.planStatus === 'none' ? 40 : 0) +
      (100 - entry.score);

    return [...rows].sort((left, right) => {
      if (triageSort === 'score_asc') {
        return left.score - right.score || left.tenantName.localeCompare(right.tenantName);
      }
      if (triageSort === 'blocked_desc') {
        return (
          right.onboarding.blockedRequiredTasks - left.onboarding.blockedRequiredTasks ||
          left.score - right.score ||
          left.tenantName.localeCompare(right.tenantName)
        );
      }
      if (triageSort === 'overdue_desc') {
        return (
          right.onboarding.overdueRequiredTasks - left.onboarding.overdueRequiredTasks ||
          left.score - right.score ||
          left.tenantName.localeCompare(right.tenantName)
        );
      }
      if (triageSort === 'unassigned_desc') {
        return (
          right.onboarding.unassignedRequiredTasks - left.onboarding.unassignedRequiredTasks ||
          left.score - right.score ||
          left.tenantName.localeCompare(right.tenantName)
        );
      }
      return riskScore(right) - riskScore(left) || left.score - right.score || left.tenantName.localeCompare(right.tenantName);
    });
  }, [observabilitySummary, triageFilter, triageSort]);

  useEffect(() => {
    setUsageTelemetry(readAdminUsageTelemetrySnapshot());
  }, []);

  const bulkTelemetryRecommendation = useMemo(() => {
    if (!usageTelemetry) {
      return null;
    }
    return buildAdminBulkEndpointRecommendation(usageTelemetry.bulkActionStats, 'local browser telemetry');
  }, [usageTelemetry]);

  const publishedBulkTelemetryRecommendation = useMemo(
    () =>
      observabilitySummary
        ? buildAdminBulkEndpointRecommendation(
            observabilitySummary.onboardingUsageTelemetry.bulkActionStats,
            `server published telemetry (${observabilitySummary.onboardingUsageTelemetry.windowDays}d window)`
          )
        : null,
    [observabilitySummary]
  );

  const telemetryRollupAlignmentNote = useMemo(
    () =>
      observabilitySummary
        ? buildAdminUsageTelemetryRollupAlignmentNote(observabilitySummary.onboardingUsageTelemetry.windowDays)
        : null,
    [observabilitySummary]
  );

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
            <article className="admin-kpi-card">
              <p>Onboarding Plans</p>
              <strong>{observabilitySummary.onboarding.tenantsWithPersistedPlan}</strong>
              <span>tenants with persisted onboarding plans</span>
            </article>
            <article className="admin-kpi-card">
              <p>Onboarding Blockers</p>
              <strong>{observabilitySummary.onboarding.blockedRequiredTasks}</strong>
              <span>required onboarding tasks currently blocked</span>
            </article>
            <article className="admin-kpi-card">
              <p>Onboarding Overdue</p>
              <strong>{observabilitySummary.onboarding.overdueRequiredTasks}</strong>
              <span>required onboarding tasks past due date</span>
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

            <article className="admin-observability-panel">
              <h3>Onboarding Rollout Health</h3>
              <p className="admin-muted">
                Cross-tenant persisted onboarding plan and checklist risk signals used by readiness scoring.
              </p>
              <div className="admin-row">
                <span className="admin-chip">persisted plans: {observabilitySummary.onboarding.tenantsWithPersistedPlan}</span>
                <span className="admin-chip">active: {observabilitySummary.onboarding.activePlans}</span>
                <span className="admin-chip">paused: {observabilitySummary.onboarding.pausedPlans}</span>
                <span className="admin-chip">completed: {observabilitySummary.onboarding.completedPlans}</span>
              </div>
              <div className="admin-row">
                <span className="admin-chip admin-chip-warn">
                  blocked required: {observabilitySummary.onboarding.blockedRequiredTasks}
                </span>
                <span className="admin-chip admin-chip-warn">
                  overdue required: {observabilitySummary.onboarding.overdueRequiredTasks}
                </span>
                <span className="admin-chip admin-chip-warn">
                  unassigned required: {observabilitySummary.onboarding.unassignedRequiredTasks}
                </span>
              </div>
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
                      <div className="admin-row">
                        <span className={`admin-chip ${entry.score >= 75 ? 'admin-chip-ok' : 'admin-chip-warn'}`}>
                          {entry.score}%
                        </span>
                        {onOpenTenantLaunch ? (
                          <button
                            type="button"
                            className="admin-secondary"
                            onClick={() => {
                              onOpenTenantLaunch(entry.tenantId, 'readiness');
                            }}
                          >
                            Open Launch
                          </button>
                        ) : null}
                      </div>
                    </div>
                    <p className="admin-muted">{entry.tenantSlug}</p>
                    <div className="admin-row">
                      <span className="admin-chip">onboarding: {entry.onboarding.planStatus}</span>
                      <span className="admin-chip">
                        progress: {entry.onboarding.completedRequiredTaskCount}/{entry.onboarding.requiredTaskCount}
                      </span>
                      <span
                        className={`admin-chip ${
                          entry.onboarding.blockedRequiredTasks > 0 ? 'admin-chip-warn' : 'admin-chip-ok'
                        }`}
                      >
                        blocked: {entry.onboarding.blockedRequiredTasks}
                      </span>
                      <span
                        className={`admin-chip ${
                          entry.onboarding.overdueRequiredTasks > 0 ? 'admin-chip-warn' : 'admin-chip-ok'
                        }`}
                      >
                        overdue: {entry.onboarding.overdueRequiredTasks}
                      </span>
                      <span
                        className={`admin-chip ${
                          entry.onboarding.unassignedRequiredTasks > 0 ? 'admin-chip-warn' : 'admin-chip-ok'
                        }`}
                      >
                        unassigned: {entry.onboarding.unassignedRequiredTasks}
                      </span>
                    </div>
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

          <article className="admin-observability-panel">
            <div className="admin-row admin-space-between">
              <h3>Onboarding Triage Queue</h3>
              <span className="admin-chip">rows: {onboardingTriageRows.length}</span>
            </div>
            <p className="admin-muted">
              Cross-tenant triage view for persisted onboarding plan health and required-task risk signals.
            </p>
            <div className="admin-inline-row">
              <label className="admin-field">
                <span>Filter</span>
                <select
                  value={triageFilter}
                  onChange={(event) =>
                    setTriageFilter(event.target.value as 'all' | 'blocked' | 'overdue' | 'unassigned' | 'paused' | 'no_plan')
                  }
                >
                  <option value="all">All</option>
                  <option value="blocked">Blocked Required</option>
                  <option value="overdue">Overdue Required</option>
                  <option value="unassigned">Unassigned Required</option>
                  <option value="paused">Paused Plan</option>
                  <option value="no_plan">No Plan</option>
                </select>
              </label>
              <label className="admin-field">
                <span>Sort</span>
                <select
                  value={triageSort}
                  onChange={(event) =>
                    setTriageSort(
                      event.target.value as 'risk_desc' | 'score_asc' | 'blocked_desc' | 'overdue_desc' | 'unassigned_desc'
                    )
                  }
                >
                  <option value="risk_desc">Risk (High to Low)</option>
                  <option value="score_asc">Readiness Score (Low to High)</option>
                  <option value="blocked_desc">Blocked Count</option>
                  <option value="overdue_desc">Overdue Count</option>
                  <option value="unassigned_desc">Unassigned Count</option>
                </select>
              </label>
            </div>

            {onboardingTriageRows.length === 0 ? (
              <p className="admin-muted">No tenants match the current onboarding triage filter.</p>
            ) : (
              <ul className="admin-list">
                {onboardingTriageRows.slice(0, 12).map((entry) => (
                  <li key={`triage-${entry.tenantId}`} className="admin-list-item">
                    <div className="admin-row admin-space-between">
                      <strong>{entry.tenantName}</strong>
                      <div className="admin-row">
                        <span className={`admin-chip ${entry.score >= 75 ? 'admin-chip-ok' : 'admin-chip-warn'}`}>
                          readiness {entry.score}%
                        </span>
                        {onOpenTenantLaunch ? (
                          <button
                            type="button"
                            className="admin-secondary"
                            onClick={() => {
                              onOpenTenantLaunch(entry.tenantId, 'triage');
                            }}
                          >
                            Open Launch
                          </button>
                        ) : null}
                      </div>
                    </div>
                    <p className="admin-muted">{entry.tenantSlug}</p>
                    <div className="admin-row">
                      <span className="admin-chip">plan: {entry.onboarding.planStatus}</span>
                      <span className="admin-chip">
                        progress: {entry.onboarding.completedRequiredTaskCount}/{entry.onboarding.requiredTaskCount}
                      </span>
                      <span
                        className={`admin-chip ${
                          entry.onboarding.blockedRequiredTasks > 0 ? 'admin-chip-warn' : 'admin-chip-ok'
                        }`}
                      >
                        blocked: {entry.onboarding.blockedRequiredTasks}
                      </span>
                      <span
                        className={`admin-chip ${
                          entry.onboarding.overdueRequiredTasks > 0 ? 'admin-chip-warn' : 'admin-chip-ok'
                        }`}
                      >
                        overdue: {entry.onboarding.overdueRequiredTasks}
                      </span>
                      <span
                        className={`admin-chip ${
                          entry.onboarding.unassignedRequiredTasks > 0 ? 'admin-chip-warn' : 'admin-chip-ok'
                        }`}
                      >
                        unassigned: {entry.onboarding.unassignedRequiredTasks}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </article>

          <article className="admin-observability-panel">
            <div className="admin-row admin-space-between">
              <h3>Onboarding Usage Telemetry (Local)</h3>
              <div className="admin-row">
                <button
                  type="button"
                  className="admin-secondary"
                  onClick={() => {
                    setUsageTelemetry(readAdminUsageTelemetrySnapshot());
                  }}
                >
                  Refresh Local
                </button>
                <button
                  type="button"
                  className="admin-secondary"
                  onClick={() => {
                    setUsageTelemetry(clearAdminUsageTelemetrySnapshot());
                  }}
                >
                  Clear Local
                </button>
              </div>
            </div>
            <p className="admin-muted">
              Browser-local telemetry (`admin-usage-telemetry.v1`) for onboarding triage and bulk actions. This data is not
              sent to the server.
            </p>
            <div className="admin-row">
              <span className="admin-chip">storage: {ADMIN_USAGE_TELEMETRY_POLICY.storage}</span>
              <span className="admin-chip">promotion: {ADMIN_USAGE_TELEMETRY_POLICY.promotionMode}</span>
              <span className="admin-chip">
                publish includes tenantIds: {String(ADMIN_USAGE_TELEMETRY_POLICY.includesTenantIdsInPublish)}
              </span>
              <span className="admin-chip">
                publish includes recent events: {String(ADMIN_USAGE_TELEMETRY_POLICY.includesRecentEventsInPublish)}
              </span>
              <span className="admin-chip">
                suggested retention: {ADMIN_USAGE_TELEMETRY_POLICY.recommendedServerRetentionDays}d
              </span>
              <span className="admin-chip">
                review cadence: {ADMIN_USAGE_TELEMETRY_POLICY.recommendedReviewCadenceDays}d
              </span>
              <span className="admin-chip">
                rollup target: {ADMIN_USAGE_TELEMETRY_POLICY.recommendedRollupWindowDays}d
              </span>
              <span className="admin-chip">
                bulk threshold min runs: {ADMIN_BULK_ENDPOINT_RECOMMENDATION_THRESHOLDS.minRunsForDecision}
              </span>
              <span className="admin-chip">
                warn avg selected: {ADMIN_BULK_ENDPOINT_RECOMMENDATION_THRESHOLDS.avgSelectedWarnAt}+
              </span>
              <span className="admin-chip">
                warn avg duration: {Math.round(ADMIN_BULK_ENDPOINT_RECOMMENDATION_THRESHOLDS.avgDurationWarnMs / 1000)}s+
              </span>
              <span className="admin-chip">
                warn failure rate: {(ADMIN_BULK_ENDPOINT_RECOMMENDATION_THRESHOLDS.failureRateWarnRatio * 100).toFixed(0)}%+
              </span>
            </div>
            {telemetryRollupAlignmentNote ? (
              <p className={telemetryRollupAlignmentNote.level === 'warn' ? 'admin-field-error' : 'admin-muted'}>
                {telemetryRollupAlignmentNote.summary}
              </p>
            ) : null}
            <div className="admin-row">
              <span className="admin-chip">
                published (server, {observabilitySummary.onboardingUsageTelemetry.windowDays}d):{' '}
                {observabilitySummary.onboardingUsageTelemetry.publishCount}
              </span>
              <span className="admin-chip">
                latest publish:{' '}
                {observabilitySummary.onboardingUsageTelemetry.latestPublishedAt
                  ? formatTimestamp(observabilitySummary.onboardingUsageTelemetry.latestPublishedAt)
                  : 'none'}
              </span>
              <span className="admin-chip">
                published event types: {observabilitySummary.onboardingUsageTelemetry.totals.publishedEventTypeCount}
              </span>
              <span className="admin-chip">
                published bulk types: {observabilitySummary.onboardingUsageTelemetry.totals.publishedBulkActionTypeCount}
              </span>
            </div>
            {Object.entries(observabilitySummary.onboardingUsageTelemetry.bulkActionStats).length > 0 ? (
              <ul className="admin-list">
                {Object.entries(observabilitySummary.onboardingUsageTelemetry.bulkActionStats).map(([actionKey, stats]) => {
                  const avgSelected = stats.count > 0 ? stats.totalSelectedCount / stats.count : 0;
                  const avgDurationMs = stats.count > 0 ? stats.totalDurationMs / stats.count : 0;
                  return (
                    <li key={`published-${actionKey}`} className="admin-list-item">
                      <div className="admin-row admin-space-between">
                        <strong>published aggregate: {actionKey}</strong>
                        <span className="admin-chip">runs: {stats.count}</span>
                      </div>
                      <div className="admin-row">
                        <span className="admin-chip">avg selected: {avgSelected.toFixed(1)}</span>
                        <span className="admin-chip">avg duration: {Math.round(avgDurationMs)}ms</span>
                        <span className="admin-chip">success: {stats.totalSuccessCount}</span>
                        <span className="admin-chip">failures: {stats.totalFailureCount}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="admin-muted">No published server-side telemetry aggregates yet in the current window.</p>
            )}
            {publishedBulkTelemetryRecommendation ? (
              <p
                className={
                  publishedBulkTelemetryRecommendation.level === 'warn'
                    ? 'admin-field-error'
                    : publishedBulkTelemetryRecommendation.level === 'ok'
                      ? 'admin-muted'
                      : 'admin-muted'
                }
              >
                <strong>Published Rollup Recommendation:</strong> {publishedBulkTelemetryRecommendation.summary}{' '}
                {publishedBulkTelemetryRecommendation.detail}
              </p>
            ) : null}

            {usageTelemetry ? (
              <>
                <div className="admin-row">
                  <span className="admin-chip">updated: {formatTimestamp(usageTelemetry.updatedAt)}</span>
                  <span className="admin-chip">recent events: {usageTelemetry.recentEvents.length}</span>
                </div>

                {bulkTelemetryRecommendation ? (
                  <p
                    className={
                      bulkTelemetryRecommendation.level === 'warn'
                      ? 'admin-field-error'
                      : bulkTelemetryRecommendation.level === 'ok'
                          ? 'admin-muted'
                          : 'admin-muted'
                    }
                  >
                    <strong>Local Recommendation:</strong> {bulkTelemetryRecommendation.summary} {bulkTelemetryRecommendation.detail}
                  </p>
                ) : null}

                <div className="admin-row">
                  {onPublishUsageTelemetryAggregate ? (
                    <button
                      type="button"
                      className="admin-secondary"
                      disabled={usageTelemetryPublishState.status === 'publishing'}
                      onClick={async () => {
                        setUsageTelemetryPublishState({ status: 'publishing', message: 'Publishing aggregate snapshot...' });
                        const result = await onPublishUsageTelemetryAggregate(
                          buildAdminUsageTelemetryPublishAggregate(usageTelemetry)
                        );
                        if (result.ok) {
                          setUsageTelemetryPublishState({
                            status: 'success',
                            message: 'Aggregate telemetry snapshot published to Admin audit log.',
                          });
                        } else {
                          setUsageTelemetryPublishState({
                            status: 'error',
                            message: result.error,
                          });
                        }
                      }}
                    >
                      {usageTelemetryPublishState.status === 'publishing' ? 'Publishing...' : 'Publish Aggregate Snapshot'}
                    </button>
                  ) : null}
                  {Object.entries(usageTelemetry.countsByEvent).length === 0 ? (
                    <span className="admin-chip">no events recorded</span>
                  ) : (
                    Object.entries(usageTelemetry.countsByEvent).map(([eventName, count]) => (
                      <span key={eventName} className="admin-chip">
                        {eventName}: {count}
                      </span>
                    ))
                  )}
                </div>
                {usageTelemetryPublishState.message ? (
                  <p
                    className={
                      usageTelemetryPublishState.status === 'error'
                        ? 'admin-field-error'
                        : usageTelemetryPublishState.status === 'success'
                          ? 'admin-muted'
                          : 'admin-muted'
                    }
                  >
                    {usageTelemetryPublishState.message}
                  </p>
                ) : null}

                {Object.entries(usageTelemetry.bulkActionStats).length > 0 ? (
                  <ul className="admin-list">
                    {Object.entries(usageTelemetry.bulkActionStats).map(([actionKey, stats]) => {
                      const avgSelected = stats.count > 0 ? stats.totalSelectedCount / stats.count : 0;
                      const avgDurationMs = stats.count > 0 ? stats.totalDurationMs / stats.count : 0;
                      const attempts = stats.totalSuccessCount + stats.totalFailureCount;
                      const failureRate = attempts > 0 ? (stats.totalFailureCount / attempts) * 100 : 0;
                      return (
                        <li key={actionKey} className="admin-list-item">
                          <div className="admin-row admin-space-between">
                            <strong>{actionKey}</strong>
                            <span className="admin-chip">runs: {stats.count}</span>
                          </div>
                          <div className="admin-row">
                            <span className="admin-chip">avg selected: {avgSelected.toFixed(1)}</span>
                            <span className="admin-chip">avg duration: {Math.round(avgDurationMs)}ms</span>
                            <span className="admin-chip">success: {stats.totalSuccessCount}</span>
                            <span className="admin-chip">failures: {stats.totalFailureCount}</span>
                            <span className="admin-chip">failure rate: {failureRate.toFixed(1)}%</span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}

                {usageTelemetry.recentEvents.length > 0 ? (
                  <>
                    <h4>Recent Local Events</h4>
                    <ul className="admin-list">
                      {usageTelemetry.recentEvents
                        .slice()
                        .reverse()
                        .slice(0, 8)
                        .map((event, index) => (
                          <li key={`${event.name}-${event.at}-${index}`} className="admin-list-item">
                            <div className="admin-row admin-space-between">
                              <strong>{event.name}</strong>
                              <span className="admin-chip">{formatTimestamp(event.at)}</span>
                            </div>
                            {event.metadata ? (
                              <div className="admin-row">
                                {Object.entries(event.metadata).map(([key, value]) => (
                                  <span key={`${event.name}-${event.at}-${key}`} className="admin-chip">
                                    {key}: {String(value)}
                                  </span>
                                ))}
                              </div>
                            ) : null}
                          </li>
                        ))}
                    </ul>
                  </>
                ) : null}
              </>
            ) : (
              <p className="admin-muted">Loading local telemetry snapshot...</p>
            )}
          </article>
        </>
      ) : null}
    </>
  );
}
