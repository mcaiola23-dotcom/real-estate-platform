'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import type {
  ControlPlaneActorPermission,
  ControlPlaneActorRole,
  ControlPlaneAdminAuditAction,
  ControlPlaneAdminAuditEvent,
  ControlPlaneAdminAuditStatus,
  ControlPlaneObservabilitySummary,
  ControlPlaneTenantSnapshot,
  TenantBillingPaymentStatus,
  TenantBillingSubscription,
  TenantBillingSubscriptionStatus,
  TenantControlActor,
  TenantSupportDiagnosticsSummary,
  TenantSupportDiagnosticStatus,
  TenantSupportRemediationAction,
  TenantDomainProbeResult,
} from '@real-estate/types/control-plane';
import {
  computeBillingDriftRemediation,
  type BillingDriftRemediationMode,
} from '../lib/billing-drift-remediation';
import {
  createMutationErrorGuidance,
  type MutationErrorField,
  type MutationErrorGuidance,
  type MutationErrorScope,
} from '../lib/mutation-error-guidance';
import {
  enforcePlanGovernance,
  evaluatePlanGovernance,
  planFeatureTemplates,
} from '../lib/plan-governance';

interface ControlPlaneWorkspaceProps {
  initialSnapshots: ControlPlaneTenantSnapshot[];
  hasClerkKey: boolean;
}

interface OnboardingDraft {
  name: string;
  slug: string;
  primaryDomain: string;
  planCode: string;
  featureFlags: string[];
  customFlagsCsv: string;
}

interface ActorDraft {
  actorId: string;
  displayName: string;
  email: string;
  role: ControlPlaneActorRole;
  permissions: ControlPlaneActorPermission[];
}

interface ActorSupportSessionDraft {
  durationMinutes: number;
}

interface BillingDraft {
  planCode: string;
  status: TenantBillingSubscriptionStatus;
  paymentStatus: TenantBillingPaymentStatus;
  billingProvider: string;
  billingCustomerId: string;
  billingSubscriptionId: string;
  trialEndsAt: string;
  currentPeriodEndsAt: string;
  cancelAtPeriodEnd: boolean;
  syncEntitlements: boolean;
}

interface PlanOption {
  code: string;
  label: string;
  summary: string;
}

interface FeatureOption {
  id: string;
  label: string;
  detail: string;
}

const GLOBAL_AUDIT_SCOPE = '__global__';

const auditStatusOptions: ControlPlaneAdminAuditStatus[] = ['allowed', 'denied', 'succeeded', 'failed'];
const auditActionOptions: ControlPlaneAdminAuditAction[] = [
  'tenant.provision',
  'tenant.status.update',
  'tenant.domain.add',
  'tenant.domain.update',
  'tenant.settings.update',
  'tenant.billing.update',
  'tenant.billing.sync',
  'tenant.diagnostics.remediate',
  'tenant.actor.add',
  'tenant.actor.update',
  'tenant.actor.remove',
  'tenant.support-session.start',
  'tenant.support-session.end',
];
const auditActorRoleFilterOptions = ['admin', 'operator', 'support', 'viewer', 'unknown'];

const actorRoleOptions: Array<{ value: ControlPlaneActorRole; label: string }> = [
  { value: 'admin', label: 'Admin' },
  { value: 'operator', label: 'Operator' },
  { value: 'support', label: 'Support' },
  { value: 'viewer', label: 'Viewer' },
];

const actorPermissionOptions: Array<{ id: ControlPlaneActorPermission; label: string; detail: string }> = [
  { id: 'tenant.onboarding.manage', label: 'Onboarding', detail: 'Provision tenants and maintain launch setup.' },
  { id: 'tenant.domain.manage', label: 'Domain Ops', detail: 'Attach domains and manage verification states.' },
  { id: 'tenant.settings.manage', label: 'Settings', detail: 'Edit plan and feature entitlement controls.' },
  { id: 'tenant.audit.read', label: 'Audit Read', detail: 'View mutation audit history for operators.' },
  {
    id: 'tenant.observability.read',
    label: 'Observability Read',
    detail: 'View reliability, queue, and readiness monitoring data.',
  },
  {
    id: 'tenant.support-session.start',
    label: 'Support Session',
    detail: 'Start time-bounded support sessions for tenant troubleshooting.',
  },
];

const roleDefaultPermissions: Record<ControlPlaneActorRole, ControlPlaneActorPermission[]> = {
  admin: [
    'tenant.onboarding.manage',
    'tenant.domain.manage',
    'tenant.settings.manage',
    'tenant.audit.read',
    'tenant.observability.read',
    'tenant.support-session.start',
  ],
  operator: ['tenant.onboarding.manage', 'tenant.domain.manage', 'tenant.settings.manage', 'tenant.audit.read'],
  support: ['tenant.audit.read', 'tenant.observability.read', 'tenant.support-session.start'],
  viewer: ['tenant.audit.read', 'tenant.observability.read'],
};

const defaultSupportSessionDurationMinutes = 30;
const billingSubscriptionStatusOptions: TenantBillingSubscriptionStatus[] = ['trialing', 'active', 'past_due', 'canceled'];
const billingPaymentStatusOptions: TenantBillingPaymentStatus[] = ['pending', 'paid', 'past_due', 'unpaid'];

const onboardingSteps = [
  {
    title: 'Tenant Basics',
    detail: 'Create a clear tenant identity for operators and future customer-facing branding.',
  },
  {
    title: 'Primary Domain',
    detail: 'Set the launch domain and define the initial DNS verification target.',
  },
  {
    title: 'Plan & Features',
    detail: 'Pick entitlement baseline and high-value modules for go-live.',
  },
  {
    title: 'Review & Provision',
    detail: 'Confirm launch configuration and create the tenant workspace.',
  },
] as const;

const planOptions: PlanOption[] = [
  { code: 'starter', label: 'Starter', summary: 'Core CRM + website operations for solo agents.' },
  { code: 'growth', label: 'Growth', summary: 'Adds automation and deeper lead intelligence workflows.' },
  { code: 'pro', label: 'Pro', summary: 'Full operational stack for higher-volume teams.' },
  { code: 'team', label: 'Team', summary: 'Expanded collaboration controls and advanced governance.' },
];

const featureOptions: FeatureOption[] = [
  { id: 'crm_pipeline', label: 'Pipeline Workspace', detail: 'Lead board, stage transitions, and activity timeline.' },
  { id: 'lead_capture', label: 'Lead Capture Intake', detail: 'Website form intake and conversion-ready routing.' },
  { id: 'ai_nba', label: 'AI Next Best Action', detail: 'AI-assisted conversion recommendations for operators.' },
  { id: 'automation_sequences', label: 'Automation Sequences', detail: 'Scheduled follow-ups and drip sequences.' },
  { id: 'behavior_intelligence', label: 'Behavior Intelligence', detail: 'Search/favorite/view signals in CRM context.' },
  { id: 'domain_ops', label: 'Domain Ops Toolkit', detail: 'Domain verification/health operations visibility.' },
];
const featureLabelById = featureOptions.reduce<Record<string, string>>((result, feature) => {
  result[feature.id] = feature.label;
  return result;
}, {});

const defaultOnboardingDraft: OnboardingDraft = {
  name: '',
  slug: '',
  primaryDomain: '',
  planCode: 'starter',
  featureFlags: planFeatureTemplates.starter ?? [],
  customFlagsCsv: '',
};

interface DomainProbeResponse {
  ok: true;
  tenantId: string;
  checkedAt: string;
  probes: TenantDomainProbeResult[];
  primaryDomainProbe: TenantDomainProbeResult | null;
}

interface ObservabilitySummaryResponse {
  ok: true;
  summary: ControlPlaneObservabilitySummary;
}

interface BillingSubscriptionResponse {
  ok: true;
  subscription: TenantBillingSubscription;
}

interface DiagnosticsSummaryResponse {
  ok: true;
  summary: TenantSupportDiagnosticsSummary;
}

interface DiagnosticsRemediationResponse {
  ok: boolean;
  result: {
    action: TenantSupportRemediationAction;
    ok: boolean;
    message: string;
    changedCount?: number;
  };
  summary: TenantSupportDiagnosticsSummary;
  error?: string | null;
}

interface AuditRequestAttribution {
  requestId: string | null;
  requestMethod: string | null;
  requestPath: string | null;
}

interface AuditChangeDetail {
  field: string;
  before: string;
  after: string;
}

interface BillingDriftSignal {
  auditEventId: string;
  createdAt: string;
  status: ControlPlaneAdminAuditStatus;
  mode: string;
  missingCount: number;
  extraCount: number;
  missingFlags: string[];
  extraFlags: string[];
  duplicate: boolean | null;
  applied: boolean | null;
  requestId: string | null;
  error: string | null;
}

function parseAuditLimit(value: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 50;
  }

  return Math.max(1, Math.min(Math.trunc(parsed), 200));
}

function toAuditValueString(value: unknown): string {
  if (value === undefined) {
    return 'n/a';
  }
  if (value === null) {
    return 'null';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  try {
    return JSON.stringify(value);
  } catch {
    return '[unserializable]';
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function getAuditRequestAttribution(event: ControlPlaneAdminAuditEvent): AuditRequestAttribution {
  const metadata = asRecord(event.metadata);
  const nestedRequest = asRecord(metadata?.request);
  const requestId =
    (typeof metadata?.requestId === 'string' ? metadata.requestId : null) ??
    (typeof nestedRequest?.id === 'string' ? nestedRequest.id : null);
  const requestMethod =
    (typeof metadata?.requestMethod === 'string' ? metadata.requestMethod : null) ??
    (typeof nestedRequest?.method === 'string' ? nestedRequest.method : null);
  const requestPath =
    (typeof metadata?.requestPath === 'string' ? metadata.requestPath : null) ??
    (typeof nestedRequest?.path === 'string' ? nestedRequest.path : null);

  return {
    requestId,
    requestMethod,
    requestPath,
  };
}

function getAuditChangeDetails(event: ControlPlaneAdminAuditEvent): AuditChangeDetail[] {
  const metadata = asRecord(event.metadata);
  if (!metadata) {
    return [];
  }

  const changes = asRecord(metadata.changes);
  if (changes) {
    return Object.entries(changes).map(([field, value]) => {
      const detail = asRecord(value);
      if (detail && ('before' in detail || 'after' in detail)) {
        return {
          field,
          before: toAuditValueString(detail.before),
          after: toAuditValueString(detail.after),
        };
      }

      return {
        field,
        before: 'n/a',
        after: toAuditValueString(value),
      };
    });
  }

  const before = asRecord(metadata.before);
  const after = asRecord(metadata.after);
  if (before || after) {
    const keys = new Set<string>([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]);
    return Array.from(keys).map((field) => ({
      field,
      before: toAuditValueString(before?.[field]),
      after: toAuditValueString(after?.[field]),
    }));
  }

  return [];
}

function getAuditChangeAfterValue(event: ControlPlaneAdminAuditEvent, field: string): unknown {
  const metadata = asRecord(event.metadata);
  const changes = asRecord(metadata?.changes);
  const detail = asRecord(changes?.[field]);
  if (detail && 'after' in detail) {
    return detail.after;
  }

  return changes?.[field];
}

function toBooleanValue(value: unknown): boolean | null {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') {
      return true;
    }
    if (normalized === 'false') {
      return false;
    }
  }
  if (typeof value === 'number') {
    if (value === 1) {
      return true;
    }
    if (value === 0) {
      return false;
    }
  }
  return null;
}

function toIntegerValue(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.trunc(value);
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return Math.trunc(parsed);
    }
  }
  return null;
}

function toStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((entry): entry is string => typeof entry === 'string')
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return [];
    }
    return trimmed
      .split(',')
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  }
  return [];
}

function toBillingDriftSignal(event: ControlPlaneAdminAuditEvent): BillingDriftSignal | null {
  if (event.action !== 'tenant.billing.sync') {
    return null;
  }

  const driftDetected = toBooleanValue(getAuditChangeAfterValue(event, 'entitlementDriftDetected'));
  if (driftDetected !== true) {
    return null;
  }

  const modeValue = getAuditChangeAfterValue(event, 'entitlementDriftMode');
  const mode = typeof modeValue === 'string' && modeValue.trim().length > 0 ? modeValue.trim() : 'unknown';
  const missingFlags = toStringList(getAuditChangeAfterValue(event, 'entitlementMissingFlags'));
  const extraFlags = toStringList(getAuditChangeAfterValue(event, 'entitlementExtraFlags'));
  const missingCount = toIntegerValue(getAuditChangeAfterValue(event, 'entitlementMissingCount')) ?? missingFlags.length;
  const extraCount = toIntegerValue(getAuditChangeAfterValue(event, 'entitlementExtraCount')) ?? extraFlags.length;
  const duplicate = toBooleanValue(getAuditChangeAfterValue(event, 'duplicate'));
  const applied = toBooleanValue(getAuditChangeAfterValue(event, 'applied'));
  const request = getAuditRequestAttribution(event);

  return {
    auditEventId: event.id,
    createdAt: event.createdAt,
    status: event.status,
    mode,
    missingCount,
    extraCount,
    missingFlags,
    extraFlags,
    duplicate,
    applied,
    requestId: request.requestId,
    error: event.error,
  };
}

function getBillingDriftSummaryForAuditRow(
  event: ControlPlaneAdminAuditEvent
): { mode: string; missingCount: number; extraCount: number } | null {
  if (event.action !== 'tenant.billing.sync') {
    return null;
  }

  const driftDetected = toBooleanValue(getAuditChangeAfterValue(event, 'entitlementDriftDetected'));
  if (driftDetected !== true) {
    return null;
  }

  const modeValue = getAuditChangeAfterValue(event, 'entitlementDriftMode');
  const mode = typeof modeValue === 'string' && modeValue.trim().length > 0 ? modeValue.trim() : 'unknown';

  return {
    mode,
    missingCount: toIntegerValue(getAuditChangeAfterValue(event, 'entitlementMissingCount')) ?? 0,
    extraCount: toIntegerValue(getAuditChangeAfterValue(event, 'entitlementExtraCount')) ?? 0,
  };
}

function escapeCsvCell(value: string): string {
  const normalized = value.replace(/"/g, '""');
  return `"${normalized}"`;
}

function confirmDestructiveAction(message: string): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.confirm(message);
}

const defaultActorDraft: ActorDraft = {
  actorId: '',
  displayName: '',
  email: '',
  role: 'viewer',
  permissions: roleDefaultPermissions.viewer,
};

function toCsv(values: string[]): string {
  return values.join(', ');
}

