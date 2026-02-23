import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ADMIN_BULK_ENDPOINT_RECOMMENDATION_THRESHOLDS,
  ADMIN_USAGE_TELEMETRY_POLICY,
  buildAdminBulkEndpointRecommendation,
  buildAdminUsageTelemetryRollupAlignmentNote,
} from './admin-usage-telemetry';

test('bulk endpoint recommendation defers when total runs are below tuned minimum threshold', () => {
  const recommendation = buildAdminBulkEndpointRecommendation(
    {
      status: {
        count: ADMIN_BULK_ENDPOINT_RECOMMENDATION_THRESHOLDS.minRunsForDecision - 1,
        totalSelectedCount: 24,
        totalEligibleCount: 24,
        totalSuccessCount: 24,
        totalFailureCount: 0,
        totalDurationMs: 9_000,
      },
    },
    'local browser telemetry'
  );

  assert.equal(recommendation.level, 'info');
  assert.equal(recommendation.metrics.runCount, ADMIN_BULK_ENDPOINT_RECOMMENDATION_THRESHOLDS.minRunsForDecision - 1);
  assert.match(recommendation.summary, /deferred/i);
});

test('bulk endpoint recommendation stays ok when evidence is sufficient and metrics stay under thresholds', () => {
  const runs = ADMIN_BULK_ENDPOINT_RECOMMENDATION_THRESHOLDS.minRunsForDecision;
  const recommendation = buildAdminBulkEndpointRecommendation(
    {
      status: {
        count: runs,
        totalSelectedCount: runs * (ADMIN_BULK_ENDPOINT_RECOMMENDATION_THRESHOLDS.avgSelectedWarnAt - 2),
        totalEligibleCount: runs * (ADMIN_BULK_ENDPOINT_RECOMMENDATION_THRESHOLDS.avgSelectedWarnAt - 2),
        totalSuccessCount: runs * 5,
        totalFailureCount: 0,
        totalDurationMs: runs * (ADMIN_BULK_ENDPOINT_RECOMMENDATION_THRESHOLDS.avgDurationWarnMs - 1_000),
      },
    },
    'server published telemetry (14d window)'
  );

  assert.equal(recommendation.level, 'ok');
  assert.match(recommendation.summary, /PATCH/);
});

test('bulk endpoint recommendation warns when failure rate crosses tuned threshold', () => {
  const runs = ADMIN_BULK_ENDPOINT_RECOMMENDATION_THRESHOLDS.minRunsForDecision;
  const recommendation = buildAdminBulkEndpointRecommendation(
    {
      owner_role_actor: {
        count: runs,
        totalSelectedCount: runs * 10,
        totalEligibleCount: runs * 10,
        totalSuccessCount: 90,
        totalFailureCount: 10,
        totalDurationMs: runs * 2_000,
      },
    },
    'local browser telemetry'
  );

  assert.equal(recommendation.level, 'warn');
  assert.match(recommendation.detail, /failure rate 10\.0%/);
});

test('rollup alignment note confirms the recommended 14-day window spans two weekly review cycles', () => {
  const note = buildAdminUsageTelemetryRollupAlignmentNote(ADMIN_USAGE_TELEMETRY_POLICY.recommendedRollupWindowDays);

  assert.equal(note.level, 'info');
  assert.match(note.summary, /two weekly review cycles/i);
});

test('rollup alignment note warns when the rollup window exceeds suggested retention', () => {
  const note = buildAdminUsageTelemetryRollupAlignmentNote(
    ADMIN_USAGE_TELEMETRY_POLICY.recommendedServerRetentionDays + 1
  );

  assert.equal(note.level, 'warn');
  assert.match(note.summary, /exceeds suggested server retention/i);
});
