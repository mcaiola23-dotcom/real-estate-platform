import type { Tenant, TenantDomain } from './tenant';

export interface TenantControlSettings {
  id: string;
  tenantId: string;
  status: 'active' | 'archived';
  planCode: string;
  featureFlags: string[];
  createdAt: string;
  updatedAt: string;
}

export type TenantOnboardingPlanStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived';

export type TenantOnboardingTaskStatus = 'pending' | 'in_progress' | 'blocked' | 'done' | 'skipped';

export type TenantOnboardingTaskPriority = 'critical' | 'high' | 'normal' | 'low';

export type TenantOnboardingOwnerRole = 'sales' | 'ops' | 'build' | 'client';

export interface TenantOnboardingPlan {
  id: string;
  tenantId: string;
  status: TenantOnboardingPlanStatus;
  planCode: string;
  startedAt: string | null;
  targetLaunchDate: string | null;
  completedAt: string | null;
  pausedAt: string | null;
  pauseReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TenantOnboardingTask {
  id: string;
  tenantOnboardingPlanId: string;
  tenantId: string;
  taskKey: string;
  title: string;
  description: string | null;
  status: TenantOnboardingTaskStatus;
  priority: TenantOnboardingTaskPriority;
  required: boolean;
  ownerRole: TenantOnboardingOwnerRole;
  ownerActorId: string | null;
  dueAt: string | null;
  blockedByClient: boolean;
  blockerReason: string | null;
  sortOrder: number;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TenantOnboardingPlanTaskSeedInput {
  taskKey: string;
  title: string;
  description?: string | null;
  required: boolean;
  ownerRole: TenantOnboardingOwnerRole;
  priority?: TenantOnboardingTaskPriority;
  sortOrder?: number;
  dueAt?: string | null;
}

export interface CreateTenantOnboardingPlanFromTemplateInput {
  planCode: string;
  status?: TenantOnboardingPlanStatus;
  startedAt?: string | null;
  targetLaunchDate?: string | null;
  pauseReason?: string | null;
  tasks: TenantOnboardingPlanTaskSeedInput[];
}

export interface UpdateTenantOnboardingPlanInput {
  status?: TenantOnboardingPlanStatus;
  targetLaunchDate?: string | null;
  pauseReason?: string | null;
}

export interface UpdateTenantOnboardingTaskInput {
  status?: TenantOnboardingTaskStatus;
  priority?: TenantOnboardingTaskPriority;
  ownerRole?: TenantOnboardingOwnerRole;
  ownerActorId?: string | null;
  dueAt?: string | null;
  blockedByClient?: boolean;
  blockerReason?: string | null;
  title?: string;
  description?: string | null;
}

export interface TenantOnboardingPlanWithTasks {
  plan: TenantOnboardingPlan;
  tasks: TenantOnboardingTask[];
}

export interface ControlPlaneTenantSnapshot {
  tenant: Tenant;
  domains: TenantDomain[];
  settings: TenantControlSettings;
}

export interface CreateTenantProvisioningInput {
  slug: string;
  name: string;
  primaryDomain: string;
  planCode?: string;
  featureFlags?: string[];
}

export interface AddTenantDomainInput {
  hostname: string;
  isPrimary?: boolean;
  isVerified?: boolean;
}

export type DomainDnsProbeStatus = 'verified' | 'pending' | 'missing';

export type DomainCertificateProbeStatus = 'ready' | 'pending' | 'blocked';

export interface TenantDomainProbeResult {
  domainId: string;
  hostname: string;
  isPrimary: boolean;
  persistedVerified: boolean;
  checkedAt: string;
  dnsStatus: DomainDnsProbeStatus;
  dnsMessage: string;
  certificateStatus: DomainCertificateProbeStatus;
  certificateMessage: string;
  certificateValidTo: string | null;
  observedRecords: string[];
}

export interface UpdateTenantControlSettingsInput {
  planCode?: string;
  featureFlags?: string[];
  status?: 'active' | 'archived';
}

export type TenantSupportDiagnosticCategory = 'auth' | 'domain' | 'ingestion';

export type TenantSupportDiagnosticStatus = 'ok' | 'warning' | 'failed';

export type TenantSupportRemediationAction =
  | 'domain.mark_primary_verified'
  | 'ingestion.requeue_dead_letters'
  | 'ingestion.schedule_pending_now';

export interface TenantSupportDiagnosticRemediation {
  action: TenantSupportRemediationAction;
  label: string;
  detail: string;
}

export interface TenantSupportDiagnosticCheck {
  id: string;
  category: TenantSupportDiagnosticCategory;
  status: TenantSupportDiagnosticStatus;
  label: string;
  detail: string;
  remediation: TenantSupportDiagnosticRemediation[];
}

export interface TenantSupportDiagnosticsSummary {
  tenantId: string;
  generatedAt: string;
  overallStatus: TenantSupportDiagnosticStatus;
  counts: {
    ok: number;
    warning: number;
    failed: number;
  };
  checks: TenantSupportDiagnosticCheck[];
}

export interface TenantSupportRemediationResult {
  action: TenantSupportRemediationAction;
  ok: boolean;
  message: string;
  changedCount?: number;
}

export type TenantBillingSubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled';

export type TenantBillingPaymentStatus = 'pending' | 'paid' | 'past_due' | 'unpaid';

export interface TenantBillingSubscription {
  id: string;
  tenantId: string;
  planCode: string;
  status: TenantBillingSubscriptionStatus;
  paymentStatus: TenantBillingPaymentStatus;
  billingProvider: string;
  billingCustomerId: string | null;
  billingSubscriptionId: string | null;
  trialEndsAt: string | null;
  currentPeriodEndsAt: string | null;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
}

export type TenantBillingProvider = 'manual' | 'stripe';

export interface UpdateTenantBillingSubscriptionInput {
  planCode?: string;
  status?: TenantBillingSubscriptionStatus;
  paymentStatus?: TenantBillingPaymentStatus;
  billingProvider?: string;
  billingCustomerId?: string | null;
  billingSubscriptionId?: string | null;
  trialEndsAt?: string | null;
  currentPeriodEndsAt?: string | null;
  cancelAtPeriodEnd?: boolean;
  entitlementFlags?: string[];
  syncEntitlements?: boolean;
}

export interface TenantBillingProviderEventInput {
  provider: TenantBillingProvider;
  eventId: string;
  eventType: string;
  tenantId?: string;
  billingCustomerId?: string | null;
  billingSubscriptionId?: string | null;
  subscription?: {
    planCode?: string;
    status?: TenantBillingSubscriptionStatus;
    paymentStatus?: TenantBillingPaymentStatus;
    trialEndsAt?: string | null;
    currentPeriodEndsAt?: string | null;
    cancelAtPeriodEnd?: boolean;
  };
  entitlementFlags?: string[];
  syncEntitlements?: boolean;
  metadata?: Record<string, unknown>;
}

export type TenantBillingEntitlementDriftMode = 'compared' | 'provider_missing' | 'tenant_unresolved';

export interface TenantBillingEntitlementDriftSummary {
  mode: TenantBillingEntitlementDriftMode;
  evaluatedAt: string;
  hasDrift: boolean;
  providerEntitlementFlags: string[];
  persistedEntitlementFlags: string[];
  missingInTenantSettings: string[];
  extraInTenantSettings: string[];
}

export interface TenantBillingProviderEventResult {
  provider: TenantBillingProvider;
  eventId: string;
  eventType: string;
  tenantId: string | null;
  duplicate: boolean;
  applied: boolean;
  message: string;
  subscription: TenantBillingSubscription | null;
  entitlementDrift: TenantBillingEntitlementDriftSummary | null;
}

export type ControlPlaneActorRole = 'admin' | 'operator' | 'support' | 'viewer';

export type ControlPlaneActorPermission =
  | 'tenant.onboarding.manage'
  | 'tenant.domain.manage'
  | 'tenant.settings.manage'
  | 'tenant.audit.read'
  | 'tenant.observability.read'
  | 'tenant.support-session.start';

export interface TenantControlActor {
  id: string;
  tenantId: string;
  actorId: string;
  displayName: string | null;
  email: string | null;
  role: ControlPlaneActorRole;
  permissions: ControlPlaneActorPermission[];
  supportSessionActive: boolean;
  supportSessionStartedAt: string | null;
  supportSessionExpiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertTenantControlActorInput {
  actorId: string;
  displayName?: string | null;
  email?: string | null;
  role: ControlPlaneActorRole;
  permissions?: ControlPlaneActorPermission[];
}

export interface UpdateTenantControlActorInput {
  displayName?: string | null;
  email?: string | null;
  role?: ControlPlaneActorRole;
  permissions?: ControlPlaneActorPermission[];
}

export interface TenantSupportSessionUpdateInput {
  active: boolean;
  durationMinutes?: number;
}

export type ControlPlaneAdminAuditAction =
  | 'tenant.provision'
  | 'tenant.status.update'
  | 'tenant.domain.add'
  | 'tenant.domain.update'
  | 'tenant.settings.update'
  | 'tenant.onboarding.plan.create'
  | 'tenant.onboarding.plan.update'
  | 'tenant.onboarding.task.update'
  | 'tenant.billing.update'
  | 'tenant.billing.sync'
  | 'tenant.diagnostics.remediate'
  | 'tenant.actor.add'
  | 'tenant.actor.update'
  | 'tenant.actor.remove'
  | 'tenant.support-session.start'
  | 'tenant.support-session.end'
  | 'tenant.observability.telemetry.publish';

export type ControlPlaneAdminAuditStatus = 'allowed' | 'denied' | 'succeeded' | 'failed';

export interface CreateControlPlaneAdminAuditEventInput {
  action: ControlPlaneAdminAuditAction;
  status: ControlPlaneAdminAuditStatus;
  actorId?: string | null;
  actorRole: string;
  tenantId?: string;
  domainId?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface ControlPlaneAdminAuditEvent {
  id: string;
  action: ControlPlaneAdminAuditAction;
  status: ControlPlaneAdminAuditStatus;
  actorId: string | null;
  actorRole: string;
  tenantId: string | null;
  domainId: string | null;
  error: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface ControlPlaneMutationTrend {
  status: ControlPlaneAdminAuditStatus;
  count: number;
}

export interface ControlPlaneIngestionStatusCount {
  status: 'pending' | 'processing' | 'processed' | 'dead_letter';
  count: number;
}

export interface ControlPlaneTenantReadinessScore {
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  score: number;
  onboarding: {
    planStatus: TenantOnboardingPlanStatus | 'none';
    requiredTaskCount: number;
    completedRequiredTaskCount: number;
    incompleteRequiredTaskCount: number;
    blockedRequiredTasks: number;
    overdueRequiredTasks: number;
    unassignedRequiredTasks: number;
  };
  checks: Array<{
    label: string;
    ok: boolean;
  }>;
}

export interface ControlPlaneOnboardingObservabilitySummary {
  tenantsWithPersistedPlan: number;
  activePlans: number;
  pausedPlans: number;
  completedPlans: number;
  blockedRequiredTasks: number;
  overdueRequiredTasks: number;
  unassignedRequiredTasks: number;
}

export interface ControlPlaneBillingDriftModeCounts {
  compared: number;
  provider_missing: number;
  tenant_unresolved: number;
}

export interface ControlPlaneBillingDriftTenantSummary {
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  driftEvents: number;
  missingFlagCount: number;
  extraFlagCount: number;
  modeCounts: ControlPlaneBillingDriftModeCounts;
  latestDriftAt: string | null;
}

export interface ControlPlaneBillingDriftSummary {
  windowDays: number;
  generatedAt: string;
  totals: {
    driftEvents: number;
    tenantsWithDrift: number;
    missingFlagCount: number;
    extraFlagCount: number;
    modeCounts: ControlPlaneBillingDriftModeCounts;
  };
  byTenant: ControlPlaneBillingDriftTenantSummary[];
}

export interface ControlPlaneOnboardingUsageTelemetryObservabilitySummary {
  windowDays: number;
  publishCount: number;
  latestPublishedAt: string | null;
  totals: {
    recentEventCount: number;
    publishedEventTypeCount: number;
    publishedBulkActionTypeCount: number;
  };
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
}

export interface ControlPlaneObservabilitySummary {
  generatedAt: string;
  totals: {
    tenants: number;
    domains: number;
    verifiedPrimaryDomains: number;
    averageReadinessScore: number;
  };
  mutationTrends: ControlPlaneMutationTrend[];
  ingestion: {
    runtimeReady: boolean;
    runtimeReason: string | null;
    runtimeMessage: string;
    queueStatusCounts: ControlPlaneIngestionStatusCount[];
    deadLetterCount: number;
  };
  billingDrift: ControlPlaneBillingDriftSummary;
  onboarding: ControlPlaneOnboardingObservabilitySummary;
  onboardingUsageTelemetry: ControlPlaneOnboardingUsageTelemetryObservabilitySummary;
  tenantReadiness: ControlPlaneTenantReadinessScore[];
}