function fromCsv(value: string): string[] {
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function uniqueList(values: string[]): string[] {
  return Array.from(new Set(values));
}

function uniquePermissions(values: ControlPlaneActorPermission[]): ControlPlaneActorPermission[] {
  return Array.from(new Set(values));
}

function toDateInputValue(value: string | null): string {
  if (!value) {
    return '';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  return parsed.toISOString().slice(0, 10);
}

function toBillingDraft(subscription: TenantBillingSubscription): BillingDraft {
  return {
    planCode: subscription.planCode,
    status: subscription.status,
    paymentStatus: subscription.paymentStatus,
    billingProvider: subscription.billingProvider,
    billingCustomerId: subscription.billingCustomerId ?? '',
    billingSubscriptionId: subscription.billingSubscriptionId ?? '',
    trialEndsAt: toDateInputValue(subscription.trialEndsAt),
    currentPeriodEndsAt: toDateInputValue(subscription.currentPeriodEndsAt),
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    syncEntitlements: false,
  };
}

function diagnosticStatusLabel(status: TenantSupportDiagnosticStatus): string {
  if (status === 'failed') {
    return 'failed';
  }
  if (status === 'warning') {
    return 'warning';
  }
  return 'ok';
}

function diagnosticStatusChipClass(status: TenantSupportDiagnosticStatus): string {
  if (status === 'failed') {
    return 'admin-chip-status-failed';
  }
  if (status === 'warning') {
    return 'admin-chip-warn';
  }
  return 'admin-chip-ok';
}

function normalizeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function normalizeHostname(value: string): string {
  return value.trim().toLowerCase();
}

function formatFeatureLabel(featureId: string): string {
  return featureLabelById[featureId] ?? featureId;
}

function formatActorRole(role: ControlPlaneActorRole): string {
  return actorRoleOptions.find((entry) => entry.value === role)?.label ?? role;
}

function formatTimestamp(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString();
}

function buildPlanDraftMap(snapshots: ControlPlaneTenantSnapshot[]): Record<string, string> {
  return snapshots.reduce<Record<string, string>>((result, snapshot) => {
    result[snapshot.tenant.id] = snapshot.settings.planCode;
    return result;
  }, {});
}

function buildFlagsDraftMap(snapshots: ControlPlaneTenantSnapshot[]): Record<string, string> {
  return snapshots.reduce<Record<string, string>>((result, snapshot) => {
    result[snapshot.tenant.id] = toCsv(snapshot.settings.featureFlags);
    return result;
  }, {});
}

async function readResponseError(response: Response, fallback: string): Promise<string> {
  try {
    const payload = (await response.json()) as { error?: unknown };
    if (typeof payload.error === 'string' && payload.error.trim().length > 0) {
      return payload.error;
    }
  } catch {
    // Ignore parse errors and return fallback.
  }

  return fallback;
}

function buildPlanGovernanceIssue(
  scope: MutationErrorScope,
  planCode: string,
  evaluation: ReturnType<typeof evaluatePlanGovernance>,
  focusStepIndex?: number
): MutationErrorGuidance {
  const missingRequired = evaluation.missingRequired.map(formatFeatureLabel);
  const disallowed = evaluation.disallowed.map(formatFeatureLabel);

  const detailParts: string[] = [];
  if (missingRequired.length > 0) {
    detailParts.push(`Missing required features for ${planCode}: ${missingRequired.join(', ')}.`);
  }
  if (disallowed.length > 0) {
    detailParts.push(`Disallowed for ${planCode}: ${disallowed.join(', ')}.`);
  }

  return {
    scope,
    summary: `Plan guardrails need review (${planCode})`,
    detail: detailParts.join(' '),
    fieldHints: {
      featureFlags: 'Use Apply Plan Template or Enforce Guardrails before saving.',
    },
    nextSteps: [
      'Apply the plan template or use Enforce Guardrails to auto-fix feature flags.',
      'Enable override only for temporary exceptions that need manual approval.',
    ],
    focusStepIndex,
  };
}

export function ControlPlaneWorkspace({ initialSnapshots, hasClerkKey }: ControlPlaneWorkspaceProps) {
  const [snapshots, setSnapshots] = useState(initialSnapshots);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(initialSnapshots[0]?.tenant.id ?? null);

  const [busy, setBusy] = useState(false);
  const [workspaceIssue, setWorkspaceIssue] = useState<MutationErrorGuidance | null>(null);
  const [workspaceNotice, setWorkspaceNotice] = useState<string | null>(null);

  const [wizardStepIndex, setWizardStepIndex] = useState(0);
  const [onboardingDraft, setOnboardingDraft] = useState<OnboardingDraft>(defaultOnboardingDraft);
  const [onboardingAllowPlanOverride, setOnboardingAllowPlanOverride] = useState(false);

  const [domainDraftByTenant, setDomainDraftByTenant] = useState<Record<string, string>>({});
  const [planDraftByTenant, setPlanDraftByTenant] = useState<Record<string, string>>(() => buildPlanDraftMap(initialSnapshots));
  const [flagsDraftByTenant, setFlagsDraftByTenant] = useState<Record<string, string>>(() => buildFlagsDraftMap(initialSnapshots));
  const [settingsAllowPlanOverrideByTenant, setSettingsAllowPlanOverrideByTenant] = useState<Record<string, boolean>>({});
  const [domainOpsAutoPollEnabled, setDomainOpsAutoPollEnabled] = useState(false);
  const [domainOpsPollIntervalSeconds, setDomainOpsPollIntervalSeconds] = useState(20);
  const [domainOpsLastCheckedAt, setDomainOpsLastCheckedAt] = useState<string | null>(null);
  const [domainProbeByDomainId, setDomainProbeByDomainId] = useState<Record<string, TenantDomainProbeResult>>({});
  const [domainVerificationRetryByDomain, setDomainVerificationRetryByDomain] = useState<Record<string, number>>({});

  const [auditEvents, setAuditEvents] = useState<ControlPlaneAdminAuditEvent[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [selectedAuditTenantId, setSelectedAuditTenantId] = useState<string>(GLOBAL_AUDIT_SCOPE);
  const [selectedAuditStatus, setSelectedAuditStatus] = useState<string>('all');
  const [selectedAuditAction, setSelectedAuditAction] = useState<string>('all');
  const [selectedAuditActorRole, setSelectedAuditActorRole] = useState<string>('all');
  const [selectedAuditActorId, setSelectedAuditActorId] = useState('');
  const [selectedAuditRequestId, setSelectedAuditRequestId] = useState('');
  const [selectedAuditChangedField, setSelectedAuditChangedField] = useState('');
  const [selectedAuditSearch, setSelectedAuditSearch] = useState('');
  const [selectedAuditFromDate, setSelectedAuditFromDate] = useState('');
  const [selectedAuditToDate, setSelectedAuditToDate] = useState('');
  const [selectedAuditErrorsOnly, setSelectedAuditErrorsOnly] = useState(false);
  const [selectedAuditLimit, setSelectedAuditLimit] = useState(100);

  const [tenantActorsByTenant, setTenantActorsByTenant] = useState<Record<string, TenantControlActor[]>>({});
  const [actorsLoadingByTenant, setActorsLoadingByTenant] = useState<Record<string, boolean>>({});
  const [actorDraftByTenant, setActorDraftByTenant] = useState<Record<string, ActorDraft>>({});
  const [actorRoleDraftByActorKey, setActorRoleDraftByActorKey] = useState<Record<string, ControlPlaneActorRole>>({});
  const [actorPermissionsDraftByActorKey, setActorPermissionsDraftByActorKey] = useState<
    Record<string, ControlPlaneActorPermission[]>
  >({});
  const [supportSessionDraftByActorKey, setSupportSessionDraftByActorKey] = useState<
    Record<string, ActorSupportSessionDraft>
  >({});

  const [billingByTenant, setBillingByTenant] = useState<Record<string, TenantBillingSubscription>>({});
  const [billingDraftByTenant, setBillingDraftByTenant] = useState<Record<string, BillingDraft>>({});
  const [billingLoadingByTenant, setBillingLoadingByTenant] = useState<Record<string, boolean>>({});
  const [billingDriftSignalsByTenant, setBillingDriftSignalsByTenant] = useState<Record<string, BillingDriftSignal[]>>(
    {}
  );
  const [billingDriftLoadingByTenant, setBillingDriftLoadingByTenant] = useState<Record<string, boolean>>({});
  const [billingDriftErrorByTenant, setBillingDriftErrorByTenant] = useState<Record<string, string | null>>({});

  const [diagnosticsByTenant, setDiagnosticsByTenant] = useState<Record<string, TenantSupportDiagnosticsSummary>>({});
  const [diagnosticsLoadingByTenant, setDiagnosticsLoadingByTenant] = useState<Record<string, boolean>>({});
  const [diagnosticsActionBusyByTenant, setDiagnosticsActionBusyByTenant] = useState<Record<string, boolean>>({});
  const [diagnosticsErrorByTenant, setDiagnosticsErrorByTenant] = useState<Record<string, string | null>>({});

  const [observabilitySummary, setObservabilitySummary] = useState<ControlPlaneObservabilitySummary | null>(null);
  const [observabilityLoading, setObservabilityLoading] = useState(false);
  const [observabilityError, setObservabilityError] = useState<string | null>(null);

  const toActorKey = useCallback((tenantId: string, actorId: string) => `${tenantId}:${actorId}`, []);

  const selectedTenant = useMemo(() => {
    if (!selectedTenantId) {
      return null;
    }

    return snapshots.find((snapshot) => snapshot.tenant.id === selectedTenantId) ?? null;
  }, [selectedTenantId, snapshots]);

  const selectedTenantActiveDomains = useMemo(() => {
    if (!selectedTenant) {
      return [];
    }

    return selectedTenant.domains.filter((domain) => domain.status === 'active');
  }, [selectedTenant]);

  const selectedTenantActors = useMemo(() => {
    if (!selectedTenant) {
      return [];
    }

    return tenantActorsByTenant[selectedTenant.tenant.id] ?? [];
  }, [selectedTenant, tenantActorsByTenant]);

  const selectedTenantDiagnostics = useMemo(() => {
    if (!selectedTenant) {
      return null;
    }

    return diagnosticsByTenant[selectedTenant.tenant.id] ?? null;
  }, [diagnosticsByTenant, selectedTenant]);

  const selectedTenantBilling = useMemo(() => {
    if (!selectedTenant) {
      return null;
    }

    return billingByTenant[selectedTenant.tenant.id] ?? null;
  }, [billingByTenant, selectedTenant]);

  const selectedTenantBillingDraft = useMemo(() => {
    if (!selectedTenant) {
      return null;
    }

    return billingDraftByTenant[selectedTenant.tenant.id] ?? null;
  }, [billingDraftByTenant, selectedTenant]);

  const selectedTenantBillingDriftSignals = useMemo(() => {
    if (!selectedTenant) {
      return [];
    }

    return billingDriftSignalsByTenant[selectedTenant.tenant.id] ?? [];
  }, [billingDriftSignalsByTenant, selectedTenant]);

  const selectedTenantActorDraft = useMemo(() => {
    if (!selectedTenant) {
      return defaultActorDraft;
    }

    return actorDraftByTenant[selectedTenant.tenant.id] ?? defaultActorDraft;
  }, [actorDraftByTenant, selectedTenant]);

  const selectedPrimaryDomain = useMemo(() => {
    if (!selectedTenant) {
      return null;
    }

    return selectedTenantActiveDomains.find((domain) => domain.isPrimary) ?? null;
  }, [selectedTenant, selectedTenantActiveDomains]);

  const selectedPrimaryDomainProbe = useMemo(() => {
    if (!selectedPrimaryDomain) {
      return null;
    }

    return domainProbeByDomainId[selectedPrimaryDomain.id] ?? null;
  }, [domainProbeByDomainId, selectedPrimaryDomain]);

  const totalTenants = snapshots.length;
  const totalDomains = useMemo(() => snapshots.reduce((count, snapshot) => count + snapshot.domains.length, 0), [snapshots]);
  const unverifiedPrimaryCount = useMemo(() => {
    return snapshots.filter((snapshot) => {
      const primaryDomain = snapshot.domains.find((domain) => domain.status === 'active' && domain.isPrimary) ?? null;
      return !primaryDomain || !primaryDomain.isVerified;
    }).length;
  }, [snapshots]);

  const readinessSummary = useMemo(() => {
    if (!selectedTenant) {
      return {
        completed: 0,
        total: 6,
        checks: [
          { label: 'Tenant active', ok: false },
          { label: 'Primary domain exists', ok: false },
          { label: 'Primary domain verified', ok: false },
          { label: 'Settings active', ok: false },
          { label: 'Plan assigned', ok: false },
          { label: 'At least one feature enabled', ok: false },
        ],
      };
    }

    const primaryDomain = selectedTenant.domains.find((domain) => domain.status === 'active' && domain.isPrimary) ?? null;
    const primaryDomainVerified = primaryDomain
      ? (domainProbeByDomainId[primaryDomain.id]?.dnsStatus ?? (primaryDomain.isVerified ? 'verified' : 'pending')) ===
        'verified'
      : false;
    const checks = [
      { label: 'Tenant active', ok: selectedTenant.tenant.status === 'active' },
      { label: 'Primary domain exists', ok: Boolean(primaryDomain) },
      { label: 'Primary domain verified', ok: primaryDomainVerified },
      { label: 'Settings active', ok: selectedTenant.settings.status === 'active' },
      {
        label: 'Plan assigned',
        ok: selectedTenant.settings.status === 'active' && selectedTenant.settings.planCode.trim().length > 0,
      },
      {
        label: 'At least one feature enabled',
        ok: selectedTenant.settings.status === 'active' && selectedTenant.settings.featureFlags.length > 0,
      },
    ];

    const completed = checks.filter((entry) => entry.ok).length;
    return {
      completed,
      total: checks.length,
      checks,
    };
  }, [domainProbeByDomainId, selectedTenant]);

  const tenantNameById = useMemo(() => {
    return snapshots.reduce<Record<string, string>>((result, snapshot) => {
      result[snapshot.tenant.id] = snapshot.tenant.name;
      return result;
    }, {});
  }, [snapshots]);

  const auditChangedFieldOptions = useMemo(() => {
    const fields = new Set<string>();
    for (const event of auditEvents) {
      for (const change of getAuditChangeDetails(event)) {
        fields.add(change.field);
      }
    }
    return Array.from(fields).sort((left, right) => left.localeCompare(right));
  }, [auditEvents]);

  const wizardFeatures = useMemo(() => {
    return uniqueList([...onboardingDraft.featureFlags, ...fromCsv(onboardingDraft.customFlagsCsv)]);
  }, [onboardingDraft.customFlagsCsv, onboardingDraft.featureFlags]);

  const wizardGovernance = useMemo(() => {
    return evaluatePlanGovernance(onboardingDraft.planCode, wizardFeatures);
  }, [onboardingDraft.planCode, wizardFeatures]);

  const selectedTenantDraftFeatureFlags = useMemo(() => {
    if (!selectedTenant) {
      return [];
    }

    const csv = flagsDraftByTenant[selectedTenant.tenant.id] ?? toCsv(selectedTenant.settings.featureFlags);
    return fromCsv(csv);
  }, [flagsDraftByTenant, selectedTenant]);

  const selectedTenantPlanCode = useMemo(() => {
    if (!selectedTenant) {
      return 'starter';
    }

    return (planDraftByTenant[selectedTenant.tenant.id] ?? selectedTenant.settings.planCode).trim() || 'starter';
  }, [planDraftByTenant, selectedTenant]);

  const selectedSettingsGovernance = useMemo(() => {
    if (!selectedTenant) {
      return null;
    }

    return evaluatePlanGovernance(selectedTenantPlanCode, selectedTenantDraftFeatureFlags);
  }, [selectedTenant, selectedTenantDraftFeatureFlags, selectedTenantPlanCode]);

  const selectedSettingsAllowOverride = selectedTenant
    ? Boolean(settingsAllowPlanOverrideByTenant[selectedTenant.tenant.id])
    : false;
  const selectedTenantIsActive = selectedTenant?.tenant.status === 'active';
  const selectedSettingsIsActive = selectedTenant?.settings.status === 'active';
  const settingsEditable = Boolean(selectedTenantIsActive && selectedSettingsIsActive);
  const auditDriftPresetActive =
    selectedAuditAction === 'tenant.billing.sync' &&
    selectedAuditChangedField.trim().toLowerCase() === 'entitlementdriftdetected';

  const sslReadiness = useMemo(() => {
    if (!selectedPrimaryDomain) {
      return {
        dnsStatus: 'missing',
        certificateStatus: 'blocked',
        dnsMessage: 'No primary domain configured yet.',
        certificateMessage: 'Certificate cannot be issued until a primary domain is set.',
      };
    }

    if (selectedPrimaryDomainProbe) {
      return {
        dnsStatus: selectedPrimaryDomainProbe.dnsStatus,
        certificateStatus: selectedPrimaryDomainProbe.certificateStatus,
        dnsMessage: selectedPrimaryDomainProbe.dnsMessage,
        certificateMessage: selectedPrimaryDomainProbe.certificateMessage,
      };
    }

    if (!selectedPrimaryDomain.isVerified) {
      return {
        dnsStatus: 'pending',
        certificateStatus: 'pending',
        dnsMessage: `Waiting for DNS verification on ${selectedPrimaryDomain.hostname}.`,
        certificateMessage: 'Certificate readiness is pending DNS verification.',
      };
    }

    return {
      dnsStatus: 'verified',
      certificateStatus: 'ready',
      dnsMessage: `${selectedPrimaryDomain.hostname} is verified.`,
      certificateMessage: 'Certificate readiness checks passed for launch.',
    };
  }, [selectedPrimaryDomain, selectedPrimaryDomainProbe]);

  const wizardCanContinue = useMemo(() => {
    if (wizardStepIndex === 0) {
      return onboardingDraft.name.trim().length > 1 && normalizeSlug(onboardingDraft.slug).length > 1;
    }

    if (wizardStepIndex === 1) {
      const normalizedDomain = normalizeHostname(onboardingDraft.primaryDomain);
      return normalizedDomain.length > 2 && normalizedDomain.includes('.');
    }

    if (wizardStepIndex === 2) {
      const hasGuardrailIssues = wizardGovernance.missingRequired.length > 0 || wizardGovernance.disallowed.length > 0;
      return onboardingDraft.planCode.trim().length > 0 && (onboardingAllowPlanOverride || !hasGuardrailIssues);
    }

    return true;
  }, [
    onboardingAllowPlanOverride,
    onboardingDraft.name,
    onboardingDraft.planCode,
    onboardingDraft.primaryDomain,
    onboardingDraft.slug,
    wizardGovernance.disallowed.length,
    wizardGovernance.missingRequired.length,
    wizardStepIndex,
  ]);

  const loadAuditEvents = useCallback(
    async (
      tenantScopeOverride?: string,
      filterOverrides?: Partial<{
        status: string;
        action: string;
        actorRole: string;
        actorId: string;
        requestId: string;
        changedField: string;
        search: string;
        fromDate: string;
        toDate: string;
        errorsOnly: boolean;
        limit: number;
      }>
    ) => {
      const tenantScope = tenantScopeOverride ?? selectedAuditTenantId;
      const status = filterOverrides?.status ?? selectedAuditStatus;
      const action = filterOverrides?.action ?? selectedAuditAction;
      const actorRole = filterOverrides?.actorRole ?? selectedAuditActorRole;
      const actorId = filterOverrides?.actorId ?? selectedAuditActorId;
      const requestId = filterOverrides?.requestId ?? selectedAuditRequestId;
      const changedField = filterOverrides?.changedField ?? selectedAuditChangedField;
      const search = filterOverrides?.search ?? selectedAuditSearch;
      const fromDate = filterOverrides?.fromDate ?? selectedAuditFromDate;
      const toDate = filterOverrides?.toDate ?? selectedAuditToDate;
      const errorsOnly = filterOverrides?.errorsOnly ?? selectedAuditErrorsOnly;
      const limit = filterOverrides?.limit ?? selectedAuditLimit;

      setAuditLoading(true);
      setAuditError(null);

      try {
        const query = new URLSearchParams();
        query.set('limit', String(limit));

        if (tenantScope !== GLOBAL_AUDIT_SCOPE) {
          query.set('tenantId', tenantScope);
        }
        if (status !== 'all') {
          query.set('status', status);
        }
        if (action !== 'all') {
          query.set('action', action);
        }
        if (actorRole !== 'all') {
          query.set('actorRole', actorRole);
        }
        if (actorId.trim().length > 0) {
          query.set('actorId', actorId.trim());
        }
        if (requestId.trim().length > 0) {
          query.set('requestId', requestId.trim());
        }
        if (changedField.trim().length > 0) {
          query.set('changedField', changedField.trim());
        }
        if (search.trim().length > 0) {
          query.set('search', search.trim());
        }
        if (fromDate.trim().length > 0) {
          query.set('from', fromDate.trim());
        }
        if (toDate.trim().length > 0) {
          query.set('to', toDate.trim());
        }
        if (errorsOnly) {
          query.set('errorsOnly', 'true');
        }

        const response = await fetch(`/api/admin-audit?${query.toString()}`, { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(await readResponseError(response, 'Unable to load audit timeline.'));
        }

        const payload = (await response.json()) as { events: ControlPlaneAdminAuditEvent[] };
        setAuditEvents(payload.events);
      } catch (error) {
        setAuditError(error instanceof Error ? error.message : 'Unknown audit timeline load error.');
      } finally {
        setAuditLoading(false);
      }
    },
    [
      selectedAuditAction,
      selectedAuditActorId,
      selectedAuditActorRole,
      selectedAuditChangedField,
      selectedAuditErrorsOnly,
      selectedAuditFromDate,
      selectedAuditLimit,
      selectedAuditRequestId,
      selectedAuditSearch,
      selectedAuditStatus,
      selectedAuditTenantId,
      selectedAuditToDate,
    ]
  );

  useEffect(() => {
    void loadAuditEvents();
  }, [loadAuditEvents]);

  const exportAuditEvents = useCallback(
    (format: 'json' | 'csv') => {
      if (auditEvents.length === 0) {
        setWorkspaceNotice('No audit events available to export for current filters.');
        return;
      }

      if (format === 'json') {
        const blob = new Blob([JSON.stringify(auditEvents, null, 2)], { type: 'application/json;charset=utf-8' });
        const objectUrl = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = objectUrl;
        anchor.download = `admin-audit-${new Date().toISOString().slice(0, 10)}.json`;
        anchor.click();
        URL.revokeObjectURL(objectUrl);
        setWorkspaceNotice('Exported audit timeline JSON for current filters.');
        return;
      }

      const header = [
        'createdAt',
        'eventId',
        'status',
        'action',
        'tenantId',
        'tenantName',
        'domainId',
        'actorId',
        'actorRole',
        'requestId',
        'requestMethod',
        'requestPath',
        'changedFields',
        'error',
      ];

      const rows = auditEvents.map((event) => {
        const request = getAuditRequestAttribution(event);
        const changedFields = getAuditChangeDetails(event)
          .map((entry) => entry.field)
          .join('; ');

        return [
          event.createdAt,
          event.id,
          event.status,
          event.action,
          event.tenantId ?? '',
          event.tenantId ? tenantNameById[event.tenantId] ?? '' : '',
          event.domainId ?? '',
          event.actorId ?? '',
          event.actorRole,
          request.requestId ?? '',
          request.requestMethod ?? '',
          request.requestPath ?? '',
          changedFields,
          event.error ?? '',
        ].map((value) => escapeCsvCell(value));
      });

      const csvContent = [header.map((value) => escapeCsvCell(value)).join(','), ...rows.map((row) => row.join(','))].join(
        '\n'
      );
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = `admin-audit-${new Date().toISOString().slice(0, 10)}.csv`;
      anchor.click();
      URL.revokeObjectURL(objectUrl);
      setWorkspaceNotice('Exported audit timeline CSV for current filters.');
    },
    [auditEvents, tenantNameById]
  );

  const loadObservabilitySummary = useCallback(async () => {
    setObservabilityLoading(true);
    setObservabilityError(null);

    try {
      const response = await fetch('/api/observability?tenantLimit=30', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(await readResponseError(response, 'Unable to load observability summary.'));
      }

      const payload = (await response.json()) as ObservabilitySummaryResponse;
      setObservabilitySummary(payload.summary);
    } catch (error) {
      setObservabilityError(error instanceof Error ? error.message : 'Unable to load observability summary.');
    } finally {
      setObservabilityLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadObservabilitySummary();
  }, [loadObservabilitySummary]);

  const loadBillingForTenant = useCallback(async (tenantId: string) => {
    setBillingLoadingByTenant((prev) => ({ ...prev, [tenantId]: true }));
    try {
      const response = await fetch(`/api/tenants/${tenantId}/billing`, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(await readResponseError(response, 'Unable to load billing subscription details.'));
      }

      const payload = (await response.json()) as BillingSubscriptionResponse;
      setBillingByTenant((prev) => ({
        ...prev,
        [tenantId]: payload.subscription,
      }));
      setBillingDraftByTenant((prev) => ({
        ...prev,
        [tenantId]: prev[tenantId] ?? toBillingDraft(payload.subscription),
      }));
    } finally {
      setBillingLoadingByTenant((prev) => ({ ...prev, [tenantId]: false }));
    }
  }, []);

  const loadBillingDriftSignalsForTenant = useCallback(async (tenantId: string) => {
    setBillingDriftLoadingByTenant((prev) => ({ ...prev, [tenantId]: true }));
    setBillingDriftErrorByTenant((prev) => ({ ...prev, [tenantId]: null }));

    try {
      const query = new URLSearchParams();
      query.set('tenantId', tenantId);
      query.set('action', 'tenant.billing.sync');
      query.set('changedField', 'entitlementDriftDetected');
      query.set('limit', '30');

      const response = await fetch(`/api/admin-audit?${query.toString()}`, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(await readResponseError(response, 'Unable to load billing drift timeline.'));
      }

      const payload = (await response.json()) as { events: ControlPlaneAdminAuditEvent[] };
      const signals = payload.events
        .map((event) => toBillingDriftSignal(event))
        .filter((entry): entry is BillingDriftSignal => Boolean(entry));
      setBillingDriftSignalsByTenant((prev) => ({
        ...prev,
        [tenantId]: signals,
      }));
    } catch (error) {
      setBillingDriftErrorByTenant((prev) => ({
        ...prev,
        [tenantId]: error instanceof Error ? error.message : 'Unable to load billing drift timeline.',
      }));
    } finally {
      setBillingDriftLoadingByTenant((prev) => ({ ...prev, [tenantId]: false }));
    }
  }, []);

  const loadDiagnosticsForTenant = useCallback(async (tenantId: string) => {
    setDiagnosticsLoadingByTenant((prev) => ({ ...prev, [tenantId]: true }));
    setDiagnosticsErrorByTenant((prev) => ({ ...prev, [tenantId]: null }));

    try {
      const response = await fetch(`/api/tenants/${tenantId}/diagnostics`, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(await readResponseError(response, 'Unable to load tenant diagnostics.'));
      }

      const payload = (await response.json()) as DiagnosticsSummaryResponse;
      setDiagnosticsByTenant((prev) => ({
        ...prev,
        [tenantId]: payload.summary,
      }));
    } catch (error) {
      setDiagnosticsErrorByTenant((prev) => ({
        ...prev,
        [tenantId]: error instanceof Error ? error.message : 'Unable to load tenant diagnostics.',
      }));
    } finally {
      setDiagnosticsLoadingByTenant((prev) => ({ ...prev, [tenantId]: false }));
    }
  }, []);

  const loadActorsForTenant = useCallback(
    async (tenantId: string) => {
      setActorsLoadingByTenant((prev) => ({ ...prev, [tenantId]: true }));

      try {
        const response = await fetch(`/api/tenants/${tenantId}/actors`, { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(await readResponseError(response, 'Unable to load tenant actors.'));
        }

        const payload = (await response.json()) as { ok: true; actors: TenantControlActor[] };
        setTenantActorsByTenant((prev) => ({
          ...prev,
          [tenantId]: payload.actors,
        }));
        setActorDraftByTenant((prev) => ({
          ...prev,
          [tenantId]: prev[tenantId] ?? defaultActorDraft,
        }));
        setActorRoleDraftByActorKey((prev) => {
          const next = { ...prev };
          for (const actor of payload.actors) {
            next[toActorKey(tenantId, actor.actorId)] = actor.role;
          }
          return next;
        });
        setActorPermissionsDraftByActorKey((prev) => {
          const next = { ...prev };
          for (const actor of payload.actors) {
            next[toActorKey(tenantId, actor.actorId)] = actor.permissions;
          }
          return next;
        });
        setSupportSessionDraftByActorKey((prev) => {
          const next = { ...prev };
          for (const actor of payload.actors) {
            const key = toActorKey(tenantId, actor.actorId);
            next[key] = prev[key] ?? { durationMinutes: defaultSupportSessionDurationMinutes };
          }
          return next;
        });
      } finally {
        setActorsLoadingByTenant((prev) => ({ ...prev, [tenantId]: false }));
      }
    },
    [toActorKey]
  );

  useEffect(() => {
    if (!selectedTenantId) {
      return;
    }

    void loadActorsForTenant(selectedTenantId);
    void loadBillingForTenant(selectedTenantId);
    void loadBillingDriftSignalsForTenant(selectedTenantId);
    void loadDiagnosticsForTenant(selectedTenantId);
  }, [loadActorsForTenant, loadBillingDriftSignalsForTenant, loadBillingForTenant, loadDiagnosticsForTenant, selectedTenantId]);

  const loadDomainProbes = useCallback(async (tenantId: string, domainId?: string) => {
    const response = await fetch(`/api/tenants/${tenantId}/domains/probe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(domainId ? { domainId } : {}),
    });
    if (!response.ok) {
      throw new Error(await readResponseError(response, 'Unable to probe domain status.'));
    }

    const payload = (await response.json()) as DomainProbeResponse;
    setDomainProbeByDomainId((previous) => {
      const next = { ...previous };
      for (const probe of payload.probes) {
        next[probe.domainId] = probe;
      }
      return next;
    });

    return payload;
  }, []);

  const refresh = useCallback(
    async (preferredTenantId?: string | null) => {
      const response = await fetch('/api/tenants', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(await readResponseError(response, 'Unable to refresh tenant list.'));
      }

      const payload = (await response.json()) as { tenants: ControlPlaneTenantSnapshot[] };
      setSnapshots(payload.tenants);
      setPlanDraftByTenant(buildPlanDraftMap(payload.tenants));
      setFlagsDraftByTenant(buildFlagsDraftMap(payload.tenants));
      setDomainProbeByDomainId((previous) => {
        const activeDomainIds = new Set(payload.tenants.flatMap((snapshot) => snapshot.domains.map((domain) => domain.id)));
        return Object.fromEntries(Object.entries(previous).filter(([domainId]) => activeDomainIds.has(domainId)));
      });
      setBillingByTenant((previous) => {
        const activeTenantIds = new Set(payload.tenants.map((snapshot) => snapshot.tenant.id));
        return Object.fromEntries(Object.entries(previous).filter(([tenantId]) => activeTenantIds.has(tenantId)));
      });
      setBillingDraftByTenant((previous) => {
        const activeTenantIds = new Set(payload.tenants.map((snapshot) => snapshot.tenant.id));
        return Object.fromEntries(Object.entries(previous).filter(([tenantId]) => activeTenantIds.has(tenantId)));
      });
      setBillingDriftSignalsByTenant((previous) => {
        const activeTenantIds = new Set(payload.tenants.map((snapshot) => snapshot.tenant.id));
        return Object.fromEntries(Object.entries(previous).filter(([tenantId]) => activeTenantIds.has(tenantId)));
      });
      setBillingDriftErrorByTenant((previous) => {
        const activeTenantIds = new Set(payload.tenants.map((snapshot) => snapshot.tenant.id));
        return Object.fromEntries(Object.entries(previous).filter(([tenantId]) => activeTenantIds.has(tenantId)));
      });
      setDiagnosticsByTenant((previous) => {
        const activeTenantIds = new Set(payload.tenants.map((snapshot) => snapshot.tenant.id));
        return Object.fromEntries(Object.entries(previous).filter(([tenantId]) => activeTenantIds.has(tenantId)));
      });
      setDiagnosticsErrorByTenant((previous) => {
        const activeTenantIds = new Set(payload.tenants.map((snapshot) => snapshot.tenant.id));
        return Object.fromEntries(Object.entries(previous).filter(([tenantId]) => activeTenantIds.has(tenantId)));
      });

      const desiredTenantId = preferredTenantId === undefined ? selectedTenantId : preferredTenantId;
      const resolvedTenantId = desiredTenantId && payload.tenants.some((snapshot) => snapshot.tenant.id === desiredTenantId)
        ? desiredTenantId
        : (payload.tenants[0]?.tenant.id ?? null);
      setSelectedTenantId(resolvedTenantId);

      const nextAuditScope =
        selectedAuditTenantId !== GLOBAL_AUDIT_SCOPE &&
        !payload.tenants.some((snapshot) => snapshot.tenant.id === selectedAuditTenantId)
          ? GLOBAL_AUDIT_SCOPE
          : selectedAuditTenantId;

      if (nextAuditScope !== selectedAuditTenantId) {
        setSelectedAuditTenantId(nextAuditScope);
      }

      await loadAuditEvents(nextAuditScope);
      await loadObservabilitySummary();
      if (resolvedTenantId) {
        await loadActorsForTenant(resolvedTenantId);
        await loadBillingForTenant(resolvedTenantId);
        await loadBillingDriftSignalsForTenant(resolvedTenantId);
        await loadDiagnosticsForTenant(resolvedTenantId);
      }
    },
    [
      loadActorsForTenant,
      loadAuditEvents,
      loadBillingDriftSignalsForTenant,
      loadBillingForTenant,
      loadDiagnosticsForTenant,
      loadObservabilitySummary,
      selectedAuditTenantId,
      selectedTenantId,
    ]
  );

  const runDomainOpsRefresh = useCallback(
    async (tenantId: string, reason: 'manual' | 'poll' | 'retry', domainId?: string) => {
      try {
        await refresh(tenantId);
        const probePayload = await loadDomainProbes(tenantId, reason === 'retry' ? domainId : undefined);
        const refreshedAt = probePayload.checkedAt || new Date().toISOString();
        setDomainOpsLastCheckedAt(refreshedAt);

        if (reason === 'manual') {
          setWorkspaceNotice(`Domain operations probe completed at ${formatTimestamp(refreshedAt)}.`);
        }
        if (reason === 'retry') {
          setWorkspaceNotice('Verification retry probe complete. Review DNS and certificate status results below.');
        }
      } catch (error) {
        if (reason !== 'poll') {
          setWorkspaceIssue(
            createMutationErrorGuidance({
              scope: 'domain-update',
              status: 0,
              message: error instanceof Error ? error.message : 'Domain operations refresh failed.',
            })
          );
        }
      }
    },
    [loadDomainProbes, refresh]
  );

  useEffect(() => {
    if (!domainOpsAutoPollEnabled || !selectedTenantId) {
      return;
    }

    const intervalSeconds = Math.min(Math.max(domainOpsPollIntervalSeconds, 10), 120);
    const intervalId = window.setInterval(() => {
      void runDomainOpsRefresh(selectedTenantId, 'poll');
    }, intervalSeconds * 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [domainOpsAutoPollEnabled, domainOpsPollIntervalSeconds, runDomainOpsRefresh, selectedTenantId]);

  const applyPlanTemplateToWizard = useCallback((planCode: string) => {
    const template = planFeatureTemplates[planCode] ?? [];
    setOnboardingDraft((prev) => ({
      ...prev,
      planCode,
      featureFlags: template,
    }));
    setOnboardingAllowPlanOverride(false);
  }, []);

  const toggleWizardFeature = useCallback((featureId: string) => {
    setOnboardingDraft((prev) => {
      const exists = prev.featureFlags.includes(featureId);
      return {
        ...prev,
        featureFlags: exists ? prev.featureFlags.filter((entry) => entry !== featureId) : [...prev.featureFlags, featureId],
      };
    });
  }, []);

  const toggleSettingsFeature = useCallback(
    (tenantId: string, baseFlags: string[], featureId: string) => {
      const current = flagsDraftByTenant[tenantId] ? fromCsv(flagsDraftByTenant[tenantId] ?? '') : baseFlags;
      const exists = current.includes(featureId);
      const next = exists ? current.filter((entry) => entry !== featureId) : [...current, featureId];
      setFlagsDraftByTenant((prev) => ({
        ...prev,
        [tenantId]: toCsv(uniqueList(next)),
      }));
    },
    [flagsDraftByTenant]
  );

  const applyPlanTemplateToTenantSettings = useCallback((tenantId: string, planCode: string) => {
    const template = planFeatureTemplates[planCode] ?? [];
    setFlagsDraftByTenant((prev) => ({
      ...prev,
      [tenantId]: toCsv(template),
    }));
    setSettingsAllowPlanOverrideByTenant((prev) => ({
      ...prev,
      [tenantId]: false,
    }));
  }, []);

  const enforceGuardrailsForTenant = useCallback(
    (tenantId: string, planCode: string, baseFlags: string[]) => {
      const current = flagsDraftByTenant[tenantId] ? fromCsv(flagsDraftByTenant[tenantId] ?? '') : baseFlags;
      const enforced = enforcePlanGovernance(planCode, current);
      setFlagsDraftByTenant((prev) => ({
        ...prev,
        [tenantId]: toCsv(enforced),
      }));
      setSettingsAllowPlanOverrideByTenant((prev) => ({
        ...prev,
        [tenantId]: false,
      }));
      setWorkspaceIssue(null);
      setWorkspaceNotice(`Applied ${planCode} plan guardrails.`);
    },
    [flagsDraftByTenant]
  );

  async function createTenantFromWizard() {
    if (!wizardCanContinue || wizardStepIndex < onboardingSteps.length - 1) {
      return;
    }

    setBusy(true);
    setWorkspaceIssue(null);
    setWorkspaceNotice(null);

    try {
      const payload = {
        name: onboardingDraft.name.trim(),
        slug: normalizeSlug(onboardingDraft.slug),
        primaryDomain: normalizeHostname(onboardingDraft.primaryDomain),
        planCode: onboardingDraft.planCode.trim() || 'starter',
        featureFlags: wizardFeatures,
      };
      const governance = evaluatePlanGovernance(payload.planCode, payload.featureFlags);
      if (!onboardingAllowPlanOverride && (governance.missingRequired.length > 0 || governance.disallowed.length > 0)) {
        setWorkspaceIssue(buildPlanGovernanceIssue('onboarding', payload.planCode, governance, 2));
        setWizardStepIndex(2);
        return;
      }

      const response = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const message = await readResponseError(response, 'Tenant provisioning failed.');
        const guidance = createMutationErrorGuidance({
          scope: 'onboarding',
          status: response.status,
          message,
        });
        setWorkspaceIssue(guidance);
        if (guidance.focusStepIndex !== undefined) {
          setWizardStepIndex(guidance.focusStepIndex);
        }
        return;
      }

      const json = (await response.json()) as { tenant: ControlPlaneTenantSnapshot };

      setWorkspaceIssue(null);
      setWorkspaceNotice(`${json.tenant.tenant.name} provisioned. Continue with domain verification below.`);
      setOnboardingDraft(defaultOnboardingDraft);
      setOnboardingAllowPlanOverride(false);
      setWizardStepIndex(0);
      await refresh(json.tenant.tenant.id);
    } catch (error) {
      const guidance = createMutationErrorGuidance({
        scope: 'onboarding',
        status: 0,
        message: error instanceof Error ? error.message : 'Unknown tenant provisioning error.',
      });
      setWorkspaceIssue(guidance);
      if (guidance.focusStepIndex !== undefined) {
        setWizardStepIndex(guidance.focusStepIndex);
      }
    } finally {
      setBusy(false);
    }
  }

  async function addDomain(tenantId: string) {
    const hostname = normalizeHostname(domainDraftByTenant[tenantId] ?? '');
    if (!hostname) {
      return;
    }

    setBusy(true);
    setWorkspaceIssue(null);
    setWorkspaceNotice(null);

    try {
      const response = await fetch(`/api/tenants/${tenantId}/domains`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostname }),
      });

      if (!response.ok) {
        const message = await readResponseError(response, 'Domain add failed.');
        setWorkspaceIssue(
          createMutationErrorGuidance({
            scope: 'domain-add',
            status: response.status,
            message,
          })
        );
        return;
      }

      setDomainDraftByTenant((prev) => ({ ...prev, [tenantId]: '' }));
      setWorkspaceIssue(null);
      setWorkspaceNotice(`Domain ${hostname} attached.`);
      await refresh(tenantId);
    } catch (error) {
      setWorkspaceIssue(
        createMutationErrorGuidance({
          scope: 'domain-add',
          status: 0,
          message: error instanceof Error ? error.message : 'Unknown domain add error.',
        })
      );
    } finally {
      setBusy(false);
    }
  }

  async function retryDomainVerification(tenantId: string, domainId: string) {
    setBusy(true);
    setWorkspaceIssue(null);
    setWorkspaceNotice(null);
    setDomainVerificationRetryByDomain((prev) => ({
      ...prev,
      [domainId]: (prev[domainId] ?? 0) + 1,
    }));

    try {
      await runDomainOpsRefresh(tenantId, 'retry', domainId);
    } finally {
      setBusy(false);
    }
  }

  async function patchDomain(
    tenantId: string,
    domainId: string,
    updates: {
      status?: 'active' | 'archived';
      isPrimary?: boolean;
      isVerified?: boolean;
    }
  ) {
    setBusy(true);
    setWorkspaceIssue(null);
    setWorkspaceNotice(null);

    try {
      const response = await fetch(`/api/tenants/${tenantId}/domains/${domainId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const message = await readResponseError(response, 'Domain status update failed.');
        setWorkspaceIssue(
          createMutationErrorGuidance({
            scope: 'domain-update',
            status: response.status,
            message,
          })
        );
        return;
      }

      setWorkspaceIssue(null);
      if (updates.status === 'archived') {
        setWorkspaceNotice('Domain archived. It is excluded from active routing until restored.');
      } else if (updates.status === 'active') {
        setWorkspaceNotice('Domain restored to active status.');
      } else if (updates.isPrimary) {
        setWorkspaceNotice('Primary domain updated.');
      } else if (updates.isVerified) {
        setWorkspaceNotice('Domain marked as verified.');
      }

      await refresh(tenantId);
    } catch (error) {
      setWorkspaceIssue(
        createMutationErrorGuidance({
          scope: 'domain-update',
          status: 0,
          message: error instanceof Error ? error.message : 'Unknown domain update error.',
        })
      );
    } finally {
      setBusy(false);
    }
  }

  async function saveSettings(tenantId: string) {
    if (!settingsEditable) {
      setWorkspaceIssue(
        createMutationErrorGuidance({
          scope: 'settings',
          status: 400,
          message: 'Settings are archived or tenant is inactive. Restore before editing plan or feature flags.',
        })
      );
      return;
    }

    const nextPlanCode = (planDraftByTenant[tenantId] ?? 'starter').trim() || 'starter';
    const nextFeatureFlags = fromCsv(flagsDraftByTenant[tenantId] ?? '');
    const allowPlanOverride = Boolean(settingsAllowPlanOverrideByTenant[tenantId]);
    const governance = evaluatePlanGovernance(nextPlanCode, nextFeatureFlags);

    setBusy(true);
    setWorkspaceIssue(null);
    setWorkspaceNotice(null);

    try {
      if (!allowPlanOverride && (governance.missingRequired.length > 0 || governance.disallowed.length > 0)) {
        setWorkspaceIssue(buildPlanGovernanceIssue('settings', nextPlanCode, governance));
        return;
      }

      const response = await fetch(`/api/tenants/${tenantId}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planCode: nextPlanCode,
          featureFlags: nextFeatureFlags,
        }),
      });

      if (!response.ok) {
        const message = await readResponseError(response, 'Settings update failed.');
        setWorkspaceIssue(
          createMutationErrorGuidance({
            scope: 'settings',
            status: response.status,
            message,
          })
        );
        return;
      }

      setWorkspaceIssue(null);
      setWorkspaceNotice('Tenant settings saved.');
      await refresh(tenantId);
    } catch (error) {
      setWorkspaceIssue(
        createMutationErrorGuidance({
          scope: 'settings',
          status: 0,
          message: error instanceof Error ? error.message : 'Unknown settings update error.',
        })
      );
    } finally {
      setBusy(false);
    }
  }

  async function patchTenantLifecycleStatus(tenantId: string, status: 'active' | 'archived') {
    const confirmed = confirmDestructiveAction(
      status === 'archived'
        ? 'Archive tenant workspace? This soft-delete disables active operations until restored.'
        : 'Restore tenant workspace to active operations?'
    );
    if (!confirmed) {
      return;
    }

    setBusy(true);
    setWorkspaceIssue(null);
    setWorkspaceNotice(null);

    try {
      const response = await fetch(`/api/tenants/${tenantId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const message = await readResponseError(response, 'Tenant lifecycle update failed.');
        setWorkspaceIssue(createMutationErrorGuidance({ scope: 'settings', status: response.status, message }));
        return;
      }

      setWorkspaceNotice(
        status === 'archived'
          ? 'Tenant archived (soft-delete). Use Restore to reactivate.'
          : 'Tenant restored to active status.'
      );
      await refresh(tenantId);
    } catch (error) {
      setWorkspaceIssue(
        createMutationErrorGuidance({
          scope: 'settings',
          status: 0,
          message: error instanceof Error ? error.message : 'Tenant lifecycle update failed.',
        })
      );
    } finally {
      setBusy(false);
    }
  }

  async function patchSettingsLifecycleStatus(tenantId: string, status: 'active' | 'archived') {
    const confirmed = confirmDestructiveAction(
      status === 'archived'
        ? 'Archive tenant settings? Plan/feature editing will be disabled until restored.'
        : 'Restore tenant settings to active status?'
    );
    if (!confirmed) {
      return;
    }

    setBusy(true);
    setWorkspaceIssue(null);
    setWorkspaceNotice(null);

    try {
      const response = await fetch(`/api/tenants/${tenantId}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const message = await readResponseError(response, 'Settings lifecycle update failed.');
        setWorkspaceIssue(createMutationErrorGuidance({ scope: 'settings', status: response.status, message }));
        return;
      }

      setWorkspaceNotice(status === 'archived' ? 'Tenant settings archived.' : 'Tenant settings restored.');
      await refresh(tenantId);
    } catch (error) {
      setWorkspaceIssue(
        createMutationErrorGuidance({
          scope: 'settings',
          status: 0,
          message: error instanceof Error ? error.message : 'Settings lifecycle update failed.',
        })
      );
    } finally {
      setBusy(false);
    }
  }

  function setBillingDraftField<K extends keyof BillingDraft>(tenantId: string, field: K, value: BillingDraft[K]) {
    setBillingDraftByTenant((prev) => {
      const current = prev[tenantId] ?? {
        planCode: 'starter',
        status: 'trialing' as TenantBillingSubscriptionStatus,
        paymentStatus: 'pending' as TenantBillingPaymentStatus,
        billingProvider: 'manual',
        billingCustomerId: '',
        billingSubscriptionId: '',
        trialEndsAt: '',
        currentPeriodEndsAt: '',
        cancelAtPeriodEnd: false,
        syncEntitlements: false,
      };

      return {
        ...prev,
        [tenantId]: {
          ...current,
          [field]: value,
        },
      };
    });
  }

  async function saveBillingSubscription(tenantId: string) {
    const draft = billingDraftByTenant[tenantId];
    if (!draft) {
      return;
    }

    const entitlementFlags = draft.syncEntitlements ? fromCsv(flagsDraftByTenant[tenantId] ?? '') : undefined;
    const toIsoDateOrNull = (value: string): string | null => {
      const trimmed = value.trim();
      if (!trimmed) {
        return null;
      }
      const parsed = new Date(`${trimmed}T00:00:00.000Z`);
      return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
    };

    setBusy(true);
    setWorkspaceIssue(null);
    setWorkspaceNotice(null);

    try {
      const response = await fetch(`/api/tenants/${tenantId}/billing`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planCode: draft.planCode.trim() || 'starter',
          status: draft.status,
          paymentStatus: draft.paymentStatus,
          billingProvider: draft.billingProvider.trim() || 'manual',
          billingCustomerId: draft.billingCustomerId.trim() || null,
          billingSubscriptionId: draft.billingSubscriptionId.trim() || null,
          trialEndsAt: toIsoDateOrNull(draft.trialEndsAt),
          currentPeriodEndsAt: toIsoDateOrNull(draft.currentPeriodEndsAt),
          cancelAtPeriodEnd: draft.cancelAtPeriodEnd,
          syncEntitlements: draft.syncEntitlements,
          entitlementFlags,
        }),
      });

      if (!response.ok) {
        const message = await readResponseError(response, 'Billing subscription update failed.');
        setWorkspaceIssue(
          createMutationErrorGuidance({
            scope: 'settings',
            status: response.status,
            message,
          })
        );
        return;
      }

      const payload = (await response.json()) as BillingSubscriptionResponse;
      setBillingByTenant((prev) => ({
        ...prev,
        [tenantId]: payload.subscription,
      }));
      setBillingDraftByTenant((prev) => ({
        ...prev,
        [tenantId]: {
          ...toBillingDraft(payload.subscription),
          syncEntitlements: false,
        },
      }));

      setWorkspaceNotice(
        draft.syncEntitlements
          ? 'Billing subscription updated and entitlement flags synchronized.'
          : 'Billing subscription updated.'
      );
      await refresh(tenantId);
    } catch (error) {
      setWorkspaceIssue(
        createMutationErrorGuidance({
          scope: 'settings',
          status: 0,
          message: error instanceof Error ? error.message : 'Billing subscription update failed.',
        })
      );
    } finally {
      setBusy(false);
    }
  }

  async function applyBillingDriftAuditPreset(tenantId: string) {
    setSelectedAuditTenantId(tenantId);
    setSelectedAuditStatus('all');
    setSelectedAuditAction('tenant.billing.sync');
    setSelectedAuditActorRole('all');
    setSelectedAuditActorId('');
    setSelectedAuditRequestId('');
    setSelectedAuditChangedField('entitlementDriftDetected');
    setSelectedAuditSearch('');
    setSelectedAuditFromDate('');
    setSelectedAuditToDate('');
    setSelectedAuditErrorsOnly(false);
    setSelectedAuditLimit(100);

    await loadAuditEvents(tenantId, {
      status: 'all',
      action: 'tenant.billing.sync',
      actorRole: 'all',
      actorId: '',
      requestId: '',
      changedField: 'entitlementDriftDetected',
      search: '',
      fromDate: '',
      toDate: '',
      errorsOnly: false,
      limit: 100,
    });
    setWorkspaceNotice('Audit timeline filtered to billing entitlement drift events for the selected tenant.');
  }

  function armBillingEntitlementSync(tenantId: string) {
    setBillingDraftByTenant((prev) => {
      const existingDraft = prev[tenantId];
      if (existingDraft) {
        return {
          ...prev,
          [tenantId]: {
            ...existingDraft,
            syncEntitlements: true,
          },
        };
      }

      const subscription = billingByTenant[tenantId];
      if (!subscription) {
        return prev;
      }

      return {
        ...prev,
        [tenantId]: {
          ...toBillingDraft(subscription),
          syncEntitlements: true,
        },
      };
    });
  }

  function applyBillingDriftRemediation(
    tenantId: string,
    signal: BillingDriftSignal,
    mode: BillingDriftRemediationMode
  ) {
    if (!settingsEditable) {
      setWorkspaceIssue(
        createMutationErrorGuidance({
          scope: 'settings',
          status: 400,
          message: 'Settings are archived or tenant is inactive. Restore status before applying drift corrections.',
        })
      );
      return;
    }

    const tenantSnapshot = snapshots.find((snapshot) => snapshot.tenant.id === tenantId);
    if (!tenantSnapshot) {
      setWorkspaceIssue(
        createMutationErrorGuidance({
          scope: 'settings',
          status: 404,
          message: 'Selected tenant is unavailable for drift remediation.',
        })
      );
      return;
    }

    const baselineFlags = flagsDraftByTenant[tenantId]
      ? fromCsv(flagsDraftByTenant[tenantId] ?? '')
      : tenantSnapshot.settings.featureFlags;
    const remediation = computeBillingDriftRemediation({
      baselineFlags,
      missingFlags: signal.missingFlags,
      extraFlags: signal.extraFlags,
      mode,
    });

    if (!remediation.actionable) {
      setWorkspaceNotice(
        'No actionable entitlement flag names were captured for this drift event. Refresh drift signals and retry.'
      );
      return;
    }

    setFlagsDraftByTenant((prev) => ({
      ...prev,
      [tenantId]: toCsv(remediation.nextFlags),
    }));
    if (remediation.shouldArmEntitlementSync) {
      armBillingEntitlementSync(tenantId);
    }
    setWorkspaceIssue(null);
    setWorkspaceNotice(
      `Applied drift corrections to settings draft (${remediation.addedCount} added, ${remediation.removedCount} removed). Save Settings, then Save Billing Workflow to sync entitlements.`
    );
  }

  async function runDiagnosticRemediation(tenantId: string, action: TenantSupportRemediationAction) {
    setBusy(true);
    setWorkspaceIssue(null);
    setWorkspaceNotice(null);
    setDiagnosticsActionBusyByTenant((prev) => ({ ...prev, [tenantId]: true }));

    try {
      const response = await fetch(`/api/tenants/${tenantId}/diagnostics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const payload = (await response.json()) as DiagnosticsRemediationResponse | { ok: false; error: string };
      if (!response.ok || !('result' in payload)) {
        const message =
          'error' in payload && typeof payload.error === 'string'
            ? payload.error
            : 'Diagnostics remediation failed.';
        setWorkspaceIssue(
          createMutationErrorGuidance({
            scope: 'settings',
            status: response.status,
            message,
          })
        );
        return;
      }

      setDiagnosticsByTenant((prev) => ({
        ...prev,
        [tenantId]: payload.summary,
      }));
      if (!payload.ok) {
        setWorkspaceIssue(
          createMutationErrorGuidance({
            scope: 'settings',
            status: 400,
            message: payload.error ?? payload.result.message,
          })
        );
      } else {
        setWorkspaceNotice(payload.result.message);
      }

      await refresh(tenantId);
    } catch (error) {
      setWorkspaceIssue(
        createMutationErrorGuidance({
          scope: 'settings',
          status: 0,
          message: error instanceof Error ? error.message : 'Diagnostics remediation failed.',
        })
      );
    } finally {
      setDiagnosticsActionBusyByTenant((prev) => ({ ...prev, [tenantId]: false }));
      setBusy(false);
    }
  }

  function setActorDraftField<K extends keyof ActorDraft>(tenantId: string, field: K, value: ActorDraft[K]) {
    setActorDraftByTenant((prev) => {
      const current = prev[tenantId] ?? defaultActorDraft;
      return {
        ...prev,
        [tenantId]: {
          ...current,
          [field]: value,
        },
      };
    });
  }

  function setActorRoleDraft(tenantId: string, actorId: string, role: ControlPlaneActorRole) {
    const key = toActorKey(tenantId, actorId);
    setActorRoleDraftByActorKey((prev) => ({
      ...prev,
      [key]: role,
    }));
    setActorPermissionsDraftByActorKey((prev) => {
      const current = prev[key] ?? [];
      return {
        ...prev,
        [key]: uniquePermissions([...roleDefaultPermissions[role], ...current]),
      };
    });
  }

  function toggleActorPermissionDraft(tenantId: string, actorId: string, permission: ControlPlaneActorPermission) {
    const key = toActorKey(tenantId, actorId);
    setActorPermissionsDraftByActorKey((prev) => {
      const current = prev[key] ?? [];
      const next = current.includes(permission)
        ? current.filter((entry) => entry !== permission)
        : [...current, permission];
      return {
        ...prev,
        [key]: next,
      };
    });
  }

  async function addActor(tenantId: string) {
    const draft = actorDraftByTenant[tenantId] ?? defaultActorDraft;
    const actorId = draft.actorId.trim();
    if (!actorId) {
      return;
    }

    setBusy(true);
    setWorkspaceIssue(null);
    setWorkspaceNotice(null);

    try {
      const response = await fetch(`/api/tenants/${tenantId}/actors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actorId,
          displayName: draft.displayName.trim() || null,
          email: draft.email.trim() || null,
          role: draft.role,
          permissions: uniquePermissions(draft.permissions),
        }),
      });

      if (!response.ok) {
        const message = await readResponseError(response, 'Actor add failed.');
        setWorkspaceIssue(createMutationErrorGuidance({ scope: 'settings', status: response.status, message }));
        return;
      }

      setActorDraftByTenant((prev) => ({
        ...prev,
        [tenantId]: defaultActorDraft,
      }));
      setWorkspaceNotice(`Actor ${actorId} added.`);
      await loadActorsForTenant(tenantId);
      await loadAuditEvents();
      await loadObservabilitySummary();
    } catch (error) {
      setWorkspaceIssue(
        createMutationErrorGuidance({
          scope: 'settings',
          status: 0,
          message: error instanceof Error ? error.message : 'Actor add failed.',
        })
      );
    } finally {
      setBusy(false);
    }
  }

  async function saveActor(tenantId: string, actor: TenantControlActor) {
    const key = toActorKey(tenantId, actor.actorId);
    const role = actorRoleDraftByActorKey[key] ?? actor.role;
    const permissions = actorPermissionsDraftByActorKey[key] ?? actor.permissions;

    setBusy(true);
    setWorkspaceIssue(null);
    setWorkspaceNotice(null);

    try {
      const response = await fetch(`/api/tenants/${tenantId}/actors/${encodeURIComponent(actor.actorId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          permissions: uniquePermissions(permissions),
        }),
      });

      if (!response.ok) {
        const message = await readResponseError(response, 'Actor update failed.');
        setWorkspaceIssue(createMutationErrorGuidance({ scope: 'settings', status: response.status, message }));
        return;
      }

      setWorkspaceNotice(`Actor ${actor.actorId} updated.`);
      await loadActorsForTenant(tenantId);
      await loadAuditEvents();
      await loadObservabilitySummary();
    } catch (error) {
      setWorkspaceIssue(
        createMutationErrorGuidance({
          scope: 'settings',
          status: 0,
          message: error instanceof Error ? error.message : 'Actor update failed.',
        })
      );
    } finally {
      setBusy(false);
    }
  }

  async function removeActor(tenantId: string, actorId: string) {
    setBusy(true);
    setWorkspaceIssue(null);
    setWorkspaceNotice(null);

    try {
      const response = await fetch(`/api/tenants/${tenantId}/actors/${encodeURIComponent(actorId)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const message = await readResponseError(response, 'Actor remove failed.');
        setWorkspaceIssue(createMutationErrorGuidance({ scope: 'settings', status: response.status, message }));
        return;
      }

      setWorkspaceNotice(`Actor ${actorId} removed.`);
      await loadActorsForTenant(tenantId);
      await loadAuditEvents();
      await loadObservabilitySummary();
    } catch (error) {
      setWorkspaceIssue(
        createMutationErrorGuidance({
          scope: 'settings',
          status: 0,
          message: error instanceof Error ? error.message : 'Actor remove failed.',
        })
      );
    } finally {
      setBusy(false);
    }
  }

  async function startSupportSession(tenantId: string, actorId: string) {
    const key = toActorKey(tenantId, actorId);
    const durationMinutes = supportSessionDraftByActorKey[key]?.durationMinutes ?? defaultSupportSessionDurationMinutes;

    setBusy(true);
    setWorkspaceIssue(null);
    setWorkspaceNotice(null);

    try {
      const response = await fetch(
        `/api/tenants/${tenantId}/actors/${encodeURIComponent(actorId)}/support-session`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            durationMinutes,
          }),
        }
      );

      if (!response.ok) {
        const message = await readResponseError(response, 'Support session start failed.');
        setWorkspaceIssue(createMutationErrorGuidance({ scope: 'settings', status: response.status, message }));
        return;
      }

      setWorkspaceNotice(`Support session started for ${actorId}.`);
      await loadActorsForTenant(tenantId);
      await loadAuditEvents();
      await loadObservabilitySummary();
    } catch (error) {
      setWorkspaceIssue(
        createMutationErrorGuidance({
          scope: 'settings',
          status: 0,
          message: error instanceof Error ? error.message : 'Support session start failed.',
        })
      );
    } finally {
      setBusy(false);
    }
  }

  async function endSupportSession(tenantId: string, actorId: string) {
    setBusy(true);
    setWorkspaceIssue(null);
    setWorkspaceNotice(null);

    try {
      const response = await fetch(
        `/api/tenants/${tenantId}/actors/${encodeURIComponent(actorId)}/support-session`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const message = await readResponseError(response, 'Support session end failed.');
        setWorkspaceIssue(createMutationErrorGuidance({ scope: 'settings', status: response.status, message }));
        return;
      }

      setWorkspaceNotice(`Support session ended for ${actorId}.`);
      await loadActorsForTenant(tenantId);
      await loadAuditEvents();
      await loadObservabilitySummary();
    } catch (error) {
      setWorkspaceIssue(
        createMutationErrorGuidance({
          scope: 'settings',
          status: 0,
          message: error instanceof Error ? error.message : 'Support session end failed.',
        })
      );
    } finally {
      setBusy(false);
    }
  }

  function renderWizardBody() {
    const onboardingNameHint = getFieldHint('onboarding', 'name');
    const onboardingSlugHint = getFieldHint('onboarding', 'slug');
    const onboardingPrimaryDomainHint = getFieldHint('onboarding', 'primaryDomain');
    const onboardingFeatureFlagsHint = getFieldHint('onboarding', 'featureFlags');

    if (wizardStepIndex === 0) {
      return (
        <div className="admin-wizard-grid">
          <label className={`admin-field ${onboardingNameHint ? 'has-error' : ''}`}>
            Tenant Name
            <input
              value={onboardingDraft.name}
              onChange={(event) => {
                const nextName = event.target.value;
                setOnboardingDraft((prev) => {
                  const shouldAutofillSlug = prev.slug.trim().length === 0;
                  return {
                    ...prev,
                    name: nextName,
                    slug: shouldAutofillSlug ? normalizeSlug(nextName) : prev.slug,
                  };
                });
              }}
              placeholder="North Shore Realty"
            />
            {onboardingNameHint ? <p className="admin-field-error">{onboardingNameHint}</p> : null}
          </label>
          <label className={`admin-field ${onboardingSlugHint ? 'has-error' : ''}`}>
            Tenant Slug
            <input
              value={onboardingDraft.slug}
              onChange={(event) => {
                const nextSlug = normalizeSlug(event.target.value);
                setOnboardingDraft((prev) => ({
                  ...prev,
                  slug: nextSlug,
                }));
              }}
              placeholder="north-shore-realty"
            />
            {onboardingSlugHint ? <p className="admin-field-error">{onboardingSlugHint}</p> : null}
          </label>
          <p className="admin-step-note">
            Slug is used for internal identity and should be short, lowercase, and stable over time.
          </p>
        </div>
      );
    }

    if (wizardStepIndex === 1) {
      return (
        <div className="admin-wizard-grid">
          <label className={`admin-field ${onboardingPrimaryDomainHint ? 'has-error' : ''}`}>
            Primary Domain
            <input
              value={onboardingDraft.primaryDomain}
              onChange={(event) => {
                const nextDomain = normalizeHostname(event.target.value);
                setOnboardingDraft((prev) => ({
                  ...prev,
                  primaryDomain: nextDomain,
                }));
              }}
              placeholder="northshore.localhost"
            />
            {onboardingPrimaryDomainHint ? <p className="admin-field-error">{onboardingPrimaryDomainHint}</p> : null}
          </label>
          <div className="admin-domain-guide">
            <strong>Operator DNS Guidance</strong>
            <p>
              Add an `A` record pointing to the web runtime target, then verify in Domain Operations after provisioning.
            </p>
            <code>{onboardingDraft.primaryDomain || 'tenant.example.com'}</code>
          </div>
        </div>
      );
    }

    if (wizardStepIndex === 2) {
      return (
        <div className="admin-wizard-grid">
          <div className="admin-plan-grid">
            {planOptions.map((plan) => {
              const active = onboardingDraft.planCode === plan.code;

              return (
                <button
                  key={plan.code}
                  type="button"
                  className={`admin-plan-card ${active ? 'is-active' : ''}`}
                  onClick={() => {
                    applyPlanTemplateToWizard(plan.code);
                  }}
                >
                  <span>{plan.label}</span>
                  <small>{plan.summary}</small>
                </button>
              );
            })}
          </div>

          <div className="admin-feature-grid">
            {featureOptions.map((feature) => {
              const enabled = onboardingDraft.featureFlags.includes(feature.id);

              return (
                <button
                  key={feature.id}
                  type="button"
                  className={`admin-feature-chip ${enabled ? 'is-active' : ''}`}
                  onClick={() => {
                    toggleWizardFeature(feature.id);
                  }}
                >
                  <span>{feature.label}</span>
                  <small>{feature.detail}</small>
                </button>
              );
            })}
          </div>

          <label className={`admin-field ${onboardingFeatureFlagsHint ? 'has-error' : ''}`}>
            Additional Feature Flags (csv)
            <input
              value={onboardingDraft.customFlagsCsv}
              onChange={(event) => {
                setOnboardingDraft((prev) => ({
                  ...prev,
                  customFlagsCsv: event.target.value,
                }));
              }}
              placeholder="priority_support,white_glove_onboarding"
            />
            {onboardingFeatureFlagsHint ? <p className="admin-field-error">{onboardingFeatureFlagsHint}</p> : null}
          </label>

          <section className="admin-governance-panel">
            <div className="admin-row admin-space-between">
              <strong>Plan Guardrails</strong>
              <span className="admin-chip">plan: {onboardingDraft.planCode}</span>
            </div>
            <p className="admin-muted">
              Required: {wizardGovernance.requiredFeatures.map(formatFeatureLabel).join(', ') || 'none'}.
            </p>
            <p className="admin-muted">
              Allowed: {wizardGovernance.allowedFeatures.map(formatFeatureLabel).join(', ') || 'no restrictions'}.
            </p>
            {wizardGovernance.missingRequired.length > 0 ? (
              <p className="admin-warning">
                Missing: {wizardGovernance.missingRequired.map(formatFeatureLabel).join(', ')}.
              </p>
            ) : null}
            {wizardGovernance.disallowed.length > 0 ? (
              <p className="admin-warning">
                Outside plan: {wizardGovernance.disallowed.map(formatFeatureLabel).join(', ')}.
              </p>
            ) : null}
            {wizardGovernance.recommendedMissing.length > 0 ? (
              <p className="admin-muted">
                Recommended additions: {wizardGovernance.recommendedMissing.map(formatFeatureLabel).join(', ')}.
              </p>
            ) : null}
            <label className="admin-inline-field admin-inline-toggle">
              <input
                type="checkbox"
                checked={onboardingAllowPlanOverride}
                onChange={(event) => {
                  setOnboardingAllowPlanOverride(event.target.checked);
                }}
              />
              Allow temporary plan override for provisioning
            </label>
          </section>
        </div>
      );
    }

    return (
      <div className="admin-review-grid">
        <article>
          <h3>Tenant</h3>
          <p>
            <strong>{onboardingDraft.name || '—'}</strong>
          </p>
          <p className="admin-muted">Slug: {normalizeSlug(onboardingDraft.slug) || '—'}</p>
        </article>
        <article>
          <h3>Primary Domain</h3>
          <p>
            <strong>{normalizeHostname(onboardingDraft.primaryDomain) || '—'}</strong>
          </p>
          <p className="admin-muted">Domain starts unverified and should be verified after DNS propagation.</p>
        </article>
        <article>
          <h3>Plan</h3>
          <p>
            <strong>{onboardingDraft.planCode}</strong>
          </p>
          <p className="admin-muted">Features: {wizardFeatures.length > 0 ? wizardFeatures.join(', ') : 'none'}</p>
        </article>
      </div>
    );
  }

  const selectedPlanTemplate = planFeatureTemplates[selectedTenantPlanCode] ?? null;

  const getFieldHint = (scope: MutationErrorScope, field: MutationErrorField): string | null => {
    if (!workspaceIssue || workspaceIssue.scope !== scope) {
      return null;
    }

    return workspaceIssue.fieldHints[field] ?? null;
  };

  return (
    <div className="admin-shell">
      <section className="admin-hero">
        <div>
          <p className="admin-kicker">Admin Portal</p>
          <h1>Control Plane Onboarding</h1>
          <p className="admin-muted">
            A guided provisioning workflow with domain operations and launch readiness controls for tenant onboarding.
          </p>
        </div>
        <div className="admin-row">
          <span className="admin-chip">{hasClerkKey ? 'Clerk auth enabled' : 'Clerk key missing'}</span>
          <span className="admin-chip">Tenant ops workspace</span>
        </div>
      </section>

      <section className="admin-kpi-grid" aria-label="Control plane summary">
        <article className="admin-kpi-card">
          <p>Total Tenants</p>
          <strong>{totalTenants}</strong>
          <span>active workspaces in platform inventory</span>
        </article>
        <article className="admin-kpi-card">
          <p>Total Domains</p>
          <strong>{totalDomains}</strong>
          <span>attached hostnames across all tenants</span>
        </article>
        <article className="admin-kpi-card">
          <p>Needs Domain Verification</p>
          <strong>{unverifiedPrimaryCount}</strong>
          <span>tenants without verified primary domain</span>
        </article>
      </section>

      {workspaceIssue ? (
        <section className="admin-error-panel" aria-live="polite">
          <p className="admin-error-title">{workspaceIssue.summary}</p>
          <p className="admin-error-detail">{workspaceIssue.detail}</p>
          {workspaceIssue.nextSteps.length > 0 ? (
            <ul className="admin-next-steps">
              {workspaceIssue.nextSteps.map((step, index) => (
                <li key={`${step}-${index}`}>{step}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}
      {workspaceNotice ? <p className="admin-notice">{workspaceNotice}</p> : null}

      <section className="admin-layout">
        <article className="admin-card admin-onboarding-card">
          <div className="admin-card-head">
            <h2>Guided Tenant Onboarding</h2>
            <span className="admin-chip">
              Step {wizardStepIndex + 1} / {onboardingSteps.length}
            </span>
          </div>

          <ol className="admin-stepper">
            {onboardingSteps.map((step, index) => {
              const stateClass = index === wizardStepIndex ? 'is-active' : index < wizardStepIndex ? 'is-complete' : 'is-pending';

              return (
                <li key={step.title} className={`admin-step ${stateClass}`}>
                  <span>{index + 1}</span>
                  <div>
                    <strong>{step.title}</strong>
                    <p>{step.detail}</p>
                  </div>
                </li>
              );
            })}
          </ol>

          {renderWizardBody()}

          <div className="admin-row admin-wizard-actions">
            <button
              type="button"
              className="admin-secondary"
              disabled={busy || wizardStepIndex === 0}
              onClick={() => {
                setWizardStepIndex((prev) => Math.max(0, prev - 1));
              }}
            >
              Back
            </button>

            {wizardStepIndex < onboardingSteps.length - 1 ? (
              <button
                type="button"
                disabled={busy || !wizardCanContinue}
                onClick={() => {
                  setWizardStepIndex((prev) => Math.min(onboardingSteps.length - 1, prev + 1));
                }}
              >
                Continue
              </button>
            ) : (
              <button type="button" disabled={busy || !wizardCanContinue} onClick={() => void createTenantFromWizard()}>
                {busy ? 'Provisioning...' : 'Provision Tenant'}
              </button>
            )}
          </div>
        </article>

        <article className="admin-card admin-tenant-directory">
          <div className="admin-card-head">
            <h2>Tenant Directory</h2>
            <button
              type="button"
              className="admin-secondary"
              disabled={busy}
              onClick={() => {
                void refresh();
              }}
            >
              Refresh
            </button>
          </div>

          {snapshots.length === 0 ? (
            <p className="admin-muted">No tenants available yet.</p>
          ) : (
            <ul className="admin-list">
              {snapshots.map((snapshot) => {
                const isSelected = selectedTenantId === snapshot.tenant.id;
                const activeDomains = snapshot.domains.filter((domain) => domain.status === 'active');
                const archivedDomains = snapshot.domains.filter((domain) => domain.status === 'archived');
                const primaryDomain = activeDomains.find((domain) => domain.isPrimary) ?? null;

                return (
                  <li key={snapshot.tenant.id} className={`admin-list-item ${isSelected ? 'is-selected' : ''}`}>
                    <div className="admin-row admin-space-between">
                      <div>
                        <strong>{snapshot.tenant.name}</strong>
                        <p className="admin-muted admin-list-subtitle">{snapshot.tenant.slug}</p>
                      </div>
                      <span className="admin-chip">{snapshot.tenant.status}</span>
                    </div>

                    <div className="admin-row">
                      <span className="admin-chip">plan: {snapshot.settings.planCode}</span>
                      <span className="admin-chip">domains: {activeDomains.length} active</span>
                      {archivedDomains.length > 0 ? (
                        <span className="admin-chip">archived domains: {archivedDomains.length}</span>
                      ) : null}
                      <span className="admin-chip">primary: {primaryDomain?.hostname ?? 'none'}</span>
                    </div>

                    <div className="admin-row">
                      <button
                        type="button"
                        className="admin-secondary"
                        onClick={() => {
                          setSelectedTenantId(snapshot.tenant.id);
                        }}
                      >
                        Open Domain Ops
                      </button>
                      {snapshot.tenant.status === 'active' ? (
                        <button
                          type="button"
                          className="admin-danger-button"
                          disabled={busy}
                          onClick={() => {
                            void patchTenantLifecycleStatus(snapshot.tenant.id, 'archived');
                          }}
                        >
                          Archive Tenant
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="admin-secondary"
                          disabled={busy}
                          onClick={() => {
                            void patchTenantLifecycleStatus(snapshot.tenant.id, 'active');
                          }}
                        >
                          Restore Tenant
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </article>
      </section>

      <section className="admin-card admin-ops-card">
        <div className="admin-card-head">
          <h2>Domain Operations & Launch Readiness</h2>
          {selectedTenant ? (
            <div className="admin-row">
              <span className="admin-chip">{selectedTenant.tenant.name}</span>
              <span className={`admin-chip ${selectedTenant.tenant.status === 'active' ? 'admin-chip-ok' : 'admin-chip-warn'}`}>
                tenant {selectedTenant.tenant.status}
              </span>
            </div>
          ) : null}
        </div>

        {!selectedTenant ? (
          <p className="admin-muted">Select a tenant from the directory to manage domains and launch settings.</p>
        ) : (
          <>
            {!selectedTenantIsActive ? (
              <p className="admin-warning">
                Tenant is archived. Restore tenant status to resume domain operations and settings updates.
              </p>
            ) : null}
            <div className="admin-ops-automation">
              <div className="admin-row">
                <button
                  type="button"
                  className="admin-secondary"
                  disabled={busy || !selectedTenantIsActive}
                  onClick={() => {
                    void runDomainOpsRefresh(selectedTenant.tenant.id, 'manual');
                  }}
                >
                  Poll Domain Status Now
                </button>
                <button
                  type="button"
                  className="admin-secondary"
                  disabled={busy || !selectedTenantIsActive}
                  onClick={() => {
                    setDomainOpsAutoPollEnabled((prev) => !prev);
                  }}
                >
                  {domainOpsAutoPollEnabled ? 'Stop Auto Polling' : 'Start Auto Polling'}
                </button>
                <label className="admin-inline-field">
                  Poll Interval (s)
                  <input
                    type="number"
                    min={10}
                    max={120}
                    value={domainOpsPollIntervalSeconds}
                    onChange={(event) => {
                      const next = Number.parseInt(event.target.value, 10);
                      if (!Number.isNaN(next)) {
                        setDomainOpsPollIntervalSeconds(Math.min(Math.max(next, 10), 120));
                      }
                    }}
                  />
                </label>
              </div>
              <p className="admin-muted">
                Last check: {domainOpsLastCheckedAt ? formatTimestamp(domainOpsLastCheckedAt) : 'not yet run this session'}.
              </p>
            </div>

            <div className="admin-ssl-grid">
              <article className="admin-ssl-card">
                <strong>DNS Verification</strong>
                <span
                  className={`admin-chip ${
                    sslReadiness.dnsStatus === 'verified'
                      ? 'admin-chip-ok'
                      : sslReadiness.dnsStatus === 'pending'
                        ? 'admin-chip-warn'
                        : 'admin-chip-status-failed'
                  }`}
                >
                  {sslReadiness.dnsStatus}
                </span>
                <p className="admin-muted">{sslReadiness.dnsMessage}</p>
              </article>
              <article className="admin-ssl-card">
                <strong>SSL / Certificate Readiness</strong>
                <span
                  className={`admin-chip ${
                    sslReadiness.certificateStatus === 'ready'
                      ? 'admin-chip-ok'
                      : sslReadiness.certificateStatus === 'pending'
                        ? 'admin-chip-warn'
                        : 'admin-chip-status-failed'
                  }`}
                >
                  {sslReadiness.certificateStatus}
                </span>
                <p className="admin-muted">{sslReadiness.certificateMessage}</p>
                {selectedPrimaryDomainProbe?.certificateValidTo ? (
                  <p className="admin-muted">
                    Expires: {formatTimestamp(selectedPrimaryDomainProbe.certificateValidTo)}
                  </p>
                ) : null}
              </article>
            </div>

            <div className="admin-readiness">
              <div className="admin-readiness-head">
                <strong>
                  Readiness {readinessSummary.completed}/{readinessSummary.total}
                </strong>
                <span className="admin-muted">
                  {Math.round((readinessSummary.completed / Math.max(1, readinessSummary.total)) * 100)}% complete
                </span>
              </div>
              <ul className="admin-readiness-list">
                {readinessSummary.checks.map((check) => (
                  <li key={check.label} className={check.ok ? 'is-complete' : 'is-pending'}>
                    <span aria-hidden="true">{check.ok ? '✓' : '○'}</span>
                    {check.label}
                  </li>
                ))}
              </ul>
            </div>

            <div className="admin-domain-grid">
              {selectedTenant.domains.map((domain) => {
                const domainProbe = domainProbeByDomainId[domain.id] ?? null;
                const domainActive = domain.status === 'active';

                return (
                  <article key={domain.id} className="admin-domain-card">
                    <div className="admin-row admin-space-between">
                      <strong>{domain.hostname}</strong>
                      <div className="admin-row">
                        {domain.isPrimary ? <span className="admin-chip">primary</span> : null}
                        <span className={`admin-chip ${domainActive ? 'admin-chip-ok' : 'admin-chip-warn'}`}>
                          {domain.status}
                        </span>
                        <span
                          className={`admin-chip ${
                            (domainProbe?.dnsStatus ?? (domain.isVerified ? 'verified' : 'pending')) === 'verified'
                              ? 'admin-chip-ok'
                              : (domainProbe?.dnsStatus ?? 'pending') === 'missing'
                                ? 'admin-chip-status-failed'
                                : 'admin-chip-warn'
                          }`}
                        >
                          dns {domainProbe?.dnsStatus ?? (domain.isVerified ? 'verified' : 'pending')}
                        </span>
                        <span
                          className={`admin-chip ${
                            (domainProbe?.certificateStatus ?? 'pending') === 'ready'
                              ? 'admin-chip-ok'
                              : (domainProbe?.certificateStatus ?? 'pending') === 'blocked'
                                ? 'admin-chip-status-failed'
                                : 'admin-chip-warn'
                          }`}
                        >
                          tls {domainProbe?.certificateStatus ?? 'pending'}
                        </span>
                      </div>
                    </div>
                    <p className="admin-muted">
                      {domainProbe?.dnsMessage ??
                        (domain.isVerified
                          ? `${domain.hostname} is marked verified in persisted tenant settings.`
                          : 'Run Poll Domain Status Now to fetch provider-backed verification status.')}
                    </p>
                    <p className="admin-muted">
                      {domainProbe?.certificateMessage ?? 'Certificate readiness is pending a probe run.'}
                    </p>
                    {domainProbe?.certificateValidTo ? (
                      <p className="admin-muted">Certificate valid to: {formatTimestamp(domainProbe.certificateValidTo)}</p>
                    ) : null}
                    {domainProbe?.observedRecords.length ? (
                      <p className="admin-muted">Observed DNS records: {domainProbe.observedRecords.join(', ')}</p>
                    ) : null}

                    <div className="admin-row">
                      <button
                        type="button"
                        className="admin-secondary"
                        disabled={busy || !selectedTenantIsActive || !domainActive || domain.isVerified}
                        onClick={() => {
                          void patchDomain(selectedTenant.tenant.id, domain.id, { isVerified: true });
                        }}
                      >
                        Mark Verified
                      </button>
                      <button
                        type="button"
                        className="admin-secondary"
                        disabled={busy || !selectedTenantIsActive || !domainActive || domain.isPrimary}
                        onClick={() => {
                          void patchDomain(selectedTenant.tenant.id, domain.id, { isPrimary: true });
                        }}
                      >
                        Set Primary
                      </button>
                      <button
                        type="button"
                        className="admin-secondary"
                        disabled={busy || !selectedTenantIsActive || !domainActive || domain.isVerified}
                        onClick={() => {
                          void retryDomainVerification(selectedTenant.tenant.id, domain.id);
                        }}
                      >
                        Retry Verification
                      </button>
                      {domainActive ? (
                        <button
                          type="button"
                          className="admin-danger-button"
                          disabled={busy || !selectedTenantIsActive || domain.isPrimary}
                          onClick={() => {
                            if (
                              confirmDestructiveAction(
                                `Archive ${domain.hostname}? It will be removed from active routing until restored.`
                              )
                            ) {
                              void patchDomain(selectedTenant.tenant.id, domain.id, { status: 'archived' });
                            }
                          }}
                        >
                          Archive Domain
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="admin-secondary"
                          disabled={busy || !selectedTenantIsActive}
                          onClick={() => {
                            if (confirmDestructiveAction(`Restore ${domain.hostname} to active domain status?`)) {
                              void patchDomain(selectedTenant.tenant.id, domain.id, { status: 'active' });
                            }
                          }}
                        >
                          Restore Domain
                        </button>
                      )}
                    </div>
                    <p className="admin-muted">
                      Retry checks: {domainVerificationRetryByDomain[domain.id] ?? 0}
                    </p>
                  </article>
                );
              })}
            </div>

            <div className="admin-inline-row">
              <label className={`admin-inline-field ${getFieldHint('domain-add', 'hostname') ? 'has-error' : ''}`}>
                Add Domain
                <input
                  value={domainDraftByTenant[selectedTenant.tenant.id] ?? ''}
                  onChange={(event) => {
                    setDomainDraftByTenant((prev) => ({
                      ...prev,
                      [selectedTenant.tenant.id]: event.target.value,
                    }));
                  }}
                  placeholder="northshore-secondary.localhost"
                />
                {getFieldHint('domain-add', 'hostname') ? (
                  <p className="admin-field-error">{getFieldHint('domain-add', 'hostname')}</p>
                ) : null}
              </label>
              <button
                type="button"
                disabled={busy || !selectedTenantIsActive || (domainDraftByTenant[selectedTenant.tenant.id] ?? '').trim().length === 0}
                onClick={() => {
                  void addDomain(selectedTenant.tenant.id);
                }}
              >
                Attach Domain
              </button>
            </div>

            <div className="admin-settings-grid">
              <label className={`admin-field ${getFieldHint('settings', 'planCode') ? 'has-error' : ''}`}>
                Plan Code
                <select
                  value={selectedTenantPlanCode}
                  disabled={!settingsEditable || busy}
                  onChange={(event) => {
                    const nextPlan = event.target.value;
                    setPlanDraftByTenant((prev) => ({
                      ...prev,
                      [selectedTenant.tenant.id]: nextPlan,
                    }));

                    const template = planFeatureTemplates[nextPlan] ?? [];
                    if (template.length > 0) {
                      applyPlanTemplateToTenantSettings(selectedTenant.tenant.id, nextPlan);
                    }
                  }}
                >
                  {planOptions.map((plan) => (
                    <option key={plan.code} value={plan.code}>
                      {plan.label} ({plan.code})
                    </option>
                  ))}
                </select>
                {getFieldHint('settings', 'planCode') ? (
                  <p className="admin-field-error">{getFieldHint('settings', 'planCode')}</p>
                ) : null}
              </label>

              <section className="admin-governance-panel">
                <div className="admin-row admin-space-between">
                  <strong>Plan Governance</strong>
                  <div className="admin-row">
                    <span className="admin-chip">plan: {selectedTenantPlanCode}</span>
                    <span className={`admin-chip ${selectedTenant.settings.status === 'active' ? 'admin-chip-ok' : 'admin-chip-warn'}`}>
                      settings {selectedTenant.settings.status}
                    </span>
                  </div>
                </div>
                <p className="admin-muted">
                  Required: {selectedSettingsGovernance?.requiredFeatures.map(formatFeatureLabel).join(', ') || 'none'}.
                </p>
                <p className="admin-muted">
                  Allowed: {selectedSettingsGovernance?.allowedFeatures.map(formatFeatureLabel).join(', ') || 'no restrictions'}.
                </p>
                {selectedSettingsGovernance && selectedSettingsGovernance.missingRequired.length > 0 ? (
                  <p className="admin-warning">
                    Missing: {selectedSettingsGovernance.missingRequired.map(formatFeatureLabel).join(', ')}.
                  </p>
                ) : null}
                {selectedSettingsGovernance && selectedSettingsGovernance.disallowed.length > 0 ? (
                  <p className="admin-warning">
                    Outside plan: {selectedSettingsGovernance.disallowed.map(formatFeatureLabel).join(', ')}.
                  </p>
                ) : null}
                {selectedSettingsGovernance && selectedSettingsGovernance.recommendedMissing.length > 0 ? (
                  <p className="admin-muted">
                    Recommended additions: {selectedSettingsGovernance.recommendedMissing.map(formatFeatureLabel).join(', ')}.
                  </p>
                ) : null}
                <label className="admin-inline-field admin-inline-toggle">
                  <input
                    type="checkbox"
                    checked={selectedSettingsAllowOverride}
                    disabled={!settingsEditable || busy}
                    onChange={(event) => {
                      setSettingsAllowPlanOverrideByTenant((prev) => ({
                        ...prev,
                        [selectedTenant.tenant.id]: event.target.checked,
                      }));
                    }}
                  />
                  Allow temporary override for this tenant
                </label>
              </section>

              <div className="admin-feature-grid">
                {featureOptions.map((feature) => {
                  const enabled = selectedTenantDraftFeatureFlags.includes(feature.id);
                  const requiresFeature = Boolean(selectedSettingsGovernance?.requiredFeatures.includes(feature.id));
                  return (
                    <button
                      key={feature.id}
                      type="button"
                      className={`admin-feature-chip ${enabled ? 'is-active' : ''}`}
                      disabled={!settingsEditable || busy}
                      onClick={() => {
                        toggleSettingsFeature(selectedTenant.tenant.id, selectedTenantDraftFeatureFlags, feature.id);
                      }}
                    >
                      <span>{feature.label}</span>
                      <small>{requiresFeature ? `${feature.detail} Required for this plan.` : feature.detail}</small>
                    </button>
                  );
                })}
              </div>

              <label className={`admin-field ${getFieldHint('settings', 'featureFlags') ? 'has-error' : ''}`}>
                Feature Flags (csv, advanced)
                <input
                  value={toCsv(selectedTenantDraftFeatureFlags)}
                  disabled={!settingsEditable || busy}
                  onChange={(event) => {
                    setFlagsDraftByTenant((prev) => ({
                      ...prev,
                      [selectedTenant.tenant.id]: event.target.value,
                    }));
                  }}
                />
                {getFieldHint('settings', 'featureFlags') ? (
                  <p className="admin-field-error">{getFieldHint('settings', 'featureFlags')}</p>
                ) : null}
              </label>

              <div className="admin-row">
                <button
                  type="button"
                  className="admin-secondary"
                  disabled={busy || !settingsEditable || !selectedPlanTemplate || selectedPlanTemplate.length === 0}
                  onClick={() => {
                    applyPlanTemplateToTenantSettings(selectedTenant.tenant.id, selectedTenantPlanCode);
                  }}
                >
                  Apply Plan Template
                </button>
                <button
                  type="button"
                  className="admin-secondary"
                  disabled={busy || !settingsEditable}
                  onClick={() => {
                    enforceGuardrailsForTenant(
                      selectedTenant.tenant.id,
                      selectedTenantPlanCode,
                      selectedTenantDraftFeatureFlags
                    );
                  }}
                >
                  Enforce Guardrails
                </button>
                <button
                  type="button"
                  disabled={busy || !settingsEditable}
                  onClick={() => {
                    void saveSettings(selectedTenant.tenant.id);
                  }}
                >
                  Save Settings
                </button>
                {selectedTenant.settings.status === 'active' ? (
                  <button
                    type="button"
                    className="admin-danger-button"
                    disabled={busy || !selectedTenantIsActive}
                    onClick={() => {
                      void patchSettingsLifecycleStatus(selectedTenant.tenant.id, 'archived');
                    }}
                  >
                    Archive Settings
                  </button>
                ) : (
                  <button
                    type="button"
                    className="admin-secondary"
                    disabled={busy || !selectedTenantIsActive}
                    onClick={() => {
                      void patchSettingsLifecycleStatus(selectedTenant.tenant.id, 'active');
                    }}
                  >
                    Restore Settings
                  </button>
                )}
              </div>
              {!settingsEditable ? (
                <p className="admin-warning">
                  Settings edits are paused while tenant or settings status is archived. Restore status to continue.
                </p>
              ) : null}
            </div>
          </>
        )}
      </section>

      <section className="admin-card admin-diagnostics-card">
        <div className="admin-card-head">
          <h2>Tenant Support Diagnostics</h2>
          {selectedTenant ? (
            <button
              type="button"
              className="admin-secondary"
              disabled={busy || Boolean(diagnosticsLoadingByTenant[selectedTenant.tenant.id])}
              onClick={() => {
                void loadDiagnosticsForTenant(selectedTenant.tenant.id);
              }}
            >
              {diagnosticsLoadingByTenant[selectedTenant.tenant.id] ? 'Refreshing...' : 'Refresh Diagnostics'}
            </button>
          ) : null}
        </div>

        {!selectedTenant ? (
          <p className="admin-muted">Select a tenant to run auth/domain/ingestion diagnostics.</p>
        ) : (
          <>
            {diagnosticsErrorByTenant[selectedTenant.tenant.id] ? (
              <p className="admin-error">{diagnosticsErrorByTenant[selectedTenant.tenant.id]}</p>
            ) : null}
            {diagnosticsLoadingByTenant[selectedTenant.tenant.id] && !selectedTenantDiagnostics ? (
              <p className="admin-muted">Loading diagnostics...</p>
            ) : null}

            {selectedTenantDiagnostics ? (
              <>
                <div className="admin-row">
                  <span
                    className={`admin-chip ${diagnosticStatusChipClass(
                      selectedTenantDiagnostics.overallStatus
                    )}`}
                  >
                    overall {diagnosticStatusLabel(selectedTenantDiagnostics.overallStatus)}
                  </span>
                  <span className="admin-chip">ok: {selectedTenantDiagnostics.counts.ok}</span>
                  <span className="admin-chip">warning: {selectedTenantDiagnostics.counts.warning}</span>
                  <span className="admin-chip">failed: {selectedTenantDiagnostics.counts.failed}</span>
                  <span className="admin-chip">checked: {formatTimestamp(selectedTenantDiagnostics.generatedAt)}</span>
                </div>

                <div className="admin-diagnostics-grid">
                  {selectedTenantDiagnostics.checks.map((check) => (
                    <article key={check.id} className="admin-observability-panel">
                      <div className="admin-row admin-space-between">
                        <strong>{check.label}</strong>
                        <span className={`admin-chip ${diagnosticStatusChipClass(check.status)}`}>
                          {diagnosticStatusLabel(check.status)}
                        </span>
                      </div>
                      <p className="admin-muted">{check.detail}</p>
                      <div className="admin-row">
                        <span className="admin-chip">{check.category}</span>
                      </div>
                      {check.remediation.length > 0 ? (
                        <div className="admin-row">
                          {check.remediation.map((remediation) => (
                            <button
                              key={`${check.id}-${remediation.action}`}
                              type="button"
                              className="admin-secondary"
                              disabled={busy || Boolean(diagnosticsActionBusyByTenant[selectedTenant.tenant.id])}
                              onClick={() => {
                                void runDiagnosticRemediation(selectedTenant.tenant.id, remediation.action);
                              }}
                              title={remediation.detail}
                            >
                              {remediation.label}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </article>
                  ))}
                </div>
              </>
            ) : null}
          </>
        )}
      </section>

      <section className="admin-card admin-billing-card">
        <div className="admin-card-head">
          <h2>Billing & Subscription Operations</h2>
          {selectedTenant ? (
            <button
              type="button"
              className="admin-secondary"
              disabled={busy || Boolean(billingLoadingByTenant[selectedTenant.tenant.id])}
              onClick={() => {
                void loadBillingForTenant(selectedTenant.tenant.id);
              }}
            >
              {billingLoadingByTenant[selectedTenant.tenant.id] ? 'Refreshing...' : 'Refresh Billing'}
            </button>
          ) : null}
        </div>

        {!selectedTenant ? (
          <p className="admin-muted">Select a tenant to manage plan transitions, billing status, and entitlement sync.</p>
        ) : selectedTenantBillingDraft ? (
          <>
            <div className="admin-row">
              <span className="admin-chip">{selectedTenant.tenant.name}</span>
              {selectedTenantBilling ? <span className="admin-chip">subscription: {selectedTenantBilling.status}</span> : null}
              {selectedTenantBilling ? (
                <span className="admin-chip">payment: {selectedTenantBilling.paymentStatus}</span>
              ) : null}
              <span className={`admin-chip ${selectedTenantBillingDriftSignals.length > 0 ? 'admin-chip-warn' : 'admin-chip-ok'}`}>
                entitlement drift: {selectedTenantBillingDriftSignals.length}
              </span>
            </div>

            <div className="admin-grid">
              <label className="admin-field">
                Plan Code
                <select
                  value={selectedTenantBillingDraft.planCode}
                  disabled={!settingsEditable || busy}
                  onChange={(event) => {
                    setBillingDraftField(selectedTenant.tenant.id, 'planCode', event.target.value);
                  }}
                >
                  {planOptions.map((plan) => (
                    <option key={plan.code} value={plan.code}>
                      {plan.label} ({plan.code})
                    </option>
                  ))}
                </select>
              </label>

              <label className="admin-field">
                Subscription Status
                <select
                  value={selectedTenantBillingDraft.status}
                  disabled={!settingsEditable || busy}
                  onChange={(event) => {
                    setBillingDraftField(
                      selectedTenant.tenant.id,
                      'status',
                      event.target.value as TenantBillingSubscriptionStatus
                    );
                  }}
                >
                  {billingSubscriptionStatusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>

              <label className="admin-field">
                Payment Status
                <select
                  value={selectedTenantBillingDraft.paymentStatus}
                  disabled={!settingsEditable || busy}
                  onChange={(event) => {
                    setBillingDraftField(
                      selectedTenant.tenant.id,
                      'paymentStatus',
                      event.target.value as TenantBillingPaymentStatus
                    );
                  }}
                >
                  {billingPaymentStatusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="admin-grid">
              <label className="admin-field">
                Billing Provider
                <input
                  value={selectedTenantBillingDraft.billingProvider}
                  disabled={!settingsEditable || busy}
                  onChange={(event) => {
                    setBillingDraftField(selectedTenant.tenant.id, 'billingProvider', event.target.value);
                  }}
                  placeholder="manual or stripe"
                />
              </label>
              <label className="admin-field">
                Customer ID
                <input
                  value={selectedTenantBillingDraft.billingCustomerId}
                  disabled={!settingsEditable || busy}
                  onChange={(event) => {
                    setBillingDraftField(selectedTenant.tenant.id, 'billingCustomerId', event.target.value);
                  }}
                  placeholder="cus_xxx"
                />
              </label>
              <label className="admin-field">
                Subscription ID
                <input
                  value={selectedTenantBillingDraft.billingSubscriptionId}
                  disabled={!settingsEditable || busy}
                  onChange={(event) => {
                    setBillingDraftField(selectedTenant.tenant.id, 'billingSubscriptionId', event.target.value);
                  }}
                  placeholder="sub_xxx"
                />
              </label>
            </div>

            <div className="admin-grid">
              <label className="admin-field">
                Trial Ends
                <input
                  type="date"
                  value={selectedTenantBillingDraft.trialEndsAt}
                  disabled={!settingsEditable || busy}
                  onChange={(event) => {
                    setBillingDraftField(selectedTenant.tenant.id, 'trialEndsAt', event.target.value);
                  }}
                />
              </label>
              <label className="admin-field">
                Current Period Ends
                <input
                  type="date"
                  value={selectedTenantBillingDraft.currentPeriodEndsAt}
                  disabled={!settingsEditable || busy}
                  onChange={(event) => {
                    setBillingDraftField(selectedTenant.tenant.id, 'currentPeriodEndsAt', event.target.value);
                  }}
                />
              </label>
              <label className="admin-inline-field admin-inline-toggle admin-billing-toggle">
                <input
                  type="checkbox"
                  checked={selectedTenantBillingDraft.cancelAtPeriodEnd}
                  disabled={!settingsEditable || busy}
                  onChange={(event) => {
                    setBillingDraftField(selectedTenant.tenant.id, 'cancelAtPeriodEnd', event.target.checked);
                  }}
                />
                Cancel at period end
              </label>
            </div>

            <label className="admin-inline-field admin-inline-toggle admin-billing-toggle">
              <input
                type="checkbox"
                checked={selectedTenantBillingDraft.syncEntitlements}
                disabled={!settingsEditable || busy}
                onChange={(event) => {
                  setBillingDraftField(selectedTenant.tenant.id, 'syncEntitlements', event.target.checked);
                }}
              />
              Sync entitlement flags from current settings draft when saving plan transition
            </label>

            <section className="admin-billing-drift-panel">
              <div className="admin-row admin-space-between">
                <strong>Entitlement Drift Triage</strong>
                <div className="admin-row">
                  <button
                    type="button"
                    className="admin-secondary"
                    disabled={busy || Boolean(billingDriftLoadingByTenant[selectedTenant.tenant.id])}
                    onClick={() => {
                      void loadBillingDriftSignalsForTenant(selectedTenant.tenant.id);
                    }}
                  >
                    {billingDriftLoadingByTenant[selectedTenant.tenant.id] ? 'Refreshing...' : 'Refresh Drift Signals'}
                  </button>
                  <button
                    type="button"
                    className="admin-secondary"
                    disabled={busy}
                    onClick={() => {
                      void applyBillingDriftAuditPreset(selectedTenant.tenant.id);
                    }}
                  >
                    Open in Audit Timeline
                  </button>
                </div>
              </div>
              <p className="admin-muted">
                Drift compares provider entitlement flags against persisted tenant settings. Investigate and remediate
                missing/extra flag mismatches before billing escalations.
              </p>
              {billingDriftErrorByTenant[selectedTenant.tenant.id] ? (
                <p className="admin-error">{billingDriftErrorByTenant[selectedTenant.tenant.id]}</p>
              ) : null}
              {billingDriftLoadingByTenant[selectedTenant.tenant.id] ? (
                <p className="admin-muted">Loading entitlement drift signals...</p>
              ) : null}
              {!billingDriftLoadingByTenant[selectedTenant.tenant.id] && selectedTenantBillingDriftSignals.length === 0 ? (
                <p className="admin-muted">No entitlement drift signals detected for recent billing sync events.</p>
              ) : null}
              {selectedTenantBillingDriftSignals.length > 0 ? (
                <ul className="admin-billing-drift-list">
                  {selectedTenantBillingDriftSignals.slice(0, 5).map((signal) => (
                    <li key={signal.auditEventId} className="admin-billing-drift-item">
                      <div className="admin-row admin-space-between">
                        <span className="admin-chip">{formatTimestamp(signal.createdAt)}</span>
                        <span className={`admin-chip admin-chip-status-${signal.status}`}>{signal.status}</span>
                      </div>
                      <div className="admin-row">
                        <span className="admin-chip admin-chip-warn">mode: {signal.mode}</span>
                        <span className="admin-chip">missing: {signal.missingCount}</span>
                        <span className="admin-chip">extra: {signal.extraCount}</span>
                        {signal.duplicate !== null ? (
                          <span className="admin-chip">duplicate: {signal.duplicate ? 'yes' : 'no'}</span>
                        ) : null}
                        {signal.applied !== null ? (
                          <span className="admin-chip">applied: {signal.applied ? 'yes' : 'no'}</span>
                        ) : null}
                        {signal.requestId ? <span className="admin-chip">request: {signal.requestId}</span> : null}
                      </div>
                      {signal.missingFlags.length > 0 ? (
                        <p className="admin-muted">Missing provider flags: {signal.missingFlags.join(', ')}</p>
                      ) : null}
                      {signal.extraFlags.length > 0 ? (
                        <p className="admin-muted">Extra tenant flags: {signal.extraFlags.join(', ')}</p>
                      ) : null}
                      {signal.error ? <p className="admin-error">{signal.error}</p> : null}
                      <div className="admin-row">
                        <button
                          type="button"
                          className="admin-secondary"
                          disabled={busy || !settingsEditable || signal.missingFlags.length === 0}
                          onClick={() => {
                            applyBillingDriftRemediation(selectedTenant.tenant.id, signal, 'missing');
                          }}
                        >
                          Add Missing Flags
                        </button>
                        <button
                          type="button"
                          className="admin-secondary"
                          disabled={busy || !settingsEditable || signal.extraFlags.length === 0}
                          onClick={() => {
                            applyBillingDriftRemediation(selectedTenant.tenant.id, signal, 'extra');
                          }}
                        >
                          Remove Extra Flags
                        </button>
                        <button
                          type="button"
                          className="admin-secondary"
                          disabled={
                            busy ||
                            !settingsEditable ||
                            (signal.missingFlags.length === 0 && signal.extraFlags.length === 0)
                          }
                          onClick={() => {
                            applyBillingDriftRemediation(selectedTenant.tenant.id, signal, 'all');
                          }}
                        >
                          Apply Both
                        </button>
                      </div>
                      <p className="admin-muted admin-audit-guidance">
                        Quick actions update the Settings draft and arm Billing entitlement sync. Save Settings, then
                        Save Billing Workflow to persist corrections.
                      </p>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>

            <div className="admin-row">
              <button
                type="button"
                disabled={busy || !settingsEditable || Boolean(billingLoadingByTenant[selectedTenant.tenant.id])}
                onClick={() => {
                  void saveBillingSubscription(selectedTenant.tenant.id);
                }}
              >
                Save Billing Workflow
              </button>
            </div>

            {!settingsEditable ? (
              <p className="admin-warning">
                Billing mutation controls are disabled while tenant/settings status is archived.
              </p>
            ) : null}
          </>
        ) : (
          <p className="admin-muted">
            {billingLoadingByTenant[selectedTenant.tenant.id] ? 'Loading billing details...' : 'No billing details loaded yet.'}
          </p>
        )}
      </section>

      <section className="admin-card admin-rbac-card">
        <div className="admin-card-head">
          <h2>RBAC Management & Support Sessions</h2>
          {selectedTenant ? (
            <button
              type="button"
              className="admin-secondary"
              disabled={busy || Boolean(actorsLoadingByTenant[selectedTenant.tenant.id])}
              onClick={() => {
                void loadActorsForTenant(selectedTenant.tenant.id);
              }}
            >
              {actorsLoadingByTenant[selectedTenant.tenant.id] ? 'Refreshing...' : 'Refresh Actors'}
            </button>
          ) : null}
        </div>

        {!selectedTenant ? (
          <p className="admin-muted">Select a tenant to manage roles, permissions, and support-session controls.</p>
        ) : (
          <>
            <div className="admin-rbac-add-grid">
              <label className="admin-field">
                Actor ID
                <input
                  value={selectedTenantActorDraft.actorId}
                  onChange={(event) => {
                    setActorDraftField(selectedTenant.tenant.id, 'actorId', event.target.value);
                  }}
                  placeholder="user_abc123"
                />
              </label>
              <label className="admin-field">
                Display Name
                <input
                  value={selectedTenantActorDraft.displayName}
                  onChange={(event) => {
                    setActorDraftField(selectedTenant.tenant.id, 'displayName', event.target.value);
                  }}
                  placeholder="Alex Support"
                />
              </label>
              <label className="admin-field">
                Email
                <input
                  value={selectedTenantActorDraft.email}
                  onChange={(event) => {
                    setActorDraftField(selectedTenant.tenant.id, 'email', event.target.value);
                  }}
                  placeholder="alex@tenant.com"
                />
              </label>
              <label className="admin-field">
                Role
                <select
                  value={selectedTenantActorDraft.role}
                  onChange={(event) => {
                    const role = event.target.value as ControlPlaneActorRole;
                    setActorDraftField(selectedTenant.tenant.id, 'role', role);
                    setActorDraftField(
                      selectedTenant.tenant.id,
                      'permissions',
                      uniquePermissions([
                        ...roleDefaultPermissions[role],
                        ...selectedTenantActorDraft.permissions,
                      ])
                    );
                  }}
                >
                  {actorRoleOptions.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="admin-feature-grid">
              {actorPermissionOptions.map((permission) => {
                const enabled = selectedTenantActorDraft.permissions.includes(permission.id);
                return (
                  <button
                    key={permission.id}
                    type="button"
                    className={`admin-feature-chip ${enabled ? 'is-active' : ''}`}
                    onClick={() => {
                      const next = enabled
                        ? selectedTenantActorDraft.permissions.filter((entry) => entry !== permission.id)
                        : [...selectedTenantActorDraft.permissions, permission.id];
                      setActorDraftField(selectedTenant.tenant.id, 'permissions', uniquePermissions(next));
                    }}
                  >
                    <span>{permission.label}</span>
                    <small>{permission.detail}</small>
                  </button>
                );
              })}
            </div>

            <div className="admin-row">
              <button
                type="button"
                disabled={busy || selectedTenantActorDraft.actorId.trim().length === 0}
                onClick={() => {
                  void addActor(selectedTenant.tenant.id);
                }}
              >
                Add Actor
              </button>
            </div>

            {actorsLoadingByTenant[selectedTenant.tenant.id] ? (
              <p className="admin-muted">Loading tenant actors...</p>
            ) : null}

            {selectedTenantActors.length === 0 ? (
              <p className="admin-muted">No actors configured yet for this tenant.</p>
            ) : (
              <ul className="admin-list">
                {selectedTenantActors.map((actor) => {
                  const actorKey = toActorKey(selectedTenant.tenant.id, actor.actorId);
                  const roleDraft = actorRoleDraftByActorKey[actorKey] ?? actor.role;
                  const permissionDraft = actorPermissionsDraftByActorKey[actorKey] ?? actor.permissions;
                  const supportSessionDraft =
                    supportSessionDraftByActorKey[actorKey]?.durationMinutes ?? defaultSupportSessionDurationMinutes;

                  return (
                    <li key={actor.id} className="admin-list-item">
                      <div className="admin-row admin-space-between">
                        <div>
                          <strong>{actor.displayName || actor.actorId}</strong>
                          <p className="admin-muted admin-list-subtitle">{actor.actorId}</p>
                        </div>
                        <span className="admin-chip">{formatActorRole(actor.role)}</span>
                      </div>
                      {actor.email ? <p className="admin-muted">Email: {actor.email}</p> : null}

                      <label className="admin-field">
                        Role
                        <select
                          value={roleDraft}
                          onChange={(event) => {
                            setActorRoleDraft(
                              selectedTenant.tenant.id,
                              actor.actorId,
                              event.target.value as ControlPlaneActorRole
                            );
                          }}
                        >
                          {actorRoleOptions.map((role) => (
                            <option key={role.value} value={role.value}>
                              {role.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <div className="admin-feature-grid">
                        {actorPermissionOptions.map((permission) => {
                          const enabled = permissionDraft.includes(permission.id);
                          return (
                            <button
                              key={`${actor.id}-${permission.id}`}
                              type="button"
                              className={`admin-feature-chip ${enabled ? 'is-active' : ''}`}
                              onClick={() => {
                                toggleActorPermissionDraft(selectedTenant.tenant.id, actor.actorId, permission.id);
                              }}
                            >
                              <span>{permission.label}</span>
                              <small>{permission.detail}</small>
                            </button>
                          );
                        })}
                      </div>

                      <div className="admin-support-session-row">
                        <span className="admin-chip">
                          support session: {actor.supportSessionActive ? 'active' : 'inactive'}
                        </span>
                        {actor.supportSessionExpiresAt ? (
                          <span className="admin-chip">
                            expires {formatTimestamp(actor.supportSessionExpiresAt)}
                          </span>
                        ) : null}
                        <label className="admin-inline-field">
                          Duration (minutes)
                          <input
                            type="number"
                            min={10}
                            max={240}
                            value={supportSessionDraft}
                            onChange={(event) => {
                              const parsed = Number.parseInt(event.target.value, 10);
                              if (Number.isNaN(parsed)) {
                                return;
                              }
                              setSupportSessionDraftByActorKey((prev) => ({
                                ...prev,
                                [actorKey]: {
                                  durationMinutes: Math.min(Math.max(parsed, 10), 240),
                                },
                              }));
                            }}
                          />
                        </label>
                      </div>

                      <div className="admin-row">
                        <button
                          type="button"
                          className="admin-secondary"
                          disabled={busy}
                          onClick={() => {
                            void saveActor(selectedTenant.tenant.id, actor);
                          }}
                        >
                          Save Access
                        </button>
                        {actor.supportSessionActive ? (
                          <button
                            type="button"
                            className="admin-secondary"
                            disabled={busy}
                            onClick={() => {
                              void endSupportSession(selectedTenant.tenant.id, actor.actorId);
                            }}
                          >
                            End Support Session
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="admin-secondary"
                            disabled={busy}
                            onClick={() => {
                              void startSupportSession(selectedTenant.tenant.id, actor.actorId);
                            }}
                          >
                            Start Support Session
                          </button>
                        )}
                        <button
                          type="button"
                          className="admin-secondary"
                          disabled={busy}
                          onClick={() => {
                            void removeActor(selectedTenant.tenant.id, actor.actorId);
                          }}
                        >
                          Remove Actor
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </section>

      <section className="admin-card admin-observability-card">
        <div className="admin-card-head">
          <h2>Control Plane Observability</h2>
          <button
            type="button"
            className="admin-secondary"
            disabled={busy || observabilityLoading}
            onClick={() => {
              void loadObservabilitySummary();
            }}
          >
            {observabilityLoading ? 'Refreshing...' : 'Refresh Observability'}
          </button>
        </div>

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
                <strong>
                  {observabilitySummary.mutationTrends.find((entry) => entry.status === 'failed')?.count ?? 0}
                </strong>
                <span>admin mutation failures recorded in last seven days</span>
              </article>
              <article className="admin-kpi-card">
                <p>Dead-Letter Queue</p>
                <strong>{observabilitySummary.ingestion.deadLetterCount}</strong>
                <span>ingestion jobs awaiting operator action</span>
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
                          <span key={`${entry.tenantId}-${check.label}`} className={`admin-chip ${check.ok ? 'admin-chip-ok' : 'admin-chip-warn'}`}>
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
      </section>

      <section className="admin-card">
        <div className="admin-card-head">
          <h2>Audit Timeline</h2>
          <div className="admin-row">
            <button
              type="button"
              className="admin-secondary"
              disabled={busy || auditLoading}
              onClick={() => {
                void loadAuditEvents();
              }}
            >
              Refresh Timeline
            </button>
            <button
              type="button"
              className="admin-secondary"
              disabled={auditLoading || auditEvents.length === 0}
              onClick={() => {
                exportAuditEvents('csv');
              }}
            >
              Export CSV
            </button>
            <button
              type="button"
              className="admin-secondary"
              disabled={auditLoading || auditEvents.length === 0}
              onClick={() => {
                exportAuditEvents('json');
              }}
            >
              Export JSON
            </button>
          </div>
        </div>

        <p className="admin-muted">
          Operator visibility for control-plane mutations with actor/request attribution and change detail.
        </p>
        {auditDriftPresetActive ? (
          <p className="admin-warning admin-audit-guidance">
            Drift triage view is active. Focus on events where `entitlementDriftDetected {'->'} true`, then reconcile
            missing/extra counts against tenant settings feature flags.
          </p>
        ) : null}

        <div className="admin-audit-filter-grid">
          <label className="admin-field">
            Tenant Scope
            <select
              value={selectedAuditTenantId}
              onChange={(event) => {
                setSelectedAuditTenantId(event.target.value);
              }}
            >
              <option value={GLOBAL_AUDIT_SCOPE}>Global Recent Feed</option>
              {snapshots.map((snapshot) => (
                <option key={snapshot.tenant.id} value={snapshot.tenant.id}>
                  {snapshot.tenant.name} ({snapshot.tenant.slug})
                </option>
              ))}
            </select>
          </label>

          <label className="admin-field">
            Status
            <select
              value={selectedAuditStatus}
              onChange={(event) => {
                setSelectedAuditStatus(event.target.value);
              }}
            >
              <option value="all">all</option>
              {auditStatusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>

          <label className="admin-field">
            Action
            <select
              value={selectedAuditAction}
              onChange={(event) => {
                setSelectedAuditAction(event.target.value);
              }}
            >
              <option value="all">all</option>
              {auditActionOptions.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
          </label>

          <label className="admin-field">
            Actor Role
            <select
              value={selectedAuditActorRole}
              onChange={(event) => {
                setSelectedAuditActorRole(event.target.value);
              }}
            >
              <option value="all">all</option>
              {auditActorRoleFilterOptions.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>

          <label className="admin-field">
            Actor ID
            <input
              type="text"
              value={selectedAuditActorId}
              onChange={(event) => {
                setSelectedAuditActorId(event.target.value);
              }}
              placeholder="contains actor id"
            />
          </label>

          <label className="admin-field">
            Request ID
            <input
              type="text"
              value={selectedAuditRequestId}
              onChange={(event) => {
                setSelectedAuditRequestId(event.target.value);
              }}
              placeholder="contains request id"
            />
          </label>

          <label className="admin-field">
            Changed Field
            <input
              type="text"
              value={selectedAuditChangedField}
              list="audit-changed-fields"
              onChange={(event) => {
                setSelectedAuditChangedField(event.target.value);
              }}
              placeholder="planCode / featureFlags / ..."
            />
            <datalist id="audit-changed-fields">
              {auditChangedFieldOptions.map((field) => (
                <option key={field} value={field} />
              ))}
            </datalist>
          </label>

          <label className="admin-field">
            From
            <input
              type="date"
              value={selectedAuditFromDate}
              onChange={(event) => {
                setSelectedAuditFromDate(event.target.value);
              }}
            />
          </label>

          <label className="admin-field">
            To
            <input
              type="date"
              value={selectedAuditToDate}
              onChange={(event) => {
                setSelectedAuditToDate(event.target.value);
              }}
            />
          </label>

          <label className="admin-field">
            Limit
            <input
              type="number"
              min={1}
              max={200}
              value={selectedAuditLimit}
              onChange={(event) => {
                setSelectedAuditLimit(parseAuditLimit(event.target.value));
              }}
            />
          </label>

          <label className="admin-field">
            Search
            <input
              type="text"
              value={selectedAuditSearch}
              onChange={(event) => {
                setSelectedAuditSearch(event.target.value);
              }}
              placeholder="action, tenant, path, error..."
            />
          </label>

          <label className="admin-inline-field admin-audit-toggle">
            <input
              type="checkbox"
              checked={selectedAuditErrorsOnly}
              onChange={(event) => {
                setSelectedAuditErrorsOnly(event.target.checked);
              }}
            />
            Show errors only
          </label>
        </div>

        {auditError ? <p className="admin-error">{auditError}</p> : null}
        {auditLoading ? <p className="admin-muted">Loading audit timeline...</p> : null}
        {!auditLoading && auditEvents.length === 0 ? <p className="admin-muted">No audit events found.</p> : null}

        {auditEvents.length > 0 ? (
          <ul className="admin-list">
            {auditEvents.map((event) => (
              <li key={event.id} className="admin-list-item">
                {(() => {
                  const requestAttribution = getAuditRequestAttribution(event);
                  const changeDetails = getAuditChangeDetails(event);
                  const billingDriftSummary = getBillingDriftSummaryForAuditRow(event);

                  return (
                    <>
                      <div className="admin-row admin-space-between">
                        <strong>{event.action}</strong>
                        <span className={`admin-chip admin-chip-status-${event.status}`}>{event.status}</span>
                      </div>
                      <div className="admin-row">
                        <span className="admin-chip">{formatTimestamp(event.createdAt)}</span>
                        <span className="admin-chip">role: {event.actorRole}</span>
                        <span className="admin-chip">actor: {event.actorId ?? 'unknown'}</span>
                        <span className="admin-chip">
                          tenant: {event.tenantId ? (tenantNameById[event.tenantId] ?? event.tenantId) : 'n/a'}
                        </span>
                        {event.domainId ? <span className="admin-chip">domain: {event.domainId}</span> : null}
                      </div>
                      {billingDriftSummary ? (
                        <div className="admin-row">
                          <span className="admin-chip admin-chip-warn">entitlement drift detected</span>
                          <span className="admin-chip">mode: {billingDriftSummary.mode}</span>
                          <span className="admin-chip">missing: {billingDriftSummary.missingCount}</span>
                          <span className="admin-chip">extra: {billingDriftSummary.extraCount}</span>
                        </div>
                      ) : null}
                      <div className="admin-row">
                        <span className="admin-chip">request: {requestAttribution.requestId ?? event.id}</span>
                        {requestAttribution.requestMethod ? (
                          <span className="admin-chip">method: {requestAttribution.requestMethod}</span>
                        ) : null}
                        {requestAttribution.requestPath ? (
                          <span className="admin-chip">path: {requestAttribution.requestPath}</span>
                        ) : null}
                      </div>
                      {changeDetails.length > 0 ? (
                        <details className="admin-audit-diff">
                          <summary>Change detail ({changeDetails.length})</summary>
                          <ul className="admin-audit-diff-list">
                            {changeDetails.map((change) => (
                              <li key={`${event.id}-${change.field}`}>
                                <strong>{change.field}</strong>
                                <span>
                                  {change.before} {'->'} {change.after}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </details>
                      ) : null}
                      {event.error ? <p className="admin-error">{event.error}</p> : null}
                    </>
                  );
                })()}
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}
