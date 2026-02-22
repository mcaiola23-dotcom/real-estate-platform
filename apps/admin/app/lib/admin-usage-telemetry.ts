export type AdminUsageTelemetryEventName =
  | 'onboarding.triage.open_launch.readiness'
  | 'onboarding.triage.open_launch.triage'
  | 'onboarding.bulk.status'
  | 'onboarding.bulk.owner_role'
  | 'onboarding.bulk.owner_actor'
  | 'onboarding.bulk.owner_role_actor';

export interface AdminUsageTelemetrySnapshot {
  version: 1;
  updatedAt: string;
  countsByEvent: Partial<Record<AdminUsageTelemetryEventName, number>>;
  lastEventAtByEvent: Partial<Record<AdminUsageTelemetryEventName, string>>;
  bulkActionStats: Partial<
    Record<
      'status' | 'owner_role' | 'owner_actor' | 'owner_role_actor',
      {
        count: number;
        totalSelectedCount: number;
        totalEligibleCount: number;
        totalSuccessCount: number;
        totalFailureCount: number;
        totalDurationMs: number;
      }
    >
  >;
  recentEvents: Array<{
    name: AdminUsageTelemetryEventName;
    at: string;
    metadata?: Record<string, number | string | boolean | null>;
  }>;
}

export type AdminUsageTelemetryBulkActionKey = 'status' | 'owner_role' | 'owner_actor' | 'owner_role_actor';

export interface AdminUsageTelemetryBulkActionStats {
  count: number;
  totalSelectedCount: number;
  totalEligibleCount: number;
  totalSuccessCount: number;
  totalFailureCount: number;
  totalDurationMs: number;
}

export interface AdminUsageTelemetryPublishAggregate {
  version: 1;
  generatedAt: string;
  localSnapshotUpdatedAt: string;
  recentEventCount: number;
  countsByEvent: Partial<Record<AdminUsageTelemetryEventName, number>>;
  bulkActionStats: Partial<Record<AdminUsageTelemetryBulkActionKey, AdminUsageTelemetryBulkActionStats>>;
  policy: {
    storage: 'browser_local';
    promotionMode: 'manual_aggregate_opt_in';
    includesRecentEvents: false;
    includesTenantIds: false;
    retention: 'server_audit_retention_policy';
  };
}

const STORAGE_KEY = 'admin-usage-telemetry.v1';
const MAX_RECENT_EVENTS = 40;

export const ADMIN_USAGE_TELEMETRY_POLICY = {
  localStorageKey: STORAGE_KEY,
  storage: 'browser_local',
  promotionMode: 'manual_aggregate_opt_in',
  includesRecentEventsInPublish: false,
  includesTenantIdsInPublish: false,
  recommendedServerRetentionDays: 30,
} as const;

export const ADMIN_BULK_ENDPOINT_RECOMMENDATION_THRESHOLDS = {
  minRunsForDecision: 10,
  avgSelectedWarnAt: 15,
  avgDurationWarnMs: 8_000,
  failureRateWarnRatio: 0.15,
} as const;

export interface AdminBulkEndpointRecommendation {
  level: 'info' | 'ok' | 'warn';
  summary: string;
  detail: string;
  metrics: {
    runCount: number;
    avgSelectedCount: number;
    avgDurationMs: number;
    failureRateRatio: number;
  };
}

function defaultSnapshot(): AdminUsageTelemetrySnapshot {
  return {
    version: 1,
    updatedAt: new Date(0).toISOString(),
    countsByEvent: {},
    lastEventAtByEvent: {},
    bulkActionStats: {},
    recentEvents: [],
  };
}

function listBulkActionStats(
  bulkActionStats: Partial<Record<AdminUsageTelemetryBulkActionKey, AdminUsageTelemetryBulkActionStats>> | undefined
): AdminUsageTelemetryBulkActionStats[] {
  return Object.values(bulkActionStats ?? {});
}

