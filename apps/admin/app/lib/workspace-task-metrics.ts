import type { AdminWorkspaceTab } from './action-center';

export interface WorkspaceTaskMetric {
  id: AdminWorkspaceTab;
  label: string;
  count: number;
  countLabel: string;
}

export interface WorkspaceTaskMetricInput {
  launchReadinessPercent: number;
  supportAlertCount: number;
  billingDriftCount: number;
  actorCount: number;
  deadLetterCount: number;
  auditEventCount: number;
}

export function buildWorkspaceTaskMetrics(input: WorkspaceTaskMetricInput): WorkspaceTaskMetric[] {
  return [
    { id: 'launch', label: 'Create & Launch', count: input.launchReadinessPercent, countLabel: '% readiness' },
    { id: 'support', label: 'Support', count: input.supportAlertCount, countLabel: ' alerts' },
    { id: 'billing', label: 'Billing', count: input.billingDriftCount, countLabel: ' drift' },
    { id: 'access', label: 'Access', count: input.actorCount, countLabel: ' actors' },
    { id: 'health', label: 'Platform Health', count: input.deadLetterCount, countLabel: ' dead-letter' },
    { id: 'audit', label: 'Audit Log', count: input.auditEventCount, countLabel: ' events' },
  ];
}
