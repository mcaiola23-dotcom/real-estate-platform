import assert from 'node:assert/strict';
import test from 'node:test';

import { buildWorkspaceTaskMetrics } from './workspace-task-metrics';

test('buildWorkspaceTaskMetrics returns stable tab ordering and labels', () => {
  const metrics = buildWorkspaceTaskMetrics({
    launchReadinessPercent: 67,
    supportAlertCount: 3,
    billingDriftCount: 2,
    actorCount: 4,
    deadLetterCount: 1,
    auditEventCount: 25,
  });

  assert.deepEqual(
    metrics.map((metric) => metric.id),
    ['launch', 'support', 'billing', 'access', 'health', 'audit']
  );
  assert.deepEqual(
    metrics.map((metric) => `${metric.label}:${metric.count}${metric.countLabel}`),
    [
      'Create & Launch:67% readiness',
      'Support:3 alerts',
      'Billing:2 drift',
      'Access:4 actors',
      'Platform Health:1 dead-letter',
      'Audit Log:25 events',
    ]
  );
});
