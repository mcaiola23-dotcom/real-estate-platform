export type AdminWorkspaceTab = 'launch' | 'support' | 'billing' | 'access' | 'health' | 'audit';

export interface ActionCenterItem {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  detail: string;
  tab: AdminWorkspaceTab;
  sectionId?: string;
}

export interface ActionCenterInput {
  hasSelectedTenant: boolean;
  tenantStatus?: 'active' | 'suspended' | 'archived';
  settingsStatus?: 'active' | 'archived';
  hasPrimaryDomain: boolean;
  dnsStatus?: 'verified' | 'pending' | 'missing';
  certificateStatus?: 'ready' | 'pending' | 'blocked';
  billingDriftCount: number;
  diagnosticsLoaded: boolean;
  diagnosticsFailedCount: number;
  diagnosticsWarningCount: number;
  actorCount: number;
  onboardingLoaded?: boolean;
  onboardingPlanExists?: boolean;
  onboardingPlanStatus?: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  onboardingRequiredBlockedCount?: number;
  onboardingRequiredOverdueCount?: number;
  onboardingRequiredUnassignedCount?: number;
}

const severityRank: Record<ActionCenterItem['severity'], number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

export function buildActionCenterItems(input: ActionCenterInput): ActionCenterItem[] {
  const items: ActionCenterItem[] = [];

  if (!input.hasSelectedTenant) {
    return [
      {
        id: 'select-tenant',
        severity: 'info',
        title: 'Create or select a tenant',
        detail: 'Start in Create a Tenant or Tenant Directory to unlock launch setup and operational tools.',
        tab: 'launch',
        sectionId: 'create-tenant',
      },
    ];
  }

  if (input.tenantStatus !== 'active') {
    items.push({
      id: 'tenant-archived',
      severity: 'critical',
      title: 'Tenant is archived',
      detail: 'Restore tenant status before launch setup, billing updates, or diagnostics actions.',
      tab: 'launch',
      sectionId: 'launch-setup',
    });
  }

  if (input.settingsStatus !== 'active') {
    items.push({
      id: 'settings-archived',
      severity: 'critical',
      title: 'Tenant settings are archived',
      detail: 'Restore settings status so plan and feature changes can be saved.',
      tab: 'launch',
      sectionId: 'launch-setup',
    });
  }

  if (!input.hasPrimaryDomain) {
    items.push({
      id: 'no-primary-domain',
      severity: 'critical',
      title: 'Primary domain not configured',
      detail: 'Attach a domain and set a primary hostname in Launch Setup before go-live.',
      tab: 'launch',
      sectionId: 'launch-setup',
    });
  } else if (input.dnsStatus !== 'verified') {
    items.push({
      id: 'dns-unverified',
      severity: 'critical',
      title: 'Primary domain DNS not verified',
      detail: `DNS status is ${input.dnsStatus ?? 'pending'}. Run Domain Status polling and complete DNS configuration.`,
      tab: 'launch',
      sectionId: 'launch-setup',
    });
  } else if (input.certificateStatus !== 'ready') {
    items.push({
      id: 'tls-not-ready',
      severity: 'warning',
      title: 'Certificate readiness is not complete',
      detail: `TLS/certificate status is ${input.certificateStatus ?? 'pending'}. Re-run probe and confirm SSL issuance.`,
      tab: 'launch',
      sectionId: 'launch-setup',
    });
  }

  if (input.billingDriftCount > 0) {
    items.push({
      id: 'billing-drift',
      severity: 'warning',
      title: `Billing entitlement drift detected (${input.billingDriftCount})`,
      detail: 'Review drift triage and reconcile missing/extra flags before billing escalations.',
      tab: 'billing',
      sectionId: 'billing',
    });
  }

  if (!input.diagnosticsLoaded) {
    items.push({
      id: 'diagnostics-not-run',
      severity: 'info',
      title: 'Diagnostics not loaded yet',
      detail: 'Run tenant diagnostics to capture auth/domain/ingestion health before launch review.',
      tab: 'support',
      sectionId: 'tenant-diagnostics',
    });
  } else if (input.diagnosticsFailedCount > 0) {
    items.push({
      id: 'diagnostics-failed',
      severity: 'critical',
      title: `Diagnostics failures (${input.diagnosticsFailedCount})`,
      detail: 'Open Troubleshooting & Repairs and run remediation for failed checks.',
      tab: 'support',
      sectionId: 'tenant-diagnostics',
    });
  } else if (input.diagnosticsWarningCount > 0) {
    items.push({
      id: 'diagnostics-warning',
      severity: 'warning',
      title: `Diagnostics warnings (${input.diagnosticsWarningCount})`,
      detail: 'Review warning checks and confirm whether remediation is needed before launch.',
      tab: 'support',
      sectionId: 'tenant-diagnostics',
    });
  }

  if (input.actorCount === 0) {
    items.push({
      id: 'no-actors',
      severity: 'warning',
      title: 'No tenant actors configured',
      detail: 'Add at least one operator/support actor so the tenant can be supported after launch.',
      tab: 'access',
      sectionId: 'access',
    });
  }

  if (input.onboardingLoaded) {
    if (!input.onboardingPlanExists) {
      items.push({
        id: 'onboarding-plan-missing',
        severity: 'warning',
        title: 'No persisted onboarding plan',
        detail: 'Create a tenant onboarding plan from the Launch checklist template to track task completion durably.',
        tab: 'launch',
        sectionId: 'launch-setup',
      });
    } else {
      if (input.onboardingPlanStatus === 'paused') {
        items.push({
          id: 'onboarding-plan-paused',
          severity: 'warning',
          title: 'Onboarding plan is paused',
          detail: 'Resume onboarding when blockers are cleared so launch task tracking stays current.',
          tab: 'launch',
          sectionId: 'launch-setup',
        });
      }

      if ((input.onboardingRequiredBlockedCount ?? 0) > 0) {
        items.push({
          id: 'onboarding-blocked-tasks',
          severity: 'critical',
          title: `Blocked onboarding tasks (${input.onboardingRequiredBlockedCount})`,
          detail: 'Resolve blocked required onboarding tasks before go-live readiness review.',
          tab: 'launch',
          sectionId: 'launch-setup',
        });
      }

      if ((input.onboardingRequiredOverdueCount ?? 0) > 0) {
        items.push({
          id: 'onboarding-overdue-tasks',
          severity: 'critical',
          title: `Overdue onboarding tasks (${input.onboardingRequiredOverdueCount})`,
          detail: 'Review due dates and complete overdue required onboarding tasks.',
          tab: 'launch',
          sectionId: 'launch-setup',
        });
      }

      if ((input.onboardingRequiredUnassignedCount ?? 0) > 0) {
        items.push({
          id: 'onboarding-unassigned-tasks',
          severity: 'warning',
          title: `Unassigned onboarding tasks (${input.onboardingRequiredUnassignedCount})`,
          detail: 'Assign owners to required onboarding tasks so launch responsibilities are clear.',
          tab: 'launch',
          sectionId: 'launch-setup',
        });
      }
    }
  }

  if (items.length === 0) {
    items.push({
      id: 'launch-track',
      severity: 'info',
      title: 'No major blockers detected',
      detail: 'Tenant appears launch-ready from current signals. Review final content/domain state before go-live.',
      tab: 'launch',
      sectionId: 'launch-setup',
    });
  }

  return items.sort((left, right) => severityRank[left.severity] - severityRank[right.severity]);
}