function sanitizeMetadata(
  metadata: Record<string, unknown> | undefined
): Record<string, number | string | boolean | null> | undefined {
  if (!metadata) {
    return undefined;
  }

  const entries = Object.entries(metadata).flatMap(([key, value]) => {
    if (
      value === null ||
      typeof value === 'number' ||
      typeof value === 'string' ||
      typeof value === 'boolean'
    ) {
      return [[key, value] as const];
    }
    return [];
  });

  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

export function readAdminUsageTelemetrySnapshot(): AdminUsageTelemetrySnapshot {
  if (typeof window === 'undefined') {
    return defaultSnapshot();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultSnapshot();
    }
    const parsed = JSON.parse(raw) as Partial<AdminUsageTelemetrySnapshot> | null;
    if (!parsed || parsed.version !== 1) {
      return defaultSnapshot();
    }
    return {
      ...defaultSnapshot(),
      ...parsed,
      countsByEvent: parsed.countsByEvent ?? {},
      lastEventAtByEvent: parsed.lastEventAtByEvent ?? {},
      bulkActionStats: parsed.bulkActionStats ?? {},
      recentEvents: Array.isArray(parsed.recentEvents) ? parsed.recentEvents.slice(-MAX_RECENT_EVENTS) : [],
    };
  } catch {
    return defaultSnapshot();
  }
}

export function recordAdminUsageEvent(
  name: AdminUsageTelemetryEventName,
  metadata?: Record<string, unknown>
): AdminUsageTelemetrySnapshot {
  const snapshot = readAdminUsageTelemetrySnapshot();
  const now = new Date().toISOString();
  const safeMetadata = sanitizeMetadata(metadata);

  snapshot.updatedAt = now;
  snapshot.countsByEvent[name] = (snapshot.countsByEvent[name] ?? 0) + 1;
  snapshot.lastEventAtByEvent[name] = now;
  snapshot.recentEvents = [...snapshot.recentEvents, { name, at: now, metadata: safeMetadata }].slice(-MAX_RECENT_EVENTS);

  const bulkEventToKey: Partial<Record<AdminUsageTelemetryEventName, keyof AdminUsageTelemetrySnapshot['bulkActionStats']>> = {
    'onboarding.bulk.status': 'status',
    'onboarding.bulk.owner_role': 'owner_role',
    'onboarding.bulk.owner_actor': 'owner_actor',
    'onboarding.bulk.owner_role_actor': 'owner_role_actor',
  };
  const bulkKey = bulkEventToKey[name];
  if (bulkKey) {
    const current = snapshot.bulkActionStats[bulkKey] ?? {
      count: 0,
      totalSelectedCount: 0,
      totalEligibleCount: 0,
      totalSuccessCount: 0,
      totalFailureCount: 0,
      totalDurationMs: 0,
    };
    current.count += 1;
    current.totalSelectedCount += typeof safeMetadata?.selectedCount === 'number' ? safeMetadata.selectedCount : 0;
    current.totalEligibleCount += typeof safeMetadata?.eligibleCount === 'number' ? safeMetadata.eligibleCount : 0;
    current.totalSuccessCount += typeof safeMetadata?.successCount === 'number' ? safeMetadata.successCount : 0;
    current.totalFailureCount += typeof safeMetadata?.failureCount === 'number' ? safeMetadata.failureCount : 0;
    current.totalDurationMs += typeof safeMetadata?.durationMs === 'number' ? safeMetadata.durationMs : 0;
    snapshot.bulkActionStats[bulkKey] = current;
  }

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
      // Ignore storage quota/privacy errors; telemetry is best-effort only.
    }
  }

  return snapshot;
}

export function clearAdminUsageTelemetrySnapshot(): AdminUsageTelemetrySnapshot {
  const snapshot = defaultSnapshot();
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage quota/privacy errors; telemetry reset is best-effort only.
    }
  }
  return snapshot;
}

export function buildAdminUsageTelemetryPublishAggregate(
  snapshot: AdminUsageTelemetrySnapshot
): AdminUsageTelemetryPublishAggregate {
  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    localSnapshotUpdatedAt: snapshot.updatedAt,
    recentEventCount: snapshot.recentEvents.length,
    countsByEvent: snapshot.countsByEvent,
    bulkActionStats: snapshot.bulkActionStats,
    policy: {
      storage: 'browser_local',
      promotionMode: 'manual_aggregate_opt_in',
      includesRecentEvents: false,
      includesTenantIds: false,
      retention: 'server_audit_retention_policy',
    },
  };
}

