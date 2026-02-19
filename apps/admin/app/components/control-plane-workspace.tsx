'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import type {
  ControlPlaneAdminAuditAction,
  ControlPlaneAdminAuditEvent,
  ControlPlaneAdminAuditStatus,
  ControlPlaneTenantSnapshot,
} from '@real-estate/types/control-plane';
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
  'tenant.domain.add',
  'tenant.domain.update',
  'tenant.settings.update',
];

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
  const [domainVerificationRetryByDomain, setDomainVerificationRetryByDomain] = useState<Record<string, number>>({});

  const [auditEvents, setAuditEvents] = useState<ControlPlaneAdminAuditEvent[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [selectedAuditTenantId, setSelectedAuditTenantId] = useState<string>(GLOBAL_AUDIT_SCOPE);
  const [selectedAuditStatus, setSelectedAuditStatus] = useState<string>('all');
  const [selectedAuditAction, setSelectedAuditAction] = useState<string>('all');

  const selectedTenant = useMemo(() => {
    if (!selectedTenantId) {
      return null;
    }

    return snapshots.find((snapshot) => snapshot.tenant.id === selectedTenantId) ?? null;
  }, [selectedTenantId, snapshots]);

  const selectedPrimaryDomain = useMemo(() => {
    if (!selectedTenant) {
      return null;
    }

    return selectedTenant.domains.find((domain) => domain.isPrimary) ?? null;
  }, [selectedTenant]);

  const totalTenants = snapshots.length;
  const totalDomains = useMemo(() => snapshots.reduce((count, snapshot) => count + snapshot.domains.length, 0), [snapshots]);
  const unverifiedPrimaryCount = useMemo(() => {
    return snapshots.filter((snapshot) => {
      const primaryDomain = snapshot.domains.find((domain) => domain.isPrimary) ?? null;
      return !primaryDomain || !primaryDomain.isVerified;
    }).length;
  }, [snapshots]);

  const readinessSummary = useMemo(() => {
    if (!selectedTenant) {
      return {
        completed: 0,
        total: 4,
        checks: [
          { label: 'Primary domain exists', ok: false },
          { label: 'Primary domain verified', ok: false },
          { label: 'Plan assigned', ok: false },
          { label: 'At least one feature enabled', ok: false },
        ],
      };
    }

    const primaryDomain = selectedTenant.domains.find((domain) => domain.isPrimary) ?? null;
    const checks = [
      { label: 'Primary domain exists', ok: Boolean(primaryDomain) },
      { label: 'Primary domain verified', ok: Boolean(primaryDomain?.isVerified) },
      { label: 'Plan assigned', ok: selectedTenant.settings.planCode.trim().length > 0 },
      { label: 'At least one feature enabled', ok: selectedTenant.settings.featureFlags.length > 0 },
    ];

    const completed = checks.filter((entry) => entry.ok).length;
    return {
      completed,
      total: checks.length,
      checks,
    };
  }, [selectedTenant]);

  const tenantNameById = useMemo(() => {
    return snapshots.reduce<Record<string, string>>((result, snapshot) => {
      result[snapshot.tenant.id] = snapshot.tenant.name;
      return result;
    }, {});
  }, [snapshots]);

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

  const sslReadiness = useMemo(() => {
    if (!selectedPrimaryDomain) {
      return {
        dnsStatus: 'missing',
        certificateStatus: 'blocked',
        dnsMessage: 'No primary domain configured yet.',
        certificateMessage: 'Certificate cannot be issued until a primary domain is set.',
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
  }, [selectedPrimaryDomain]);

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
    async (tenantScopeOverride?: string) => {
      const tenantScope = tenantScopeOverride ?? selectedAuditTenantId;

      setAuditLoading(true);
      setAuditError(null);

      try {
        const query = new URLSearchParams();
        query.set('limit', '50');

        if (tenantScope !== GLOBAL_AUDIT_SCOPE) {
          query.set('tenantId', tenantScope);
        }
        if (selectedAuditStatus !== 'all') {
          query.set('status', selectedAuditStatus);
        }
        if (selectedAuditAction !== 'all') {
          query.set('action', selectedAuditAction);
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
    [selectedAuditAction, selectedAuditStatus, selectedAuditTenantId]
  );

  useEffect(() => {
    void loadAuditEvents();
  }, [loadAuditEvents]);

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
    },
    [loadAuditEvents, selectedAuditTenantId, selectedTenantId]
  );

  const runDomainOpsRefresh = useCallback(
    async (tenantId: string, reason: 'manual' | 'poll' | 'retry') => {
      try {
        await refresh(tenantId);
        const refreshedAt = new Date().toISOString();
        setDomainOpsLastCheckedAt(refreshedAt);

        if (reason === 'manual') {
          setWorkspaceNotice(`Domain operations refreshed at ${formatTimestamp(refreshedAt)}.`);
        }
        if (reason === 'retry') {
          setWorkspaceNotice('Verification retry check complete. Update status when DNS verification succeeds.');
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
    [refresh]
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
      await runDomainOpsRefresh(tenantId, 'retry');
    } finally {
      setBusy(false);
    }
  }

  async function patchDomain(
    tenantId: string,
    domainId: string,
    updates: {
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
      if (updates.isPrimary) {
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
                const primaryDomain = snapshot.domains.find((domain) => domain.isPrimary) ?? null;

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
                      <span className="admin-chip">domains: {snapshot.domains.length}</span>
                      <span className="admin-chip">primary: {primaryDomain?.hostname ?? 'none'}</span>
                    </div>

                    <button
                      type="button"
                      className="admin-secondary"
                      onClick={() => {
                        setSelectedTenantId(snapshot.tenant.id);
                      }}
                    >
                      Open Domain Ops
                    </button>
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
          {selectedTenant ? <span className="admin-chip">{selectedTenant.tenant.name}</span> : null}
        </div>

        {!selectedTenant ? (
          <p className="admin-muted">Select a tenant from the directory to manage domains and launch settings.</p>
        ) : (
          <>
            <div className="admin-ops-automation">
              <div className="admin-row">
                <button
                  type="button"
                  className="admin-secondary"
                  disabled={busy}
                  onClick={() => {
                    void runDomainOpsRefresh(selectedTenant.tenant.id, 'manual');
                  }}
                >
                  Poll Domain Status Now
                </button>
                <button
                  type="button"
                  className="admin-secondary"
                  disabled={busy}
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
              {selectedTenant.domains.map((domain) => (
                <article key={domain.id} className="admin-domain-card">
                  <div className="admin-row admin-space-between">
                    <strong>{domain.hostname}</strong>
                    <div className="admin-row">
                      {domain.isPrimary ? <span className="admin-chip">primary</span> : null}
                      <span className={`admin-chip ${domain.isVerified ? 'admin-chip-ok' : 'admin-chip-warn'}`}>
                        {domain.isVerified ? 'verified' : 'unverified'}
                      </span>
                    </div>
                  </div>

                  <div className="admin-row">
                    <button
                      type="button"
                      className="admin-secondary"
                      disabled={busy || domain.isVerified}
                      onClick={() => {
                        void patchDomain(selectedTenant.tenant.id, domain.id, { isVerified: true });
                      }}
                    >
                      Mark Verified
                    </button>
                    <button
                      type="button"
                      className="admin-secondary"
                      disabled={busy || domain.isPrimary}
                      onClick={() => {
                        void patchDomain(selectedTenant.tenant.id, domain.id, { isPrimary: true });
                      }}
                    >
                      Set Primary
                    </button>
                    <button
                      type="button"
                      className="admin-secondary"
                      disabled={busy || domain.isVerified}
                      onClick={() => {
                        void retryDomainVerification(selectedTenant.tenant.id, domain.id);
                      }}
                    >
                      Retry Verification
                    </button>
                  </div>
                  <p className="admin-muted">
                    Retry checks: {domainVerificationRetryByDomain[domain.id] ?? 0}
                  </p>
                </article>
              ))}
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
                disabled={busy || (domainDraftByTenant[selectedTenant.tenant.id] ?? '').trim().length === 0}
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
                  <span className="admin-chip">plan: {selectedTenantPlanCode}</span>
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
                  disabled={busy || !selectedPlanTemplate || selectedPlanTemplate.length === 0}
                  onClick={() => {
                    applyPlanTemplateToTenantSettings(selectedTenant.tenant.id, selectedTenantPlanCode);
                  }}
                >
                  Apply Plan Template
                </button>
                <button
                  type="button"
                  className="admin-secondary"
                  disabled={busy}
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
                  disabled={busy}
                  onClick={() => {
                    void saveSettings(selectedTenant.tenant.id);
                  }}
                >
                  Save Settings
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      <section className="admin-card">
        <div className="admin-card-head">
          <h2>Audit Timeline</h2>
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
        </div>

        <p className="admin-muted">Operator visibility for provisioning/domain/settings mutation outcomes.</p>

        <div className="admin-grid">
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
        </div>

        {auditError ? <p className="admin-error">{auditError}</p> : null}
        {auditLoading ? <p className="admin-muted">Loading audit timeline...</p> : null}
        {!auditLoading && auditEvents.length === 0 ? <p className="admin-muted">No audit events found.</p> : null}

        {auditEvents.length > 0 ? (
          <ul className="admin-list">
            {auditEvents.map((event) => (
              <li key={event.id} className="admin-list-item">
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
                {event.error ? <p className="admin-error">{event.error}</p> : null}
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}