export function buildAdminBulkEndpointRecommendation(
  bulkActionStats: Partial<Record<AdminUsageTelemetryBulkActionKey, AdminUsageTelemetryBulkActionStats>> | undefined,
  sourceLabel: string
): AdminBulkEndpointRecommendation {
  const statsList = listBulkActionStats(bulkActionStats);
  if (statsList.length === 0) {
    return {
      level: 'info',
      summary: `No onboarding bulk-action telemetry recorded in ${sourceLabel}.`,
      detail: `Use Launch checklist bulk actions to collect ${sourceLabel} evidence before deciding on a backend bulk endpoint.`,
      metrics: {
        runCount: 0,
        avgSelectedCount: 0,
        avgDurationMs: 0,
        failureRateRatio: 0,
      },
    };
  }

  const totals = statsList.reduce(
    (acc, entry) => {
      acc.count += entry.count;
      acc.selected += entry.totalSelectedCount;
      acc.success += entry.totalSuccessCount;
      acc.failure += entry.totalFailureCount;
      acc.durationMs += entry.totalDurationMs;
      return acc;
    },
    { count: 0, selected: 0, success: 0, failure: 0, durationMs: 0 }
  );

  const avgSelected = totals.count > 0 ? totals.selected / totals.count : 0;
  const avgDurationMs = totals.count > 0 ? totals.durationMs / totals.count : 0;
  const failureRate = totals.success + totals.failure > 0 ? totals.failure / (totals.success + totals.failure) : 0;
  const metrics = {
    runCount: totals.count,
    avgSelectedCount: avgSelected,
    avgDurationMs,
    failureRateRatio: failureRate,
  };

  if (totals.count < ADMIN_BULK_ENDPOINT_RECOMMENDATION_THRESHOLDS.minRunsForDecision) {
    return {
      level: 'info',
      summary: 'Insufficient telemetry to justify a bulk API endpoint yet.',
      detail: `Observed ${totals.count} bulk actions in ${sourceLabel} (avg selected ${avgSelected.toFixed(
        1
      )}, avg duration ${Math.round(avgDurationMs)}ms). Collect more usage before changing the API surface.`,
      metrics,
    };
  }

  if (
    avgSelected >= ADMIN_BULK_ENDPOINT_RECOMMENDATION_THRESHOLDS.avgSelectedWarnAt ||
    avgDurationMs >= ADMIN_BULK_ENDPOINT_RECOMMENDATION_THRESHOLDS.avgDurationWarnMs ||
    failureRate >= ADMIN_BULK_ENDPOINT_RECOMMENDATION_THRESHOLDS.failureRateWarnRatio
  ) {
    return {
      level: 'warn',
      summary: 'Bulk endpoint may be justified soon.',
      detail: `Observed ${totals.count} bulk actions in ${sourceLabel} (avg selected ${avgSelected.toFixed(
        1
      )}, avg duration ${Math.round(avgDurationMs)}ms, failure rate ${(failureRate * 100).toFixed(1)}%).`,
      metrics,
    };
  }

  return {
    level: 'ok',
    summary: 'Current repeated PATCH bulk actions look acceptable.',
    detail: `Observed ${totals.count} bulk actions in ${sourceLabel} (avg selected ${avgSelected.toFixed(
      1
    )}, avg duration ${Math.round(avgDurationMs)}ms, failure rate ${(failureRate * 100).toFixed(1)}%).`,
    metrics,
  };
}

export function buildAdminUsageTelemetryRollupAlignmentNote(windowDays: number): {
  level: 'info' | 'warn';
  summary: string;
} {
  if (windowDays > ADMIN_USAGE_TELEMETRY_POLICY.recommendedServerRetentionDays) {
    return {
      level: 'warn',
      summary: `Telemetry rollup window (${windowDays}d) exceeds suggested server retention (${ADMIN_USAGE_TELEMETRY_POLICY.recommendedServerRetentionDays}d).`,
    };
  }
  return {
    level: 'info',
    summary: `Telemetry rollup window (${windowDays}d) is within suggested server retention (${ADMIN_USAGE_TELEMETRY_POLICY.recommendedServerRetentionDays}d).`,
  };
}
